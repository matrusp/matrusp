#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys
import re
import json
import codecs
import locale
import multiprocessing
import dateutil.parser
import get_turmas_cepe
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

#sys.stdout = codecs.getwriter(locale.getpreferredencoding())(sys.stdout)

#30 dias antes da matéria encerrar ela será excluída do BD
data_validade = datetime.today() + timedelta(days=30)

def main(db_dir, arq_saida, arq_antigo=None, obter_cepe=True):
	db_dir = os.path.abspath(db_dir)
	arq_saida = os.path.abspath(arq_saida)


	if not os.path.isdir(db_dir):
		print u" - %s não é um diretório válido. Encerrando. - " % (db_dir)
		return 1;
		
	db_antigo = {}
	try:
		if arq_antigo != None:
			db_antigo = ler_db_antigo(os.path.abspath(arq_antigo))
	except Exception, e:
		print u" - %s não pôde ser aberto. Encerrando. - " % (arq_antigo)
		sys.exit(1);

	arqs = map(lambda arq: os.path.join(db_dir, arq), os.listdir(db_dir))
	
	pool = multiprocessing.Pool()
	db_novo = dict(pool.map(processar_arquivo, arqs))
	
	if arq_antigo != None:
		db_novo = fundir_dbs(db_novo, db_antigo)
		
	db_novo = remover_materias_apos_validade(db_novo)
	
	if obter_cepe:
		print u" - Obtendo disciplinas do CEPE - "
		try:
			cepe = get_turmas_cepe.obter_materias_cepe()
			db_novo.update(cepe)
			print u" - Disciplinas do CEPE incorporadas - "
		except:
			pass
	
	print u" - Gravando resultados - "
	try:
		saida = codecs.open(arq_saida, "w", encoding='utf-8')
	except Exception, e:
		print u" - %s não pôde ser aberto. Encerrando. - " % (arq_saida)
		return 1;
	saida.write(json.dumps({u"TODOS":db_novo.values()}, separators=(',',':')))
	saida.close()
	print u" - FIM! - "
	return 0

#Engloba todo o processamento de uma dada matéria. 
#Recebe como parâmetro um caminho ABSOLUTO do html e retorna uma dupla (código
#da disciplina, dados extraídos do arquivo html).
def processar_arquivo(arq):
	parseado = parsear_materia(arq)
	codigo = parseado[0]
	return (codigo, parseado)

#Abre o arquivo com o DB antigo e retorna um dicionário da forma
#db = {"AAA000": info_aaa000, "AAA0001": info_aaa0001, ...}
def ler_db_antigo(arq_antigo):
	antigo = json.loads(codecs.open(arq_antigo, "r", encoding='utf-8').read())
	
	db = {}
	for materia in antigo[u"TODOS"]:
		codigo = materia[0]
		db[codigo] = materia
		
	return db	

#Recebe dois DBs, um antigo e um novo, ambos da forma
#db = {"AAA000": info_aaa000, "AAA0001": info_aaa0001, ...}
#e retorna todo o conteúdo do DB novo mais quaisquer matérias do DB antigo que
#não estão no DB novo, já estão em andamento mas que ainda não tenham terminado.
#Exemplo: Matérias anuais não tem oferecimento no segundo semestre mas ainda
# devem continuar aparecendo durante todo o ano.
def fundir_dbs(db_novo, db_antigo):
	print u" - Fundindo DBs antigo e novo - "
	hoje = datetime.today()
	for codigo, materia in db_antigo.iteritems():
		if codigo not in db_novo:
			inicio_mais_passado = obter_inicio_mais_passado(materia)
			termino_mais_futuro = obter_termino_mais_futuro(materia)
			if inicio_mais_passado < hoje and hoje < termino_mais_futuro:
				print u" - Recuperando %s do DB antigo (Término em %s). - " % (codigo, termino_mais_futuro.strftime("%d/%m/%Y"))
				db_novo[codigo] = materia

	print u" - Fim da fusão dos DBs antigo e novo - "
		
	return db_novo

