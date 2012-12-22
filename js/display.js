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
            var hora = turma.aulas[i].hora;
            func(priv, dia, hora);
        }
    }
    function over(c, turma)
    {
        if ((navigator.userAgent.toLowerCase().indexOf("msie") > -1) && !turma) /* FIXME something wrong with IE when selecting turmas */
            return;
        var materia = turma.materia;
        var current_turma = c && c[materia.codigo] ? c[materia.codigo].turma_representante : null;

        if (turma == selected)
            return;

        if (current_turma)
            map_turma(current_turma, null, function(priv, dia, hora) {
                ui_horario.clear_cell(dia, hora);
            });

        map_turma(turma, c, function(c, dia, hora) {
            if (c && c[dia][hora] && c[dia][hora].horario.materia != materia) {
                ui_logger.set_quick_text("choque de horario", "lightcoral");
                ui_horario.display_cell(dia, hora, Cell.red(materia.codigo));
            } else {
                ui_horario.display_cell(dia, hora, Cell.black(materia.codigo));
            }
        });

        selected = turma;
    }
    function out(c, turma)
    {
        if ((navigator.userAgent.toLowerCase().indexOf("msie") > -1) && !turma) /* FIXME something wrong with IE when selecting turmas */
            return;
        var materia = turma.materia;
        var current_turma = c && c[materia.codigo] ? c[materia.codigo].turma_representante : null;

        if (!c) {
            selected = "";
            ui_horario.reset();
            return;
        }

        if (turma != current_turma)
            map_turma(turma, c, function(c, dia, hora) {
                if (c[dia][hora] && c[dia][hora].horario)
                    ui_horario.display_cell(dia, hora, Cell.normal(c[dia][hora]));
                else
                    ui_horario.clear_cell(dia, hora);
            });

        if (current_turma)
            map_turma(current_turma, c, function(c, dia, hora) {
                ui_horario.display_cell(dia, hora, Cell.normal(c[dia][hora]));
            });

        ui_logger.unset_quick_text();

        selected = null;
    }
    function turma(c, turma) {
        map_turma(turma, c, function(c, dia, hora) {
            ui_horario.display_cell(dia, hora, Cell.normal(c[dia][hora]));
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
