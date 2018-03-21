#!/usr/bin/python
# -*- coding: utf-8 -*-
import os
import os.path
import re
from pprint import pprint
import sys
import aiohttp
import urllib
import locale
import json
import codecs
import asyncio
from bs4 import BeautifulSoup
import html5lib
import dateutil
import dateutil.parser
import argparse
import time
import logging
import gzip

#Limpa o DB_DIR antes de inserir os dados novos
remover_antigos = True

def main():
	t = time.perf_counter()

	logger.info(" - Obtendo a lista de todas as unidades de ensino - ")
	if not args.unidades:
		response = urllib.request.urlopen('https://uspdigital.usp.br/jupiterweb/jupColegiadoLista?tipo=T')
		soup = BeautifulSoup(response.read(), "html5lib")

		#Lista de tags do BeautifulSoup da forma [<a
		#href="jupColegiadoMenu.jsp?codcg=33&amp;tipo=D&amp;nomclg=Museu+Paulista">Museu
		#Paulista</a>, ...]
		links_unidades = soup.find_all('a', href=re.compile("jupColegiadoMenu"))
	
		#Lista de codigos de unidades de ensino.
		#Normalmente: [u'86', u'27', u'39', u'98', u'7', u'22', u'94', u'88', u'18',
		#u'97', u'3', u'11', u'16', u'9', u'60', u'2', u'89', u'12', u'81', u'48',
		#u'59', u'96', u'91', u'8', u'5', u'17', u'10', u'23', u'25', u'58', u'95',
		#u'6', u'74', u'61', u'99', u'14', u'93', u'41', u'92', u'42', u'55', u'4',
		# u'43', u'76', u'44', u'45', u'83', u'47', u'46', u'75', u'87', u'21', u'90',
		#u'71', u'100', u'1', u'30', u'64', u'31', u'85', u'36', u'32', u'38', u'33']
		codigos_unidades = list(map(extrai_codigo_unidade, links_unidades))
	else:
		codigos_unidades = args.unidades
	logger.info(" - %d unidades de ensino encontradas - " % (len(codigos_unidades)))

	tasks_materias = loop.run_until_complete(iterar_unidades(codigos_unidades))
	materias = []

	for task in tasks_materias[0]:
		res = task.result()
		if res:
			materias.append(res)

	materias_json = json.dumps(materias)
	
	arq = open(os.path.join(args.db_dir, args.out) ,"w")
	arq.write(materias_json)
	arq.close()

	if not args.nogzip:
		arq = open(os.path.join(args.db_dir, args.out + ".gz") ,"wb")
		arq.write(gzip.compress(bytes(materias_json,'utf-8')))
		arq.close()

	logger.info(f" -   {len(materias)} materias salvas")

	logger.info(" - FIM! -")
	logger.info(f" - \n - Tempo de execução: {time.perf_counter() - t} segundos")
	return 0

async def iterar_unidades(codigos_unidades):

	global session
	session = aiohttp.ClientSession()

	logger.info(" - Iniciando processamento de unidades")
	coros = []
	for codigo in codigos_unidades:
		coros.append(iterar_unidade(codigo))
	future = asyncio.wait(tuple(coros))

	unidade_tasks = await future
	logger.info(f" -   {len(unidade_tasks[0])} unidades processadas")
	logger.info(" - Iniciando processamento de materias")

	coros = []
	for materias_unidade in unidade_tasks[0]:
		for materia in materias_unidade.result():
			coros.append(parsear_materia(materia))

	logger.info(f" -   {len(coros)} materias encontradas")
	future = asyncio.wait(tuple(coros))
	materias_tasks = await future

	await session.close()
	logger.info(f" -   {len(materias_tasks[0])} materias processadas")
	return materias_tasks

async def iterar_unidade(codigo):
	logger.debug(" -    Obtendo as materias da unidade %s - " % (codigo))
	response = await session.get('https://uspdigital.usp.br/jupiterweb/jupDisciplinaLista?letra=A-Z&tipo=T&codcg=' + codigo, timeout = 120)
	assert response.status == 200
	soup = BeautifulSoup(await response.text(), "html5lib")
	links_materias = soup.find_all('a', href=re.compile("obterTurma"))
	materias = list(map(extrai_materia, links_materias))
	logger.debug(f" -   {len(materias)} materias encontradas na unidade {codigo} - ")

	return materias

