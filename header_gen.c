#define _XOPEN_SOURCE 500
#include <stdio.h>
#include <inttypes.h>
#include <stdlib.h>

#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

#include <string.h>

#include <zlib.h>

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <locale.h>
#include <iconv.h>
#include <errno.h>

#include <ctype.h>

static int
is_turma(char *s)
{
    /* turmas têm 4 ou 5 dígitos seguidos de uma possível letra */
    return
        (s[ 0] >= '0' && s[0] <= '9') &&
        (s[ 1] >= '0' && s[1] <= '9') &&
        (s[ 2] >= '0' && s[2] <= '9') &&
        (s[ 3] >= '0' && s[3] <= '9') &&
        (!s[4] || (s[ 4] >= '0' && s[4] <= '9')) &&
        (!s[4] || !s[5] || (s[ 5] >= 'A' && s[5] <= 'Z'));
}
static int
is_horario(char *s)
{
    /* horarios são no formato "#.####-# / XXX-XXXXX" */
    return
        (s[ 0] >= '0' && s[0] <= '9') &&
        (s[ 1] == '.') &&
        (s[ 2] >= '0' && s[2] <= '9') &&
        (s[ 3] >= '0' && s[3] <= '9') &&
        (s[ 4] >= '0' && s[4] <= '9') &&
        (s[ 5] >= '0' && s[5] <= '9') &&
        (s[ 6] == '-') &&
        (s[ 7] >= '0' && s[7] <= '9') &&
        (s[ 8] == ' ') &&
        (s[ 9] == '/') &&
        (s[10] == ' ');
}
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

static inline void
read_char(char c, int *entity_end, int *delimiter, char **object,
          int *object_len, int *object_i, int *eol, int always_read)
{
    if        (c == 0x00 || c == 0x09 ||
               c == 0x0a || c == 0x0c ||
               c == 0x0d || c == 0x20) {
        /* whitespace */
        if (c == 0x0d || c == 0x0a)
            *eol = 1;
        *entity_end = 1;
    } else if (c == '(' || c == ')' ||
               c == '<' || c == '>' ||
               c == '[' || c == ']' ||
               c == '{' || c == '}' ||
               c == '/' || c == '%') {
        if (!(*object_i) || (*object_i) != '\\') {
            /* delimiter */
            *entity_end = 1;
            *delimiter = 1;
        }
    }
    if (always_read || !(*entity_end)) {
        /* regular */
        if (*object_i >= *object_len) {
            *object_len <<= 1;
            *object = realloc(*object, *object_len);
        }
        (*object)[(*object_i)++] = c;
        (*object)[ *object_i   ] = 0;
    }
}

static char *full[7] = { 0 };
static char *fetch[2] = { 0 };
static int string_i, is_string;
static int string_len;
static char *string;
iconv_t to_utf8;
iconv_t to_ascii;

static FILE *fp_fetch = NULL;
static FILE *fp_full = NULL;
static FILE *fp_equiv = NULL;
static void
print_materia(void)
{
    static char lastc[10] = { 0 };
    static int equiv = 0;
    if (!full[0])
        return;
    if (strcmp(lastc, fetch[0])) {
        fprintf(fp_fetch, "    { \"%s\", \"%s\" },\n", fetch[0], fetch[1]);
        strcpy(lastc, fetch[0]);
        fprintf(fp_equiv, "    %d,\n", equiv);
    }
    fprintf(fp_full,
        "    { \"%s\", \"%s\", \"%s\", \"%s\", \"%s\", \"%s\", \"%s\" },\n",
        full[0], /* código da disciplina */
        full[1], /* nome da turma */
        full[2], /* nome da disciplina */
        full[3], /* horas-aula */
        full[4], /* vagas */
        full[5] ? full[5] : "" /* horário */,
        full[6] ? full[6] : "" /* professor */);
    equiv++;
}
static void
freep(void *p2)
{
    void **p = p2;
    if (*p) {
        free(*p);
        *p = NULL;
    }
}
static void
free_materia(void)
{
    freep(&fetch[0]);
    freep(&fetch[1]);
    freep(&full[0]);
    freep(&full[1]);
    freep(&full[2]);
    freep(&full[3]);
    freep(&full[4]);
    freep(&full[5]);
    freep(&full[6]);
}

