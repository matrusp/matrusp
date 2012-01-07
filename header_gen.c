#define _XOPEN_SOURCE 700
#include <stdio.h>
#include <inttypes.h>
#include <stdlib.h>

#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

#include <string.h>

#include <libxml/parser.h>
#include <libxml/tree.h>

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "utf8_to_ascii.h"
#include <assert.h>

#include <ctype.h>

static int has_started = 0;
static FILE *fp_full = NULL;

static xmlNodePtr
get_child(xmlNodePtr parent, const char *name)
{
    xmlNodePtr child = parent->children;
    while (child) {
        if (!strcmp((const char *) child->name, name)) {
            return child;
        }
        child = child->next;
    }
    return NULL;
}

static char **
get_list(xmlNodePtr node)
{
    xmlNodePtr child;
    char **list;
    int l = 1, i = 0;
    for (child = node->children; child; child = child->next)
        if (child->type == 3 || (child->type == 1 && child->name[0] == 'a'))
            l++;
    list = malloc(l * sizeof(char *));
    for (child = node->children; child; child = child->next) {
        if (child->type == 1 && child->name[0] == 'a') {
            list[i++] = (char *) xmlNodeGetContent(child->children);
        } else if (child->type == 3) {
            list[i++] = (char *) xmlNodeGetContent(child);
        }
    }
    list[i] = NULL;
    return list;
}

