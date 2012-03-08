#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main()
{
    FILE *fp;
    char *p, *e;
    char *prefix=HOME"/matrufsc/dados2/";
    char *name, *bigname, *data;
    char *content_type;
    int l1, l2;
    int i;

    p = getenv("QUERY_STRING");
    if (!p)
        goto fail;

    if (p[0] != 'q' || p[1] != '=')
        goto fail;
    p += 2;

    l1 = strlen(p) + 1;
    name = malloc(l1);
    bigname = malloc(strlen(prefix)+(l1<<2)+5-1);

    if (!bigname || !name)
        goto fail;

    strncpy(name, p, l1-1);

    strcat(bigname, prefix);
    e = bigname + strlen(prefix);
    for (i = 0; i < l1-1; i++) {
        sprintf(e+(i<<1), "%02x", name[i]);
    }
    sprintf(e+(i<<1), ".json");
    e[(i<<1)+5] = 0;

    content_type = "application/json";
    fp = fopen(bigname, "r");
    if (!fp) {
        e[i<<1] = 0;
        content_type = "text/xml";
        fp = fopen(bigname, "r");
    }
    if (!fp)
        goto fail;
    fseek(fp, 0, SEEK_END);
    l2 = ftell(fp);
    fseek(fp, 0, SEEK_SET);
    data = malloc(l2);
    if (!data) {
        fclose(fp);
        goto fail;
    }
    fread(data, l2, 1, fp);
    fclose(fp);

    printf("Content-type: %s\n"
           "Expires: -1\n"
           "\n", content_type);
    fwrite(data, l2, 1, stdout);

    return 0;

fail:
    printf("Content-type: text/plain\n"
           "Expires: -1\n"
           "\n");
    return 0;
}