#Remove do DB quaisquer matérias que tem como término mais no futuro uma data
#antes de data_validade
def remover_materias_apos_validade(db):
	print u" - Removendo do DB matérias que passaram da validade - "	
	for codigo, materia in db.items():
		termino_mais_futuro = obter_termino_mais_futuro(materia)
		if termino_mais_futuro < data_validade:
			print u"   - Removendo %s  (Término em %s). - " % (codigo, termino_mais_futuro.strftime("%d/%m/%Y"))
			del db[codigo]
	
	print u" - Fim da remoção das matérias que passaram da validade - "	
	
	return db

#Dada uma descrição de uma matéria da forma que parsear_materia retorna, 
#devolve o datetime correspondente à data de térimino mais no futuro de todas
#as turmas dela.
def obter_termino_mais_futuro(materia):
	turmas = materia[2]
	datas_termino = map(lambda t: dateutil.parser.parse(t[2], dayfirst=True), turmas)
	return max(datas_termino)

#Dada uma descrição de uma matéria da forma que parsear_materia retorna, 
#devolve o datetime correspondente à data de início mais no passado de todas
#as turmas dela.
def obter_inicio_mais_passado(materia):
	turmas = materia[2]
	datas_inicio = map(lambda t: dateutil.parser.parse(t[1], dayfirst=True), turmas)
	return min(datas_inicio)


#Retorna uma tupla da forma:
#(codigo, inicio, fim, tipo, codigo_teorica)
#Exemplo:
#("2013102", "25/02/2013", "29/06/2013", "Teórica", None)
#("2013102", "25/02/2013", "29/06/2013", "Prática", None)
#("2013102", "25/02/2013", "29/06/2013", "Teórica Vinculada", None)
#("2013112", "25/02/2013", "29/06/2013", "Prática Vinculada", "2013102")
def parsear_informacoes(tabela):
	codigo_teorica = codigo = inicio = fim = tipo = observacoes = None
	
	for tr in tabela.find_all("tr"):
		tds = tr.find_all("td")

		if re.search(u"Código\s+da\s+Turma\s+Teórica", tds[0].string, flags=re.U):
			codigo_teorica = tds[1].string.strip()
		elif re.search(u"Código\s+da\s+Turma", tds[0].string, flags=re.U):
			codigo = re.match(u"^(\w+)", tds[1].string.strip(), flags=re.U).group(1)
		elif re.search(u"Início", tds[0].string, flags=re.U):
			inicio = dateutil.parser.parse(tds[1].string.strip(), dayfirst=True).strftime("%d/%m/%Y")
		elif re.search(u"Fim", tds[0].string, flags=re.U):
			fim = dateutil.parser.parse(tds[1].string.strip(), dayfirst=True).strftime("%d/%m/%Y")
		elif re.search(u"Tipo\s+da\s+Turma", tds[0].string, flags=re.U):
			tipo = tds[1].string.strip()
		elif re.search(u"Observações", tds[0].string, flags=re.U):
			observacoes = tds[1].string.strip()
		else:
			print u"Informacao ignorada: %s" % (tds[0].string.strip())
#		print info
	return (codigo, inicio, fim, tipo, codigo_teorica)

#Retorna uma lista de dias de aula da forma:
#[(dia_semana1, hora_inicio1, hora_fim1, [prof1, prof2, ...]), ...]
#Exemplo
#[("seg", "10:00", "11:40", ["Marcelo Gomes de Queiroz"]),
# ("qua", "08:00", "09:40", ["Marcelo Gomes de Queiroz"])]
def parsear_horario(tabela):
	horario = []
	accum = None
	for tr in tabela.find_all("tr"):
		tds = tr.find_all("td")
		tds = map(lambda x: u"".join(x.stripped_strings).strip(), tds)
		if tds[0] == u"Horário": #Cabeçalho
			continue
		
		if tds[0] != u"": #Novo dia de aula (Ex. |ter|10:00|11:50|Adilson Simonis|)
			if accum != None:
				horario.append(accum)
			accum = (tds[0], tds[1], tds[2], [tds[3]])
 		
 		#Mais professores (Ex. ||||Elisabeti Kira|) e possivelmente um horário maior
		#Ex: |qui|14:00|16:00|Sonia Regina Leite Garcia
		#    |   |     |18:00|Artur Simões Rozestraten
		#    |   |     |     |Eduardo Colli
 		if tds[0] == u"" and tds[1] == u"": 
 			if tds[2] > accum[2]:
 				accum = (accum[0], accum[1], tds[2], accum[3])
 			accum[3].append(tds[3])
 		
 		#Mais uma aula no mesmo dia
		#Ex:  |seg|08:00|12:00|(R)Jose Roberto de Magalhaes Bastos
 		#     |   |     |13:00|(R)Magali de Lourdes Caldana
		#     |   |14:00|18:00|(R)Jose Roberto de Magalhaes Bastos
 		#     |   |     |19:00|(R)Magali de Lourdes Caldana
 		if tds[0] == u"" and tds[1] != u"":
 			if accum != None:
				horario.append(accum)
			accum = (accum[0], tds[1], tds[2], [tds[3]])
			
	if accum != None:
		horario.append(accum)