def extrai_codigo_unidade(x):
	return re.search("codcg=(\d+)", x.get('href')).group(1)

#Tabelas sem tabelas dentro
def eh_tabela_folha(tag):
	return tag.name == "table" and tag.table == None

async def parsear_materia(materia):
	if not materia:
		return
	async with sem:
		logger.debug(f" -      Obtendo turmas de {materia[0]} - {materia[1]}")
		codigo = materia[0]
		try:
			response = await session.get('https://uspdigital.usp.br/jupiterweb/obterTurma?print=true&sgldis=' + codigo, timeout=args.timeout, verify_ssl=False)
			assert response.status == 200
			response = await response.text()
		except asyncio.TimeoutError:
			try:
				logger.warn(f" -      O pedido de turmas de {codigo} excedeu o tempo limite do pedido. Tentando novamente...")
				response = await session.get('https://uspdigital.usp.br/jupiterweb/obterTurma?print=true&sgldis=' + codigo, timeout=args.timeout*2, verify_ssl=False)
				assert response.status == 200
				response = await response.text()
			except asyncio.TimeoutError:
				logger.error(f" -      O pedido de turmas de {codigo} excedeu o tempo limite do pedido")
				return
		except:
			logger.exception(f" -      Não foi possível obter turmas de {materia[0]} - {materia[1]}")
			return
	
		logger.debug(f" -      Analisando turmas de {materia[0]} - {materia[1]}")
		soup = BeautifulSoup(response, "html5lib")
		tabelas_folha = soup.find_all(eh_tabela_folha)
		turmas = parsear_turmas(tabelas_folha)

		if not turmas:
			logger.warning(f" -      Disciplina {codigo} não possui turmas válidas cadastradas no Jupiter. Ignorando...")
			return;

		logger.debug(f" -      Obtendo informações de {materia[0]} - {materia[1]}")
		try:
			response2 = await session.get('https://uspdigital.usp.br/jupiterweb/obterDisciplina?print=true&sgldis=' + codigo, timeout = args.timeout, verify_ssl=False)
			assert response2.status == 200
			response2 = await response2.text()
		except asyncio.TimeoutError:
			try:
				logger.warn(f" -      O pedido de informações de {codigo} excedeu o tempo limite do pedido. Tentando novamente...")
				response2 = await session.get('https://uspdigital.usp.br/jupiterweb/obterDisciplina?print=true&sgldis=' + codigo, timeout = args.timeout*2, verify_ssl=False)
				assert response2.status == 200
				response2 = await response2.text()
			except asyncio.TimeoutError:
				logger.error(f" -      O pedido de informações de {codigo} excedeu o tempo limite do pedido")
				return
		except:
			logger.exception(f" -      Não foi possível obter informações de {codigo}")
			return
	
		soup = BeautifulSoup(response2, "html5lib")
		tabelas_folha = soup.find_all(eh_tabela_folha)

		materia = parsear_info_materia(tabelas_folha)

		if not materia:
			logger.warning(f" -      Disciplina {codigo} não possui informações cadastradas no Jupiter. Ignorando...")
			return;

		materia['turmas'] = turmas

		logger.debug(f" -      Salvando {codigo}")

		materia_json = json.dumps(materia)

		arq = open("%s.json" % os.path.join(args.db_dir, codigo) ,"w")
		arq.write(materia_json)
		arq.close()

		if not args.nogzip:
			arq = open("%s.json.gz" % os.path.join(args.db_dir, codigo) ,"wb")
			arq.write(gzip.compress(bytes(materia_json,'utf-8')))
			arq.close()

		return materia

def parsear_info_materia(tabelas_folha):
	info = {}

	re_nome = re.compile("Disciplina:\s+.{7}\s+-.+")
	re_creditos = re.compile("Créditos\s+Aula")

	for folha in tabelas_folha:
		trs = folha.find_all("tr")
		if folha.find(text=re_nome):
			strings = list(folha.stripped_strings)
			info['unidade'] = strings[0]
			info['departamento'] = strings[1]
			search = re.search("Disciplina:\s+([A-Z0-9\s]{7})\s-\s(.+)", strings[2])
			assert search != None, f"{strings[2]} não é um nome de disciplina válido ({folha})"
			info['codigo'] = search.group(1)
			info['nome'] = search.group(2)
		elif ''.join(trs[0].stripped_strings) == "Objetivos":
			info['objetivos'] = ''.join(trs[1].stripped_strings)
		elif ''.join(trs[0].stripped_strings) == "Programa Resumido":
			info['programa_resumido'] = ''.join(trs[1].stripped_strings)
		elif folha.find(text=re_creditos):
			info = { **info, **parsear_creditos(folha) }

	return info

