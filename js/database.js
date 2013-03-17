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
Database.prototype.get_date = function(semestre) {
    return this.db[semestre]["DATA"];
}
Database.prototype.set_db = function(semestre, campus) {
    if (this.db[semestre] && this.db[semestre][campus])
        this.cur_db = this.db[semestre][campus];
    else
        return -1;
    return 0;
}
Database.prototype.add = function(semestre, array) {
    var self = this;
    self.db[semestre] = new Array();

    for (var campus in array) {
        var campus_array = array[campus];
        if (campus === "DATA") {
            self.db[semestre][campus] = campus_array;
            continue;
        }
        self.db[semestre][campus] = new Array();
        campus_array.forEach(function(k) {
            var i = new Object();
            i.codigo     = k[0];
            i.nome_ascii = k[1];
            i.nome       = k[2];
            i.turmas     = new Array();
            k[3].forEach(function(m) {
                var n = new Object();
                n.nome              = m[0];
                n.horas_aula        = m[1];
                n.vagas_ofertadas   = m[2];
                n.vagas_ocupadas    = m[3];
                n.alunos_especiais  = m[4];
                n.saldo_vagas       = m[5];
                n.pedidos_sem_vaga  = m[6];
                n.horarios          = m[7];
                n.professores       = m[8];
                i.turmas.push(n);
            });
            self.db[semestre][campus][i.codigo] = i;
            self.db[semestre][campus].push(i);
        });
    }
}
Database.prototype.fetch = function(string, page) {
    string = string.toUpperCase()
            .replace(/[ÀÁÂÃÄÅ]/g, "A")
            .replace(/[ÈÉÊË]/g, "E")
            .replace(/[ÌÍÎÏ]/g, "I")
            .replace(/[ÒÓÔÕÖØ]/g, "O")
            .replace(/[ÙÚÛÜ]/g, "U")
            .replace(/Ç/g, "C")
            .replace(/Ð/g, "D")
            .replace(/Ñ/g, "N")
            .replace(/Ý/g, "Y")
            .replace(/ß/g, "B");
    var search_whole = [];
    var search_part = [];
    var needles = string.split(" ");
    needles.forEach(function(str) {
        if (str != "") {
            search_whole.push(new RegExp("\\b" + str + "\\b", "g"));
            search_part.push(new RegExp(str, "g"));
        }
    });
    this.result = [];
    this.result.forEach(function(t) {
        delete t.score;
    });
    for (var i = 0; i < this.cur_db.length; i++) {
        var haystack = this.cur_db[i];
        var firstword = haystack.nome_ascii.split(" ")[0];
        var exactly = false;
        var score = 0;
        for (var j = 0; j < search_whole.length; j++) {
            var expr_score = 0;
            search_whole[j].lastIndex = 0;
            if (search_whole[j].test(haystack.codigo)) {
                exactly = true;
                continue;
            }
            if (firstword == needles[j])
                expr_score += 200;
            expr_score += this.search_score(haystack.nome_ascii, search_whole[j], 100);
            expr_score += this.search_score(haystack.nome_ascii, search_part[j], 10);
            expr_score += this.search_score(haystack.codigo, search_part[j], 1);
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
        var diff = b.score - a.score;
        if (!diff) {
            if (a.score < 10 && b.score < 10) {
                if      (b.codigo < a.codigo)
                    diff =  1;
                else if (a.codigo < b.codigo)
                    diff = -1;
            } else {
                if      (b.nome_ascii < a.nome_ascii)
                    diff =  1;
                else if (a.nome_ascii < b.nome_ascii)
                    diff = -1;
            }
        }
        return diff;
    });
}
Database.prototype.page = function(page) {
    return this.result.slice(page*10, (page+1)*10);
}
Database.prototype.full = function(string) {
    return this.cur_db[string];
}
