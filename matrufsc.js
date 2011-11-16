function Main(ui_materias, ui_turmas, ui_logger, ui_combinacoes, materias, turmas, combinacoes)
{
    var self = this;

    function display_combinacao(cc)
    {
        var deselected = combinacoes.deselected();
        if (deselected) {
            for (var i in deselected) {
                var materia = deselected[i];
                materia.ui_turma.innerHTML = "<strike>XXXXXX</strike>";
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
        combinacoes.generate(materias.list());
        ui_materias.add_item(materia);
        display_combinacao(1);
        ui_turmas.create(materia);
        materias.set_selected(materia);
        ui_logger.set_text("'" + codigo + "' adicionada", "lightgreen");
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
    ui_materias.cb_onremove    = function(materia) {
        var selected = materias.get_selected();
        if (selected && selected.codigo == materia.codigo)
            ui_turmas.reset();
        ui_logger.set_text("'" + materia.codigo + "' removida", "lightgreen");
        materia.row.parentNode.removeChild(materia.row);
        materias.remove_item(materia);
        combinacoes.generate(materias.list());
        display_combinacao(1);
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
        var turma = materias.new_turma(materia, nome, null, null);
        ui_turmas.new_turma(turma);
    };
    ui_turmas.cb_onmouseover = function(turma) { turmas.display_over(turma); };
    ui_turmas.cb_onmouseout  = function(turma) { turmas.undisplay_over(turma); };
    ui_turmas.cb_changed     = function(codigo, turma, checked) { materias.get(codigo).turmas[turma].selected = checked; };
    ui_turmas.cb_updated     = function() {
        var turma = turmas.get_selected();
        combinacoes.generate(materias.list());
        display_combinacao(1);
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
    var main   = new Main(ui_materias, ui_turmas, ui_logger, ui_combinacoes, materias, turmas, combinacoes);
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