def parsear_turmas(tabelas_folha):
	turmas = []
	info = horario = vagas = None
	for folha in tabelas_folha:
		if folha.find_all(text=re.compile("Código\s+da\s+Turma", flags=re.UNICODE)):
			if info != None:
				if not horario:
					logger.warn(f" -      Turma {info['codigo']} não possui horário cadastrado");
				elif not vagas:
					logger.warn(f" -      Turma {info['codigo']} não possui vagas cadastradas");
				else:
					info['horario'] = horario
					info['vagas'] = vagas
					turmas.append(info)
			info = parsear_info_turma(folha)
		elif folha.find_all(text="Horário"):
			horario = parsear_horario(folha)
		elif folha.find_all(text=re.compile("Atividades\s+Didáticas", flags=re.UNICODE)):
			continue
		elif folha.find_all(text="Vagas"):
			vagas = parsear_vagas(folha)
	
	if info != None:
		info['horario'] = horario
		info['vagas'] = vagas
		turmas.append(info)
	return turmas

def parsear_creditos(tabela):
	creditos = {'creditos_aula': 0, 'creditos_trabalho': 0}
	for tr in tabela.find_all("tr"):
		tds = list(map(lambda x: next(x.stripped_strings),tr.find_all("td")))
		if re.search("Créditos\s+Aula:", tds[0], flags=re.U):
			creditos['creditos_aula'] = to_int(tds[1])
		elif re.search("Créditos\s+Trabalho:", tds[0], flags=re.U):
			creditos['creditos_trabalho'] = to_int(tds[1])
	return creditos

#Retorna uma tupla da forma:
#(codigo, inicio, fim, tipo, codigo_teorica)
#Exemplo:
#("2013102", "25/02/2013", "29/06/2013", "Teórica", None)
#("2013102", "25/02/2013", "29/06/2013", "Prática", None)
#("2013102", "25/02/2013", "29/06/2013", "Teórica Vinculada", None)
#("2013112", "25/02/2013", "29/06/2013", "Prática Vinculada", "2013102")
def parsear_info_turma(tabela):
	info = {}
	try:
		for tr in tabela.find_all("tr"):
			tds = list(map(lambda x: next(x.stripped_strings),tr.find_all("td")))
			if re.search("Código\s+da\s+Turma\s+Teórica", tds[0], flags=re.U):
				info['codigo_teorica'] = tds[1]
			elif re.search("Código\s+da\s+Turma", tds[0], flags=re.U):
				info['codigo'] = re.match("^(\w+)", tds[1], flags=re.U).group(1)
			elif re.search("Início", tds[0], flags = re.U):
				info['inicio'] = dateutil.parser.parse(tds[1], dayfirst=True).strftime("%d/%m/%Y")
			elif re.search("Fim", tds[0], flags=re.U):
				info['fim'] = dateutil.parser.parse(tds[1], dayfirst=True).strftime("%d/%m/%Y")
			elif re.search("Tipo\s+da\s+Turma", tds[0], flags=re.U):
				info['tipo'] = tds[1]
			elif re.search("Observações", tds[0], flags=re.U):
				info['observacoes'] = tds[1]
			else:
				print("Informacao ignorada: %s" % (tds[0]))
	except IndexError:
		pass

	return info

def parsear_vagas(tabela):
	vagas = {}
	accum = None
	for tr in tabela.find_all("tr"):
		tds = tr.find_all("td")
		tds = ["".join(x.stripped_strings).strip() for x in tds]
		
		if len(tds) == 5 and tds[0] == "": #Cabecalho
			continue
		elif len(tds) == 5 and tds[0] != "": #Novo tipo de vaga (Obrigatória, Optativa, ...)
			if accum != None:
				vagas[tipo] = accum
			tipo = tds[0]
			accum = {'vagas': to_int(tds[1]), 'inscritos': to_int(tds[2]), 'pendentes': to_int(tds[3]), 'matriculados': to_int(tds[4]), 'grupos': {}}
		elif len(tds) == 6: #Detalhamento das vagas (IME - Matemática Bacharelado, Qualquer Unidade da
                      #USP, ...)
			grupo = tds[1]
			detalhamento = {'vagas': to_int(tds[2]), 'inscritos': to_int(tds[3]), 'pendentes': to_int(tds[4]), 'matriculados': to_int(tds[5])}
			accum['grupos'][grupo] = detalhamento
	if accum != None:
		vagas[tipo] = accum
	return vagas

