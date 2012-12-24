#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import re
import json
from bs4 import BeautifulSoup

DB_DIR = "db/"
arq_saida = "db_usp.json"


def parsear_informacoes(tabela):
	info = {}
	for tr in tabela.find_all("tr"):
		tds = tr.find_all("td")

		if re.search(u"Código\s+da\s+Turma\s+Teórica", tds[0].string, flags=re.U):
			info["codigo_teorica"] = tds[1].string.strip()
		elif re.search(u"Código\s+da\s+Turma", tds[0].string, flags=re.U):
			info["codigo"] = tds[1].string.strip()
		elif re.search(u"Início", tds[0].string, flags=re.U):
			info["inicio"] = tds[1].string.strip()
		elif re.search(u"Fim", tds[0].string, flags=re.U):
			info["fim"] = tds[1].string.strip()
		elif re.search(u"Tipo\s+da\s+Turma", tds[0].string, flags=re.U):
			info["tipo"] = tds[1].string.strip()
		elif re.search(u"Observações", tds[0].string, flags=re.U):
			info["observacoes"] = tds[1].string.strip()
		else:
			print "Informacaoo ignorada: %s" % (tds[0].string.strip())
#		print info
	return info

def parsear_horario(tabela):
	horario = []
	accum = None
	for tr in tabela.find_all("tr"):
		tds = tr.find_all("td")
		tds = map(lambda x: u"".join(x.stripped_strings).strip(), tds)
		if tds[0] == u"Horário":
			continue
		if tds[0] != u"":
			if accum != None:
				horario.append(accum)
			accum = (tds[0], tds[1], tds[2], [tds[3]])
		if tds[0] == u"":
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

def parsear_vagas(tabela):
	vagas = []
	accum = None
	for tr in tabela.find_all("tr"):
		tds = tr.find_all("td")
		tds = map(lambda x: u"".join(x.stripped_strings).strip(), tds)
		
		if len(tds) == 5 and tds[0] == u"": #Cabecalho
			continue
		elif len(tds) == 5 and tds[0] != u"":
			if accum != None:
				vagas.append(accum)
			
			
			accum = (tds[0], to_int(tds[1]), to_int(tds[2]), to_int(tds[3]), to_int(tds[4]), [])
		elif len(tds) == 6:
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
	
	return (codigo, nome, turmas)

db = []	
for arq in os.listdir(DB_DIR):
	db.append(parsear_materia(arq))

print " - Gravando resultados - "
saida = open(arq_saida, "w")
saida.write(json.dumps(db))
saida.close()
print " - FIM! - "
