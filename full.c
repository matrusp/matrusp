#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include <inttypes.h>
#include <time.h>

#include FULL2_H

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

extern char **environ;
int main()
{
    time_t now = time(0) + 20*60;
    struct tm tm = *gmtime(&now);
    const struct mapping *r;
    char expires_buf[128];
    int use_gzip = 0;
    char *p;
    int i;

    for (i = 0; environ[i]; i++)
        if (!strncmp(environ[i], "HTTP_ACCEPT_ENCODING", 20))
            if (strstr(environ[i]+21, "deflate")) {
                use_gzip = 1;
                break;
            }

    printf("Content-type: text/xml\n");
    strftime(expires_buf, sizeof(expires_buf), "%a, %d %b %Y %H:%M:%S %Z", &tm);
    printf("Expires: %s\n", expires_buf);

    p = getenv("QUERY_STRING");
    if (!p)
        return 0;

    if (p[0] != 'q' || p[1] != '=')
        return 0;
    p += 2;

    if (!is_materia(p)) {
        printf("\n");
        return 0;
    }

    if ((r = in_word_set(p, strlen(p)))) {
        if (use_gzip) {
            const uint8_t *deflate        = full_result[r->index].deflate;
            const int      deflate_length = full_result[r->index].deflate_length;
            printf("Content-Encoding: deflate\n"
                    "Content-Length: %d\n"
                    "\n", deflate_length);
            fwrite(deflate, deflate_length, 1, stdout);
        } else {
            const char *text = full_result[r->index].text;
            printf("\n");
            printf("%s", text);
        }
        return 0;
    }

    printf("\n");

    return 0;
}