static char *
strdup_to_utf8(char *string)
{
    char utf8_string[1024];
    char *i = string;
    char *o = utf8_string;
    size_t o_s = sizeof(utf8_string);
    size_t i_s = strlen(string)+1;
    int ret = iconv(to_utf8, &i, &i_s, &o, &o_s);
    if (ret == -1) {
        fprintf(stderr, "%s:%d some error with iconv '%s' %d\n", __FILE__, __LINE__, string, errno);
        exit(1);
    }
    return strdup(utf8_string);
}
static char *
strdup_to_ascii(char *string)
{
    char ascii_string[1024];
    char *i = string;
    char *o = ascii_string;
    char *p;
    size_t o_s = sizeof(ascii_string);
    size_t i_s = strlen(string)+1;
    int ret = iconv(to_ascii, &i, &i_s, &o, &o_s);
    if (ret == -1) {
        fprintf(stderr, "%s:%d some error with iconv '%s' %d\n", __FILE__, __LINE__, string, errno);
        exit(1);
    }
    p = ascii_string;
    while (*p) {
        *p = toupper(*p);
        p++;
    }
    return strdup(ascii_string);
}
static void
strdupcat(char **a, char *b)
{
    int size = strlen(*a) + strlen(b) + 2;
    char *ret = malloc(size);
    ret[0] = 0;
    sprintf(ret, "%s %s", *a, b);
    free(*a);
    *a = ret;
}

