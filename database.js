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
Database.prototype.set_db = function(campus, semestre) {
    if (!campus)
        campus = "FLO";
    if (!semestre)
        semestre = "20122";
    if (this.db[campus])
        this.cur_db = this.db[campus][semestre];
    else {
        this.cur_db = null;
        this.campus = campus;
        this.semestre = semestre;
    }
}
Database.prototype.add = function(campus, semestre, array) {
    var self = this;
    if (!this.db[campus])
        this.db[campus] = new Array();
    this.db[campus][semestre] = new Array();
    array.forEach(function(k) {
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
        self.db[campus][semestre][i.codigo] = i;
        self.db[campus][semestre].push(i);
    });
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
    if (!this.cur_db)
        this.set_db(this.campus, this.semestre);
    for (var i = 0; i < this.cur_db.length; i++) {
        var haystack = this.cur_db[i];
        var exactly = false;
        var score = 0;
        for (var j = 0; j < search_whole.length; j++) {
            var expr_score = 0;
            search_whole[j].lastIndex = 0;
            if (search_whole[j].test(haystack.codigo)) {
                exactly = true;
                break;
            }
            expr_score += this.search_score(haystack.nome_ascii, search_whole[j], 100);
            expr_score += this.search_score(haystack.nome_ascii, search_part[j], 10);
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
    if (!this.cur_db)
        this.set_db(this.campus, this.semestre);
    return this.cur_db[string];
}
