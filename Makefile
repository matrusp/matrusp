all: database.json save2.cgi load2.cgi ping.cgi matrufsc.js

SRC=json2.js \
compat.js \
persistence.js \
dconsole.js \
combinacoes.js \
materias.js \
display.js \
combobox.js \
database.js \
state.js \
ui_ajuda_popup.js \
ui_campus.js \
ui_combinacoes.js \
ui_horario.js \
ui_logger.js \
ui_materias.js \
ui_saver.js \
ui_turmas.js \
main.js

header_gen_pdf: header_gen_pdf.c
header_gen_pdf: EXTRA_FLAGS=-lz
20121_JOI.json: header_gen_pdf 20121.pdf
	./header_gen_pdf 20121.pdf 20121_JOI.json 20121
20122_JOI.json: header_gen_pdf 20122.pdf
	./header_gen_pdf 20122.pdf 20122_JOI.json 20122

header_gen: header_gen.c
header_gen: EXTRA_FLAGS=-I/usr/include/libxml2 -lxml2
20121_FLO.json: header_gen 20121.db
	./header_gen 20121.db 20121_FLO.json 20121
20122_FLO.json: header_gen 20122.db
	./header_gen 20122.db 20122_FLO.json 20122

save2.cgi: save.c
save2.cgi: EXTRA_FLAGS=-DHOME=\"${HOME}\"
load2.cgi: load.c
load2.cgi: EXTRA_FLAGS=-DHOME=\"${HOME}\"
ping.cgi: ping.c
ping.cgi: EXTRA_FLAGS=-DHOME=\"${HOME}\"
access.cgi: access.c
access.cgi: EXTRA_FLAGS=-DHOME=\"${HOME}\"

save2.cgi load2.cgi ping.cgi access.cgi header_gen header_gen_pdf:
	gcc -Wall -O3 -std=c99 -o $@ $< ${EXTRA_FLAGS}

%.gz: %
	gzip --best --no-name -c $< > $@

database.json: 20121_JOI.json 20121_FLO.json 20122_JOI.json 20122_FLO.json
	cat $^ > $@

matrufsc.js: $(SRC)
#	closure --compilation_level=ADVANCED_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
#	closure --compilation_level=SIMPLE_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
	cat $^ > $@

clean::
	rm -f 20121_FLO.json 20121_JOI.json
	rm -f 20122_FLO.json 20122_JOI.json
	rm -f database.json
	rm -f header_gen_pdf header_gen
	rm -rf save2.cgi load2.cgi ping.cgi access.cgi matrufsc.js install *~ .htaccess~
	rm -f matrufsc.css.gz matrufsc.js.gz index.html.gz database.json.gz

install-gz:: install matrufsc.css.gz matrufsc.js.gz index.html.gz database.json.gz access.cgi
	cp matrufsc.css.gz matrufsc.js.gz index.html.gz install/
	cp database.json.gz install/
	cp access.cgi .htaccess install/

install:: all
	mkdir -p install
	cp matrufsc.css matrufsc.js index.html install/
	cp database.json install/
	cp save2.cgi load2.cgi ping.cgi install/
