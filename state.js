/**
 * @constructor
 */
function Plano(n)
{
    var self = this;

    self.index = n;
    self.nome = "Plano " + (n + 1);
    self.cleanup();
}
Plano.prototype.cleanup = function() {
    this.combinacoes = new Combinacoes();
    this.materias    = new Materias();
}

/**
 * @constructor
 */
function State()
{
    var self = this;

    self.reset = function() {
        self.planos = [];
        self.planos.push(new Plano(0));
        self.planos.push(new Plano(1));
        self.planos.push(new Plano(2));
        self.planos.push(new Plano(3));
        self.index  = 0;
        self.plano  = self.planos[self.index];
        self.campus = "FLO";
        self.semestre = "20122";
    }
    self.reset();

    self.copy_plano = function(plano) {
        var state_plano = new Object();
        var list = plano.materias.list();
        state_plano.combinacao = plano.combinacoes.current();
        state_plano.materias   = new Array();
        state_plano.materia    = plano.materias.selected
        for (var i = 0; i < list.length; i++) {
            var state_materia = new Object();
            var materia = list[i];
            state_materia.codigo   = materia.codigo.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/&/g,"&amp;");
            state_materia.nome     = materia.nome.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/&/g,"&amp;");
            state_materia.cor      = materia.cor;
            state_materia.turmas   = new Array();
            for (var j = 0; j < materia.turmas.length; j++) {
                var state_turma = new Object();
                var turma = materia.turmas[j];
                state_turma.nome             = turma.nome;
                state_turma.horas_aula       = turma.horas_aula;
                state_turma.vagas_ofertadas  = turma.vagas_ofertadas;
                state_turma.vagas_ocupadas   = turma.vagas_ocupadas;
                state_turma.alunos_especiais = turma.alunos_especiais;
                state_turma.saldo_vagas      = turma.saldo_vagas;
                state_turma.pedidos_sem_vaga = turma.pedidos_sem_vaga;
                state_turma.professores      = new Array();
                for (var k = 0; k < turma.professores.length; k++)
                    state_turma.professores.push(turma.professores[k]);
                state_turma.horarios         = new Array();
                for (var k = 0; k < turma.aulas.length; k++)
                    state_turma.horarios.push(turma.aulas[k].toString());
                state_turma.selected         = turma.selected;
                state_materia.turmas.push(state_turma);
            }
            state_materia.agrupar  = materia.agrupar;
            state_materia.selected = materia.selected;
            state_plano.materias.push(state_materia);
        }
        return state_plano;
    }

    self.save = function() {
        var state_to_return = new Object();
        state_to_return.versao = 4;
        state_to_return.campus = self.campus;
        state_to_return.semestre = self.semestre;
        state_to_return.planos = new Array();
        state_to_return.plano  = self.index;
        for (var p = 0; p < self.planos.length; p++) {
            var state_plano = self.copy_plano(self.planos[p]);
            state_to_return.planos.push(state_plano);
        }
        return JSON.stringify(state_to_return);
    };

    self.new_plano = function(plano_to_load, n) {
        var plano = new Plano(n);
        plano.materias.selected = plano_to_load.materia;
        plano.combinacao        = plano_to_load.combinacao;
        for (var i = 0; i < plano_to_load.materias.length; i++) {
            var materia = plano.materias.add_json(plano_to_load.materias[i]);
            if (!materia)
                return -1;
            materia.codigo = materia.codigo.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
            materia.nome   = materia.nome.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
        }
        return plano;
    };

    self.load = function(state_to_load) {
        if (state_to_load.versao > 4)
            return -2;

        self.campus = state_to_load.campus;
        self.semestre = state_to_load.semestre;
        self.planos = [];

        for (var p = 0; p < state_to_load.planos.length; p++) {
            var plano = self.new_plano(state_to_load.planos[p], p);
            if (plano == -1)
                return -1;
            self.planos.push(plano);
        }
        if (!self.planos[0])
            self.planos[0] = new Plano(1);
        var plano_to_load = state_to_load.plano;
        if (plano_to_load < 0 || plano_to_load > self.planos.length || !plano_to_load)
            plano_to_load = 0;
        self.index = plano_to_load;
        self.plano = self.planos[plano_to_load];
        return 0;
    };

    self.set_plano = function(plano) {
        var i = 0;
        if (plano)
            for (; i < self.planos.length; i++)
                if (self.planos[i] == plano)
                    break;
        self.index = i;
        self.plano = self.planos[self.index];
    };
}
