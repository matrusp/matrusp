#define _XOPEN_SOURCE 700
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include <inttypes.h>
#include <time.h>

#include "fetch.h"

#include "utf8_to_ascii.h"

#include <stdlib.h>

static void decodeURIComponent(char *d, char *s, int l)
{
    while (s[0]) {
        if (s[0] == '%' && s[1] && s[2]) {
            char x[3] = { s[1], s[2], 0 };
            char *x2;
            *d++ = strtol(x, &x2, 16);
            s += 1 + x2-x;
        } else {
            *d++ = *s++;
        }
    }
    *d = 0;
}

int main()
{
    char *p, *d, *d0, *o0;
    size_t p_s, i_s, o_s;
    int l = sizeof(fetch)/sizeof(fetch[0]);
    time_t now = time(0) + 20*60;
    struct tm tm = *gmtime(&now);
    char expires_buf[128];
    int start, end;
    int page = 0;
    int i, j = 0;

    printf("Content-type: text/html\n");
    strftime(expires_buf, sizeof(expires_buf), "%a, %d %b %Y %H:%M:%S %Z", &tm);
    printf("Expires: %s\n", expires_buf);
    printf("\n");

    p = getenv("QUERY_STRING");
    if (!p)
        return 0;

    if (p[0] == 'p' && p[1] == '=') {
        char *endptr;
        page = strtol(&p[2], &endptr, 10);
        if (*endptr != '&' || page < 0)
            return 0;
        p = endptr + 1;
    }

    start =  page   *10;
    end   = (page+1)*10;

    if (p[0] != 'q' || p[1] != '=')
        return 0;
    p += 2;

    p_s = strlen(p);
    d0 = d = malloc(p_s+1);
    decodeURIComponent(d, p, p_s);

    i_s = strlen(d)+1;
    o_s = i_s;
    o0 = malloc(o_s);
    if (!o0)
        return 0;

    o0 = utf8_to_ascii(d, 1);

    for (i = 0; i < l && j < end; i++) {
        if (strstr(fetch[i].codigo_disciplina, o0) || strstr(fetch[i].nome_disciplina_ascii, o0)) {
            if (j++ >= start)
                printf("%s %s\n", fetch[i].codigo_disciplina, fetch[i].nome_disciplina_utf8);
        }
    }

    free(d0);
    free(o0);

    return 0;
}
