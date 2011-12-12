all: full2.cgi fetch2.cgi save2.cgi load2.cgi matrufsc.js

SRC=persistence.js \
jsonxml.js \
ui_saver.js \
ui_logger.js \
dconsole.js \
combinacoes.js \
materias.js \
turmas.js \
ui_materias.js \
ui_turmas.js \
ui_combinacoes.js \
ui_horario.js \
combobox.js \
main.js

full2.h: header_gen.c turmas_db full2.c
	gcc -Wall -O3 -std=c99 -o header_gen header_gen.c -I/usr/include/libxml2 -lxml2
	./header_gen turmas_db fetch.h full.h
	gcc -Wall -O3 -std=c99 -o full2 full2.c -lz
	./full2 > full2.h

full2.cgi: full.c full2.h
	gcc -O3 -std=c99 -o full2.cgi full.c
fetch2.cgi: fetch.c full2.h
	gcc -O3 -std=c99 -o fetch2.cgi fetch.c

save2.cgi: save.c
	gcc -Wall -O3 -std=c99 -o save2.cgi save.c
load2.cgi: load.c
	gcc -Wall -O3 -std=c99 -o load2.cgi load.c

matrufsc.js: $(SRC)
#	closure --compilation_level=ADVANCED_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
#	closure --compilation_level=SIMPLE_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
	cat $^ > $@

clean::
	rm -rf fetch.h full.h full2.h header_gen full2 fetch2.cgi full2.cgi save2.cgi load2.cgi matrufsc.js install *~

install:: all
	mkdir -p install/cgi-bin
	cp matrufsc.js index.html install/
	cp full2.cgi fetch2.cgi save2.cgi load2.cgi install/cgi-bin/
