#!/usr/bin/python
# -*- coding: utf-8 -*-
import os
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
from multi_key_dict import multi_key_dict

codigos_unidades = {}

def main():
	t = time.perf_counter() # Contador de tempo de execução

	logger.info(" - Obtendo a lista de todas as unidades de ensino - ")

	response = urllib.request.urlopen('https://uspdigital.usp.br/jupiterweb/jupColegiadoLista?tipo=T')
	soup = BeautifulSoup(response.read(), "html5lib")

	# Lista de tags do BeautifulSoup da forma [<a
	# href="jupColegiadoMenu.jsp?codcg=33&amp;tipo=D&amp;nomclg=Museu+Paulista">Museu
	# Paulista</a>, ...]
	links_unidades = soup.find_all('a', href=re.compile("jupColegiadoMenu"))

	# Popular o dicionário de unidades a partir dos links encontrados
	global codigos_unidades
	codigos_unidades = {key:value for (key, value) in map(lambda x: (re.search("codcg=(\d+)", x.get('href')).group(1),x.string), links_unidades)}
	
	logger.info(" - %d unidades de ensino encontradas - " % (len(codigos_unidades)))

	# Iniciar a iteração das unidades de acordo com as unidades encontradas ou fornecidas por argumento opcional, de forma assíncrona.
	if not args.unidades:
		cursos = loop.run_until_complete(iterar_unidades(codigos_unidades.keys()))
	else:
		cursos = loop.run_until_complete(iterar_unidades(args.unidades))

	# Salvar em arquivo json
	cursos_json = json.dumps(cursos)
	
	arq = open(os.path.join(args.db_dir, args.out) ,"w")
	arq.write(cursos_json)
	arq.close()

	if not args.nogzip:
		arq = open(os.path.join(args.db_dir, args.out + ".gz") ,"wb")
		arq.write(gzip.compress(bytes(cursos_json,'utf-8')))
		arq.close()

	logger.info(f" -   {len(cursos)} cursos salvos")

	logger.info(" - FIM! -")
	logger.info(f" - \n - Tempo de execução: {time.perf_counter() - t} segundos")
	return 0

async def iterar_unidades(codigos_unidades):
	# Sessão HTTP global utilizada por todas as iterações
	global session
	session = aiohttp.ClientSession()

	#Chamar todas as unidades simultaneamente, de forma assíncrona
	logger.info(" - Iniciando processamento de unidades")
	unidade_tasks = (await asyncio.wait([iterar_unidade(i) for i in codigos_unidades]))[0]

	logger.info(f" -   {len(unidade_tasks)} unidades processadas")
	logger.info(" - Iniciando processamento de cursos")

	# Criar uma corotina para cada matéria encontrada, de todas as unidades
	coros = []
	for cursos_unidade in unidade_tasks:
		for curso in cursos_unidade.result():
			coros.append(parsear_curso(curso))

	# Chamar todas as matérias simultaneamente, de forma assíncrona
	#logger.info(f" -   {len(coros)} materias encontradas")
	cursos_tasks = (await asyncio.wait(tuple(coros)))[0]

	#Fechar a sessão e retornar os resultados.
	await session.close()
	#logger.info(f" -   {len(materias_tasks)} materias processadas")
	return [i.result() for i in cursos_tasks if i.result()]

async def iterar_unidade(codigo):
	#logger.debug(" -    Obtendo as materias da unidade %s - " % (codigo))
	response = await session.get('https://uspdigital.usp.br/jupiterweb/jupCursoLista?tipo=N&codcg=' + codigo, timeout = 120)
	assert response.status == 200
	soup = BeautifulSoup(await response.text(), "html5lib")
	links_cursos = soup.find_all('a', href=re.compile("listarGradeCurricular"))
	#logger.debug(f" -   {len(materias)} materias encontradas na unidade {codigo} - ")
	
	return [i['href'] for i in links_cursos] # Retorna uma lista de matérias para serem buscadas

#Tabelas sem tabelas dentro
def eh_tabela_folha(tag):
	return tag.name == "table" and tag.table == None

