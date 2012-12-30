#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import re
import json
import codecs
from bs4 import BeautifulSoup

DB_DIR = "../db/usp/"
#O arquivo final está codificado em UTF-8
arq_saida = "db_usp.txt" 

def main():
	db = []	
	for arq in os.listdir(os.path.abspath(DB_DIR)):
		db.append(parsear_materia(arq))

	print " - Gravando resultados - "
	saida = codecs.open(arq_saida, "w", encoding='utf-8')
	saida.write(json.dumps({u"TODOS":db}, separators=(',',':')))
	saida.close()
	print " - FIM! - "


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
			codigo = tds[1].string.strip()
		elif re.search(u"Início", tds[0].string, flags=re.U):
			inicio = tds[1].string.strip()
		elif re.search(u"Fim", tds[0].string, flags=re.U):
			fim = tds[1].string.strip()
		elif re.search(u"Tipo\s+da\s+Turma", tds[0].string, flags=re.U):
			tipo = tds[1].string.strip()
		elif re.search(u"Observações", tds[0].string, flags=re.U):
			observacoes = tds[1].string.strip()
		else:
			print "Informacao ignorada: %s" % (tds[0].string.strip())
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
		if tds[0] == u"": #Apenas mais professores (Ex. ||||Elisabeti Kira|)
			accum[3].append(tds[3])
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
	print " - Parseando arquivo %s - " % (arquivo)
	
	codigo = arquivo[:-5]
	html = open(DB_DIR + arquivo, "r")
	soup = BeautifulSoup(html.read())
	html.close()
	tabelas_folha = soup.find_all(eh_tabela_folha)
	
	turmas = []
	info = horario = vagas = None
	for folha in tabelas_folha:
		if folha.find_all(text=re.compile("Disciplina:\s+" + codigo, flags=re.UNICODE)):
			nome = list(folha.stripped_strings)[-1]
			nome = re.search("Disciplina:\s+%s - (.+)" % (codigo), nome).group(1)
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
	for codigo, turma in tipos[u"Prática Vinculada"].iteritems():
		#Desempacotando
		info, horario, vagas = turma
		codigo, data_inicio, data_fim, tipo, codigo_teorica = info
		
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
	del tipos[u"Teórica Vinculada"] #Não é mais necessário
	
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
	main()

