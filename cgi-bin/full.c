#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>

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
    int has_started = 0;
    char *p;
    int i;

    printf("Content-type: text/html\n\n");

    p = getenv("QUERY_STRING");
    if (!p)
        return 0;

    if (p[0] != 'q' || p[1] != '=')
        return 0;
    p += 2;

    if (!is_materia(p))
        return 0;

    for (i = 0; i < l; i++) {
        if (cmp_materia(full[i][0], p)) {
            if (!has_started)
                printf("%s\t%s\n", full[i][0], full[i][2]);
            printf("%s\t%s\t%s\t%s\t%s\n", full[i][1], full[i][3], full[i][4], full[i][5], full[i][6]);
            has_started++;
        } else {
            if (has_started)
                break;
        }
    }

    return 0;
}
