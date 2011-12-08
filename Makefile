all: matrufsc.js

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

matrufsc.js: $(SRC)
	cat $^ > $@
