DBs=20121.json 20122.json

all: $(DBs) save2.cgi load2.cgi ping.cgi matrufsc.js index.html

SRC:=json2.js \
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
ui_planos.js \
ui_saver.js \
ui_turmas.js \
ui_updates.js \
main.js

SRC:=$(addprefix js/,$(SRC))

header_gen: c/header_gen.c
header_gen: EXTRA_FLAGS=-I/usr/include/libxml2 -lxml2

%.json: header_gen db/%*.xml
	./$^ $@

cursos_turmas: c/header_gen.c
	gcc -Wall -O3 -std=c99 -o $@ $< ${EXTRA_FLAGS}
cursos_turmas: EXTRA_FLAGS=-I/usr/include/libxml2 -lxml2 -DCURSOS_TURMAS
cursos_turmas.js: cursos_turmas db/20122.db
	./cursos_turmas db/20122.db cursos_turmas.js

save2.cgi: c/save.c
save2.cgi: EXTRA_FLAGS=-DHOME=\"${HOME}\"
load2.cgi: c/load.c
load2.cgi: EXTRA_FLAGS=-DHOME=\"${HOME}\"
ping.cgi: c/ping.c
access.cgi: c/access.c

save2.cgi load2.cgi ping.cgi access.cgi header_gen:
	gcc -Wall -O3 -std=c99 -o $@ $< ${EXTRA_FLAGS}

%.gz: %
	gzip --best --no-name -c $< > $@

ifdef RELEASE
sed_RELEASE=-e "s/if(0)/if(1)/"
endif

index.html: html/matrufsc.html html/ajuda.html
	sed -e "/include_ajuda/r html/ajuda.html" -e "/include_ajuda/d" ${sed_RELEASE} html/matrufsc.html | tee index.html > /dev/null

matrufsc.js: $(SRC)
#	closure --compilation_level=ADVANCED_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
ifdef RELEASE
	closure --compilation_level=SIMPLE_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
else
	cat $^ > $@
endif

clean::
	rm -f header_gen $(DBs) $(addsuffix .gz,$(DBs))
	rm -f cursos_turmas cursos_turmas.js
	rm -rf save2.cgi load2.cgi ping.cgi access.cgi matrufsc.js index.html install *~ .htaccess~
	rm -f matrufsc.css.gz matrufsc.js.gz index.html.gz

install-gz:: install matrufsc.css.gz matrufsc.js.gz index.html.gz $(addsuffix .gz,$(DBs)) access.cgi
	cp matrufsc.css.gz matrufsc.js.gz index.html.gz install/
	cp $(addsuffix .gz,$(DBs)) install/
	cp access.cgi .htaccess install/

install:: all
	mkdir -p install
	cp matrufsc.css matrufsc.js index.html install/
	cp $(DBs) install/
	cp save2.cgi load2.cgi ping.cgi install/
