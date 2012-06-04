/**
 * @constructor
 */
function State()
{
    var self = this;

    self.combinacoes = new Combinacoes();
    self.materias    = new Materias();
    self.campus      = "FLO";

    self.save = function() {
        var list = self.materias.list();
        var state_to_return = new Object();
        state_to_return.versao     = 4;
        state_to_return.materia_selected = self.materias.selected;
        state_to_return.campus           = self.campus;
        state_to_return.combinacao       = self.combinacoes.current();
        state_to_return.materias         = new Array();
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
            state_to_return.materias.push(state_materia);
        }
        return JSON.stringify(state_to_return);
    };

    self.carregar = function(state_to_load) {
        if (state_to_load.versao > 4)
            return -2;

        self.materias.reset();

        for (var i = 0; i < state_to_load.materias.length; i++) {
            var materia = self.materias.add_json(state_to_load.materias[i]);
            if (!materia)
                return -1;
            materia.codigo = materia.codigo.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
            materia.nome   = materia.nome.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
        }
        self.materias.selected = state_to_load.materia_selected;
        return 0;
    };
}
