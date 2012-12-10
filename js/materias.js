var Horas = {
    "0730": 0,  0:"0730",
    "0820": 1,  1:"0820",
    "0910": 2,  2:"0910",
    "1010": 3,  3:"1010",
    "1100": 4,  4:"1100",
    "1330": 5,  5:"1330",
    "1420": 6,  6:"1420",
    "1510": 7,  7:"1510",
    "1620": 8,  8:"1620",
    "1710": 9,  9:"1710",
    "1830":10, 10:"1830",
    "1920":11, 11:"1920",
    "2020":12, 12:"2020",
    "2110":13, 13:"2110"
};

/**
 * @constructor
 */
function Aula(dia, hora, sala) {
    this.dia  = dia;
    this.hora = hora;
    this.sala = sala;
}
Aula.prototype.toString = function() {
    return (this.dia+2) + "." + Horas[this.hora] + "-1 / " + this.sala;
}

/**
 * @constructor
 */
function Turma(turma) {
    if (!turma) {
        this.horas_aula       = "0";
        this.vagas_ofertadas  = "0";
        this.vagas_ocupadas   = "0";
        this.alunos_especiais = "0";
        this.saldo_vagas      = "0";
        this.pedidos_sem_vaga = "0";
        this.professores      = new Array();
        this.aulas            = new Array();
        this.selected         = 1;
        return;
    }

    var self = this;

    turma = JSON.parse(JSON.stringify(turma));

    if (turma.selected == null)
        turma.selected = 1;
    this.nome             = turma.nome;
    this.selected         = turma.selected;
    this.horas_aula       = turma.horas_aula;
    this.vagas_ofertadas  = turma.vagas_ofertadas;
    this.vagas_ocupadas   = turma.vagas_ocupadas;
    this.alunos_especiais = turma.alunos_especiais;
    this.saldo_vagas      = turma.saldo_vagas;
    this.pedidos_sem_vaga = turma.pedidos_sem_vaga;
    this.professores      = turma.professores;
    this.aulas            = new Array();

    turma.horarios.forEach(function(horario){
        var dia  = parseInt(horario.slice(0,1)) - 2;
        var hora = Horas[horario.slice(2,6)];
        var n    = parseInt(horario.slice(7));
        var sala = horario.slice(11,21);
        for (var j = 0; j < n; j++)
            self.aulas.push(new Aula(dia, hora+j, sala));
    });
    self.order_aulas();
}
Turma.prototype.order_aulas = function() {
    var self = this;
    var aulas = self.aulas;
    for (var i = 0; i < aulas.length-1; i++) {
        for (var j = i+1; j < aulas.length; j++) {
            if ((aulas[j].dia < aulas[i].dia) || ((aulas[j].dia == aulas[i].dia) && (aulas[j].hora < aulas[i].hora))) {
                var tmp  = aulas[i];
                aulas[i] = aulas[j];
                aulas[j] = tmp;
            }
        }
    }
}
Turma.prototype.index = function(agrupar) {
    var index = this.nome;
    if (agrupar) {
        var index = "";
        for (var i = 0; i < this.aulas.length; i++)
            index += (this.aulas[i].dia+2) + "." + Horas[this.aulas[i].hora];
    }
    return index;
}

/**
 * @constructor
 */
function Materia(materia) {
    if (!materia) {
        this.turmas = new Array();
        this.horarios = new Object();
        this.agrupar  = 1;
        this.selected = 1;
        return;
    }

    var self = this;

    materia = JSON.parse(JSON.stringify(materia));

    if (materia.selected == null)
        materia.selected = 1;
    if (materia.agrupar  == null)
        materia.agrupar  = 1;

    this.agrupar  = materia.agrupar;
    this.codigo   = materia.codigo;
    this.cor      = materia.cor;
    this.nome     = materia.nome;
    this.selected = materia.selected;
    this.turmas   = new Array();

    materia.turmas.forEach(function(turma){
        turma = new Turma(turma);
        turma.materia = self;
        self.turmas.push(turma);
    });
}
Materia.prototype.fix_horarios = function() {
    this.horarios = new Object();
    for (var k = 0; k < this.turmas.length; k++) {
        var turma = this.turmas[k];
        var index = turma.index(this.agrupar);
        if (!this.horarios[index]) {
            this.horarios[index] = new Object();
            this.horarios[index].turmas = new Object();
            this.horarios[index].turma_representante = turma;
            this.horarios[index].materia = this;
            this.horarios[index].aulas = turma.aulas;
        }
        this.horarios[index].turmas[turma.nome] = turma;
        turma.horario = this.horarios[index];
    }
}

