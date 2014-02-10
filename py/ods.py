#!/usr/bin/python
# -*- coding: utf-8 -*-

import StringIO
import json
import odf

from odf.opendocument import OpenDocumentSpreadsheet
from odf.style import Style, TableCellProperties
from odf.text import P
from odf.table import Table, TableColumn, TableRow, TableCell

def add_cell(*args):
    cell = TableCell()
    cell.addElement(P(text=args[1]))
    if args.__len__() >= 3:
        cell.setAttribute("stylename", args[2])
    if args.__len__() == 4:
        cell.setAttribute("numbercolumnsspanned", args[3])
    args[0].addElement(cell)

def run(json_in):
    # carrega stdin
    xson = json.loads(json_in)

    # inicializa ods
    planilha = OpenDocumentSpreadsheet()
    table = Table(name="Plano %s" % xson['index'])

    table.addElement(TableColumn())

    tr = TableRow()
    add_cell(tr, u"MatrUFSC")
    add_cell(tr, u"Segunda")
    add_cell(tr, u"Terça")
    add_cell(tr, u"Quarta")
    add_cell(tr, u"Quinta")
    add_cell(tr, u"Sexta")
    add_cell(tr, u"Sábado")
    table.addElement(tr)

    horas = [ u"07:30 - 08:20", u"08:20 - 09:10", u"09:10 - 10:00", u"10:10 - 11:00", u"11:00 - 11:50",
            u"13:30 - 14:20", u"14:20 - 15:10", u"15:10 - 16:00", u"16:20 - 17:10", u"17:10 - 18:00",
            u"18:30 - 19:20", u"19:20 - 20:10", u"20:20 - 21:10", u"21:10 - 22:00" ]

    trs = []
    for i in range(14):
        tr = TableRow()
        tds = []
        for j in range(7):
            cell = TableCell()
            tr.addElement(cell)
            tds.append(cell)
        table.addElement(tr)
        trs.append(tds)

    for i in range(14):
        trs[i][0].addElement(P(text=horas[i]))

    # cabeçalho das turmas
    tr = TableRow()
    add_cell(tr, u'Código')
    add_cell(tr, u'Turma')
    add_cell(tr, u'Nome')
    table.addElement(tr)
    estilos = {}

    # escreve turmas e cria estilos
    for turma in xson['turmas']:
        estilocor = "estilo%s" % turma['cor']

        estilo = Style(name=estilocor, family="table-cell")
        estilo.addElement(TableCellProperties(backgroundcolor=turma['cor']))
        planilha.styles.addElement(estilo)

        estilos[estilocor] = estilo

        tr = TableRow()
        add_cell(tr, turma['codigo'], estilo)
        add_cell(tr, turma['turma'], estilo)
        add_cell(tr, turma['nome'], estilo, 5)
        table.addElement(tr)

    # escreve aulas
    for i, dia in enumerate(xson['horarios']):
        for j, aula in enumerate(dia):
            if aula:
                estilocor = "estilo%s" % aula['cor']
                text = aula['codigo']
                trs[j][1+i].addElement(P(text=text))
                trs[j][1+i].setAttribute("stylename", estilocor)

    planilha.spreadsheet.addElement(table)
    output = StringIO.StringIO()
    planilha.save(output)
    return output.getvalue()

# run(raw_input())
