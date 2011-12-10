#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include <inttypes.h>

#include "full.h"

static int
is_materia(char *s)
{
    /* matérias são no formato XXX#### */
    return
        (s[0] >= 'A' && s[0] <= 'Z') &&
        (s[1] >= 'A' && s[1] <= 'Z') &&
        (s[2] >= 'A' && s[2] <= 'Z') &&
        (s[3] >= '0' && s[3] <= '9') &&
        (s[4] >= '0' && s[4] <= '9') &&
        (s[5] >= '0' && s[5] <= '9') &&
        (s[6] >= '0' && s[6] <= '9') &&
         s[7] == 0x00;
}
static int
cmp_materia(char *a, char *b)
{
    /* matérias são no formato XXX#### */
    return (a[0] == b[0]) &&
           (a[1] == b[1]) &&
           (a[2] == b[2]) &&
           (a[3] == b[3]) &&
           (a[4] == b[4]) &&
           (a[5] == b[5]) &&
           (a[6] == b[6]) &&
           (a[7] == b[7]);
}

int main()
{
    int l = sizeof(full)/sizeof(full[0]);
    char *p;
    int i;

    printf("Content-type: text/xml\n"
           "Expires: -1\n"
           "\n");

    p = getenv("QUERY_STRING");
    if (!p)
        return 0;

    if (p[0] != 'q' || p[1] != '=')
        return 0;
    p += 2;

    if (!is_materia(p))
        return 0;

    for (i = 0; i < l; i++) {
        if (cmp_materia(full[i].codigo_disciplina, p)) {
            printf("%s", full[i].result);
            break;
        }
    }

    return 0;
}
