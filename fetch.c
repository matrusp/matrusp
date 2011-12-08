#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>

#include "full.h"
#include "equiv.h"
#include "fetch.h"

#include <locale.h>
#include <iconv.h>
#include <errno.h>

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
    char *p, *d, *d0, *o, *o0;
    size_t p_s, i_s, o_s;
    int l = sizeof(fetch)/sizeof(fetch[0]);
    iconv_t to_ascii;
    int i, j = 0;

    printf("Content-type: text/html\n"
           "Expires: -1\n"
           "\n");

    p = getenv("QUERY_STRING");
    if (!p)
        return 0;

    if (p[0] != 'q' || p[1] != '=')
        return 0;
    p += 2;

    p_s = strlen(p);
    d0 = d = malloc(p_s+1);
    decodeURIComponent(d, p, p_s);

    setlocale(LC_ALL, "en_US.utf8");

    to_ascii = iconv_open("ASCII//TRANSLIT", "utf8");
    if (to_ascii == (iconv_t) -1)
        return 0;

    i_s = strlen(d)+1;
    o_s = i_s;
    o0 = o = malloc(o_s);
    if (!o0)
        return 0;

    iconv(to_ascii, &d, &i_s, &o, &o_s);

    for (i = 0; i < l && j < 10; i++) {
        if (strstr(fetch[i][0], o0) || strstr(fetch[i][1], o0)) {
            printf("%s %s\n", fetch[i][0], full[equiv[i]][2]);
            j++;
        }
    }

    iconv_close(to_ascii);
    free(d0);
    free(o0);

    return 0;
}
