/**
 * @constructor
 */
function Database() {
    this.db = new Object();
    this.search_score = function(haystack, needle, value) {
        needle.lastIndex = 0;
        var tmp = haystack.match(needle);
        if (tmp === null)
            return 0;
        return tmp.length * value;
    };
}
Database.prototype.set_db = function(semestre, campus) {
    if (this.db[semestre] && this.db[semestre][campus])
        this.cur_db = this.db[semestre][campus];
    else
        return -1;
    return 0;
}
//("MAC0315", "Programação Linear", [(codigo_t1, data_inicio_t1, data_fim_t1, tipo_t1, horario_t1, vagas_t1), ...])

//(codigo, data_inicio, data_fim, tipo) = ("2013102", "25/02/2013", "29/06/2013", "Teórica")

//horario = [("seg", "10:00", "11:40", ["Marcelo Gomes de Queiroz"]),
//           ("qua", "08:00", "09:40", ["Marcelo Gomes de Queiroz"])]

//vagas = [("Obrigatória", 70, 65, 0, 0, [("IME - Ciência da Computação", 70, 65, 0, 0)]), 
//         ("Optativa Eletiva", 10, 16, 0, 0, [("IME - Matemática Bacharelado", 5, 6, 0, 0), ("IME - Estatística", 5, 10, 0, 0)]),
//         ("Optativa Livre", 2, 3, 0, 0, [("Qualquer Unidade da USP", 2, 3, 0, 0)]), 
//         ("Alunos Especiais", 1, 0, 0, 0, [])]
Database.prototype.add = function(semestre, array) {
    var self = this;
    self.db[semestre] = {};

    for (var campus in array) {
        var campus_array = array[campus];
        self.db[semestre][campus] = {};
        campus_array.forEach(function(k) {
            var i = new Object();
            i.codigo     = k[0];
            i.nome       = k[1];
            i.turmas     = [];
            k[2].forEach(function(m) {
                var n = new Object();
                n.nome              = m[0];
                n.data_inicio        = m[1];
                n.data_fim   = m[2];
                n.tipo    = m[3];
                n.horario  = [];
                if (m[4] != null) {
                    m[4].forEach(function (o) {
                        var p = new Object();
                        p.dia = o[0];
                        p.hora_inicio = o[1];
                        p.hora_fim = o[2];
                        p.professores = o[3];
                        n.horario.push(p);
                    });
                }
                n.vagas = m[5];
                i.turmas.push(n);
            });
            self.db[semestre][campus][i.codigo] = i;
//            self.db[semestre][campus].push(i);
        });
    }
    
}
Database.prototype.fetch = function(string, page) {
    string = string.toUpperCase().replace(/À/g, "A")
            .replace(/Á/g, "A").replace(/Â/g, "A").replace(/Ã/g, "A")
            .replace(/Ä/g, "A").replace(/Å/g, "A").replace(/Ç/g, "C")
            .replace(/È/g, "E").replace(/É/g, "E").replace(/Ê/g, "E")
            .replace(/Ë/g, "E").replace(/Ì/g, "I").replace(/Í/g, "I")
            .replace(/Î/g, "I").replace(/Ï/g, "I").replace(/Ð/g, "D")
            .replace(/Ñ/g, "N").replace(/Ò/g, "O").replace(/Ó/g, "O")
            .replace(/Ô/g, "O").replace(/Õ/g, "O").replace(/Ö/g, "O")
            .replace(/Ø/g, "O").replace(/Ù/g, "U").replace(/Ú/g, "U")
            .replace(/Û/g, "U").replace(/Ü/g, "U").replace(/Ý/g, "Y")
            .replace(/ß/g, "B");
    var search_whole = [];
    var search_part = [];
    string.split(" ").forEach(function(str) {
        if (str != "") {
            search_whole.push(new RegExp("\\b" + str + "\\b", "g"));
            search_part.push(new RegExp(str, "g"));
        }
    });
    this.result = [];
    for (var codigo in this.cur_db) {
        var haystack = this.cur_db[codigo];
        var exactly = false;
        var score = 0;
        for (var j = 0; j < search_whole.length; j++) {
            var expr_score = 0;
            search_whole[j].lastIndex = 0;
            if (search_whole[j].test(haystack.codigo)) {
                exactly = true;
                break;
            }
            expr_score += this.search_score(haystack.nome, search_whole[j], 100);
            expr_score += this.search_score(haystack.nome, search_part[j], 10);
            expr_score += this.search_score(haystack.codigo, search_part[j], 10);
            if (expr_score) {
                score += expr_score;
            } else {
                score = 0;
                break;
            }
        }
        if (exactly) {
            this.result = [haystack];
            break;
        }
        if (score) {
            haystack.score = score;
            this.result.push(haystack);
        }
    }
    this.result.sort(function(a,b) {
        return b.score - a.score;
    });
    this.result.forEach(function(t) {
        delete t.score;
    });
}
Database.prototype.page = function(page) {
    return this.result.slice(page*10, (page+1)*10);
}
Database.prototype.full = function(string) {
    return this.cur_db[string];
}
