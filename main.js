/**
 * @constructor
 */
function Main(combo, ui_materias, ui_turmas, ui_logger, ui_combinacoes, ui_horario, ui_saver, ui_campus, ui_grayout, materias, display, combinacoes, persistence)
{
    var self = this;

    function display_combinacao(cc)
    {
        var horas_aula = 0;
        var m = materias.list();
        for (var i = 0; i < m.length; i++) {
            var materia = m[i];
            if (materia.selected == -1) {
                materia.ui_turma.innerHTML = "<strike>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</strike>";
                materia.ui_turma.style.textAlign = "center";
                materia.ui_selected.checked = 0;
                materia.ui_selected.disabled = "disabled";
            } else if (materia.selected == 0) {
                materia.ui_turma.innerHTML = "<strike>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</strike>";
                materia.ui_turma.style.textAlign = "center";
                materia.ui_selected.checked = 0;
                materia.ui_selected.disabled = "";
            }
        }

        display.reset();
        var c = combinacoes.get(cc);
        if (!c) {
            cc = 0;
        } else {
            c.horarios_combo.forEach(function(horario){
                for (var k in horario.turmas) {
                    if (horario.turmas[k].selected) {
                        var turma = horario.turmas[k];
                        break;
                    }
                }
                if (!turma)
                    var turma = horario.turma_representante;
                turma.materia.ui_turma.innerHTML = turma.nome;
                turma.materia.ui_turma.style.textAlign = "left";
                turma.materia.ui_selected.checked = true;
                turma.materia.ui_selected.disabled = "";
                horas_aula += parseInt(turma.aulas.length);
                display.turma(c, turma);
            });
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
        var materia = materias.new_item(codigo, nome);
        materias.new_turma(materia);
        ui_materias.add(materia);
        ui_turmas.create(materia);
        materias.set_selected(materia);
        ui_logger.set_text("'" + nome + "' adicionada", "lightgreen");
        update_all();
    };
    function add_materia(result) {
        var materia = materias.add_json(result);
        if (!materia) {
            ui_logger.set_text("'" + result.codigo + "' ja foi adicionada", "lightcoral");
            return;
        }
        ui_materias.add(materia);
        ui_turmas.create(materia);
        materias.set_selected(materia);
        ui_logger.set_text("'" + result.codigo + "' adicionada", "lightgreen");
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
    ui_materias.cb_changed = function(materia, attr, str) {
        if (str == "") {
            ui_logger.set_text("o código não pode ser vazio", "lightcoral");
        } else if (attr == "codigo" && materias.get(str)) {
            ui_logger.set_text("código '" + str + "' já está sendo usado", "lightcoral");
        } else {
            materias.changed(materia, attr, str);
            update_all();
        }
    };
    ui_materias.cb_select      = function(materia, checked) {
        materia.selected = checked ? 1 : 0;
        if (materia.selected) {
            var selected = 0;
            for (var i = 0; i < materia.turmas.length; i++) {
                var turma = materia.turmas[i];
                if (turma.selected)
                    selected = 1;
            }
            if (!selected) {
                for (var i = 0; i < materia.turmas.length; i++) {
                    var turma = materia.turmas[i];
                    turma.selected = 1
                }
                ui_turmas.create(materia);
            }
        }
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
        ui_materias.fix_width();
        update_all();
    };
    var m_array = null;
    var m_timer = null;
    var m_count = null;
    self.m_update_turma = function() {
        if (!m_array.length)
            return;
        if (m_count != -1)
            display.under(combinacoes.get_current(), m_array[m_count]);
        m_count++;
        if (m_count >= m_array.length)
            m_count = 0;
        display.over(combinacoes.get_current(), m_array[m_count]);
        if (m_array.length != 1)
            m_timer = setTimeout((function(t){return function(){t.m_update_turma();}})(self), 1000);
    }
    ui_materias.cb_onmouseover = function(materia) {
        var c = combinacoes.get_current();
        if (!c)
            return;
        for (var i = 0; i < c.horarios_combo.length; i++) {
            var horario = c.horarios_combo[i];
            var turma = horario.turma_representante;
            if (turma.materia == materia) {
                display.over(c, turma);
                return;
            }
        }
        m_array = materia.turmas.filter(function(turma){return turma.selected;});
        m_count = -1;
        self.m_update_turma();
    };
    ui_materias.cb_onmouseout  = function(materia) {
        var c = combinacoes.get_current();
        if (!c)
            return;
        for (var i = 0; i < c.horarios_combo.length; i++) {
            var horario = c.horarios_combo[i];
            var turma = horario.turma_representante;
            if (turma.materia == materia) {
                display.under(c, turma);
                return;
            }
        }
        if (m_array && m_array.length)
            display.under(c, m_array[m_count]);
        if (m_timer)
            clearTimeout(m_timer);
        m_array = null;
        m_timer = null;
        m_count = null;
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
    var overlay = null;
    function clear_overlay() {
        overlay = [[],[],[],[],[],[]];
    }
    clear_overlay();
    function update_all(comb) {
        if (self.editando) {
            var editando = self.editando;
            var aulas = new Array();
            for (dia = 0; dia < 6; dia++)
                for (hora = 0; hora < 14; hora++)
                    if (overlay[dia][hora]) {
                        var aula = new Aula(dia, hora, "SALA");
                        for (var k = 0; k < editando.aulas.length; k++) {
                            var a2 = editando.aulas[k];
                            if (a2.dia == dia && a2.hora == hora) {
                                aula.sala = a2.sala;
                                break;
                            }
                        }
                        aulas.push(aula);
                    }
            editando.horario.aulas = aulas;
            for (var k in editando.horario.turmas)
                editando.horario.turmas[k].aulas = aulas;
            materias.fix_horarios(editando.materia);
            clear_overlay();
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
        clear_overlay();
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
                case 1: ui_horario.display_cell(dia, hora, {text:turma.materia.codigo,bgcolor:turma.materia.cor,color:"black"}); break;
                case 2: ui_horario.display_cell(dia, hora, Cell.black (turma.materia.codigo)); break;
                case 3: ui_horario.display_cell(dia, hora, Cell.normal(fake[dia][hora])); break;
                case 4: ui_horario.display_cell(dia, hora, {text:turma.materia.codigo,bgcolor:"black",color:"red"}); break;
                case 5: ui_horario.display_cell(dia, hora, Cell.red   (turma.materia.codigo)); break;
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
    ui_turmas.cb_onmouseover = function(turma) { display.over(combinacoes.get_current(), turma); };
    ui_turmas.cb_onmouseout  = function(turma) { display.under(combinacoes.get_current(), turma); };
    ui_turmas.cb_changed     = function(turma, checked) {
        turma.selected = checked ? 1 : 0;
        turma.materia.selected = 1;
    };
    ui_turmas.cb_updated     = function() {
        var turma = display.get_selected();
        update_all();
        display.over(combinacoes.get_current(), turma);
    };
    ui_turmas.cb_ok          = function() {
        ui_grayout.hide();
        update_all();
    };
    ui_turmas.cb_cancel      = function() {
        ui_grayout.hide();
        clear_overlay();
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
        state.campus     = ui_campus.get_selected();
        state.combinacao = combinacoes.current();
        state.materias   = new Array();
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
            state.materias.push(state_materia);
        }
        return JSON.stringify(state);
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
        save_request.open("POST", "save2.cgi?q=" + encodeURIComponent(identificador), true);
        save_request.send(ret);
        ui_logger.waiting("salvando horário para '" + identificador + "'");
    };
    self.carregar = function(state, identificador) {
        if (state.versao > 4) {
            ui_logger.set_text("erro ao tentar abrir horário de versão mais recente", "lightcoral");
            return;
        }

        materias.reset();
        ui_materias.reset();
        ui_logger.reset();
        display.reset();
        ui_turmas.reset();

        for (var i = 0; i < state.materias.length; i++) {
            var materia = materias.add_json(state.materias[i]);
            if (!materia) {
                ui_logger.set_text("houve algum erro ao importar as mat\u00e9rias!", "lightcoral");
                return;
            }
            materia.codigo = materia.codigo.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
            materia.nome = materia.nome.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
            ui_materias.add(materia);
        }
        var materia = materias.get(state.materia_selected);
        if (materia)
            ui_turmas.create(materia);
        materias.set_selected(materias.get(state.materia_selected));
        if (!state.campus)
            state.campus = 0;
        ui_campus.set_selected(state.campus);
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
                if (this.status == 200 && this.responseText != "") {
                    try {
                        var state = JSON.parse(this.responseText);
                    } catch (e) {
                    }
                }
                if (!state) {
                    ui_logger.set_text("erro ao abrir horário para '" + this.loadstr + "'", "lightcoral");
                } else {
                    self.carregar(state, identificador);
                    ui_logger.set_text("horário para '" + this.loadstr + "' foi carregado", "lightgreen");
                }
            }
        };
        load_request.open("GET", "load2.cgi?q=" + encodeURIComponent(identificador), true);
        load_request.send(null);
        ui_logger.waiting("carregando horário para '" + identificador + "'");
    }
}

function getScrollBarWidth () {
  var inner = document.createElement('p');
  inner.style.width = "100%";
  inner.style.height = "200px";

  var outer = document.createElement('div');
  outer.style.position = "absolute";
  outer.style.top = "0px";
  outer.style.left = "0px";
  outer.style.visibility = "hidden";
  outer.style.width = "200px";
  outer.style.height = "150px";
  outer.style.overflow = "hidden";
  outer.appendChild (inner);

  document.body.appendChild (outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  if (w1 == w2) w2 = outer.clientWidth;

  document.body.removeChild (outer);

  return (w1 - w2);
};

ajuda_shown = false;
mudancas = false;
init_main = function() {
    document.scrollbar_width = getScrollBarWidth();

    var persistence = new Persistence();
    var identificador = persistence.read_id();

    var ui_materias    = new UI_materias("materias_list");
    var ui_combinacoes = new UI_combinacoes("combinacoes");
    var ui_horario     = new UI_horario("horario");
    var ui_turmas      = new UI_turmas("turmas_list");
    var ui_logger      = new UI_logger("logger");
    var ui_campus      = new UI_campus("campus");
    var ui_saver       = new UI_saver("saver");

    var ui_grayout     = new UI_grayout("grayout");
    ui_grayout.cb_onclick = function() {
        if (ajuda_shown) {
            ui_ajuda_popup.cb_fechar();
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
    ui_ajuda_popup.cb_fechar = function() {
        ui_grayout.hide();
        ui_ajuda_popup.hide();
        ajuda_shown = false;
    }

    var combinacoes = new Combinacoes();
    var materias = new Materias();
    var display = new Display(ui_logger, ui_horario);

    dconsole2 = new Dconsole("dconsole");
    var combo   = new Combobox("materias_input", "materias_suggestions", ui_logger);
    var main   = new Main(combo, ui_materias, ui_turmas, ui_logger, ui_combinacoes, ui_horario, ui_saver, ui_campus, ui_grayout, materias, display, combinacoes, persistence);

    combo.cb_add_materia = main.add_materia;
    combo.cb_new_materia = main.new_materia;

    document.onkeydown = function(e) {
        var ev = e ? e : event;
        var c = ev.keyCode;
        var elm = ev.target;
        if (!elm)
            elm = ev.srcElement;
        if (elm.nodeType == 3) // defeat Safari bug
            elm = elm.parentNode;
        if (ajuda_shown && c == 27) {
            ui_ajuda_popup.cb_fechar();
            return;
        }
        if (main.editando) {
            if (c == 27)
                ui_turmas.cb_cancel();
            return;
        }
        if (elm == combo.input || elm == ui_saver.input || elm == ui_materias.input)
            return;
        if (elm == ui_combinacoes.selecao_atual) {
            var pos = -1;
            if (document.selection) {
                var range = document.selection.createRange();
                range.moveStart('character', -elm.value.length);
                pos = range.text.length;
            } else {
                pos = elm.selectionStart;
            }
            if (c == 13) {
                ui_combinacoes.selecao_atual.blur();
                ui_combinacoes.selecao_atual.focus();
            } else if (pos == elm.value.length && c == 39) {
                main.next();
            } else if (pos == 0 && c == 37) {
                main.previous();
                if (document.selection) {
                    var range = elm.createTextRange();
                    range.collapse(true);
                    range.moveStart('character', 0);
                    range.moveEnd('character', 0);
                    range.select();
                } else {
                    elm.selectionStart = 0;
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
        try {
            var state3 = JSON.parse(state);
            main.carregar(state3);
        } catch (e) {
        }
    } else {
        if (identificador != null && identificador != "") {
            ui_saver.cb_carregar(identificador);
        }
    }
    if (combo.input.value == identificador)
        combo.input.value = "";

    document.getElementById("ui_loading").style.display = "none";
    document.getElementById("ui_main").style.display = "block";
    document.getElementById("ui_fb").style.display = "block";
    ui_turmas.set_height(ui_horario.height());
    ui_materias.fix_width();
}

var database = new Database();
init_main();
