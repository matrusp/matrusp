DBs=20121.json 20122.json 20131.json

DB_USP=./db/db_usp.txt
SEMESTRE=20131

all: $(DBs) matrufsc.js index.html

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
ui_avisos.js \
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

HOMEDIR=/home/pedrovc

%.json: py/parse_turmas.py db/%*.xml
	./$^ $@

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
	rm -f $(DBs) $(addsuffix .gz,$(DBs))
	rm -rf matrufsc.js index.html
	rm -rf install
	rm -f $(addsuffix /*~,. c db html js py) .htaccess~
	rm -f matrufsc.css.gz matrufsc.js.gz index.html.gz

install-gz:: install matrufsc.css.gz matrufsc.js.gz index.html.gz $(addsuffix .gz,$(DBs))
	cp matrufsc.css.gz matrufsc.js.gz index.html.gz install/
	cp $(addsuffix .gz,$(DBs)) install/
	

install:: all
	mkdir -p install
	mkdir -p install/data
	touch install/data/index.html
	cp matrufsc.css matrufsc.js index.html php/* install/
	chmod 755 install/*.php
	cp $(DBs) install/
#	cp .htaccess install/
	cp robots.txt install/

install-matrusp::index.html matrufsc.js
	mkdir -p install
	mkdir -p install/data
	touch install/data/index.html
	cp matrufsc.css ie.css matrufsc.js index.html img/barra.jpg php/* install/
	chmod 755 install/*.php
	cp $(DB_USP) install/$(SEMESTRE).txt
	cp robots.txt install/
	