static int
parse_line(char *line, size_t line_len)
{
    int object_len = 128;
    char *object = malloc(object_len);
    int object_i = 0;
    int comment = 0;
    int i;
    for (i = 0; i < line_len; i++) {
        int eol = 0;
        int entity_end = 0;
        int delimiter = 0;
        int always_read = is_string;
        read_char(line[i], &entity_end, &delimiter, &object,
                  &object_len, &object_i, &eol, always_read);
        if (comment && !eol)
            continue;
        if (entity_end) {
            if (is_string) {
                if (line[i] == ')' && (!i || line[i-1] != '\\')) {
                    /* string */
                    is_string--;
                    if (!is_string) {
                        int l, k;
                        object[object_i-1] = 0;
                        l = strlen(object);
                        while (string_i + l > string_len) {
                            string_len <<= 1;
                            string = realloc(string, string_len);
                        }
                        if (string_i)
                            string[string_i++] = ' ';
                        for (k = 0; k < l; k++) {
                            string[string_i++] = object[k];
                            if (object[k] == '\\')
                                string_i--;
                        }
                        string[string_i] = 0;
                    }
                } else if (line[i] == '(' && (!i || line[i-1] != '\\')) {
                    is_string++;
                }
            } else {
                if (!comment) {
                    if        (!strcmp(object, "BT")) {
                        string_i           = 0;
                        string[string_i  ] = 0;
                    } else if (!strcmp(object, "ET")) {
                        if        (is_materia(string)) {
                            print_materia();
                            free_materia();
                            full[0] = strdup(string);
                            fetch[0] = strdup(string);
                        } else if (full[6]) {
                            if (!strcmp(string, "de") ||
                                !strcmp(string, "CADASTRO DE TURMAS") ||
                                !strcmp(string, "20121") ||
                                !strcmp(string, "Semestre:") ||
                                !strcmp(string, "Departamento:") ||
                                !strcmp(string, "TODOS") ||
                                !strcmp(string, "Curso:") ||
                                !strcmp(string, "TODOS") ||
                                !strcmp(string, "Nome da Disciplina") ||
                                !strcmp(string, "H.A.") ||
                                !strcmp(string, "Horarios/Locais") ||
                                !strcmp(string, "Turma") ||
                                !strcmp(string, "Disciplina") ||
                                !strcmp(string, "Vagas Ofertadas") ||
                                !strcmp(string, "Vagas Ocupadas") ||
                                !strcmp(string, "Alunos Especiais") ||
                                !strcmp(string, "Saldo Vagas") ||
                                !strcmp(string, "Pedidos sem vaga") ||
                                !strcmp(string, "Professores") ||
                                !strcmp(string, "Curso") ||
                                !strcmp(string, "29") ||
                                !strncmp(string, "SeTIC", 5) ||
                                (string[0] == 'P' && (unsigned char) string[1] == 0xe1) ||
                                (string[0] == 'H' && string[1] == 'o' && string[2] == 'r') ||
                                !strcmp(string, ""))
                            {
                            /* do nothing */
                            } else if (is_horario(string)) {
                                strdupcat(&full[5], string);
                            } else {
                                int total_chars = strlen(string);
                                int upper_case = 0;
                                int lower_case = 0;
                                int only_I = 1;
                                int kkk;
                                for (kkk = 0; kkk < total_chars; kkk++) {
                                    if      (string[kkk] >= 'A' && string[kkk] <= 'Z')
                                        upper_case++;
                                    else if (string[kkk] >= 'a' && string[kkk] <= 'z')
                                        lower_case++;
                                    if (string[kkk] != 'I')
                                        only_I = 0;
                                }
                                if (lower_case || only_I) {
                                    strdupcat(&full[2], string); /* nome da disciplina */
                                } else if (upper_case) {
                                    strdupcat(&full[6], string); /* nome do professor */
                                } else {
                                fprintf(stderr, "unhandled string '%s' (%d/%d)\n", string, upper_case, lower_case);
                                }
                            }
                        } else if (full[5]) {
                            full[6] = strdup_to_utf8(string);
                        } else if (full[4]) {
                            static int wait = 0;
                            wait++;
                            if (wait == 5) {
                                if (is_horario(string)) {
                                    full[5] = strdup(string);
                                } else {
                                    full[6] = strdup_to_utf8(string);
                                }
                                wait = 0;
                            }
                        } else if (full[3]) {
                            full[4] = strdup(string);
                        } else if (full[2]) {
                            full[3] = strdup(string);
                        } else if (full[1]) {
                            full[2] = strdup_to_utf8(string);
                            fetch[1] = strdup_to_ascii(string);
                        } else if (full[0]) {
                            full[1] = strdup(string);
                        }
                        string_i           = 0;
                        string[string_i  ] = 0;
                    }
                }
                object_i           = 0;
                object[object_i  ] = 0;
                if (delimiter && !comment) {
                    if        (line[i] == '(') {
                        /* string */
                        is_string++;
                    }
                }
            }
        }
    }
    free(object);
    return 1;
}

static
void parse_stream(const char *stream, int stream_size)
{
    char *line = (char *) stream;
    size_t line_len = 0;

    string_len = 128;
    string = malloc(string_len);
    for (int i = 0; i < stream_size; i++) {
        line_len++;
        if (stream[i] == '\n') {
            if (!parse_line(line, line_len)) {
                fprintf(stdout, "error parsing line\n");
                break;
            }
            line = (char *) &stream[i+1];
            line_len = 0;
        }
    }
    free(string);
}

