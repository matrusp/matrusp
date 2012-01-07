/**
 * @constructor
 */
function Database() {
    this.db = new Object();
}
Database.prototype.set_campus = function(campus) {
    this.cur_db = this.db[campus];
}
Database.prototype.add = function(campus, array) {
    var self = this;
    this.db[campus] = new Array();
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
        self.db[campus][i.codigo] = i;
        self.db[campus].push(i);
    });
    this.set_campus(campus);
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
    var search_exp = new RegExp(string, "g");
    this.result = this.cur_db.filter(function(materia) {
        var r = false;
        search_exp.lastIndex = 0;
        r |= search_exp.test(materia.codigo);
        search_exp.lastIndex = 0;
        r |= search_exp.test(materia.nome_ascii);
        return r;
        });
}
Database.prototype.page = function(page) {
    return this.result.slice(page*10, (page+1)*10);
}
Database.prototype.full = function(string) {
    return this.cur_db[string];
}
