debug: all
release: all
release: GPERF_FLAGS=-m 10

all: full2_FLO.cgi fetch2_FLO.cgi full2_JOI.cgi fetch2_JOI.cgi save2.cgi load2.cgi matrufsc.js

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
combobox.js \
main.js

header_gen_pdf: header_gen_pdf.c
header_gen_pdf: EXTRA_FLAGS=-lz
fetch_JOI.h: full_JOI.h
full_JOI.h: header_gen_pdf turmas.pdf
	./header_gen_pdf turmas.pdf fetch_JOI.h full_JOI.h
full2_JOI: full2.c full_JOI.h
full2_JOI: EXTRA_FLAGS=-DFULL_H=\"full_JOI.h\" -lz
full2_JOI.h: full2_JOI
	./full2_JOI $@ full2_JOI.gperf
	cat full2_JOI.gperf | gperf ${GPERF_FLAGS} >> $@
full2_JOI.cgi: full.c full2_JOI.h
full2_JOI.cgi: EXTRA_FLAGS=-DFULL2_H=\"full2_JOI.h\"
fetch2_JOI.cgi: fetch.c fetch_JOI.h
fetch2_JOI.cgi: EXTRA_FLAGS=-DFETCH_H=\"fetch_JOI.h\"

header_gen: header_gen.c
header_gen: EXTRA_FLAGS=-I/usr/include/libxml2 -lxml2
fetch_FLO.h: full_FLO.h
full_FLO.h: header_gen turmas_db
	./header_gen turmas_db fetch_FLO.h full_FLO.h
full2_FLO: full2.c full_FLO.h
full2_FLO: EXTRA_FLAGS=-DFULL_H=\"full_FLO.h\" -lz
full2_FLO.h: full2_FLO
	./full2_FLO $@ full2_FLO.gperf
	cat full2_FLO.gperf | gperf ${GPERF_FLAGS} >> $@
full2_FLO.cgi: full.c full2_FLO.h
full2_FLO.cgi: EXTRA_FLAGS=-DFULL2_H=\"full2_FLO.h\"
fetch2_FLO.cgi: fetch.c fetch_FLO.h
fetch2_FLO.cgi: EXTRA_FLAGS=-DFETCH_H=\"fetch_FLO.h\"

save2.cgi: save.c
load2.cgi: load.c

save2.cgi load2.cgi header_gen full2_FLO full2_FLO.cgi fetch2_FLO.cgi header_gen_pdf full2_JOI full2_JOI.cgi fetch2_JOI.cgi:
	gcc -Wall -O3 -std=c99 ${EXTRA_FLAGS} -o $@ $<

matrufsc.js: $(SRC)
#	closure --compilation_level=ADVANCED_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
#	closure --compilation_level=SIMPLE_OPTIMIZATIONS $(addprefix --js=,$(SRC)) --js_output_file=$@
	cat $^ > $@

clean::
	rm -f fetch_FLO.h full_FLO.h full2_FLO full2_FLO.h full2_FLO.gperf full2_FLO.cgi fetch2_FLO.cgi
	rm -f fetch_JOI.h full_JOI.h full2_JOI full2_JOI.h full2_JOI.gperf full2_JOI.cgi fetch2_JOI.cgi
	rm -f header_gen_pdf header_gen
	rm -rf save2.cgi load2.cgi matrufsc.js install *~

install:: all
	mkdir -p install/cgi-bin
	cp matrufsc.js index.html install/
	cp full2_FLO.cgi fetch2_FLO.cgi full2_JOI.cgi fetch2_JOI.cgi save2.cgi load2.cgi install/cgi-bin/
