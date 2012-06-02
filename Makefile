all: database.json save2.cgi load2.cgi matrufsc.js

SRC=json2.js \
compat.js \
persistence.js \
ui_campus.js \
ui_saver.js \
ui_logger.js \
dconsole.js \
combinacoes.js \
materias.js \
display.js \
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
full2_JOI.json: header_gen_pdf turmas.pdf
	./header_gen_pdf turmas.pdf full2_JOI.json

header_gen: header_gen.c
header_gen: EXTRA_FLAGS=-I/usr/include/libxml2 -lxml2
full2_FLO.json: header_gen turmas_db
	./header_gen turmas_db full2_FLO.json

save2.cgi: save.c
save2.cgi: EXTRA_FLAGS=-DHOME=\"${HOME}\"
load2.cgi: load.c
load2.cgi: EXTRA_FLAGS=-DHOME=\"${HOME}\"
access.cgi: access.c
access.cgi: EXTRA_FLAGS=-DHOME=\"${HOME}\"

save2.cgi load2.cgi access.cgi header_gen header_gen_pdf:
	gcc -Wall -O3 -std=c99 -o $@ $< ${EXTRA_FLAGS}

%.gz: %
	gzip --best --no-name -c $< > $@

database.json: full2_JOI.json full2_FLO.json
	cat $^ > $@

matrufsc.js: $(SRC)
#	closure --compilation_level=ADVANCED_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
#	closure --compilation_level=SIMPLE_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
	cat $^ > $@

clean::
	rm -f full2_FLO.json full2_JOI.json database.json
	rm -f header_gen_pdf header_gen
	rm -rf save2.cgi load2.cgi access.cgi matrufsc.js install *~ .htaccess~
	rm -f matrufsc.css.gz matrufsc.js.gz index.html.gz database.json.gz

install-gz:: install matrufsc.css.gz matrufsc.js.gz index.html.gz database.json.gz access.cgi
	cp matrufsc.css.gz matrufsc.js.gz index.html.gz install/
	cp database.json.gz install/
	cp access.cgi .htaccess install/

install:: all
	mkdir -p install
	cp matrufsc.css matrufsc.js index.html install/
	cp database.json install/
	cp save2.cgi load2.cgi install/
