#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main()
{
    FILE *fp;
    char *p, *q, *e;
    char *prefix="/home/caldo_de_cana/matrufsc/dados/";
    char *data, *name, *bigname;
    int l1, l2;
    int i;

    printf("Content-type: text/html\n"
           "Expires: -1\n"
           "\n");

    p = getenv("QUERY_STRING");
    if (!p)
        return 0;

    if (p[0] != 'q' || p[1] != '=')
        return 0;
    p += 2;

    q = strstr(p, "=");
    if (!q)
        return 0;

    l1 = (q-p) + 1;
    name = malloc(l1);
    bigname = malloc(strlen(prefix)+(l1<<2)-1);
    q++;
    l2 = strlen(q) + 1;
    data = malloc(l2);

    if (!bigname || !name || !data)
        return 0;

    strncpy(name, p, l1-1);
    strncpy(data, q, l2-1);

    strcat(bigname, prefix);
    e = bigname + strlen(prefix);
    for (i = 0; i < l1-1; i++) {
        sprintf(e+(i<<1), "%02x", name[i]);
    }
    e[i<<1] = 0;

    fp = fopen(bigname, "w");
    if (!fp)
        return 0;
    fwrite(data, l2, 1, fp);
    fclose(fp);

    printf("OK");

    return 0;
}
