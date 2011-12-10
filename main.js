/**
 * @constructor
 */
function UI_grayout(id)
{
    var self = this;

    self.grayout = document.getElementById(id);
    self.grayout.style.position = "absolute";
    self.grayout.style.left = "0px";
    self.grayout.style.top = "0px";
    self.grayout.style.width = "100%";
    self.grayout.style.height = "100%";
    self.grayout.style.backgroundColor = "#666666";
    self.grayout.style.opacity = ".7";
    self.grayout.style.filter = "alpha(opacity=70)";
    self.grayout.style.zIndex = "1000";
    self.grayout.onclick = function() { self.cb_onclick(); };

    /* procedures */
    self.hide = function() { self.grayout.style.display = "none"; };
    self.show = function() { self.grayout.style.display = ""; };
    self.cb_onclick = null;

    self.hide();
}

/**
 * @constructor
 */
function UI_ajuda_popup(id)
{
    var self = this;

    self.popup = document.getElementById(id);

    self.popup.style.position = "absolute";
    self.popup.style.backgroundColor = "#eeeeee";
    self.popup.style.width = "600px";
    self.popup.style.height = "480px";
    self.popup.style.zIndex = "2000";
    self.popup.style.top = "10%";
    self.popup.style.left = "50%";
    self.popup.style.border = "1px solid black";
    self.popup.style.fontFamily = "verdana";
    self.popup.style.fontSize = "15px";
    self.popup.style.overflow = "auto";

    function show() {
        self.popup.style.display = "";
        self.popup.style.marginLeft = "-" + (self.popup.offsetWidth /2) + "px";
    }

    /* procedures */
    self.hide         = function() { self.popup.style.display = "none"; };
    self.show         = show;

    self.hide();
}

/**
 * @constructor
 */
