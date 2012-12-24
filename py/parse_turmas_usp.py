#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import re
import json
from bs4 import BeautifulSoup

DB_DIR = "db/"

class Turma:
	def __init__(self):
		self.info = {}
		self.horario = []
		self.vagas = []
	
	def inserir_informacoes(self, tabela):
		for tr in tabela.find_all("tr"):
			tds = tr.find_all("td")
			
			if re.search(u"Código\s+da\s+Turma\s+Teórica", tds[0].string, flags=re.U):
				self.info["codigo_teorica"] = tds[1].string.strip()
			elif re.search(u"Código\s+da\s+Turma", tds[0].string, flags=re.U):
				self.info["codigo"] = tds[1].string.strip()
			elif re.search(u"Início", tds[0].string, flags=re.U):
				self.info["inicio"] = tds[1].string.strip()
			elif re.search(u"Fim", tds[0].string, flags=re.U):
				self.info["fim"] = tds[1].string.strip()
			elif re.search(u"Tipo\s+da\s+Turma", tds[0].string, flags=re.U):
				self.info["tipo"] = tds[1].string.strip()
			elif re.search(u"Observações", tds[0].string, flags=re.U):
				self.info["observacoes"] = tds[1].string.strip()
			else:
				print "Informacaoo ignorada: %s" % (tds[0].string.strip())
#		print self.info
	
	def inserir_horario(self, tabela):
		accum = None
		for tr in tabela.find_all("tr"):
			tds = tr.find_all("td")
			tds = map(lambda x: u"".join(x.stripped_strings).strip(), tds)
			if tds[0] == u"Horário":
				continue
			if tds[0] != u"":
				if accum != None:
					self.horario.append(accum)
				accum = (tds[0], tds[1], tds[2], [tds[3]])
			if tds[0] == u"":
				accum[3].append(tds[3])
		if accum != None:
			self.horario.append(accum)
#		print self.horario

	def inserir_atividades_didaticas(self, tabela):
		pass

	def inserir_vagas(self, tabela):
		accum = None
		for tr in tabela.find_all("tr"):
			tds = tr.find_all("td")
			tds = map(lambda x: u"".join(x.stripped_strings).strip(), tds)
			
			if len(tds) == 5 and tds[0] == u"": #Cabecalho
				continue
			elif len(tds) == 5 and tds[0] != u"":
				if accum != None:
					self.vagas.append(accum)
				accum = {}
				accum["nome"] = tds[0]
				accum["vagas"] = int(tds[1])
				accum["inscritos"] = int(tds[2])
				accum["pendentes"] = int(tds[3])
				accum["matriculados"] = int(tds[4])
				accum["detalhamento"] = []
			elif len(tds) == 6:
				detalhamento = {}
				detalhamento["nome"] = tds[1]
				detalhamento["vagas"] = int(tds[2])
				detalhamento["inscritos"] = int(tds[3])
				detalhamento["pendentes"] = int(tds[4])
				detalhamento["matriculados"] = int(tds[5])
				accum["detalhamento"].append(detalhamento)
		if accum != None:
			self.vagas.append(accum)
#		import pprint
#		pp = pprint.PrettyPrinter(indent=2)
#		pp.pprint(self.vagas)

class Materia:
	def __init__(self):
		self.turmas = []
	

#Tabelas sem tabelas dentro
def eh_tabela_folha(tag):
	return tag.name == "table" and tag.table == None

codigo = "0060006"
html = open(DB_DIR + codigo + ".html", "r")
soup = BeautifulSoup(html.read())
html.close()
tabelas_folha = soup.find_all(eh_tabela_folha)

turma = None
materia = Materia()
materia.codigo = codigo

for folha in tabelas_folha:
	if folha.find_all(text=re.compile("Disciplina:\s+" + codigo, flags=re.UNICODE)):
		nome = list(folha.stripped_strings)[-1]
		nome = re.match("Disciplina:\s+%s - (.+)" % (codigo), nome).group(1) 
		materia.nome = nome
	if folha.find_all(text=re.compile(u"Código\s+da\s+Turma", flags=re.UNICODE)):
		if turma != None:
			materia.turmas.append(turma)
		turma = Turma()
		turma.inserir_informacoes(folha)
	elif folha.find_all(text="Horário"):
		turma.inserir_horario(folha)
	elif folha.find_all(text=re.compile(u"Atividades\s+Didáticas", flags=re.UNICODE)):
		turma.inserir_atividades_didaticas(folha)
	elif folha.find_all(text="Vagas"):
		turma.inserir_vagas(folha)

if turma != None:
	materia.turmas.append(turma)

