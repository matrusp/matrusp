#!/usr/bin/python
# -*- coding: utf-8 -*-

import get_turmas_usp
import parse_turmas_usp

if __name__ == "__main__":
	if len(sys.argv) < 3:
		print " - Forneça o diretório onde serão armazenadas as páginas baixadas, "
		print "   o nome do arquivo de saída e o nome do banco antigo (Opcional)."
		print "   Ex: %s ./db ./db_usp.txt ./db_usp_antigo.txt" % (sys.argv[0])
		print "   Encerrando. - "
		sys.exit(1);
		
	get_turmas = get_turmas_usp.main(sys.argv[1], remover_antigos=True)
	if get_turmas != 0:
		print " - get_turmas falhou! Encerrando. -"
		sys.exit(1);
	
	if len(sys.argv) == 3:
		parse_turmas_usp.main(sys.argv[1], sys.argv[2])
	else
		parse_turmas_usp.main(sys.argv[1], sys.argv[2], sys.argv[3])
	
	print " - Fim da atualização! - "
