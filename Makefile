DBs=20121.json 20122.json 20131.json

all: $(DBs) matrufsc.py dispatch.fcgi matrufsc.js index.html

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
widgets.js \
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

%.json: py/parse_turmas.py db/%*.xml
	./$^ $@

%.gz: %
	gzip --best --no-name -c $< > $@

ifdef RELEASE
sed_RELEASE=-e "s/if(0)/if(1)/"
endif

matrufsc.py: py/matrufsc.py
	sed "s|\$$HOME|${HOME}|" py/matrufsc.py | tee matrufsc.py > /dev/null

dispatch.fcgi: py/dispatch.fcgi
	sed "s|\$$HOME|${HOME}|" py/dispatch.fcgi | tee dispatch.fcgi > /dev/null
	-[ -f pythonpath ] && sed "s|/usr/bin/python|$$(cat pythonpath)|" dispatch.fcgi > dispatch.fcgi2 && mv dispatch.fcgi2 dispatch.fcgi

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
	rm -f matrufsc.py dispatch.fcgi
	rm -f matrufsc.css.gz matrufsc.js.gz index.html.gz

install-gz:: install matrufsc.css.gz matrufsc.js.gz index.html.gz $(addsuffix .gz,$(DBs))
	cp matrufsc.css.gz matrufsc.js.gz index.html.gz install/
	cp $(addsuffix .gz,$(DBs)) install/

install:: all
	mkdir -p install
	cp matrufsc.css matrufsc.js dispatch.fcgi matrufsc.py index.html install/
	chmod 755 install/dispatch.fcgi install/matrufsc.py
	cp $(DBs) install/
	cp .htaccess install/