static void
extract_turmas(const char *content, int length)
{
    xmlNodePtr node, tr;
    xmlDocPtr doc;

    doc = xmlReadMemory(content, length, "noname.xml", NULL, 0);
    if (doc == NULL) {
        fprintf(stderr, "Failed to parse document\n");
        return;
    }

    node = doc->children; /* <html> */
    node = get_child(node, "body");
    node = get_child(node, "table");
    node = get_child(node, "tbody");

    tr = node->children;
    while (tr) {
        static char lastc[10] = { 0 };
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
            char **professores;
        } full = { 0 };
        xmlNodePtr child;
        int i = 0;

        xmlNodePtr codigo_disciplina = tr->children->next->next->next;
        xmlNodePtr nome_turma        = codigo_disciplina->next;
        xmlNodePtr nome_disciplina   = nome_turma       ->next;
        xmlNodePtr horas_aula        = nome_disciplina  ->next;
        xmlNodePtr vagas_ofertadas   = horas_aula       ->next;
        xmlNodePtr vagas_ocupadas    = vagas_ofertadas  ->next;
        xmlNodePtr alunos_especiais  = vagas_ocupadas   ->next;
        xmlNodePtr saldo_vagas       = alunos_especiais ->next;
        xmlNodePtr pedidos_sem_vaga  = saldo_vagas      ->next;
        xmlNodePtr horarios          = pedidos_sem_vaga ->next;
        xmlNodePtr professores       = horarios         ->next;

        full.codigo_disciplina  = (char *) xmlNodeGetContent(codigo_disciplina->children);
        full.nome_turma         = (char *) xmlNodeGetContent(nome_turma       ->children);
        for (child = nome_disciplina->children; child; child = child->next) {
            if (child->type == 3) {
                char *tmp = (char *) xmlNodeGetContent(child);
                if (!full.nome_disciplina) {
                    full.nome_disciplina = strdup(tmp);
                } else {
                    int l1 = strlen(full.nome_disciplina);
                    int l2 = strlen(tmp);
                    char *nome = malloc(l1 + l2 + 2);
                    strcpy(nome     , full.nome_disciplina);
                    nome[l1] = ' ';
                    strcpy(nome+l1+1, tmp);
                    nome[l1+1+l2] = 0x00;
                    full.nome_disciplina = nome;
                }
                xmlFree(tmp);
            }
        }
        full.nome_disciplina_ascii = utf8_to_ascii(full.nome_disciplina, 0);
        assert(full.nome_disciplina_ascii);
        full.horas_aula         = (char *) xmlNodeGetContent(horas_aula       ->children);
        full.vagas_ofertadas    = (char *) xmlNodeGetContent(vagas_ofertadas  ->children);
        full.vagas_ocupadas     = (char *) xmlNodeGetContent(vagas_ocupadas   ->children);
        full.alunos_especiais   = (char *) xmlNodeGetContent(alunos_especiais ->children);
        full.saldo_vagas        = (char *) xmlNodeGetContent(saldo_vagas      ->children);
//        full.pedidos_sem_vaga   = (char *) xmlNodeGetContent(pedidos_sem_vaga );
        full.pedidos_sem_vaga   = (char *) "0";
        full.horarios           = get_list(horarios   );
        full.professores        = get_list(professores);


        if (strcmp(lastc, full.codigo_disciplina)) {
            if (has_started)
                fprintf(fp_full, "]],\n");

            fprintf(fp_full, "[");
            fprintf(fp_full, "\"%s\",", full.codigo_disciplina);
            fprintf(fp_full, "\"%s\",", full.nome_disciplina_ascii);
            fprintf(fp_full, "\"%s\",", full.nome_disciplina);
            fprintf(fp_full, "[");
            strcpy(lastc, full.codigo_disciplina);
            has_started = 1;
        }

        fprintf(fp_full, "[");
        fprintf(fp_full, "\"%s\",", full.nome_turma);
        fprintf(fp_full, "%s,", full.horas_aula);
        fprintf(fp_full, "%s,", full.vagas_ofertadas);
        fprintf(fp_full, "%s,", full.vagas_ocupadas);
        fprintf(fp_full, "%s,", full.alunos_especiais);
        if (!strcmp(full.saldo_vagas, "LOTADA"))
            fprintf(fp_full, "-1,");
        else
            fprintf(fp_full, "%s,", full.saldo_vagas);
        fprintf(fp_full, "%s,", full.pedidos_sem_vaga);
        fprintf(fp_full, "[");
        for (int j = 0; full.horarios[j]; j++)
            fprintf(fp_full, "\"%s\",", full.horarios[j]);
        fprintf(fp_full, "],");
        fprintf(fp_full, "[");
        for (int j = 0; full.professores[j]; j++)
            fprintf(fp_full, "\"%s\",", full.professores[j]);
        fprintf(fp_full, "]");
        fprintf(fp_full, "],");

        xmlFree(full.codigo_disciplina);
        xmlFree(full.nome_turma       );
        free   (full.nome_disciplina  );
        free   (full.nome_disciplina_ascii);
        xmlFree(full.horas_aula       );
        xmlFree(full.vagas_ofertadas  );
        xmlFree(full.vagas_ocupadas   );
        xmlFree(full.alunos_especiais );
        xmlFree(full.saldo_vagas      );
        for (i = 0; full.professores[i]; i++)
            xmlFree(full.professores[i]);
        free(full.professores);
        for (i = 0; full.horarios[i]; i++)
            xmlFree(full.horarios[i]);
        free(full.horarios);

        tr = tr->next;
    }

    xmlFreeDoc(doc);
}

int main(int argc, char *argv[])
{
    const char *const start = "<?xml version=\"1.0\"?>";
    const int lstart = strlen(start);
    const char *const end = "------------------------------------------------------------------";
    const int lend = strlen(end);
    int start_at, end_at;
    const uint8_t *buf_in = NULL;
    char *fname_in = argv[1];
    struct stat st;
    int fd_in = 0;
    int ret = -1;

    LIBXML_TEST_VERSION

    if (argc < 3) {
        fprintf(stderr, "usage: %s <input> <full.js>\n", argv[0]);
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

    fprintf(fp_full, "database.add(\"FLO\",[\n");

    for (int i = 0; i < st.st_size - lend; i++) {
        if        (!strncmp((char *) &buf_in[i], start, lstart)) {
            start_at = i;
        } else if (!strncmp((char *) &buf_in[i], end, lend)) {
            end_at = i;
            extract_turmas((char *) &buf_in[start_at], end_at - start_at);
        }
    }

    if (has_started)
        fprintf(fp_full, "]],\n");
    fprintf(fp_full, "]);\n");

    ret = 0;

end:
    if (fp_full) fclose(fp_full);
    if (buf_in) munmap((void*)buf_in, st.st_size);
    if (fd_in ) close(fd_in);

    xmlCleanupParser();
    xmlMemoryDump();

    return ret;
}