#		print horario
	return horario

def to_int(string):
	try:
		return int(string)
	except:
		return 0

#Retorna uma lista de vagas e seus detalhamentos da forma:
#[(tipo1, vagas1, inscritos1, pendentes1, matriculados1, detalhamento1), ...]
#Onde detalhamento é da forma:
#[(parcelaA, vagasA, inscritosA, pendentesA, matriculadosA), ...]
#
#Exemplo:
#	Vagas	Inscritos	Pendentes	Matriculados
#Obrigatória	70	65	0	0
#       	IME - Ciência da Computação	70	65	-	-
#Optativa Eletiva	10	16	0	0
#       	IME - Matemática Bacharelado	5	6	-	-
#       	IME - Estatística	5	10	-	-
#Optativa Livre	2	3	0	0
#       	Qualquer Unidade da USP	2	3	-	-
#Alunos Especiais	1	0	-	0
#
#[("Obrigatória", 70, 65, 0, 0, [("IME - Ciência da Computação", 70, 65, 0, 0)]), 
# ("Optativa Eletiva", 10, 16, 0, 0, [("IME - Matemática Bacharelado", 5, 6, 0, 0), ("IME - Estatística", 5, 10, 0, 0)]), 
# ("Optativa Livre", 2, 3, 0, 0, [("Qualquer Unidade da USP", 2, 3, 0, 0)]), 
# ("Alunos Especiais", 1, 0, 0, 0, [])]
def parsear_vagas(tabela):
	vagas = []
	accum = None
	for tr in tabela.find_all("tr"):
		tds = tr.find_all("td")
		tds = map(lambda x: u"".join(x.stripped_strings).strip(), tds)
		
		if len(tds) == 5 and tds[0] == u"": #Cabecalho
			continue
		elif len(tds) == 5 and tds[0] != u"": #Novo tipo de vaga (Obrigatória, Optativa, ...)
			if accum != None:
				vagas.append(accum)
			accum = (tds[0], to_int(tds[1]), to_int(tds[2]), to_int(tds[3]), to_int(tds[4]), [])
		elif len(tds) == 6: #Detalhamento das vagas (IME - Matemática Bacharelado, Qualquer Unidade da USP, ...)
			detalhamento = (tds[1], to_int(tds[2]), to_int(tds[3]), to_int(tds[4]), to_int(tds[5]))
			accum[5].append(detalhamento)
	if accum != None:
		vagas.append(accum)
#		import pprint
#		pp = pprint.PrettyPrinter(indent=2)
#		pp.pprint(vagas)
	return vagas


#Tabelas sem tabelas dentro
def eh_tabela_folha(tag):
	return tag.name == "table" and tag.table == None

#Retorna uma tupla contendo as informações da matéria na forma:
#(codigo, nome_extenso, [(codigo_t1, data_inicio_t1, data_fim_t1, tipo_t1, horario_t1, vagas_t1), ...])
#Onde info, horario e vagas são o resultado das respectivas funções de parseamento.
#Exemplo:
#("MAC0315", "Programação Linear", [(..., ..., ..., ..., ..., ...)])
def parsear_materia(arquivo):
	print u" - Parseando arquivo %s - " % (os.path.basename(arquivo))
	
	codigo = os.path.basename(arquivo).split(".")[0]
	html = open(arquivo, "r")
	soup = BeautifulSoup(html.read())
	html.close()
	tabelas_folha = soup.find_all(eh_tabela_folha)
	
	turmas = []
	info = horario = vagas = None
	for folha in tabelas_folha:
		if folha.find_all(text=re.compile(u"Disciplina:\s+" + codigo, flags=re.UNICODE)):
			nome = list(folha.stripped_strings)[-1]
			nome = re.search(u"Disciplina:\s+%s - (.+)" % (codigo), nome).group(1)
		if folha.find_all(text=re.compile(u"Código\s+da\s+Turma", flags=re.UNICODE)):
			if info != None:
				turmas.append((info, horario, vagas))
			info = parsear_informacoes(folha)
		elif folha.find_all(text="Horário"):
			horario = parsear_horario(folha)
		elif folha.find_all(text=re.compile(u"Atividades\s+Didáticas", flags=re.UNICODE)):
			continue
		elif folha.find_all(text="Vagas"):
			vagas = parsear_vagas(folha)
	
	if info != None:
		turmas.append((info, horario, vagas))
	
	turmas = filtrar_turmas(turmas)
	
	return (codigo, nome, turmas)

