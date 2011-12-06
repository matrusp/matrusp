function Materias()
{
    var self = this;
    var selected = null;

    var materias;
    var list;
    function reset() {
        materias = new Object();
        list = new Array();
    }
    reset();

    var horas = new Object();
    horas["0730"] =  0; horas[ 0] = "0730";
    horas["0820"] =  1; horas[ 1] = "0820";
    horas["0910"] =  2; horas[ 2] = "0910";
    horas["1010"] =  3; horas[ 3] = "1010";
    horas["1100"] =  4; horas[ 4] = "1100";
    horas["1330"] =  5; horas[ 5] = "1330";
    horas["1420"] =  6; horas[ 6] = "1420";
    horas["1510"] =  7; horas[ 7] = "1510";
    horas["1620"] =  8; horas[ 8] = "1620";
    horas["1710"] =  9; horas[ 9] = "1710";
    horas["1830"] = 10; horas[10] = "1830";
    horas["1920"] = 11; horas[11] = "1920";
    horas["2020"] = 12; horas[12] = "2020";
    horas["2110"] = 13; horas[13] = "2110";

    var get_color = (function(){
        var cores = [ "lightblue", "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgreen",
                      "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightsteelblue",
                      "lightyellow" ];
        var counter = 0;
        return (function(){
            var ret = cores[counter++];
            if (counter >= cores.length)
                counter = 0;
            return ret;
        });
    })();
    function criar_aulas(str, nome, editavel)
    {
        var ret = new Array();
        if (editavel) {
            ret.nome = nome;
            ret.index = function() { return this.nome; };
        } else {
            ret.index = function() {
                var r = "";
                for (var i = 0; i < this.length; i++) {
                    r += (this[i].dia+2) + "." + horas[this[i].hora] + "-1";
                }
                return r;
            };
        }
        if (str != "") {
            var split = str.replace(/ \/ \S*/ig, "").split(" ");
            var i2 = 0;
            for (var i = 0; i < split.length; i++) {
                var dia  = parseInt(split[i].slice(0,1)) - 2;
                var hora = horas[split[i].slice(2,6)];
                var n    = parseInt(split[i].slice(7));
                for (var j = 0; j < n; j++) {
                    var aula = new Object();
                    aula.dia = dia;
                    aula.hora = hora+j;
                    ret.push(aula);
                }
            }
            for (var i = 0; i < ret.length-1; i++) {
                for (var j = i+1; j < ret.length; j++) {
                    if ((ret[j].dia < ret[i].dia) || ((ret[j].dia == ret[i].dia) && (ret[j].hora < ret[i].hora))) {
                        var tmp = ret[i];
                        ret[i] = ret[j];
                        ret[j] = tmp;
                    }
                }
            }
        }
        return ret;
    }
    function new_item(codigo, nome) {
        if (materias[codigo])
            return null;
        var materia = new Object();
        materia.codigo = codigo;
        materia.nome   = nome;
        materia.cor    = get_color();
        materia.turmas = new Array();
        materia.horarios = new Object();
        materia.selected = 1;
        materia.editavel = 1;
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
    function new_turma(materia, nome, aulas, professor) {
        if (nome == null) {
            aulas = new Array();
            do {
                nome = new_turma_name();
            } while (materia.turmas[nome]);
            aulas.nome = nome;
            aulas.index = function() { return this.nome; };
        }
        var turma = new Object();
        var index = aulas.index();
        turma.nome      = nome;
        turma.aulas     = aulas;
        turma.professor = professor;
        turma.selected  = 1;
        turma.materia   = materia;
        materia.turmas[turma.nome] = turma;
        if (!materia.horarios[index]) {
            materia.horarios[index] = new Object();
            materia.horarios[index].turmas = new Object();
            materia.horarios[index].turma_representante = turma;
            materia.horarios[index].materia = materia;
            materia.horarios[index].aulas = turma.aulas;
        }
        materia.horarios[index].turmas[turma.nome] = turma;
        materia.selected = 1;
        turma.horario = materia.horarios[index];
        return materia.horarios[index];
    }
    function remove_turma(materia, turma) {
        for (var i in materia.horarios) {
            var horario = materia.horarios[i];
            if (horario.turma_representante == turma) {
                for (var j in horario.turmas)
                    delete horario.turmas[j];
                delete materia.horarios[i];
                break;
            }
        }
        delete materia.turmas[turma.nome];
    }
    function add_item(codigo, str, editavel)
    {
        var array = str.split("\n"); /* uma turma por item */
        var split = array[0].split("\t");

        if (materias[codigo])
            return null;

        /* parte de dados */
        var materia = new Object();
        materia.codigo = codigo;
        materia.nome   = split[1];
        materia.cor    = get_color();

        materia.horarios = new Object();
        materia.turmas = new Array();
        for (var i = 1; i < array.length - 1; i++) {
            var split = array[i].split("\t");
            new_turma(materia, split[0], criar_aulas(split[3], split[0], editavel), split[4]);
        }
        materia.selected = 1;
        materia.editavel = 0;
        materias[materia.codigo] = materia;
        list.push(materia);

        return materia;
    }
    function remove_item(materia) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] == materia) {
                list.splice(i,1);
                break;
            }
        }
        delete materias[materia.codigo];
    }

    /* procedures */
    self.reset = reset;
    self.set_selected = function(materia) { selected = materia; };
    self.add_item = add_item;
    self.new_item = new_item;
    self.remove_item = remove_item;
    self.new_turma = new_turma;
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
    self.aulas_string = function(dia, hora) { return (dia+2) + "." + horas[hora] + "-1 / CTC"; };
    self.get = function(codigo) { return materias[codigo]; };
    self.get_selected = function() { return selected; };
    self.list = function() { return list; };
}