async def parsear_curso(link):
	if not link:
		return

	link = 'https://uspdigital.usp.br/jupiterweb/' + link

	async with semaforo:
		logger.debug(f" -      Obtendo informações de {link}")
		try:
			response = await session.get(link, timeout=args.timeout, verify_ssl=False)
			assert response.status == 200
			response = await response.text()
		except asyncio.TimeoutError: # Tentar acessar o jupiterWeb novamente, caso o pedido falhe.
			try:
				logger.warn(f" -      O pedido de {link} excedeu o tempo limite do pedido. Tentando novamente...")
				response = await session.get(link, timeout=args.timeout*2, verify_ssl=False)
				assert response.status == 200
				response = await response.text()
			except asyncio.TimeoutError:
				logger.error(f" -      O pedido de {link} excedeu o tempo limite do pedido")
				return
		except:
			logger.exception(f" -      Não foi possível obter informações de {link}")
			return

		soup = BeautifulSoup(response, "html5lib")
		tabelas_folha = soup.find_all(eh_tabela_folha)
		

		curso = {}
		re_codigo = re.search("codcur=(.+?)&codhab=(.+?)(&|$)",link)
		curso['codigo'] = f"{re_codigo.group(1)}-{re_codigo.group(2)}"
		curso['nome'] = ' - '.join(x.group(1) for x in re.finditer("Curso:\s*(.+)\s*", soup.get_text()))
		curso['unidade'] = codigos_unidades[re.search("codcg=([1-9]+)",link).group(1)]
		
		re_disciplinas = re.compile("Disciplinas\s+Obrigatórias")
		for folha in tabelas_folha:
			if folha.find(text=re_disciplinas):
				curso['periodos'] = parsear_periodos(folha)
				break

		return curso


def parsear_periodos(folha):
	trs = folha.find_all('tr')
	periodos = {}

	switch_tipos = {
		'Disciplinas Obrigatórias': 'obrigatoria',
		'Disciplinas Optativas Eletivas': 'optativa_eletiva',
		'Disciplinas Optativas Livres': 'optativa_livre'
	}

	re_periodo = re.compile('([0-9]+)º Período Ideal')
	
	tipo = ''
	periodo = ''
	for tr in trs:
		str = re.sub("\s+"," ",next(tr.stripped_strings,''))

		if str and switch_tipos.get(str):
			tipo = switch_tipos[str]
			continue
		elif str and re_periodo.search(str):
			periodo = re_periodo.search(str).group(1)
			if not periodo in periodos: periodos[periodo] = []
			continue
		else:
			try: tds = [next(td.stripped_strings, '') for td in tr.find_all('td')]
			except AttributeError as e: continue
			if len(tds[0]) == 7:
				periodos[periodo].append({'codigo': tds[0], 'tipo': tipo, 'req_fraco': [], 'req_forte': [], 'ind_conjunto': []})
				continue
			else:
				if len(tds) < 2:
					continue
				if tds[1] == "Requisito fraco":
					periodos[periodo][-1]['req_fraco'].append(tds[0][0:7])
				elif tds[1] == "Requisito":
					periodos[periodo][-1]['req_forte'].append(tds[0][0:7])
				elif tds[1] == "Indicação de Conjunto":
					periodos[periodo][-1]['ind_conjunto'].append(tds[0][0:7])
				continue

	return periodos
		
#Execução do programa
if __name__ == "__main__":

	#Definição dos parâmetros de entrada
	parser = argparse.ArgumentParser(description="Crawler MatrUSP")
	parser.add_argument('diretorio_destino', help="diretório que irá conter os arquivos resultantes")
	parser.add_argument('-v','--verbosidade',action = 'count', default = 0)
	parser.add_argument('-u','--unidades', help=  "iterar apenas estes códigos de unidade", nargs = '+')
	parser.add_argument('-s','--simultaneidade',help = "número de pedidos HTTP simultâneos", type=int, default=10)
	parser.add_argument('-t','--timeout',help = "tempo máximo (segundos) do pedido HTTP", type=int, default=120)
	parser.add_argument('-o','--out',help="arquivo de saída do banco de dados completo", type=str, default="cursos.json")
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

	# Enviar log para o console
	ch = logging.StreamHandler()
	ch.setLevel(60-10*(args.verbosidade or 4))
	ch.setFormatter(logging.Formatter('%(message)s'))
	logger.addHandler(ch)

	# Enviar log para arquivo
	fh = logging.FileHandler(time.strftime('%Y-%m-%d_%H-%M-%S_'+__file__+'.log'))
	fh.setLevel(logging.DEBUG)
	fh.setFormatter(logging.Formatter('[%(asctime)s] %(module)s %(levelname)s: %(message)s'))
	logger.addHandler(fh)

	loop = asyncio.get_event_loop()
	semaforo = asyncio.Semaphore(args.simultaneidade, loop = loop)

	exit(main())