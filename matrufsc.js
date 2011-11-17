function Main(ui_materias, ui_turmas, ui_logger, ui_combinacoes, ui_horario, materias, turmas, combinacoes)
{
    var self = this;

    function display_combinacao(cc)
    {
        var m = materias.list();
        for (var i = 0; i < m.length; i++) {
            var materia = m[i];
            if (materia.selected == -1) {
                materia.ui_turma.innerHTML = "<strike>XXXXXX</strike>";
                materia.ui_selected.checked = false;
                materia.ui_selected.disabled = "disabled";
            } else if (materia.selected == 0) {
                materia.ui_turma.innerHTML = "<strike>XXXXXX</strike>";
                materia.ui_selected.checked = false;
                materia.ui_selected.disabled = "";
            }
        }

        turmas.reset();
        var c = combinacoes.get(cc);
        if (!c) {
            cc = 0;
        } else {
            for (var i in c.horarios_combo) {
                var turma = c.horarios_combo[i].turma_representante;
                turma.materia.ui_turma.innerHTML = turma.turma;
                turma.materia.ui_selected.checked = true;
                turma.materia.ui_selected.disabled = "";
                turmas.display(turma, c);
            }
        }
        combinacoes.set_current(cc);
        ui_combinacoes.set_current(cc);
        ui_combinacoes.set_total(combinacoes.length());
    }

    function new_item(codigo, nome) {
        if (materias.get_nome(nome)) {
            add_item2(null, nome);
            return;
        }
        var materia = materias.new_item(codigo, nome);
        add_item2(materia, nome);
    };
    function add_item(codigo, str) {
        var materia = materias.add_item(codigo, str);
        add_item2(materia, codigo);
    };
    function add_item2(materia, codigo) {
        if (!materia) {
            ui_logger.set_text("'" + codigo + "' ja foi adicionada", "lightcoral");
            return;
        }
        ui_materias.add_item(materia);
        ui_turmas.create(materia);
        materias.set_selected(materia);
        ui_logger.set_text("'" + codigo + "' adicionada", "lightgreen");
        update_all();
    }
    function previous() {
        if (!combinacoes.length())
            return;
        var c = combinacoes.current() - 1;
        if (c < 1)
            c = combinacoes.length();
        display_combinacao(c);
    };
    function next() {
        if (!combinacoes.length())
            return;
        var c = combinacoes.current() + 1;
        if (c > combinacoes.length())
            c = 1;
        display_combinacao(c);
    };

    function salvar() {
        var list = materias.list();
        var n = list.length();
        var ret = "";
        for (var i = 0; i < n; i++) {
            var materia = list[i];
            ret += "'" + materia.codigo + "'{"
            for (var j in materia.turmas) {
                var turma = materia.turmas[j];
                if (turma.selected) {
                    ret += turma.turma + ",";
                }
            }
            ret += "}";
        }
        return ret;
    }

    /* self */
    self.new_item = new_item;
    self.add_item = add_item;
    self.previous = previous;
    self.next = next;
    self.salvar = salvar;

    /* UI_combinacoes */
    ui_combinacoes.cb_update   = function() { update_all(); };
    ui_combinacoes.cb_previous = self.previous;
    ui_combinacoes.cb_next     = self.next;
    ui_combinacoes.cb_changed  = function(val) {
        if (!combinacoes.length())
            return;
        var int = parseInt(val);
        if (int.toString() == val && val >= 1 && val <= combinacoes.length()) {
            ui_logger.reset();
            display_combinacao(val);
        } else {
            ui_logger.set_text("Combina\u00e7\u00e3o inv\u00e1lida", "lightcoral");
        }
    };
    /* UI_materias */
    ui_materias.cb_select      = function(codigo, checked) {
        var materia = materias.get(codigo);
        materia.selected = checked;
        update_all();
    };
    ui_materias.cb_onremove    = function(materia) {
        var selected = materias.get_selected();
        if (selected && selected.codigo == materia.codigo)
            ui_turmas.reset();
        ui_logger.set_text("'" + materia.codigo + "' removida", "lightgreen");
        materia.row.parentNode.removeChild(materia.row);
        materias.remove_item(materia);
        update_all();
    };
    ui_materias.cb_onclick     = function(materia) {
        ui_turmas.create(materia);
        materias.set_selected(materia);
    }
    /* UI_turmas */
    var n_turmas = 1;
    ui_turmas.cb_new_turma   = function() {
        var nome = new String();
        if (n_turmas < 1000)
            nome += "0";
        if (n_turmas <  100)
            nome += "0";
        if (n_turmas <   10)
            nome += "0";
        nome += n_turmas;
        n_turmas++;
        var materia = materias.get_selected();
        var aulas = new Array();
        aulas.nome = nome;
        aulas.index = function() { return this.nome; };
        var turma = materias.new_turma(materia, nome, aulas, null);
        ui_turmas.new_turma(turma);
        update_all();
    };
    function update_all() {
        if (editando) {
            var overlay = combinacoes.get_overlay();
            var aulas = new Array();
            aulas.nome  = editando.turma;
            aulas.index = function() { return this.nome; };
            for (var i = 0; i < editando.aulas.length; i++) {
                var aula = editando.aulas[i];
                var dia  = aula.dia;
                var hora = aula.hora;
                if (overlay[dia][hora]) {
                    overlay[dia][hora] = null;
                } else {
                    aulas.push(aula);
                }
            }
            for (dia = 0; dia < 6; dia++)
                for (hora = 0; hora < 14; hora++)
                    if (overlay[dia][hora]) {
                        var aula = {dia:dia,hora:hora,n:1};
                        aulas.push(aula);
                    }
            editando.aulas = aulas;
            editando.materia.horarios[editando.turma].aulas = aulas;
            combinacoes.clear_overlay();
            ui_horario.set_toggle(null);
            ui_turmas.edit_end();
            editando = null;
        }
        var current = combinacoes.get_current();
        combinacoes.generate(materias.list());
        ui_combinacoes.set_ok();
        display_combinacao(combinacoes.closest(current));
        var errmsg = new String();
        var m = materias.list();
        for (var i = 0; i < m.length; i++) {
            var materia = m[i];
            if (materia.selected == -1) {
                errmsg += materia.codigo;
            }
        }
        if (errmsg != "") {
            ui_logger.set_text("materias em choque: " + errmsg, "lightcoral");
        }
        current = null;
    }
    function normal_cell(d)  { return {strong:d.fixed,text:d.horario.materia.codigo,bgcolor:d.horario.materia.cor,color:"black"}; }
    function red_cell(str)   { return {strong:true,text:str,bgcolor:"red",color:"black"}; }
    function black_cell(str) { return {strong:false,text:str,bgcolor:"black",color:"white"}; }
    var editando = null;
    function edit_start(turma) {
        if (editando) {
            if (editando == turma) {
                update_all();
                return;
            }
            update_all();
        }
        var materia = materias.get_selected();
        combinacoes.clear_overlay();
        var overlay = combinacoes.get_overlay();
        function display(dia, hora, tipo, c) {
            /* 0 clear
             * 1 normal
             * 2 over
             * 3 comb
             * 4 choque 1
             * 5 choque 2
             */
            switch (tipo) {
                case 0: ui_horario.clear_cell(dia, hora); break;
                case 1: ui_horario.display_cell(dia, hora, {strong:false,text:turma.materia.codigo,bgcolor:turma.materia.cor,color:"black"}); break;
                case 2: ui_horario.display_cell(dia, hora, {strong:false,text:turma.materia.codigo,bgcolor:"black",color:"white"}); break;
                case 3: ui_horario.display_cell(dia, hora, normal_cell(c[dia][hora])); break;
                case 4: ui_horario.display_cell(dia, hora, {strong:false,text:turma.materia.codigo,bgcolor:"black",color:"red"}); break;
                case 5: ui_horario.display_cell(dia, hora, {strong:false,text:turma.materia.codigo,bgcolor:"red",color:"black"}); break;
            }
        };
        function onover(dia, hora) {
            var c  = combinacoes.get_current();
            var eq = c[dia][hora] ? c[dia][hora].horario == turma.horario : 0;
            var a1 = overlay[dia][hora] ? 0 : 1;
            var a2 = c      [dia][hora] ? 0 : 1;
            var a3 = eq                 ? 0 : 1;
            var todisplay = [ [ [ 2, 5 ], [ 1, 1 ] ], [ [ 3, 4 ], [ 2, 2 ] ] ];
            display(dia, hora, todisplay[a1][a2][a3], c);
//console.log("onover(" + a1 + ", " + a2 + ", " + a3 + ") " + todisplay[o][c][eq]);
        };
        function onout(dia, hora) {
            var c  = combinacoes.get_current();
            var eq = c[dia][hora] ? c[dia][hora].horario == turma.horario : 0;
            var a1 = overlay[dia][hora] ? 0 : 1;
            var a2 = c      [dia][hora] ? 0 : 1;
            var a3 = eq                 ? 0 : 1;
            var todisplay = [ [ [ 0, 5 ], [ 1, 1 ] ], [ [ 3, 3 ], [ 0, 0 ] ] ];
            display(dia, hora, todisplay[a1][a2][a3], c);
//console.log("onout(" + a1 + ", " + a2 + ", " + a3 + ") " + todisplay[o][c][eq]);
        };
        function toggle(dia, hora) {
//console.log("ontoggle");
            if (overlay[dia][hora])
                overlay[dia][hora] = false;
            else
                overlay[dia][hora] = true;
            onover(dia, hora);
            ui_combinacoes.set_dirty();
        };
        ui_horario.set_toggle(toggle, onover, onout);
        ui_turmas.edit_start(turma);
        editando = turma;
    }
    ui_turmas.cb_edit_turma  = function(turma) {
        edit_start(turma);
    };
    ui_turmas.cb_onmouseover = function(turma) { turmas.display_over(turma); };
    ui_turmas.cb_onmouseout  = function(turma) { turmas.undisplay_over(turma); };
    ui_turmas.cb_changed     = function(codigo, turma, checked) {
        var materia = materias.get(codigo);
        materia.turmas[turma].selected = checked;
        materia.selected = true;
    };
    ui_turmas.cb_updated     = function() {
        var turma = turmas.get_selected();
        update_all();
        turmas.display_over(turma);
    };
}

