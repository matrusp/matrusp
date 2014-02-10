#!/usr/bin/python
# -*- coding: utf-8 -*-

import StringIO
import json
import odslib

def run(json_in):
    # carrega stdin
    xson = json.loads(json_in)

    # inicializa ods
    planilha = odslib.ODS()

    # escreva dias
    planilha.content.getCell(0, 0).stringValue(u"MatrUFSC").setBold(True)
    planilha.content.getCell(1, 0).stringValue(u"Segunda")
    planilha.content.getCell(2, 0).stringValue(u"Terça")
    planilha.content.getCell(3, 0).stringValue(u"Quarta")
    planilha.content.getCell(4, 0).stringValue(u"Quinta")
    planilha.content.getCell(5, 0).stringValue(u"Sexta")
    planilha.content.getCell(6, 0).stringValue(u"Sábado")

    # escreve horas
    planilha.content.getCell(0,  1).stringValue(u"07:30 - 08:20")
    planilha.content.getCell(0,  2).stringValue(u"08:20 - 09:10")
    planilha.content.getCell(0,  3).stringValue(u"09:10 - 10:00")
    planilha.content.getCell(0,  4).stringValue(u"10:10 - 11:00")
    planilha.content.getCell(0,  5).stringValue(u"11:00 - 11:50")
    planilha.content.getCell(0,  6).stringValue(u"13:30 - 14:20")
    planilha.content.getCell(0,  7).stringValue(u"14:20 - 15:10")
    planilha.content.getCell(0,  8).stringValue(u"15:10 - 16:00")
    planilha.content.getCell(0,  9).stringValue(u"16:20 - 17:10")
    planilha.content.getCell(0, 10).stringValue(u"17:10 - 18:00")
    planilha.content.getCell(0, 11).stringValue(u"18:30 - 19:20")
    planilha.content.getCell(0, 12).stringValue(u"19:20 - 20:10")
    planilha.content.getCell(0, 13).stringValue(u"20:20 - 21:10")
    planilha.content.getCell(0, 14).stringValue(u"21:10 - 22:00")

    # escreve aulas
    for i, dia in enumerate(xson['horarios']):
        for j, aula in enumerate(dia):
            if aula:
                planilha.content.getCell(i+1, j+1).stringValue(aula['codigo']).setCellColor(aula['cor'])

    # cabeçalho das turmas
    planilha.content.getCell(0, 15).stringValue(u"Código")
    planilha.content.getCell(1, 15).stringValue(u"Turma")
    planilha.content.getCell(2, 15).stringValue(u"Nome")

    # escreve turmas e cria estilos
    for i, turma in enumerate(xson['turmas']):
        planilha.content.getCell(0, i+16).stringValue(turma['codigo']).setCellColor(turma['cor'])
        planilha.content.getCell(1, i+16).stringValue(turma['turma']).setCellColor(turma['cor'])
        planilha.content.getCell(2, i+16).stringValue(turma['nome']).setCellColor(turma['cor'])
        planilha.content.mergeCells(2, i+16, 5, 1)

    output = StringIO.StringIO()
    planilha.save(output)
    return output.getvalue()

# print run(raw_input())
