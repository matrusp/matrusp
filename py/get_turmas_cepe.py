#!/usr/bin/python
# -*- coding: utf-8 -*-

"""
Módulo de extração de turmas do CEPE para o MatrUSP.
"""

import os
import os.path
import re
import sys
import urllib2
import codecs
import locale
import dateutil.parser
from bs4 import BeautifulSoup
from urlparse import urljoin
from collections import defaultdict
from datetime import datetime, timedelta

_codigo = "ZZZ%02d%02d" #Código de uma disciplina fictícia do CEPE

sys.stdout = codecs.getwriter(locale.getpreferredencoding())(sys.stdout)

def obter_materias_cepe():
    """
    Acessa o site do CEPE e retorna uma dicionário de matérias, que representam
    as atividades físicas disponíveis.

    Exemplo de retorno:
    {'XXX0101': ('XXX0101', #Código fictício seguindo o padrão _codigo
      u'[CEPE] Alongamento I Masculino e Feminino', #Nome da disciplina
      [('01', #Número da turma
        '06/08/2013', #Data aproximada de início
        '04/12/2013', #Data aproximada de término
        u'Pr\xe1tica', #Tipo de atividade, sempre Prática
        [('ter', '17:00', '18:00', [u'Carolina']), #Dia da atividade, hora de início
                                                   #hora de término e professor
         ('qui', '17:00', '18:00', [u'Carolina'])],
        25)]), #Número de vagas
     'XXX0201': ('XXX0201',
      u'[CEPE] Badminton I/II Masculino e Feminino',
      [('01',
        '05/08/2013',
        '03/12/2013',
        u'Pr\xe1tica',
        [('seg', '12:00', '13:30', [u'Prouvot']),
         ('qua', '12:00', '13:30', [u'Prouvot'])],
        20),
       ('02',
        '05/08/2013',
        '03/12/2013',
        u'Pr\xe1tica',
        [('seg', '17:00', '18:30', [u'Prouvot']),
         ('qua', '17:00', '18:30', [u'Prouvot'])],
        15)]),
     'XXX0202': ('XXX0202',
      u'[CEPE] Badminton III Masculino e Feminino',
      [('01',
        '05/08/2013',
        '03/12/2013',
        u'Pr\xe1tica',
        [('seg', '17:00', '18:30', [u'Prouvot']),
         ('qua', '17:00', '18:30', [u'Prouvot']),
         ('sex', '17:00', '18:30', [u'Prouvot'])],
        10)]),
    """

    print(" - Obtendo a lista de todas as modalidades - ")
    response = urllib2.urlopen('http://www.cepe.usp.br/site/?q=cursos/comunidade-usp/')
    soup = BeautifulSoup(response.read(), "html5lib")

    links_modalidades = soup.find_all('a', href=re.compile("cursos/comunidade-usp/.+"))

    print(" - Encontradas %d modalidades - " % (len(links_modalidades)))    
        
    materias = {}
    for num, link in enumerate(links_modalidades, 1):
        modalidade = parsear_modalidade(link)
        for codigo, nome in zip(gerador_codigo(num), sorted(modalidade)):
            materias[codigo] = (codigo, nome, modalidade[nome])
    
    return materias

def gerador_codigo(num_modalidade):
    """
    Função geradora de códigos fictícios da modalidade de número num_modalidade.
    
    Exemplo:
    >>> a = gerador_codigo(10)
    >>> a.next()
    XXX1001
    >>> a.next()
    XXX1002
    >>> a.next()
    XXX1003
    """
    num_materia = 1;
    while True:
        yield _codigo % (num_modalidade, num_materia)
        num_materia += 1

def mapear_dia(dia):
    """
    Mapeia um dia como '5' para um dia na forma 'qui'. Em caso de dúvida
    retorna sab.
    """
    
    mapa = {'2': 'seg', '3': 'ter', '4': 'qua', '5': 'qui', '6': 'sex'}
    if dia in mapa:
        return mapa[dia]
    return "sab"

def gerar_horario(dias, horas, professor):
    """
    Mapeador de formatos de horário.
    
    Exemplo:
    >>>gerar_horario("2a/4a", "12h00-14h00", "Lorem")
    [('seg', '12:00', '14:00', ['Lorem']), ('qua', '12:00', '14:00', ['Lorem'])]
    """
    dias = re.findall(r"(\d)", dias)
    dias = map(mapear_dia, dias)
    
    horas = [dateutil.parser.parse(x).strftime("%H:%M") for x in horas.split("-")]
    
    horario = [(dia, horas[0], horas[1], [professor]) for dia in dias]
    return horario

def to_int(string):
    """
    Retorna int(string) ou 0 em caso de erro.
    """
    try:
        return int(string)
    except:
        return 0

def parsear_modalidade(link):
    """
    Recebe uma tag <a href="...">...</a> do BeautifulSoup e retorna um
    dicionário de disciplinas correspondentes às disponíveis no site do CEPE.
    
    Exemplo:
    >>>link
    <a href="http://www.cepe.usp.br/site/?q=cursos/comunidade-usp/alongamento">Alongamento</a>
    >>>parsear_modalidade(link)
{u'[CEPE] Alongamento I Masculino e Feminino': [('01',
   '06/08/2013',
   '04/12/2013',
   u'Pr\xe1tica',
   [('ter', '17:00', '18:00', [u'Carolina']),
    ('qui', '17:00', '18:00', [u'Carolina'])],
   25),
  ('02',
   '06/08/2013',
   '04/12/2013',
   u'Pr\xe1tica',
   [('ter', '13:00', '14:00', [u'Carolina']),
    ('qui', '13:00', '14:00', [u'Carolina'])],
   25)]}
    """
    nome_modalidade = link.text
    
    print(u" - Parseando %s - " % (nome_modalidade))
    
    url = urljoin("http://www.cepe.usp.br/site/?q=cursos/comunidade-usp", link["href"])
    response = urllib2.urlopen(url)
    soup = BeautifulSoup(response.read(), "html5lib")
    
    try:
        tabela_turmas = soup.select("table.cursos")[0]
    except:
        return defaultdict(list)
        
    linhas = tabela_turmas.find_all('tr')
    linhas.pop(0) #Linha de cabeçalho
    
    materias = defaultdict(list)
    for linha in linhas:
        infos = [x.text for x in linha.find_all('td')]
    
        sexo = infos[0]
        dias = infos[1]
        horas = infos[2]
        nivel = infos[3]
        professor = infos[4]
        idade = infos[5]
        local = infos[6]
        vagas = infos[7]
        distribuicao_vagas = dateutil.parser.parse(infos[8], dayfirst=True)
  
        semestre = 1
        if distribuicao_vagas.month > 6:
            semestre = 2
        
        #[CEPE] Alongamento I Masculino e Feminino
        nome = " ".join([unicode(x) for x in "[CEPE]", nome_modalidade, nivel, sexo])
        codigo = "%d%d%02d" % (distribuicao_vagas.year, semestre, len(materias[nome]) + 1)
        data_inicio = distribuicao_vagas.strftime("%d/%m/%Y") #aproximado
        data_fim = (distribuicao_vagas + timedelta(days=120)).strftime("%d/%m/%Y") #aproximado
        tipo = u"Prática"
        horario = gerar_horario(dias, horas, professor)
        vagas = to_int(vagas)
        
        materias[nome].append((codigo, data_inicio, data_fim, tipo, horario, vagas))
    
    return materias