def to_int(string):
	try:
		return int(string)
	except:
		return 0

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
		tds = ["".join(x.stripped_strings).strip() for x in tds]
		if tds[0] == "Horário": #Cabeçalho
			continue
		
		if tds[0] != "": #Novo dia de aula (Ex.  |ter|10:00|11:50|Adilson Simonis|)
			if accum != None:
				horario.append(accum)
			accum = (tds[0], tds[1], tds[2], [tds[3]])

 		#Mais professores (Ex.  ||||Elisabeti Kira|) e possivelmente um horário
 		#maior
		#Ex: |qui|14:00|16:00|Sonia Regina Leite Garcia
		#    | | |18:00|Artur Simões Rozestraten
		#    | | | |Eduardo Colli
		if tds[0] == "" and tds[1] == "": 
			if tds[2] > accum[2]:
				accum = (accum[0], accum[1], tds[2], accum[3])
			accum[3].append(tds[3])
		
 		#Mais uma aula no mesmo dia
		#Ex: |seg|08:00|12:00|(R)Jose Roberto de Magalhaes Bastos
 		#     | | |13:00|(R)Magali de Lourdes Caldana
		#     | |14:00|18:00|(R)Jose Roberto de Magalhaes Bastos
 		#     | | |19:00|(R)Magali de Lourdes Caldana
		if tds[0] == "" and tds[1] != "":
			if accum != None:
				horario.append(accum)
			accum = (accum[0], tds[1], tds[2], [tds[3]])
			
	if accum != None:
		horario.append(accum)
#		print horario
	return list(map(lambda x: dict(zip(('dia','inicio','fim','professores'),x)), horario))

#Retorna um par (codigo, nome), exemplo: (u'MAC0323', u'Estruturas de Dados')
def extrai_materia(x):
	search = re.search("sgldis=([A-Z0-9\s]{7})", x.get('href'))
	return (search.group(1), x.string) if search else None

def limpar_diretorio(diretorio):
	for the_file in os.listdir(diretorio):
		file_path = os.path.join(diretorio, the_file)
		try:
		    if os.path.isfile(file_path):
		        os.unlink(file_path)
		except Exception as e:
		    pass

		
if __name__ == "__main__":
	parser = argparse.ArgumentParser(description="Crawler MatrUSP")
	parser.add_argument('diretorio_destino', help="diretório que irá conter os arquivos resultantes")
	parser.add_argument('-v','--verbosidade',action = 'count', default = 0)
	parser.add_argument('-u','--unidades', help=  "iterar apenas estes códigos de unidade", nargs = '+')
	parser.add_argument('-s','--simultaneidade',help = "número de pedidos HTTP simultâneos", type=int, default=100)
	parser.add_argument('-t','--timeout',help = "tempo máximo (segundos) do pedido HTTP", type=int, default=120)
	parser.add_argument('-o','--out',help="arquivo de saída do banco de dados completo", type=str, default="db.json")
	parser.add_argument('--nogzip',help = "não compactar os arquivos de saída", action='store_true')
	args = parser.parse_args()

	if not args.diretorio_destino:
		parser.print_help()
		exit(1)
	
	args.db_dir = os.path.abspath(args.diretorio_destino)
	if not os.path.isdir(args.db_dir):
		parser.print_help()
		exit(1)

	logger = logging.getLogger('log')
	logger.setLevel(logging.DEBUG)

	ch = logging.StreamHandler()
	ch.setLevel(60-10*(args.verbosidade or 4))
	ch.setFormatter(logging.Formatter('%(message)s'))
	logger.addHandler(ch)

	fh = logging.FileHandler(time.strftime('%Y-%m-%d_%H-%M-%S_'+__file__+'.log'))
	fh.setLevel(logging.DEBUG)
	fh.setFormatter(logging.Formatter('[%(asctime)s] %(module)s %(levelname)s: %(message)s'))
	logger.addHandler(fh)

	loop = asyncio.get_event_loop()
	sem = asyncio.Semaphore(args.simultaneidade, loop = loop)

	exit(main())