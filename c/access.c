#define _XOPEN_SOURCE 700
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include <inttypes.h>
#include <time.h>

#include <stdlib.h>
#include <libgen.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

#define PRINT_ENV 0
#define PRINT_ERR 0
#define ALWAYS_EXPIRE 0

#if PRINT_ERR
#define set_error(x) err = x;
#else
#define set_error(x)
#endif

#define MATRUFSC "matrufsc"

int main()
{
    /* envs */
    char *accept_encoding;
    char *document_root;
    char *uri;

    char *content_type = NULL;
    char *content_encoding = NULL;
    char *dir_str0  = NULL, *dir_str;
    char *base_str0 = NULL, *base_str;

    char *data;

    struct tm last_modified_tm;
    time_t    last_modified_time_t;
    char      last_modified_str[128];
    char path[128];
    char path_gz[128];
    char *filename;
    off_t uncompressed_length;
    off_t content_length;
    struct stat st;
    FILE *fp;

#if PRINT_ERR
    char *err = NULL;
#endif

#if PRINT_ENV
    printf("Content-Type: text/plain\n");
    printf("\n");
    fflush(stdout);
    system("env");
    return 0;
#endif

    /* 1. get mandatory env (DOCUMENT_ROOT and REQUEST_URI). */
    document_root = getenv("DOCUMENT_ROOT");
    if (!document_root) {
        set_error("no document root\n");
        goto _404;
    }
    uri = getenv("REQUEST_URI");
    if (!uri) {
        set_error("no request_uri\n");
        goto _404;
    }

    dir_str  = dir_str0  = strdup(uri);
    base_str = base_str0 = strdup(uri);
    if (!dir_str || !base_str) {
        set_error("no dir_str or base_str\n");
        goto _404;
    }

    dir_str  = dirname (dir_str);
    base_str = basename(base_str);
    if (!dir_str || !base_str) {
        set_error("dirname() or basename() failed\n");
        goto _404;
    }

    /* 2. accept /MATRUFSC/ as /MATRUFSC/index.html */
    if (!strcmp(dir_str, "/") && !strcmp(base_str, MATRUFSC)) {
        dir_str  = "/" MATRUFSC;
        base_str = "index.html";
    }

    /* 3. check if it's a file we have */
    if      ( strcmp(dir_str, "/" MATRUFSC)) {
        set_error("not /" MATRUFSC "\n");
        goto _404;
    }
    else if (!strcmp(base_str, "index.html"))
        content_type = "text/html";
    else if (!strcmp(base_str, "matrufsc.js"))
        content_type = "application/javascript";
    else if (!strcmp(base_str, "matrufsc.css"))
        content_type = "text/css";
    else if (!strcmp(base_str, "20121_FLO.json") ||
             !strcmp(base_str, "20122_FLO.json") ||
             !strcmp(base_str, "20121_JOI.json") ||
             !strcmp(base_str, "20122_JOI.json"))
        content_type = "application/json";
    else {
        set_error("not any file we can send\n");
        goto _404;
    }

    /* 4. check file modification time */
    snprintf(path, sizeof(path), "%s%s/%s", document_root, dir_str, base_str);
    if (stat(path, &st)) {
        set_error("file not found, really\n");
        goto _404;
    }
    filename = path;
    content_length = st.st_size;
    uncompressed_length = st.st_size;
    putenv("TZ=GMT");
    last_modified_tm     = *gmtime(&st.st_ctime);
    last_modified_time_t = mktime(&last_modified_tm);
    strftime(last_modified_str, sizeof(last_modified_str), "%a, %d %b %Y %T %Z", &last_modified_tm);

    /* 5. check if gzip encoding is accepted */
    accept_encoding = getenv("HTTP_ACCEPT_ENCODING");
    if (accept_encoding) {
        char *str = strdup(accept_encoding);
        if (str) {
            char *t = strtok(str, ",");
            while (t) {
                if (!strcmp(t, "gzip")) {
                    snprintf(path_gz, sizeof(path_gz), "%s%s/%s.gz", document_root, dir_str, base_str);
                    if (!stat(path_gz, &st)) {
                        content_length = st.st_size;
                        filename = path_gz;
                        content_encoding = "gzip";
                    }
                    break;
                }
                t = strtok(NULL, ",");
            }
            free(str);
        }
    }

    fp = fopen(filename, "r");
    if (!fp) {
        set_error("could not open file\n");
        goto _404;
    }
    data = malloc(content_length);
    if (!data) {
        fclose(fp);
        set_error("could not alloc data for file\n");
        goto _404;
    }
    fread(data, content_length, 1, fp);
    fclose(fp);

    printf("Content-Type: %s\n", content_type);
#if ALWAYS_EXPIRE
    printf("Expires: -1\n");
#else
    printf("Last-Modified: %s\n", last_modified_str);
#endif
    printf("X-Uncompressed-Content-Length: %"PRId64"\n", uncompressed_length);
    printf("Content-Length: %"PRId64"\n", content_length);
    if (content_encoding)
        printf("Content-Encoding: %s\n", content_encoding);
    printf("\n");

    fwrite(data, content_length, 1, stdout);

    goto end;

_404:
    printf("Status: 404 Not Found\n");
    printf("Content-type: text/html; charset=UTF-8\n");
    printf("\n");
    printf("<html><head><title>404</title></head><body><center>404 - Arquivo n\u00e3o encontrado</center></body></html>");
#if PRINT_ERR
    printf("err: %s\n", err);
#endif

end:
    if (dir_str0)
        free(dir_str0);
    if (base_str0)
        free(base_str0);

    return 0;
}
