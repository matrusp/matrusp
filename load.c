#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main()
{
    FILE *fp;
    char *p, *e;
    char *prefix="/home/caldo_de_cana/matrufsc/dados2/";
    char *name, *bigname, *data;
    int l1, l2;
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

    l1 = strlen(p) + 1;
    name = malloc(l1);
    bigname = malloc(strlen(prefix)+(l1<<2)-1);

    if (!bigname || !name)
        return 0;

    strncpy(name, p, l1-1);

    strcat(bigname, prefix);
    e = bigname + strlen(prefix);
    for (i = 0; i < l1-1; i++) {
        sprintf(e+(i<<1), "%02x", name[i]);
    }
    e[i<<1] = 0;

    fp = fopen(bigname, "r");
    if (!fp)
        return 0;
    fseek(fp, 0, SEEK_END);
    l2 = ftell(fp);
    fseek(fp, 0, SEEK_SET);
    data = malloc(l2);
    if (!data) {
        fclose(fp);
        return 0;
    }
    fread(data, l2, 1, fp);
    fclose(fp);

    fwrite(data, l2, 1, stdout);

    return 0;
}
