function Turmas(ui_logger, ui_horario, combinacoes)
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
            var n    = turma.aulas[i].n;
            for (var j = 0; j < n; j++) {
                func(priv, dia, hora+j);
            }
        }
    }
    function display_over(turma)
    {
        if ((navigator.userAgent.toLowerCase().indexOf("msie") > -1) && !turma) /* FIXME something wrong with IE when selecting turmas */
            return;
        var c       = combinacoes.get_current();
        var overlay = combinacoes.get_overlay();
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
                ui_logger.set_text("choque de horario", "lightcoral");
                ui_horario.display_cell(dia, hora, red_cell(materia.codigo));
            } else {
                ui_horario.display_cell(dia, hora, black_cell(materia.codigo));
            }
        });

        selected = turma;
    }
    function normal_cell(d)  { return {strong:d.fixed,text:d.horario.materia.codigo,bgcolor:d.horario.materia.cor,color:"black"}; }
    function red_cell(str)   { return {strong:true,text:str,bgcolor:"red",color:"black"}; }
    function black_cell(str) { return {strong:false,text:str,bgcolor:"black",color:"white"}; }
    function undisplay_over(turma)
    {
        if ((navigator.userAgent.toLowerCase().indexOf("msie") > -1) && !turma) /* FIXME something wrong with IE when selecting turmas */
            return;
        var c       = combinacoes.get_current();
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
                    ui_horario.display_cell(dia, hora, normal_cell(c[dia][hora]));
                else
                    ui_horario.clear_cell(dia, hora);
            });

        if (current_turma)
            map_turma(current_turma, c, function(c, dia, hora) {
                ui_horario.display_cell(dia, hora, normal_cell(c[dia][hora]));
            });

        ui_logger.reset();

        selected = null;
    }
    function display(turma, c) {
        map_turma(turma, c, function(c, dia, hora) {
            ui_horario.display_cell(dia, hora, normal_cell(c[dia][hora]));
        });
    }

    /* procedures */
    self.reset = function() { ui_horario.reset(); selected = null; };
    self.set_selected = function(materia) { selected = materia; }
    self.undisplay_over = undisplay_over;
    self.display_over = display_over;
    self.display = display;
    /* functions */
    self.get_selected = function() { return selected; }
}
