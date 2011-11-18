all: full.cgi fetch.cgi save.cgi load.cgi

header_gen: header_gen.c
	gcc -O3 -std=c99 -o header_gen header_gen.c -lz

equiv.h full.h fetch.h: header_gen
	./header_gen turmas.pdf fetch.h full.h equiv.h

save.cgi: save.c
	gcc -O3 -std=c99 -o save.cgi save.c
load.cgi: load.c
	gcc -O3 -std=c99 -o load.cgi load.c
full.cgi: full.c full.h
	gcc -O3 -std=c99 -o full.cgi full.c
fetch.cgi: fetch.c full.h fetch.h equiv.h
	gcc -O3 -std=c99 -o fetch.cgi fetch.c

clean::
	rm -f fetch.h equiv.h full.h header_gen fetch.cgi full.cgi save.cgi load.cgi *~
