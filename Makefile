all: full2_FLO.js full2_JOI.js save2.cgi load2.cgi matrufsc.js

SRC=persistence.js \
jsonxml.js \
ui_campus.js \
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
ui_ajuda_popup.js \
combobox.js \
database.js \
main.js

header_gen_pdf: header_gen_pdf.c
header_gen_pdf: EXTRA_FLAGS=-lz
full2_JOI.js: header_gen_pdf turmas.pdf
	./header_gen_pdf turmas.pdf full2_JOI.js

header_gen: header_gen.c
header_gen: EXTRA_FLAGS=-I/usr/include/libxml2 -lxml2
full2_FLO.js: header_gen turmas_db
	./header_gen turmas_db full2_FLO.js

save2.cgi: save.c
save2.cgi: EXTRA_FLAGS=-DHOME=\"${HOME}\"
load2.cgi: load.c
load2.cgi: EXTRA_FLAGS=-DHOME=\"${HOME}\"

save2.cgi load2.cgi header_gen header_gen_pdf:
	gcc -Wall -O3 -std=c99 -o $@ $< ${EXTRA_FLAGS}

%.gz: %
	gzip --best -c $< > $@

matrufsc.js: $(SRC)
#	closure --compilation_level=ADVANCED_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
#	closure --compilation_level=SIMPLE_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
	cat $^ > $@

clean::
	rm -f full2_FLO.js
	rm -f full2_JOI.js
	rm -f header_gen_pdf header_gen
	rm -rf save2.cgi load2.cgi matrufsc.js install *~
	rm -f matrufsc.css.gz matrufsc.js.gz index.html.gz full2_FLO.js.gz full2_JOI.js.gz

install-gz:: install matrufsc.css.gz matrufsc.js.gz index.html.gz full2_FLO.js.gz full2_JOI.js.gz
	cp matrufsc.css.gz matrufsc.js.gz index.html.gz install/
	cp full2_FLO.js.gz full2_JOI.js.gz install/
	cp .htaccess install/

install:: all
	mkdir -p install/cgi-bin
	cp matrufsc.css matrufsc.js index.html install/
	cp full2_FLO.js full2_JOI.js install/
	cp save2.cgi load2.cgi install/cgi-bin/
