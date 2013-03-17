include config.mak

all: matrufsc.py dispatch.$(CGI) matrufsc.js index.html

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
versao.js \
widgets.js \
ui_sobre_popup.js \
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

%.gz: %
	gzip --best --no-name -c $< > $@

ifeq ($(RELEASE),1)
sed_RELEASE=-e "s/if(0)/if(1)/"
endif

matrufsc.py: py/matrufsc.py
	sed "s|\$$BASE_PATH|${BASE_PATH}|" $^ | tee $@ > /dev/null

dispatch.$(CGI): py/dispatch.fcgi
	sed -e "s|\$$BASE_PATH|${BASE_PATH}|" -e "s|/usr/bin/python|${PYTHON_BIN}|" $^ | tee $@ > /dev/null

index.html: html/matrufsc.html html/sobre.html
	sed -e "/include_sobre/r html/sobre.html" -e "/include_sobre/d" ${sed_RELEASE} html/matrufsc.html | tee $@ > /dev/null

matrufsc.js: $(SRC)
#	closure --compilation_level=ADVANCED_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
ifeq ($(RELEASE),1)
	closure --compilation_level=SIMPLE_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
else
	cat $^ > $@
endif

clean::
	rm -rf matrufsc.js index.html
	rm -rf install
	rm -f $(addsuffix /*~,. c db html js py) .htaccess~ .gitignore~
	rm -f matrufsc.py dispatch.$(CGI)
	rm -f matrufsc.css.gz matrufsc.js.gz index.html.gz

distclean: clean
	rm -f .htaccess
	rm -f config.mak

install-gz:: install matrufsc.css.gz matrufsc.js.gz index.html.gz
	cp matrufsc.css.gz matrufsc.js.gz index.html.gz install/

install:: all
	mkdir -p install
	cp matrufsc.css matrufsc.js dispatch.$(CGI) matrufsc.py index.html install/
	chmod 755 install/dispatch.$(CGI) install/matrufsc.py
	cp .htaccess install/
