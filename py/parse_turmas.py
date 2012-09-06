#!/usr/bin/python

# lxml is slower than cElementTree
from xml.etree import cElementTree
import unicodedata
import codecs
import json
import sys
import os

if len(sys.argv) < 3:
    print('usage: %s <input> <output>')
    sys.exit(1)

outf = codecs.getwriter('utf8')(open(sys.argv[len(sys.argv)-1], 'w'))
outf.write('{')

for i in range(1, len(sys.argv)-1):

    if i != 1:
        outf.write(',')
    outf.write('\"' + os.path.splitext(sys.argv[i])[0][-3:] + '\":[')

    inf = open(sys.argv[i], 'r')
    split = inf.read().split('<?xml version="1.0"?>')
    inf.close()

    prev_materia = None
    cur_materia = None
    materias = []

    for xml in split:
        if len(xml) == 0:
            continue
        for row in cElementTree.fromstring(xml)[1][1][2]:
            codigo_disciplina = row[ 3].text # ok
            nome_turma        = row[ 4].text # ok

            nome_disciplina   = row[ 5].text # separado por BR
            for sub in row[5]:
                nome_disciplina = nome_disciplina + ' ' + sub.tail

            horas_aula        = int(row[ 6].text) # ok
            vagas_ofertadas   = int(row[ 7].text) # ok
            vagas_ocupadas    = int(row[ 8].text) # ok
            alunos_especiais  = int(row[ 9].text) # ok
            try:
                saldo_vagas   = int(row[10].text) # ok ou <span> LOTADA
            except TypeError:
                saldo_vagas   = 0
            try:
                pedidos_sem_vaga = int(row[11].text) # ok ou vazio
            except TypeError:
                pedidos_sem_vaga = 0

            horarios = []
            if row[12].text:
                horarios.append(row[12].text)
            for sub in row[12]:
                if sub.tail:
                    horarios.append(sub.tail)

            professores = []
            if len(row[13]):
                if not row[13][0].text:
                    professores.append(row[13].text)
            for sub in row[13]:
                if sub.attrib:
                    professores.append(sub.text)
                elif sub.tail:
                    professores.append(sub.tail)

            if codigo_disciplina != prev_materia:
                try:
                    nome_disciplina_ascii = unicodedata.normalize('NFKD', nome_disciplina).encode('ascii', 'ignore')
                except TypeError:
                    nome_disciplina_ascii = nome_disciplina
                cur_materia = [codigo_disciplina, nome_disciplina_ascii.upper(), nome_disciplina, []]
                materias.append(cur_materia)
                prev_materia = codigo_disciplina
            turma = [nome_turma, horas_aula, vagas_ofertadas, vagas_ocupadas, alunos_especiais, saldo_vagas, pedidos_sem_vaga, horarios, professores]
            cur_materia[3].append(turma)

    for materia in materias:
        outf.write(json.dumps(materia, ensure_ascii=False, separators=(',',':')))
        if materia != materias[len(materias)-1]:
            outf.write(',')
        outf.write('\n')
    outf.write(']')
#    outf.write(json.dumps(materias, ensure_ascii=False, separators=(',',':')))

outf.write('}')
outf.close()
