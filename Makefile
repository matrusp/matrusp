all: full.cgi fetch.cgi save.cgi load.cgi matrufsc.js

SRC=persistence.js \
hexconv.js \
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

header_gen: header_gen.c
	gcc -O3 -std=c99 -o header_gen header_gen.c -lz

equiv.h full.h: fetch.h
fetch.h: header_gen
	./header_gen turmas.pdf fetch.h full.h equiv.h

save.cgi: save.c
	gcc -O3 -std=c99 -o save.cgi save.c
load.cgi: load.c
	gcc -O3 -std=c99 -o load.cgi load.c
full.cgi: full.c full.h
	gcc -O3 -std=c99 -o full.cgi full.c
fetch.cgi: fetch.c full.h fetch.h equiv.h
	gcc -O3 -std=c99 -o fetch.cgi fetch.c

matrufsc.js: $(SRC)
	closure --compilation_level=ADVANCED_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
#	cat $^ > $@

clean::
	rm -rf fetch.h equiv.h full.h header_gen fetch.cgi full.cgi save.cgi load.cgi matrufsc.js install *~

install:: all
	mkdir -p install/cgi-bin
	cp matrufsc.js index.html install/
	cp full.cgi fetch.cgi save.cgi load.cgi install/cgi-bin/