int main(int argc, char *argv[])
{
    const uint8_t *buf_in = NULL;
    char *fname_in = argv[1];
    int do_deflate = 0;
    int length = 0;
    struct stat st;
    int fd_in = 0;
    int ret = -1;

    if (argc < 5) {
        fprintf(stderr, "usage: %s <input.pdf> <fetch.h> <full.h> <equiv.h>\n", argv[0]);
        goto end;
    }

    /* Open and mmap() input file */
    fd_in = open(fname_in, O_RDONLY);
    if (fd_in == -1) {
        fprintf(stderr, "could not open input file '%s'\n", fname_in);
        goto end;
    }
    if (fstat(fd_in, &st) == -1) {
        fprintf(stderr, "could not stat input file '%s'\n", fname_in);
        goto end;
    }
    buf_in = mmap(NULL, st.st_size, PROT_READ, MAP_PRIVATE, fd_in, 0);
    if (buf_in == MAP_FAILED) {
        fprintf(stderr, "could not map input file '%s'\n", fname_in);
        goto end;
    }

    fp_fetch = fopen(argv[2], "wb");
    if (!fp_fetch) {
        fprintf(stderr, "could not open output file '%s'\n", argv[2]);
        goto end;
    }
    fp_full = fopen(argv[3], "wb");
    if (!fp_fetch) {
        fprintf(stderr, "could not open output file '%s'\n", argv[3]);
        goto end;
    }
    fp_equiv = fopen(argv[4], "wb");
    if (!fp_fetch) {
        fprintf(stderr, "could not open output file '%s'\n", argv[4]);
        goto end;
    }

    fprintf(fp_fetch, "static char *fetch[][2] = {\n");
    fprintf(fp_full, "static char *full[][7] = {\n");
    fprintf(fp_equiv, "static int equiv[] = {\n");

    setlocale(LC_ALL, "");

    to_utf8 = iconv_open("utf8", "iso-8859-1");
    if (to_utf8 == (iconv_t) -1) {
        fprintf(stderr, "oh, bummer 1!\n");
        return -1;
    }
    to_ascii = iconv_open("ASCII//TRANSLIT", "iso-8859-1");
    if (to_ascii == (iconv_t) -1) {
        fprintf(stderr, "oh, bummer 2!\n");
        return -1;
    }

    for (int i = 0; i < st.st_size-11; i++) {
        if        (!strncmp(&buf_in[i], "Length"     , 6)) {
            do_deflate = 0;
            i += 7;
            length = (int) strtod(&buf_in[i], NULL);
        } else if (!strncmp(&buf_in[i], "FlateDecode", 11)) {
            do_deflate = 1;
            i += 12;
        } else if (!strncmp(&buf_in[i], "endstream"  , 9)) {
            i += 10;
        } else if (!strncmp(&buf_in[i], "stream"     , 6) && do_deflate) {
            int chunk_size = 2048;
            int out_size = 0;
            int out_offset = 0;
            unsigned char *out = NULL;
            z_stream strm;
            int ret;

            i += 7;

            strm.zalloc = Z_NULL;
            strm.zfree = Z_NULL;
            strm.opaque = Z_NULL;
            strm.avail_in = 0;
            strm.next_in = Z_NULL;
            ret = inflateInit(&strm);

            if (ret != Z_OK) {
                fprintf(stderr, "inflateInit() error!\n");
                return ret;
            }

            strm.avail_in = length;
            strm.next_in = (char *) &buf_in[i];

            do {
                out_size += chunk_size;
                out = realloc(out, out_size);
                if (!out) {
                    fprintf(stderr, "could not allocate memory!\n");
                    return -1;
                }
                strm.avail_out = out_size - out_offset;
                strm.next_out = out + out_offset;
                inflate(&strm, Z_NO_FLUSH);
                out_offset = out_size;
            } while (strm.avail_out == 0);
            out_size -= strm.avail_out;

            parse_stream(out, out_size);

            inflateEnd(&strm);
            free(out);
        }
    }
    print_materia();

    iconv_close(to_utf8);
    iconv_close(to_ascii);

    fprintf(fp_full, "};\n");
    fprintf(fp_fetch, "};\n");
    fprintf(fp_equiv, "};\n");

    ret = 0;

end:
    if (fp_equiv) fclose(fp_equiv);
    if (fp_fetch) fclose(fp_fetch);
    if (fp_full) fclose(fp_full);
    if (buf_in) munmap((void*)buf_in, st.st_size);
    if (fd_in ) close(fd_in);

    return ret;
}
