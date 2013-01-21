#!/usr/bin/python
# -*- coding: utf-8 -*-

import os, os.path
import re
import sys
import urllib2
from bs4 import BeautifulSoup

#Limpa o DB_DIR antes de inserir os dados novos
remover_antigos = True

def main(db_dir, remover_antigos):
	db_dir = os.path.abspath(db_dir)
	
	if not os.path.isdir(db_dir):
		print " - %s não é um diretório válido. Encerrando. - " % (db_dir)
		return 1;

	print " - Obtendo a lista de todas as unidades de ensino - "
	response = urllib2.urlopen('https://uspdigital.usp.br/jupiterweb/jupColegiadoLista?tipo=D')
	soup = BeautifulSoup(response.read(), "html5lib")

	#Lista de tags do BeautifulSoup da forma [<a href="jupColegiadoMenu.jsp?codcg=33&amp;tipo=D&amp;nomclg=Museu+Paulista">Museu 	Paulista</a>, ...]
	links_unidades = soup.find_all('a', href=re.compile("jupColegiadoMenu"))
	
	#Lista de codigos de unidades de ensino.
	#Normalmente: [u'86', u'27', u'39', u'98', u'7', u'22', u'94', u'88', u'18',
	#u'97', u'3', u'11', u'16', u'9', u'60', u'2', u'89', u'12', u'81', u'48',
	#u'59', u'96', u'91', u'8', u'5', u'17', u'10', u'23', u'25', u'58', u'95',
	#u'6', u'74', u'61', u'99', u'14', u'93', u'41', u'92', u'42', u'55', u'4',
	# u'43', u'76', u'44', u'45', u'83', u'47', u'46', u'75', u'87', u'21', u'90',
	#u'71', u'100', u'1', u'30', u'64', u'31', u'85', u'36', u'32', u'38', u'33']
	codigos_unidades = map(extrai_codigo, links_unidades)

	print " - %d unidades de ensino encontradas - " % (len(codigos_unidades))
	
	materias = {}
	for codigo in codigos_unidades:
		print " - Obtendo as materias da unidade %s - " % (codigo)
		response = urllib2.urlopen('https://uspdigital.usp.br/jupiterweb/jupDisciplinaLista?letra=A-Z&tipo=D&codcg=' + codigo)
		soup = BeautifulSoup(response.read(), "html5lib")
		links_materias = soup.find_all('a', href=re.compile("obterDisciplina"))
		materias_unidade = map(extrai_materia, links_materias)
		print "   - %d materias encontradas - " % (len(materias_unidade))
		materias[codigo] = materias_unidade

	print " - Terminada a descoberta de materias - "

	if remover_antigos:
		print "   - Removendo turmas armazenadas antigas ... ",
		limpar_diretorio(db_dir)
		print "Feito - "

	nao_existe_oferecimento = re.compile("existe oferecimento")

	for unidade, materias_unidade in materias.iteritems():
		print " - Iniciando processamento da unidade %s - " % (unidade)
	
		for materia, nome in materias_unidade:
			if len(materia) != 7:
				continue
			response = urllib2.urlopen('https://uspdigital.usp.br/jupiterweb/obterTurma?print=true&sgldis=' + materia).read()
			if nao_existe_oferecimento.search(response):
				print "   - Pulando     %s - %s" % (materia, nome)
				continue
			print "   - Armazenando %s - %s" % (materia, nome)
			arq = open("%s.html" % os.path.join(db_dir, materia), "w")
			arq.write(response)
			arq.close()
		print " - Fim do processamento da unidade %s - " % (unidade)
	
	print " - FIM! -"
	return 0


def extrai_codigo(x):
	return re.search("codcg=(\d+)", x.get('href')).group(1)

#Retorna um par (codigo, nome), exemplo: (u'MAC0323', u'Estruturas de Dados')
def extrai_materia(x):
	return (re.search("sgldis=([A-Z0-9]+)", x.get('href')).group(1), x.string)

def limpar_diretorio(diretorio):
	for the_file in os.listdir(diretorio):
		file_path = os.path.join(diretorio, the_file)
		try:
		    if os.path.isfile(file_path):
		        os.unlink(file_path)
		except Exception, e:
		    pass

if __name__ == "__main__":
	if len(sys.argv) < 2:
		print " - Forneça o caminho para o diretório onde serão armazenados os arquivos. Encerrando. - "
		sys.exit(1);
	main(sys.argv[1], remover_antigos)