#Faz o "join" entre as turmas Teóricas e Práticas Vinculadas. O novo código
#será da forma aaaastt+pp, aaaa = ano, s = semestre, tt = código teórica, pp = código prática
#
#Uma turma passa a ser uma tupla da forma (codigo, data_inicio, data_fim, tipo, horario, vagas)
def filtrar_turmas(turmas):
#(info, horario, vagas)
#("2013102", "25/02/2013", "29/06/2013", "Teórica", None)
	tipos = {u"Teórica Vinculada": {}, u"Prática Vinculada": {}}
	for info, horario, vagas in turmas:
		codigo, _, _, tipo, _ = info
		if tipo not in tipos:
			tipos[tipo] = {}
		tipos[tipo][codigo[0:7]] = (info, horario, vagas) #tipos["Teórica"]["2013102"] = (...)
	
	praticas = {}
	#Turmas teóricas vinculadas que podem ser removidas por terem conseguido fazer o join
	teoricas_utilizadas = set([]) 
	for codigo, turma in tipos[u"Prática Vinculada"].iteritems():
		#Desempacotando
		info, horario, vagas = turma
		codigo, data_inicio, data_fim, tipo, codigo_teorica = info
		
		#Existem turmas de Prática Vinculada sem a Teórica Vinculada correspondente...
		if codigo_teorica == None or codigo_teorica not in tipos[u"Teórica Vinculada"]:
			praticas[codigo] = turma
			continue
		
		#Podemos remover essa teorica vinculada
		teoricas_utilizadas.add(codigo_teorica)
		
		#Novo código
		codigo = codigo[0:5] + codigo_teorica[5:] + u"+" + codigo[5:]
	
		#Join dos horários
		horario_teorica = tipos[u"Teórica Vinculada"][codigo_teorica][1]
	
		if horario == None and horario_teorica:
			horario = horario_teorica
		elif horario and horario_teorica:
			horario.extend(horario_teorica)
			
		#Reempacotando
		info = (codigo, data_inicio, data_fim, u"Teórica e Prática Vinculadas", None)
		turma = (info, horario, vagas)
		
		#Gravando
		praticas[codigo] = turma
	
	tipos[u"Prática Vinculada"] = praticas
	for teorica in teoricas_utilizadas:
		del tipos[u"Teórica Vinculada"][teorica]
		
	turmas = []
	#Removemos o campo codigo_teorica agora desnecessario e fazemos
	#uma turma ser uma tupla da forma (codigo, data_inicio, data_fim, tipo, horario, vagas)
	for _, turmas_tipo in tipos.iteritems():
		for _, turma in turmas_tipo.iteritems():
			info, horario, vagas = turma
			codigo, data_inicio, data_fim, tipo, _ = info
			
			turmas.append((codigo, data_inicio, data_fim, tipo, horario, vagas))
	
	return turmas
	
if __name__ == "__main__":
	if len(sys.argv) < 3:
		print u" - Forneça o diretório de entrada o nome do arquivo de saída e o"
		print u"   nome do banco antigo (Opcional)."
		print u"   Ex: %s ./db ./db_usp.txt ./db_usp_antigo.txt" % (sys.argv[0])
		print u"   Encerrando. - "
		sys.exit(1)
	elif len(sys.argv) == 3:
		main(sys.argv[1], sys.argv[2])
	else:
		main(sys.argv[1], sys.argv[2], sys.argv[3])

