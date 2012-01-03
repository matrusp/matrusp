static char *
utf8_to_ascii(char *string, int always_return)
{
    char ascii_string[1024];
    char *i = string;
    char *o = ascii_string;
    int j_i = 0, j_o = 0;
    while (i[j_i] && j_o < sizeof(ascii_string)) {
        char c = i[j_i++];
        if (c & 0x80) {
            uint8_t c2 = i[j_i++];
            const char cc3[0x100] = {
                [0x80] = 'A', [0x81] = 'A', [0x82] = 'A', [0x83] = 'A',
                [0x84] = 'A', [0x85] = 'A', /* [0x86] = 'Æ', */
                [0x87] = 'C', [0x88] = 'E', [0x89] = 'E', [0x8a] = 'E',
                [0x8b] = 'E', [0x8c] = 'I', [0x8d] = 'I', [0x8e] = 'I',
                [0x8f] = 'I', [0x90] = 'D', [0x91] = 'N', [0x92] = 'O',
                [0x93] = 'O', [0x94] = 'O', [0x95] = 'O', [0x96] = 'O',
                [0x97] = 'X', [0x98] = 'O', [0x99] = 'U', [0x9a] = 'U',
                [0x9b] = 'U', [0x9c] = 'U', [0x9d] = 'Y', /* [0x9e] = 'Þ', */
                [0x9f] = 'B', [0xa0] = 'a', [0xa1] = 'a', [0xa2] = 'a',
                [0xa3] = 'a', [0xa4] = 'a', [0xa5] = 'a', /* [0xa6] = 'æ', */
                [0xa7] = 'c', [0xa8] = 'e', [0xa9] = 'e', [0xaa] = 'e',
                [0xab] = 'e', [0xac] = 'i', [0xad] = 'i', [0xae] = 'i',
                [0xaf] = 'i', [0xb0] = 'o', [0xb1] = 'n', [0xb2] = 'o',
                [0xb3] = 'o', [0xb4] = 'o', [0xb5] = 'o', [0xb6] = 'o',
                [0xb7] = '/', [0xb8] = 'o', [0xb9] = 'u', [0xba] = 'u',
                [0xbb] = 'u', [0xbc] = 'u', [0xbd] = 'y', /* [0xbe] = 'þ', */
                [0xbf] = 'y',
            };
            const char cc4[0x100] = { [0xaa] = 'a', [0xb4] = '\'', [0xba] = 'o', };
            if      (c == -61)
                c = cc3[c2];
            else if (c == -62)
                c = cc4[c2];
            else
                c = 0;
            if (!c) {
                if (always_return)
                    break;
                fprintf(stderr, "%s:%d char '%d'%2x' not translated (%.2s) '%s'\n", __FILE__, __LINE__, c, c2, string+j_i-2, string);
                exit(1);
            }
        }
        if (c >= 'a' && c <= 'z')
            c &= ~0x20;
        o[j_o++] = c;
    }
    if (!always_return && j_o == sizeof(ascii_string))
        return NULL;
    o[j_o] = 0x00;
    return strdup(ascii_string);
}
