/**
 * @constructor
 */
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
    function criar_aulas(turma, str)
    {
        var dia  = parseInt(str.slice(0,1)) - 2;
        var hora = horas[str.slice(2,6)];
        var n    = parseInt(str.slice(7));
        for (var j = 0; j < n; j++) {
            var aula = new Object();
            aula.dia = dia;
            aula.hora = hora+j;
            turma.aulas.push(aula);
        }
    }
    function order_aulas(turma)
    {
        var aulas = turma.aulas;
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
    function new_item(codigo, nome) {
        if (materias[codigo])
            return null;
        var materia = new Object();
        materia.codigo = codigo;
        materia.nome   = nome;
        materia.cor    = get_color();
        materia.turmas = new Array();
        materia.horarios = new Object();
        materia.agrupar  = 1;
        materia.selected = 1;
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
    function fix_horarios(materia) {
        materia.horarios = new Object();
        for (var k = 0; k < materia.turmas.length; k++) {
            var turma = materia.turmas[k];
            var index = turma.nome;
            if (materia.agrupar) {
                var index = "";
                for (var i = 0; i < turma.aulas.length; i++)
                    index += (turma.aulas[i].dia+2) + "." + horas[turma.aulas[i].hora];
            }
            if (!materia.horarios[index]) {
                materia.horarios[index] = new Object();
                materia.horarios[index].turmas = new Object();
                materia.horarios[index].turma_representante = turma;
                materia.horarios[index].materia = materia;
                materia.horarios[index].aulas = turma.aulas;
            }
            materia.horarios[index].turmas[turma.nome] = turma;
            turma.horario = materia.horarios[index];
        }
    }
    function new_turma(materia) {
        do {
            var nome = new_turma_name();
        } while (materia.turmas[nome]);

        var turma = new Object();
        turma.nome             = nome;
        turma.horas_aula       = "0";
        turma.vagas_ofertadas  = "0";
        turma.vagas_ocupadas   = "0";
        turma.alunos_especiais = "0";
        turma.saldo_vagas      = "0";
        turma.pedidos_sem_vaga = "0";
        turma.professores      = new Array();
        turma.aulas            = new Array();
        turma.selected         = 1;
        turma.materia          = materia;
        materia.turmas.push(turma);
        fix_horarios(materia);
        materia.selected = 1;
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
        for (var i = 0; i < materia.turmas.length; i++) {
            if (materia.turmas[i] == turma) {
                materia.turmas.splice(i,1);
                break;
            }
        }
    }
    function add_json(materia)
    {
        if (materias[materia.codigo])
            return null;

        if (materia.selected == null)
            materia.selected = 1;
        if (materia.agrupar  == null)
            materia.agrupar  = 1;
        if (materia.cor      == null)
            materia.cor      = get_color();
        else
            color_taken(materia.cor);
        for (var i = 0; i < materia.turmas.length; i++) {
            var turma = materia.turmas[i];
            turma.aulas = new Array();
            for (var j = 0; j < turma.horarios.length; j++) {
                var horario = turma.horarios[j];
                criar_aulas(turma, horario);
            }
            order_aulas(turma);
            if (turma.selected == null)
                turma.selected = 1;
            turma.materia   = materia;
        }
        fix_horarios(materia);

        materias[materia.codigo] = materia;
        list.push(materia);

        return materia;
    }
    function add_xml(codigo, xml)
    {
        if (materias[codigo])
            return null;

        return add_json(xml_to_materia(xml));
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
    self.reset = reset;
    self.set_selected = function(materia) { selected = materia; };
    self.add_json = add_json;
    self.add_xml = add_xml;
    self.new_item = new_item;
    self.remove_item = remove_item;
    self.new_turma = new_turma;
    self.remove_turma = remove_turma;
    self.fix_horarios = fix_horarios;
    /* functions */
    self.get_nome = function(nome) {
        for (var i in materias) {
            var materia = materias[i];
            if (materia.nome == nome)
                return materia;
        }
        return null;
    };
    self.aulas_string = function(aula) { return (aula.dia+2) + "." + horas[aula.hora] + "-1 / CTC"; };
    self.get = function(codigo) { return materias[codigo]; };
    self.get_selected = function() { return selected; };
    self.list = function() { return list; };
}
