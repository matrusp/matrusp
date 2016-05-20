/**
 * @constructor
 */
function Display(ui_logger, ui_horario)
{
    var self = this;
    var selected = null;

    function map_turma(turma, priv, func)
    {
        if (!turma.aulas)
            return;
        for (var i = 0; i < turma.aulas.length; i++) {
            var dia  = turma.aulas[i].dia;
            var hora_inicio = turma.aulas[i].hora_inicio;
            var hora_fim = turma.aulas[i].hora_fim;
            func(turma, priv, dia, hora_inicio, hora_fim);
        }
    }
    function over(c, turma)
    {
        if ((navigator.userAgent.toLowerCase().indexOf("msie") > -1) && !turma) /* FIXME something wrong with IE when selecting turmas */
            return;
        var materia = turma.materia;
        var current_turma = c && c["'" + materia.codigo + "'"] ? c["'" + materia.codigo + "'"].turma_representante : null;

        if (turma == selected)
            return;

        if (current_turma)
            map_turma(current_turma, null, function(turma, c, dia, hora_inicio, hora_fim) {
                ui_horario.clear_cell2(dia, hora_inicio, hora_fim);
            });

        map_turma(turma, c, function(turma, c, dia, hora_inicio, hora_fim) {
        	var sem_current_turma = null;
        	var aula_tmp = new Aula(dia, hora_inicio, hora_fim);
        	
        	if(c && c[dia]){
            	sem_current_turma = c[dia];
            	if (current_turma)
            	    sem_current_turma = sem_current_turma.diff(current_turma.aulas);
        	}
            
            if (sem_current_turma && aula_tmp.tem_conflito(sem_current_turma)) {
                //Garantimos que o conflito é entre matérias distintas
                ui_logger.set_quick_text("choque de horario", "lightcoral");
                ui_horario.display_cell2(dia, hora_inicio, hora_fim, Cell.red(materia.codigo));
            } else {
                ui_horario.display_cell2(dia, hora_inicio, hora_fim, Cell.black(materia.codigo));
            }
        });

        selected = turma;
    }
    function out(c, turma)
    {	
        if ((navigator.userAgent.toLowerCase().indexOf("msie") > -1) && !turma) /* FIXME something wrong with IE when selecting turmas */
            return;
        var materia = turma.materia;
        var current_turma = c && c["'" + materia.codigo + "'"] ? c["'" + materia.codigo + "'"].turma_representante : null;

		self.reset();
        if (!c)
            return;

        c.horarios_combo.forEach(function(horario){
            for (var k in horario.turmas) {
                if (horario.turmas[k].selected) {
                    var turma = horario.turmas[k];
                    break;
                }
            }
            if (!turma)
                var turma = horario.turma_representante;
            self.turma(c, turma);
        });

        ui_logger.unset_quick_text();

        selected = null;
    }
    
    function turma(c, turma) {
        map_turma(turma, c, function(turma, c, dia, hora_inicio, hora_fim) {
            ui_horario.display_cell2(dia, hora_inicio, hora_fim, Cell.normal(turma));
        });
    }

    /* procedures */
    self.reset = function() { ui_horario.reset(); selected = null; };
    self.out   = out;
    self.over  = over;
    self.turma = turma;
    /* functions */
    self.get_selected = function() { return selected; }
}
