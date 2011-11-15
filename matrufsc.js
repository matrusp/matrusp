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

    function adicionar(codigo, str)
    {
        var materia = materias.add_item(codigo, str);
        if (!materia) {
            ui_logger.set_text("'" + codigo + "' ja foi adicionada", "lightcoral");
            return;
        }
        combinacoes.generate(materias.list());
        ui_materias.add_item(materia);
        display_combinacao(1);
        ui_logger.set_text("'" + materia.codigo + "' adicionada", "lightgreen");
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
    self.adicionar = adicionar;
    self.previous = previous;
    self.next = next;
    self.salvar = salvar;

    /* UI_combinacoes */
    ui_combinacoes.changed = function(val) {
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
    ui_combinacoes.previous = self.previous;
    ui_combinacoes.next = self.next;

    /* UI_materias */
    function materia_onclick_add()
    {
    }
    function materia_onclick_remove()
    {
        var materia = this.parentNode.materia;
        var selected = materias.get_selected();

        if (selected && selected.codigo == materia.codigo)
            ui_turmas.reset();

        ui_logger.set_text("'" + materia.codigo + "' removida", "lightgreen");
        materia.row.parentNode.removeChild(materia.row);
        materias.remove_item(materia);

        combinacoes.generate(materias.list());
        display_combinacao(1);
    }
    function materia_onclick()
    {
        var materia = this.parentNode.materia;
        ui_turmas.create(materia);
        materias.set_selected(materia);
    }
    ui_materias.onclick_add = materia_onclick_add;
    ui_materias.materia_onclick_remove = materia_onclick_remove;
    ui_materias.materia_onclick = materia_onclick;
    /* UI_turmas */
    function turma_changed()
    {
        var split   = this.value.split(" ");
        var materia = materias.get(split[0]);
        var turma   = materia.turmas[split[1]];
        turma.selected = this.checked;
        combinacoes.generate(materias.list());
        display_combinacao(1);
        turmas.display_over(turma);
    }
    function turma_onmouseup()
    {
        var checkboxes = this.parentNode.getElementsByTagName("td")[0].getElementsByTagName("input");
        var at_least_one_selected = 0;
        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                at_least_one_selected = 1;
                break;
            }
        }
        for (var i = 0; i < checkboxes.length; i++) {
            var split   = checkboxes[i].value.split(" ");
            var materia = materias.get(split[0]);
            var turma   = materia.turmas[split[1]];
            turma.selected        = !at_least_one_selected;
            checkboxes[i].checked = !at_least_one_selected;
        }
        combinacoes.generate(materias.list());
        display_combinacao(1);
        turmas.display_over(turma);
    }
    ui_turmas.turma_onmouseover = function () { turmas.display_over(this.turma); };
    ui_turmas.turma_onmouseout = function () { turmas.undisplay_over(this.turma); };
    ui_turmas.turma_changed = turma_changed;
    ui_turmas.turma_onmouseup = turma_onmouseup;
}

window.onload = function() {
    var ui_combinacoes = new UI_combinacoes();
    var ui_materias    = new UI_materias("materias_list", ui_combinacoes);
    var ui_horario     = new UI_horario("horario");
    var ui_turmas      = new UI_turmas("turmas_list", ui_horario.height());
    var ui_logger      = new UI_logger("logger");

    var combinacoes = new Combinacoes();
    var materias = new Materias();
    var turmas = new Turmas(ui_logger, ui_horario, combinacoes);

    dconsole = new Dconsole("dconsole");
    var main   = new Main(ui_materias, ui_turmas, ui_logger, ui_combinacoes, materias, turmas, combinacoes);
    var combo   = new Combobox("materias_input", "materias_suggestions", ui_logger);

    combo.add_item = main.adicionar;

    document.onkeydown = function(e) {
        var ev = e ? e : event;
        var c = ev.keyCode;
        if (ev.srcElement == combo.input)
            return;
        if (ev.srcElement == main.selecao_atual) {
            var pos = -1;
            if (document.selection) {
                var range = document.selection.createRange();
                range.moveStart('character', -ev.srcElement.value.length);
                pos = range.text.length;
            } else {
                pos = ev.srcElement.selectionStart;
            }
            if (c == 13) {
                main.selecao_atual.blur();
                main.selecao_atual.focus();
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
    main.adicionar("EEL7010");
    main.adicionar("EEL7011");
    main.adicionar("EGR5619");
    main.adicionar("MTM5183");
    main.adicionar("MTM5512");
    main.adicionar("QMC5106");
    } else if (0) {
    //2a fase
    main.adicionar("EEL7020");
    main.adicionar("EEL7021");
    main.adicionar("FSC5161");
    main.adicionar("LLV5603");
    main.adicionar("MTM5184");
    main.adicionar("MTM5247");
    } else if (0) {
    //3a fase
    main.adicionar("EEL7030");
    main.adicionar("EEL7031");
    main.adicionar("FSC5162");
    main.adicionar("FSC5164");
    main.adicionar("MTM5185");
    }
}
