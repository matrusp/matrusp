#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main()
{
    FILE *fp;
    char *p, *e;
    char *prefix=HOME"/matrufsc/dados3/";
    char *name, *bigname;
    char c;
    int l1;
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

    l1 = strlen(p) + 1;
    name = malloc(l1);
    bigname = malloc(strlen(prefix)+(l1<<2)+5-1);

    if (!bigname || !name)
        return 0;

    strncpy(name, p, l1-1);

    strcat(bigname, prefix);
    e = bigname + strlen(prefix);
    for (i = 0; i < l1-1; i++) {
        sprintf(e+(i<<1), "%02x", name[i]);
    }
    sprintf(e+(i<<1), ".json");
    e[(i<<1)+5] = 0;

    fp = fopen(bigname, "w");
    if (!fp)
        return 0;
    while ((c=fgetc(stdin))!=EOF)
        fputc(c, fp);
    fclose(fp);

    printf("OK");

    return 0;
}