function Main(ui_materias, ui_turmas, ui_logger, ui_combinacoes, ui_horario, ui_saver, ui_grayout, materias, turmas, combinacoes, persistence)
{
    var self = this;

    function display_combinacao(cc)
    {
        var horas_aula = 0;
        var m = materias.list();
        for (var i = 0; i < m.length; i++) {
            var materia = m[i];
            if (materia.selected == -1) {
                materia.ui_turma.innerHTML = "<strike>XXXXXX</strike>";
                materia.ui_selected.checked = 0;
                materia.ui_selected.disabled = "disabled";
            } else if (materia.selected == 0) {
                materia.ui_turma.innerHTML = "<strike>XXXXXX</strike>";
                materia.ui_selected.checked = 0;
                materia.ui_selected.disabled = "";
            }
        }

        turmas.reset();
        var c = combinacoes.get(cc);
        if (!c) {
            cc = 0;
        } else {
            for (var i in c.horarios_combo) {
                for (var k in c.horarios_combo[i].turmas) {
                    if (c.horarios_combo[i].turmas[k].selected) {
                        var turma = c.horarios_combo[i].turmas[k];
                        break;
                    }
                }
                if (!turma)
                    var turma = c.horarios_combo[i].turma_representante;
                turma.materia.ui_turma.innerHTML = turma.nome;
                turma.materia.ui_selected.checked = true;
                turma.materia.ui_selected.disabled = "";
                horas_aula += parseInt(turma.horas_aula);
                turmas.display(turma, c);
            }
        }
        combinacoes.set_current(cc);
        ui_combinacoes.set_current(cc);
        ui_combinacoes.set_total(combinacoes.length());
        ui_combinacoes.set_horas_aula(horas_aula);
    }

    var atividades = 1;
    function new_atividade_name() {
        var str = new String();
        if (atividades < 1000)
            str += "0";
        if (atividades <  100)
            str += "0";
        if (atividades <   10)
            str += "0";
        str += atividades;
        atividades++;
        return str;
    }
    function new_materia(nome) {
        do {
            var str = new_atividade_name();
            var codigo = "XXX" + str;
        } while (materias.get(codigo));
        if (materias.get_nome(nome)) {
            ui_logger.set_text("'" + codigo + "' ja foi adicionada", "lightcoral");
            return;
        }
        var materia = materias.new_item(codigo, nome);
        materias.new_turma(materia);
        ui_materias.add(materia);
        ui_turmas.create(materia);
        materias.set_selected(materia);
        ui_logger.set_text("'" + nome + "' adicionada", "lightgreen");
        update_all();
    };
    function add_materia(codigo, xml) {
        var materia = materias.add_xml(codigo, xml);
        if (!materia) {
            ui_logger.set_text("'" + codigo + "' ja foi adicionada", "lightcoral");
            return;
        }
        ui_materias.add(materia);
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

    /* self */
    self.new_materia = new_materia;
    self.add_materia = add_materia;
    self.previous = previous;
    self.next = next;

    /* UI_combinacoes */
    ui_combinacoes.cb_previous = self.previous;
    ui_combinacoes.cb_next     = self.next;
    ui_combinacoes.cb_changed  = function(val) {
        if (!combinacoes.length())
            return;
        if (parseInt(val).toString() == val && val >= 1 && val <= combinacoes.length()) {
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
    ui_materias.cb_onmoveup    = function(materia) {
        var m = materias.list();
        for (var i = 0; i < m.length; i++)
            if (m[i] == materia)
                break;
        if (i >= m.length) {
            console.log("something went wrong!");
            return;
        }
        if (i == 0)
            return;
        m[i].row.parentNode.insertBefore(m[i].row, m[i-1].row);
        var tmp = m[i-1];
        m[i-1]  = m[i  ];
        m[i  ]  = tmp;
        update_all();
    };
    ui_materias.cb_onmovedown  = function(materia) {
        var m = materias.list();
        for (var i = 0; i < m.length; i++)
            if (m[i] == materia)
                break;
        if (i >= m.length) {
            console.log("something went wrong!");
            return;
        }
        if (i == m.length-1)
            return;
        m[i].row.parentNode.insertBefore(m[i+1].row, m[i].row);
        var tmp = m[i+1];
        m[i+1]  = m[i  ];
        m[i  ]  = tmp;
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
    ui_materias.cb_onmouseover = function(materia) {
        var c = combinacoes.get_current();
        for (var i in c.horarios_combo) {
            var turma = c.horarios_combo[i].turma_representante;
            if (turma.materia == materia) {
                turmas.display_over(turma);
                break;
            }
        }
// TODO maybe display turmas onmouseover
//        ui_turmas.create(materia);
    };
    ui_materias.cb_onmouseout  = function(materia) {
        var c = combinacoes.get_current();
        for (var i in c.horarios_combo) {
            var turma = c.horarios_combo[i].turma_representante;
            if (turma.materia == materia) {
                turmas.undisplay_over(turma);
                break;
            }
        }
// TODO maybe display turmas onmouseover
//        ui_turmas.create(materias.get_selected());
    };
    ui_materias.cb_onclick     = function(materia) {
        ui_turmas.create(materia);
        materias.set_selected(materia);
    }
    /* UI_turmas */
    ui_turmas.cb_toggle_agrupar = function() {
        var materia = materias.get_selected();
        materia.agrupar = materia.agrupar ? 0 : 1;
        materias.fix_horarios(materia);
        update_all();
        ui_turmas.create(materia);
    };
    ui_turmas.cb_new_turma   = function() {
        var materia = materias.get_selected();
        materias.new_turma(materia);
        ui_turmas.create(materia);
        update_all();
    };
    ui_turmas.cb_remove_turma = function(turma) {
        var materia = turma.materia;
        materias.remove_turma(materia, turma);
        ui_turmas.remove_turma(turma);
        update_all();
    };
    function update_all(comb) {
        if (self.editando) {
            var editando = self.editando;
            var overlay = combinacoes.get_overlay();
            var aulas = new Array();
            for (dia = 0; dia < 6; dia++)
                for (hora = 0; hora < 14; hora++)
                    if (overlay[dia][hora]) {
                        var aula = {dia:dia,hora:hora,n:1};
                        aulas.push(aula);
                    }
            editando.horario.aulas = aulas;
            for (var k in editando.horario.turmas)
                editando.horario.turmas[k].aulas = aulas;
            materias.fix_horarios(editando.materia);
            combinacoes.clear_overlay();
            ui_horario.set_toggle(null);
            ui_turmas.edit_end();
            ui_turmas.create(editando.materia);
            self.editando = null;
        }
        if (comb == null)
            var current = combinacoes.get_current();
        combinacoes.generate(materias.list());
        if (comb == null)
            comb = combinacoes.closest(current)
        if (comb < 1 || comb > combinacoes.length())
            comb = 1;
        display_combinacao(comb);
        var errmsg = new String();
        var m = materias.list();
        for (var i = 0; i < m.length; i++) {
            var materia = m[i];
            if (materia.selected == -1) {
                errmsg += " " + materia.codigo;
            }
        }
        if (errmsg != "") {
            ui_logger.set_persistent("materias em choque:" + errmsg, "lightcoral");
        } else {
            ui_logger.clear_persistent();
        }
        ui_logger.reset();
        current = null;
        mudancas = combinacoes.get_current();
        persistence.write_state(self.save_state());
    }
    function normal_cell(d)  { return {strong:d.fixed,text:d.horario.materia.codigo,bgcolor:d.horario.materia.cor,color:"black"}; }
    function red_cell(str)   { return {strong:true,text:str,bgcolor:"red",color:"black"}; }
    function black_cell(str) { return {strong:false,text:str,bgcolor:"black",color:"white"}; }
    self.editando = null;
    function edit_start(turma) {
        if (self.editando) {
            if (self.editando == turma) {
                update_all();
                return;
            }
            update_all();
        }
        var materia = materias.get_selected();
        combinacoes.clear_overlay();
        var overlay = combinacoes.get_overlay();
        var c       = combinacoes.get_current();
        var fake    = combinacoes.copy(c, turma.materia);
        for (var i = 0; i < turma.aulas.length; i++) {
            var dia  = turma.aulas[i].dia;
            var hora = turma.aulas[i].hora;
            overlay[dia][hora] = true;
        }
        function display(dia, hora, tipo, fake) {
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
                case 3: ui_horario.display_cell(dia, hora, normal_cell(fake[dia][hora])); break;
                case 4: ui_horario.display_cell(dia, hora, {strong:false,text:turma.materia.codigo,bgcolor:"black",color:"red"}); break;
                case 5: ui_horario.display_cell(dia, hora, {strong:false,text:turma.materia.codigo,bgcolor:"red",color:"black"}); break;
            }
        };
        function onover(dia, hora) {
            var eq = fake   [dia][hora] ? fake[dia][hora].horario == turma.horario : 0;
            var a1 = overlay[dia][hora] ? 0 : 1;
            var a2 = fake   [dia][hora] ? 0 : 1;
            var a3 = eq                 ? 0 : 1;
            var todisplay = [ [ [ 2, 5 ], [ 1, 1 ] ], [ [ 3, 4 ], [ 2, 2 ] ] ];
            display(dia, hora, todisplay[a1][a2][a3], fake);
        };
        function onout(dia, hora) {
            var eq = fake   [dia][hora] ? fake[dia][hora].horario == turma.horario : 0;
            var a1 = overlay[dia][hora] ? 0 : 1;
            var a2 = fake   [dia][hora] ? 0 : 1;
            var a3 = eq                 ? 0 : 1;
            var todisplay = [ [ [ 0, 5 ], [ 1, 1 ] ], [ [ 3, 3 ], [ 0, 0 ] ] ];
            display(dia, hora, todisplay[a1][a2][a3], fake);
        };
        function toggle(dia, hora) {
            if (overlay[dia][hora])
                overlay[dia][hora] = false;
            else
                overlay[dia][hora] = true;
            onover(dia, hora);
        };
        ui_grayout.show();
        ui_horario.set_toggle(toggle, onover, onout);
        ui_turmas.edit_start(turma);
        self.editando = turma;
        for (var dia = 0; dia < 6; dia++)
            for (var hora = 0; hora < 14; hora++)
                onout(dia, hora);
    }
    ui_turmas.cb_edit_turma  = function(turma) {
        edit_start(turma);
    };
    ui_turmas.cb_onmouseover = function(turma) { turmas.display_over(turma); };
    ui_turmas.cb_onmouseout  = function(turma) { turmas.undisplay_over(turma); };
    ui_turmas.cb_changed     = function(turma, checked) {
        turma.selected = checked ? 1 : 0;
        turma.materia.selected = true;
    };
    ui_turmas.cb_updated     = function() {
        var turma = turmas.get_selected();
        update_all();
        turmas.display_over(turma);
    };
    ui_turmas.cb_ok          = function() {
        ui_grayout.hide();
        update_all();
    };
    ui_turmas.cb_cancel      = function() {
        ui_grayout.hide();
        combinacoes.clear_overlay();
        ui_horario.set_toggle(null);
        ui_turmas.edit_end();
        self.editando = null;
        display_combinacao(combinacoes.current());
    };
    /* UI_saver */
    self.save_state = function() {
        var list = materias.list();
        var state = new Object();
        var materia = ui_turmas.get_current();
        materia = (materia == null) ? "" : materia.codigo;
        state.versao     = 4;
        state.materia_selected = materia;
        state.combinacao = combinacoes.current();
        state.materias   = new Array();
        for (var i = 0; i < list.length; i++) {
            var state_materia = new Object();
            var materia = list[i];
            state_materia.codigo   = materia.codigo;
            state_materia.nome     = materia.nome;
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
                    state_turma.horarios.push(materias.aulas_string(turma.aulas[k]));
                state_turma.selected         = turma.selected;
                state_materia.turmas.push(state_turma);
            }
            state_materia.agrupar  = materia.agrupar;
            state_materia.selected = materia.selected;
            state.materias.push(state_materia);
        }
        return "<state>" + json_to_xml(state) + "</state>";
    }
    ui_saver.cb_salvar = function(identificador) {
        if (!identificador || identificador == "") {
            ui_logger.set_text("identificador invalido", "lightcoral");
            return;
        }
        var ret = self.save_state();

        persistence.write_state(ret);

        save_request = new XMLHttpRequest();
        save_request.savestr = identificador;
        save_request.onreadystatechange = function() {
            if (this.readyState == 4) {
                if ((this.status != 200) || this.responseText != "OK") {
                    ui_logger.set_text("erro ao salvar horário para '" + this.savestr + "'", "lightcoral");
                } else {
                    ui_logger.set_text("horário para '" + this.savestr + "' foi salvo", "lightgreen");
                    persistence.write_id(this.savestr);
                    mudancas = false;
                }
            }
        };
        save_request.open("POST", "cgi-bin/save.cgi?q=" + encodeURIComponent(identificador), true);
        save_request.send(ret);
        ui_logger.waiting("salvando horário para '" + identificador + "'");
    };
    self.carregar = function(xml, identificador) {
        state = xml_to_state(xml);

        if (state.versao > 4) {
            ui_logger.set_text("erro ao tentar abrir horário de versão mais recente", "lightcoral");
            return;
        }

        materias.reset();
        ui_materias.reset();
        ui_logger.reset();
        turmas.reset();
        ui_turmas.reset();

        for (var i = 0; i < state.materias.length; i++) {
            var materia = materias.add_json(state.materias[i]);
            if (!materia) {
                ui_logger.set_text("houve algum erro ao importar as mat\u00e9rias!", "lightcoral");
                return;
            }
            ui_materias.add(materia);
        }
        var materia = materias.get(state.materia_selected);
        if (materia)
            ui_turmas.create(materia);
        materias.set_selected(materias.get(state.materia_selected));
        ui_logger.set_text("grade de mat\u00e9rias carregada", "lightgreen");
        if (identificador)
            persistence.write_id(identificador);
        update_all(state.combinacao);
        mudancas = false;
    };
    ui_saver.cb_carregar = function(identificador) {
        if (!identificador || identificador == "") {
            ui_logger.set_text("identificador invalido", "lightcoral");
            return;
        }
        load_request = new XMLHttpRequest();
        load_request.loadstr = identificador;
        load_request.onreadystatechange = function() {
            if (this.readyState == 4) {
                if ((this.status != 200) || !this.responseXML) {
                    ui_logger.set_text("erro ao abrir horário para '" + this.loadstr + "'", "lightcoral");
                } else {
                    self.carregar(this.responseXML, identificador);
                    ui_logger.set_text("horário para '" + this.loadstr + "' foi carregado", "lightgreen");
                }
            }
        };
        load_request.open("GET", "cgi-bin/load.cgi?q=" + encodeURIComponent(identificador), true);
        load_request.send(null);
        ui_logger.waiting("carregando horário para '" + identificador + "'");
    }
}

ajuda_shown = false;
mudancas = false;
window.onload = function() {
    var persistence = new Persistence();
    var identificador = persistence.read_id();

    var ui_materias    = new UI_materias("materias_list");
    var ui_combinacoes = new UI_combinacoes("combinacoes");
    var ui_horario     = new UI_horario("horario");
    var ui_turmas      = new UI_turmas("turmas_list", ui_horario.height());
    var ui_logger      = new UI_logger("logger");
    var ui_saver       = new UI_saver("saver");

    var ui_grayout     = new UI_grayout("grayout");
    ui_grayout.cb_onclick = function() {
        if (ajuda_shown) {
            fechar_ajuda_obj.onclick();
        } else if (main.editando) {
            ui_turmas.cb_cancel();
        }
    };
    var ui_ajuda_popup = new UI_ajuda_popup("ajuda_popup");
    ui_ajuda_popup.link = document.getElementById("ajuda");
    var a = document.createElement("a");
    a.href = "#";
    a.innerHTML = "Ajuda?";
    a.onclick = function() {
        ui_ajuda_popup.show();
        ui_grayout.show();
        ajuda_shown = true;
    };
    ui_ajuda_popup.link.appendChild(a);
    fechar_ajuda_obj = document.getElementById("fechar_ajuda");
    fechar_ajuda_obj.onclick = function() {
        ui_grayout.hide();
        ui_ajuda_popup.hide();
        ajuda_shown = false;
    }

    var combinacoes = new Combinacoes();
    var materias = new Materias();
    var turmas = new Turmas(ui_logger, ui_horario, combinacoes);

    dconsole2 = new Dconsole("dconsole");
    var main   = new Main(ui_materias, ui_turmas, ui_logger, ui_combinacoes, ui_horario, ui_saver, ui_grayout, materias, turmas, combinacoes, persistence);
    var combo   = new Combobox("materias_input", "materias_suggestions", ui_logger);

    combo.cb_add_materia = main.add_materia;
    combo.cb_new_materia = main.new_materia;

    document.onkeydown = function(e) {
        var ev = e ? e : event;
        var c = ev.keyCode;
        if (ajuda_shown && c == 27) {
            fechar_ajuda_obj.onclick();
            return;
        }
        if (main.editando) {
            if (c == 27)
                ui_turmas.cb_cancel();
            return;
        }
        if (ev.srcElement == combo.input || ev.srcElement == ui_saver.input)
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

    window.onbeforeunload = function (e) {
        e = e || window.event;
        var str = 'Mudanças feitas não foram salvas'

        if (mudancas && !persistence.write_state(main.save_state())) {
            // For IE and Firefox prior to version 4
            if (e) { e.returnValue = str; }
            // For Safari
            return str;
        }
    };

    ui_saver.identificar(identificador);
    var state = persistence.read_state();
    if (state && state != "") {
        if (window.DOMParser) {
            var parser = new DOMParser();
            var xml = parser.parseFromString(state, "text/xml");
        } else {
            var xml = new ActiveXObject("Microsoft.XMLDOM");
            xml.async = "false";
            xml.loadXML(state);
        }
        main.carregar(xml);
    } else {
        if (identificador != null && identificador != "") {
            ui_saver.cb_carregar(identificador);
        }
    }
}
