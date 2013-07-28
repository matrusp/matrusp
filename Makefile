include config.mak

all: capim.py dispatch.$(CGI) capim.js index.html

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

capim.py: py/capim.py
	sed "s|\$$BASE_PATH|${BASE_PATH}|" $^ | tee $@ > /dev/null

dispatch.$(CGI): py/dispatch.fcgi
	sed -e "s|\$$BASE_PATH|${BASE_PATH}|" -e "s|/usr/bin/python|${PYTHON_BIN}|" $^ | tee $@ > /dev/null

index.html: html/capim.html html/sobre.html
	sed -e "/include_sobre/r html/sobre.html" -e "/include_sobre/d" ${sed_RELEASE} html/capim.html | tee $@ > /dev/null

capim.js: $(SRC)
#	closure --compilation_level=ADVANCED_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
ifeq ($(RELEASE),1)
	closure --compilation_level=SIMPLE_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
else
	cat $^ > $@
endif

clean::
	rm -rf capim.js index.html
	rm -rf install
	rm -f $(addsuffix /*~,. c db html js py) .htaccess~ .gitignore~
	rm -f capim.py dispatch.$(CGI)
	rm -f capim.css.gz capim.js.gz index.html.gz

distclean: clean
	rm -f .htaccess
	rm -f config.mak

install-gz:: install capim.css.gz capim.js.gz index.html.gz
	cp capim.css.gz capim.js.gz index.html.gz install/

install:: all
	mkdir -p install
	cp capim.css capim.js dispatch.$(CGI) capim.py index.html install/
	chmod 755 install/dispatch.$(CGI) install/capim.py
	cp .htaccess install/
