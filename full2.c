#include <stdio.h>
#include <string.h>
#include <assert.h>
#include <zlib.h>
#include <inttypes.h>

#include "full.h"

int main(int argc, char **argv)
{
    FILE *fp_full2 = NULL;
    FILE *fp_gperf = NULL;
    int l = sizeof(full)/sizeof(full[0]);
    int i, j;

    if (argc < 3) {
        fprintf(stderr, "usage: %s <full2.h> <gperf.h>\n", argv[0]);
        goto end;
    }

    fp_full2 = fopen(argv[1], "wb");
    if (!fp_full2) {
        fprintf(stderr, "could not open output file '%s'\n", argv[1]);
        goto end;
    }
    fp_gperf = fopen(argv[2], "wb");
    if (!fp_gperf) {
        fprintf(stderr, "could not open output file '%s'\n", argv[2]);
        goto end;
    }

    for (i = 0; i < l; i++) {
        int len = strlen(full[i].result);
        uint8_t out[len];
        z_stream strm;

        fprintf(fp_full2, "static const uint8_t %s_deflate[] = { ", full[i].codigo_disciplina);

        strm.zalloc = Z_NULL;
        strm.zfree  = Z_NULL;
        strm.opaque = Z_NULL;
        if (deflateInit2(&strm, Z_BEST_COMPRESSION, Z_DEFLATED, -15, MAX_MEM_LEVEL, Z_DEFAULT_STRATEGY) != Z_OK)
            return -1;
        strm.avail_in  = len;
        strm.next_in   = (uint8_t *) full[i].result;
        strm.avail_out = len; /* it will always deflate, it's text */
        strm.next_out  = out;
        if (deflate(&strm, Z_FINISH) == Z_STREAM_ERROR)
            return -1;
        for (j = 0; j < (len - strm.avail_out); j++)
            fprintf(fp_full2, "0x%02x, ", (uint8_t) out[j]);
        fprintf(fp_full2, "};\n");

        fprintf(fp_full2, "#define %s_deflate_length %d\n", full[i].codigo_disciplina, len - strm.avail_out);
        fprintf(fp_full2, "#define %s_index          %d\n", full[i].codigo_disciplina, i);

        (void)deflateEnd(&strm);
    }

    fprintf(fp_gperf, "struct mapping { const char *name; int index; };\n");
    fprintf(fp_gperf, "%%struct-type\n");
    fprintf(fp_gperf, "%%language=ANSI-C\n");
    fprintf(fp_gperf, "%%readonly-tables\n");
    fprintf(fp_gperf, "%%%%\n");

    fprintf(fp_full2,
        "static struct {\n"
        "    const char *text;\n"
        "    const char *deflate;\n"
        "    const int   deflate_length;\n"
        "} full_result[] = {\n");
    for (i = 0; i < l; i++) {
        fprintf(fp_full2, "    { \"%s\", %s_deflate, %s_deflate_length },\n",
            full[i].result, full[i].codigo_disciplina,
            full[i].codigo_disciplina);
        fprintf(fp_gperf, "%s, %s_index\n",
            full[i].codigo_disciplina, full[i].codigo_disciplina);
    }
    fprintf(fp_full2, "};\n");

    return 0;

end:
    if (fp_full2)
        fclose(fp_full2);
    if (fp_gperf)
        fclose(fp_gperf);
    return -1;
}
