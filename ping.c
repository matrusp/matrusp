#include <stdio.h>
#include <stdlib.h>

int main()
{
    char *name = "matrufsc";
    char start_str[] = {'\r','\n','\r','\n'};
    char str_len = 4;
    int ok = 0;
    char *p;
    char c0 = 0, c;

    p = getenv("QUERY_STRING");
    if (p && p[0] == 'q' && p[1] == '=' && p[2])
        name = p + 2;

    printf("Content-Type: application/octet-stream\n"
           "Content-Disposition: attachment; filename=%s.json\n"
           "Expires: -1\n"
           "\n", name);

    while ((c=fgetc(stdin))!=EOF) {
        if        (str_len == 2) {
            fputc(c0, stdout);
            c0 = c;
        } else if (str_len == 3) {
            str_len = 2;
            c0 = c;
        }
        if (c == start_str[ok])
            ok++;
        else
            ok = 0;
        if (ok == str_len) {
            str_len--;
            ok = 0;
        }
    }

    return 0;
}