/**
 * @constructor
 */
function Materias()
{
    var self = this;
    self.selected = "";

    var materias = new Object();
    var list = new Array();

    var cores = [ {cor:"lightblue",taken:0},
                  {cor:"lightcoral",taken:0},
                  {cor:"lightcyan",taken:0},
                  {cor:"lightgoldenrodyellow",taken:0},
                  {cor:"lightgreen",taken:0},
                  {cor:"lightpink",taken:0},
                  {cor:"lightsalmon",taken:0},
                  {cor:"lightseagreen",taken:0},
                  {cor:"lightskyblue",taken:0},
                  {cor:"lightslategray",taken:0},
                  {cor:"lightsteelblue",taken:0},
                  {cor:"lightyellow",taken:0},
                  {cor:"lightblue",taken:0} ];
    function color_taken(cor) {
        for (var i = 0; i < cores.length; i++)
            if (cores[i].cor == cor) {
                cores[i].taken++;
                break;
            }
    }
    function color_available(cor) {
        for (var i = 0; i < cores.length; i++)
            if (cores[i].cor == cor) {
                cores[i].taken--;
                break;
            }
    }
    function get_color(taken) {
        if (taken == null)
            taken = 0;
        for (var i = 0; i < cores.length; i++) {
            if (cores[i].taken == taken) {
                cores[i].taken++;
                return cores[i].cor;
            }
        }
        return get_color(taken+1);
    };

    function new_item(codigo, nome, campus, semestre) {
        if (materias[codigo])
            return null;
        var materia = new Materia();
        materia.campus = campus;
        materia.semestre = semestre;
        materia.codigo = codigo;
        materia.nome   = nome;
        materia.cor    = get_color();
        materias[materia.codigo] = materia;
        list.push(materia);
        return materia;
    }
    var n_turmas = 1;
    function new_turma_name() {
        var nome = new String();
        if (n_turmas < 1000)
            nome += "0";
        if (n_turmas <  100)
            nome += "0";
        if (n_turmas <   10)
            nome += "0";
        nome += n_turmas;
        n_turmas++;
        return nome;
    };
    function update_add_turma(materia, turma) {
        turma.materia = materia;
        materia.turmas.push(turma);
        materia.fix_horarios();
    }
    function new_turma(materia) {
        var nok = true;
        do {
            var nome = new_turma_name();
            for (var k = 0; k < materia.turmas.length; k++)
                if (materia.turmas[k].nome == nome)
                    break;
            if (k == materia.turmas.length)
                nok = false;
        } while (nok);

        var turma = new Turma();
        turma.nome             = nome;
        turma.materia          = materia;
        materia.turmas.push(turma);
        materia.fix_horarios();
        materia.selected = 1;
    }
    function remove_turma(materia, turma) {
        var turmas = turma.horario.turmas;
        for (var j in turmas)
            for (var i = 0; i < materia.turmas.length; i++)
                if (materia.turmas[i] == turmas[j]) {
                    materia.turmas.splice(i,1);
                    break;
                }
        materia.fix_horarios();
    }
    function add_json(materia, campus, semestre)
    {
        if (materias[materia.codigo])
            return null;

        materia = new Materia(materia);
        if (materia.cor      == null)
            materia.cor      = get_color();
        else
            color_taken(materia.cor);
        if (!materia.campus)
            materia.campus   = campus;
        if (!materia.semestre)
            materia.semestre = semestre;
        materia.fix_horarios();

        materias[materia.codigo] = materia;
        list.push(materia);

        return materia;
    }
    function changed(materia, attr, str) {
        if (attr == "nome") {
            materia.nome = str;
        } else if (attr == "codigo") {
            var tmp = materias[materia.codigo];
            delete materias[materia.codigo];
            materias[str] = materia;
            materia.codigo = str;
        }
    }
    function remove_item(materia) {
        color_available(materia.cor);
        for (var i = 0; i < list.length; i++) {
            if (list[i] == materia) {
                list.splice(i,1);
                break;
            }
        }
        delete materias[materia.codigo];
    }

    /* procedures */
    self.add_json = add_json;
    self.new_item = new_item;
    self.changed = changed;
    self.remove_item = remove_item;
    self.new_turma = new_turma;
    self.update_add_turma = update_add_turma;
    self.remove_turma = remove_turma;
    /* functions */
    self.get_nome = function(nome) {
        for (var i in materias) {
            var materia = materias[i];
            if (materia.nome == nome)
                return materia;
        }
        return null;
    };
    self.get = function(codigo) { return materias[codigo]; };
    self.list = function() { return list; };
}
