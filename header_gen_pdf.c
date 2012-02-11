#define _XOPEN_SOURCE 700
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
#include <assert.h>

#include <ctype.h>

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
static char **
split_horarios(char *string)
{
    char *s = strdup(string);
    char **ret;
    char *bkp = s;
    int count = 0;
    int i;

    while(*s) {
        if (!is_horario(s))
            return NULL;
        s += 11;
        while (*s && *s != ' ')
            s++;
        count++;
        if (*s == ' ') {
            *s = 0;
            s++;
        }
    }

    ret = malloc(sizeof(char*)*(count+1));
    if (!ret)
        return ret;
    s = bkp;
    for (i = 0; i < count; i++) {
        char *s2 = strdup(s);
        s += strlen(s)+1;
        ret[i] = s2;
    }
    ret[i] = NULL;
    free(bkp);

    return ret;
}
static char **
add_split_horarios(char **horarios, char *string)
{
    char **tmp = split_horarios(string);
    int i, count;
    char **ret;
    for (i = 0; horarios[i]; i++);
    count  = i;
    for (i = 0; tmp[i]; i++);
    count += i;
    ret = malloc(sizeof(char*)*(count+1));
    for (i = 0; horarios[i]; i++)
        ret[i] = horarios[i];
    count = i;
    for (i = 0; tmp[i]; i++)
        ret[count+i] = tmp[i];
    ret[count+i] = NULL;
    free(horarios);
    free(tmp);
    return ret;
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

struct {
    char *codigo_disciplina;
    char *nome_turma;
    char *nome_disciplina;
    char *nome_disciplina_ascii;
    char *horas_aula;
    char *vagas_ofertadas;
    char *vagas_ocupadas;
    char *alunos_especiais;
    char *saldo_vagas;
    char *pedidos_sem_vaga;
    char **horarios;
    char *professores;
} full = { 0 };
static int string_i, is_string;
static int string_len;
static char *string;

static int has_started = 0;
static FILE *fp_full = NULL;
static void
print_materia(void)
{
    static char lastc[10] = { 0 };
    if (!full.codigo_disciplina)
        return;

    if        (!strcmp(full.codigo_disciplina, "EMB5116") && !strcmp(full.nome_turma, "06601A")) {
        free(full.nome_disciplina);
        full.nome_disciplina = strdup("Eletrônica Analógica [Reservada Curso]");
    } else if (!strcmp(full.codigo_disciplina, "EMB5016") && !strcmp(full.nome_turma, "03601B")) {
        free(full.nome_disciplina);
        full.nome_disciplina = strdup("Cálculo Numérico [Reservada Curso]");
        free(full.horarios[0]);
        free(full.horarios);
        full.horarios = malloc(3*sizeof(char*));
        full.horarios[0] = strdup("2.1620-2 / JOI-JOI012");
        full.horarios[1] = strdup("5.1010-2 / JOI-AUD01");
        full.horarios[2] = NULL;
    }

    if (!full.horarios) {
        fprintf(stderr, "materia sem horarios! '%s' '%s'\n", full.codigo_disciplina, full.nome_turma);
        return;
    }

    if (strcmp(lastc, full.codigo_disciplina)) {
        if (has_started)
            fprintf(fp_full, "]],\n");

        fprintf(fp_full, "[");
        fprintf(fp_full, "\"%s\",", full.codigo_disciplina);
        fprintf(fp_full, "\"%s\",", full.nome_disciplina_ascii);
        fprintf(fp_full, "\"%s\",", full.nome_disciplina);
        fprintf(fp_full, "[");
        strcpy(lastc, full.codigo_disciplina);
        has_started = 0;
    }

    if (has_started++)
        fprintf(fp_full, ",");
    fprintf(fp_full, "[");
    fprintf(fp_full, "\"%s\",", full.nome_turma);
    fprintf(fp_full, "%s,", full.horas_aula);
    fprintf(fp_full, "%s,", full.vagas_ofertadas);
    fprintf(fp_full, "%s,", full.vagas_ocupadas);
    fprintf(fp_full, "%s,", full.alunos_especiais);
    fprintf(fp_full, "%s,", full.saldo_vagas);
    fprintf(fp_full, "%s,", full.pedidos_sem_vaga);
    fprintf(fp_full, "[");
    for (int j = 0; full.horarios[j]; j++) {
        if (j)
            fprintf(fp_full, ",");
        fprintf(fp_full, "\"%s\"", full.horarios[j]);
    }
    fprintf(fp_full, "],");
    fprintf(fp_full, "[");
    fprintf(fp_full, "\"%s\"", full.professores);
    fprintf(fp_full, "]");
    fprintf(fp_full, "]");
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
    int i;
    freep(&full.codigo_disciplina);
    freep(&full.nome_turma);
    freep(&full.nome_disciplina);
    freep(&full.horas_aula);
    freep(&full.vagas_ofertadas);
    freep(&full.codigo_disciplina);
    freep(&full.nome_turma);
    freep(&full.nome_disciplina);
    freep(&full.horas_aula);
    freep(&full.vagas_ofertadas);
    freep(&full.vagas_ocupadas);
    freep(&full.alunos_especiais);
    freep(&full.saldo_vagas);
    freep(&full.pedidos_sem_vaga);
    if (full.horarios)
        for (i = 0; full.horarios[i]; i++)
            free(full.horarios[i]);
    freep(&full.horarios);
    freep(&full.professores);
}

static char *
strdup_to_utf8(char *string)
{
    char utf8_string[1024];
    char *i = string;
    char *o = utf8_string;
    int j_i = 0, j_o = 0;
    while (i[j_i]) {
        char c = i[j_i++];
        if (c & 0x80) {
            uint8_t c2 = (uint8_t) c;
            const char iso8859_utf8[] = {
                [0xc0] = "À"[1], [0xc1] = "Á"[1], [0xc2] = "Â"[1], [0xc3] = "Ã"[1],
                [0xc4] = "Ä"[1], [0xc5] = "Å"[1], [0xc6] = "Æ"[1], [0xc7] = "Ç"[1],
                [0xc8] = "È"[1], [0xc9] = "É"[1], [0xca] = "Ê"[1], [0xcb] = "Ë"[1],
                [0xcc] = "Ì"[1], [0xcd] = "Í"[1], [0xce] = "Î"[1], [0xcf] = "Ï"[1],
                [0xd0] = "Ð"[1], [0xd1] = "Ñ"[1], [0xd2] = "Ò"[1], [0xd3] = "Ó"[1],
                [0xd4] = "Ô"[1], [0xd5] = "Õ"[1], [0xd6] = "Ö"[1], [0xd7] = "×"[1],
                [0xd8] = "Ø"[1], [0xd9] = "Ù"[1], [0xda] = "Ú"[1], [0xdb] = "Û"[1],
                [0xdc] = "Ü"[1], [0xdd] = "Ý"[1], [0xde] = "Þ"[1], [0xdf] = "ß"[1],
                [0xe0] = "à"[1], [0xe1] = "á"[1], [0xe2] = "â"[1], [0xe3] = "ã"[1],
                [0xe4] = "ä"[1], [0xe5] = "å"[1], [0xe6] = "æ"[1], [0xe7] = "ç"[1],
                [0xe8] = "è"[1], [0xe9] = "é"[1], [0xea] = "ê"[1], [0xeb] = "ë"[1],
                [0xec] = "ì"[1], [0xed] = "í"[1], [0xee] = "î"[1], [0xef] = "ï"[1],
                [0xf0] = "ð"[1], [0xf1] = "ñ"[1], [0xf2] = "ò"[1], [0xf3] = "ó"[1],
                [0xf4] = "ô"[1], [0xf5] = "õ"[1], [0xf6] = "ö"[1], [0xf7] = "÷"[1],
                [0xf8] = "ø"[1], [0xf9] = "ù"[1], [0xfa] = "ú"[1], [0xfb] = "û"[1],
                [0xfc] = "ü"[1], [0xfd] = "ý"[1], [0xfe] = "þ"[1], [0xff] = "ÿ"[1],
            };
            c = iso8859_utf8[c2];
            if (!c) {
                fprintf(stderr, "%s:%d char '%2x' not translated (%d) '%s'\n", __FILE__, __LINE__, (uint8_t) i[j_i-2], j_i, string);
                exit(1);
            }
            o[j_o++] = -61;
        }
        o[j_o++] = c;
    }
    assert(j_o < sizeof(utf8_string));
    o[j_o] = 0x00;
    return strdup(utf8_string);
}
static char *
iso8859_to_ascii(char *string)
{
    char ascii_string[1024];
    char *i = string;
    char *o = ascii_string;
    int j_i = 0, j_o = 0;
    while (i[j_i]) {
        char c = i[j_i++];
        if (c & 0x80) {
            uint8_t c2 = (uint8_t) c;
            const char iso8859_ascii[] = {
                [0xc0] = 'A', [0xc1] = 'A', [0xc2] = 'A', [0xc3] = 'A',
                [0xc4] = 'A', [0xc5] = 'A', /* [0xc6] = 'Æ', */
                [0xc7] = 'C', [0xc8] = 'E', [0xc9] = 'E', [0xca] = 'E',
                [0xcb] = 'E', [0xcc] = 'I', [0xcd] = 'I', [0xce] = 'I',
                [0xcf] = 'I', [0xd0] = 'D', [0xd1] = 'N', [0xd2] = 'O',
                [0xd3] = 'O', [0xd4] = 'O', [0xd5] = 'O', [0xd6] = 'O',
                [0xd7] = 'X', [0xd8] = 'O', [0xd9] = 'U', [0xda] = 'U',
                [0xdb] = 'U', [0xdc] = 'U', [0xdd] = 'Y', /* [0xde] = 'Þ', */
                [0xdf] = 'B', [0xe0] = 'a', [0xe1] = 'a', [0xe2] = 'a',
                [0xe3] = 'a', [0xe4] = 'a', [0xe5] = 'a', /* [0xe6] = 'æ', */
                [0xe7] = 'c', [0xe8] = 'e', [0xe9] = 'e', [0xea] = 'e',
                [0xeb] = 'e', [0xec] = 'i', [0xed] = 'i', [0xee] = 'i',
                [0xef] = 'i', [0xf0] = 'o', [0xf1] = 'n', [0xf2] = 'o',
                [0xf3] = 'o', [0xf4] = 'o', [0xf5] = 'o', [0xf6] = 'o',
                [0xf7] = '/', [0xf8] = 'o', [0xf9] = 'u', [0xfa] = 'u',
                [0xfb] = 'u', [0xfc] = 'u', [0xfd] = 'y', /* [0xfe] = 'þ', */
                [0xff] = 'y',
            };
            c = iso8859_ascii[c2];
            if (!c) {
                fprintf(stderr, "%s:%d char '%2x' not translated (%d) '%s'\n", __FILE__, __LINE__, (uint8_t) i[j_i-2], j_i, string);
                exit(1);
            }
        }
        if (c >= 'a' && c <= 'z')
            c &= ~0x20;
        o[j_o++] = c;
    }
    assert(j_o < sizeof(ascii_string));
    o[j_o] = 0x00;
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
                            full.codigo_disciplina = strdup(string);
                        } else if (full.professores) {
                            if (!strcmp(string, "de") ||
                                !strcmp(string, "CADASTRO DE TURMAS") ||
                                !strcmp(string, "20121") ||
                                !strcmp(string, "Semestre:") ||
                                !strcmp(string, "TODOS") ||
                                !strcmp(string, "Departamento:") ||
                                !strcmp(string, "EMB - Campus Joinville, Diretoria EMB") ||
                                !strcmp(string, "Curso:") ||
                                !strcmp(string, "601 - ENGENHARIA DA MOBILIDADE [Campus Joinville]") ||
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
                                !strcmp(string, "10") ||
                                !strncmp(string, "SeTIC", 5) ||
                                (string[0] == 'P' && (unsigned char) string[1] == 0xe1) ||
                                (string[0] == 'H' && string[1] == 'o' && string[2] == 'r') ||
                                !strcmp(string, ""))
                            {
                            /* do nothing */
                            } else if (is_horario(string)) {
                                full.horarios = add_split_horarios(full.horarios, string);
                            } else {
                                int total_chars = strlen(string);
                                int upper_case = 0;
                                int lower_case = 0;
                                int only_I = 1;
                                int kkk;
fprintf(stderr, "string: %s\n", string);
                                for (kkk = 0; kkk < total_chars; kkk++) {
                                    if      (string[kkk] >= 'A' && string[kkk] <= 'Z')
                                        upper_case++;
                                    else if (string[kkk] >= 'a' && string[kkk] <= 'z')
                                        lower_case++;
                                    if (string[kkk] != 'I')
                                        only_I = 0;
                                }
                                if (lower_case || only_I) {
                                    strdupcat(&full.nome_disciplina, string); /* nome da disciplina */
                                } else if (upper_case) {
                                    strdupcat(&full.professores, string); /* nome do professor */
                                } else {
                                fprintf(stderr, "unhandled string '%s' (%d/%d)\n", string, upper_case, lower_case);
                                }
                            }
                        } else if (full.horarios) {
                            full.professores = strdup_to_utf8(string);
                        } else if (full.pedidos_sem_vaga) {
                            if (!strcmp(string, "601")) {
                            /* do nothing */
                            } else
                            if (is_horario(string)) {
                                full.horarios = split_horarios(string);
                            } else {
                                full.professores = strdup_to_utf8(string);
                            }
                        } else if (full.saldo_vagas) {
                            if (!strcmp(string, "601"))
                                full.pedidos_sem_vaga = strdup("0");
                            else
                                full.pedidos_sem_vaga = strdup(string);
                        } else if (full.alunos_especiais) {
                            full.saldo_vagas = strdup(string);
                        } else if (full.vagas_ocupadas) {
                            full.alunos_especiais = strdup(string);
                        } else if (full.vagas_ofertadas) {
                            full.vagas_ocupadas = strdup(string);
                        } else if (full.horas_aula) {
                            full.vagas_ofertadas = strdup(string);
                        } else if (full.nome_disciplina) {
                            full.horas_aula = strdup(string);
                        } else if (full.nome_turma) {
                            full.nome_disciplina = strdup_to_utf8(string);
                            full.nome_disciplina_ascii = iso8859_to_ascii(string);
                        } else if (full.codigo_disciplina) {
                            full.nome_turma = strdup(string);
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
    char *buf_in = NULL;
    char *fname_in = argv[1];
    int do_deflate = 0;
    int length = 0;
    struct stat st;
    int fd_in = 0;
    int ret = -1;

    if (argc < 3) {
        fprintf(stderr, "usage: %s <input.pdf> <full.h>\n", argv[0]);
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

    fp_full = fopen(argv[2], "wb");
    if (!fp_full) {
        fprintf(stderr, "could not open output file '%s'\n", argv[2]);
        goto end;
    }

    fprintf(fp_full, "database.add(\"JOI\",[\n");

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
            z_stream strm = { 0 };
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
            strm.next_in = (unsigned char *) &buf_in[i];

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

            parse_stream((const char *) out, out_size);

            inflateEnd(&strm);
            free(out);
        }
    }
    print_materia();

    if (has_started)
        fprintf(fp_full, "]]\n");
    fprintf(fp_full, "]);\n");

    ret = 0;

end:
    if (fp_full) fclose(fp_full);
    if (buf_in) munmap((void*)buf_in, st.st_size);
    if (fd_in ) close(fd_in);

    return ret;
}