window.onload = function() {
    var ui_materias    = new UI_materias("materias_list");
    var ui_combinacoes = new UI_combinacoes("combinacoes");
    var ui_horario     = new UI_horario("horario");
    var ui_turmas      = new UI_turmas("turmas_list", ui_horario.height());
    var ui_logger      = new UI_logger("logger");

    var combinacoes = new Combinacoes();
    var materias = new Materias();
    var turmas = new Turmas(ui_logger, ui_horario, combinacoes);

    var dconsole = new Dconsole("dconsole");
    var main   = new Main(ui_materias, ui_turmas, ui_logger, ui_combinacoes, ui_horario, materias, turmas, combinacoes);
    var combo   = new Combobox("materias_input", "materias_suggestions", ui_logger);

    combo.cb_add_item = main.add_item;
    combo.cb_new_item = main.new_item;

    document.onkeydown = function(e) {
        var ev = e ? e : event;
        var c = ev.keyCode;
        if (ev.srcElement == combo.input)
            return;
        if (ev.srcElement == ui_combinacoes.selecao_atual) {
            var pos = -1;
            if (document.selection) {
                var range = document.selection.createRange();
                range.moveStart('character', -ev.srcElement.value.length);
                pos = range.text.length;
            } else {
                pos = ev.srcElement.selectionStart;
            }
            if (c == 13) {
                ui_combinacoes.selecao_atual.blur();
                ui_combinacoes.selecao_atual.focus();
            } else if (pos == ev.srcElement.value.length && c == 39) {
                main.next();
            } else if (pos == 0 && c == 37) {
                main.previous();
                if (document.selection) {
                    var range = ev.srcElement.createTextRange();
                    range.collapse(true);
                    range.moveStart('character', 0);
                    range.moveEnd('character', 0);
                    range.select();
                } else {
                    ev.srcElement.selectionStart = 0;
                }
            }
            return;
        }
        if (c == 39) {
            main.next();
        } else if (c == 37) {
            main.previous();
        }
    };
    if (0) {
    //1a fase
    combo.add_item("EEL7010");
    combo.add_item("EEL7011");
    combo.add_item("EGR5619");
    combo.add_item("MTM5183");
    combo.add_item("MTM5512");
    combo.add_item("QMC5106");
    } else if (0) {
    //2a fase
    combo.add_item("EEL7020");
    combo.add_item("EEL7021");
    combo.add_item("FSC5161");
    combo.add_item("LLV5603");
    combo.add_item("MTM5184");
    combo.add_item("MTM5247");
    } else if (0) {
    //3a fase
    combo.add_item("EEL7030");
    combo.add_item("EEL7031");
    combo.add_item("FSC5162");
    combo.add_item("FSC5164");
    combo.add_item("MTM5185");
    }
}
