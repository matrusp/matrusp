#include <stdio.h>
#include <string.h>
#include <assert.h>
#include <zlib.h>
#include <inttypes.h>

#include "full.h"

int main(int argc, char **argv)
{
    int l = sizeof(full)/sizeof(full[0]);
    int i, j;

    for (i = 0; i < l; i++) {
        int len = strlen(full[i].result);
        uint8_t out[len];
        z_stream strm;

        printf("static uint8_t %s_gzipped[] = { ", full[i].codigo_disciplina);

        strm.zalloc = Z_NULL;
        strm.zfree  = Z_NULL;
        strm.opaque = Z_NULL;
        if (deflateInit(&strm, Z_DEFAULT_COMPRESSION) != Z_OK)
            return -1;
        strm.avail_in  = len;
        strm.next_in   = (uint8_t *) full[i].result;
        strm.avail_out = len; /* it will always deflate, it's text */
        strm.next_out  = out;
        if (deflate(&strm, Z_FINISH) == Z_STREAM_ERROR)
            return -1;
        for (j = 0; j < (len - strm.avail_out); j++)
            printf("0x%02x, ", (uint8_t) out[j]);
        printf("};\n");

        (void)deflateEnd(&strm);
    }

    printf(
        "static struct {\n"
        "    char *codigo_disciplina;\n"
        "    char *result_gzipped;\n"
        "    int   result_gzipped_length;\n"
        "    char *result;\n"
        "} full2[] = {\n");
    for (i = 0; i < l; i++)
        printf("    { \"%s\", %s_gzipped, sizeof(%s_gzipped), \"%s\" },\n",
            full[i].codigo_disciplina, full[i].codigo_disciplina,
            full[i].codigo_disciplina, full[i].result);
    printf("};\n");

    return 0;
}
