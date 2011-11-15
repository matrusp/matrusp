function Lista(ui_materias, ui_turmas, ui_logger, horario, ui_combinacoes, combinacoes)
{
    var self = this;

    function criar_aulas(horarios)
    {
        var horas = new Object();
        horas["0730"] =  0; horas[ 0] = "0730";
        horas["0820"] =  1; horas[ 1] = "0820";
        horas["0910"] =  2; horas[ 2] = "0910";
        horas["1010"] =  3; horas[ 3] = "1010";
        horas["1100"] =  4; horas[ 4] = "1100";
        horas["1330"] =  5; horas[ 5] = "1330";
        horas["1420"] =  6; horas[ 6] = "1420";
        horas["1510"] =  7; horas[ 7] = "1510";
        horas["1620"] =  8; horas[ 8] = "1620";
        horas["1710"] =  9; horas[ 9] = "1710";
        horas["1830"] = 10; horas[10] = "1830";
        horas["1920"] = 11; horas[11] = "1920";
        horas["2020"] = 12; horas[12] = "2020";
        horas["2110"] = 13; horas[13] = "2110";

        var split = horarios.replace(/ \/ \S*/ig, "").split(" ");
        var ret = new Array();
        for (var i = 0; i < split.length; i++) {
            ret[i] = new Object();
            ret[i].dia  = parseInt(split[i].slice(0,1)) - 2;
            ret[i].hora = horas[split[i].slice(2,6)];
            ret[i].n    = parseInt(split[i].slice(7));
        }
        for (var i = 0; i < ret.length-1; i++) {
            for (var j = i+1; j < ret.length; j++) {
                if ((ret[j].dia < ret[i].dia) || ((ret[j].dia == ret[i].dia) && (ret[j].hora < ret[i].hora))) {
                    var tmp = ret[i];
                    ret[i] = ret[j];
                    ret[j] = tmp;
                }
            }
        }
        ret.index = function() {
            var r = "";
            for (var i = 0; i < this.length; i++) {
                r += (this[i].dia+2) + "." + horas[this[i].hora] + "-" + this[i].n;
            }
            return r;
        };
        return ret;
    }
    function map_turma(turma, priv, func)
    {
        for (var i = 0; i < turma.aulas.length; i++) {
            var dia  = turma.aulas[i].dia;
            var hora = turma.aulas[i].hora;
            var n    = turma.aulas[i].n;
            for (var j = 0; j < n; j++) {
                func(priv, dia, hora+j);
            }
        }
    }
    function display_turma(turma)
    {
        var c       = combinacoes.get_current();
        var materia = self.selected_materia;
        var current_turma = c && c[materia.codigo] ? c[materia.codigo].turma_representante : null;

        if (turma == self.displaying_turma)
            return;

        if (current_turma)
            map_turma(current_turma, null, function(priv, dia, hora) {
                self.horario.clear_cell(dia, hora);
            });

        map_turma(turma, c, function(c, dia, hora) {
            if (c && c[dia][hora] && c[dia][hora].horario.materia != materia) {
                ui_logger.set_text("choque de horario", "lightcoral");
                self.horario.display_cell(dia, hora, red_cell(materia.codigo));
            } else {
                self.horario.display_cell(dia, hora, black_cell(materia.codigo));
            }
        });

        self.displaying_turma = turma;
    }
    function normal_cell(d)  { return {strong:d.fixed,text:d.horario.materia.codigo,bgcolor:d.horario.materia.cor,color:"black"}; }
    function red_cell(str)   { return {strong:true,text:str,bgcolor:"red",color:"black"}; }
    function black_cell(str) { return {strong:false,text:str,bgcolor:"black",color:"white"}; }
    function undisplay_turma(turma)
    {
        var c       = combinacoes.get_current();
        var materia = self.selected_materia;
        var current_turma = c && c[materia.codigo] ? c[materia.codigo].turma_representante : null;

        if (!c) {
            self.displaying_turma = "";
            self.horario.reset();
            return;
        }

        if (turma != current_turma)
            map_turma(turma, c, function(c, dia, hora) {
                if (c[dia][hora] && c[dia][hora].horario)
                    self.horario.display_cell(dia, hora, normal_cell(c[dia][hora]));
                else
                    self.horario.clear_cell(dia, hora);
            });

        if (current_turma)
            map_turma(current_turma, c, function(c, dia, hora) {
                self.horario.display_cell(dia, hora, normal_cell(c[dia][hora]));
            });

        ui_logger.reset();

        self.displaying_turma = "";
    }
    function display_combinacao(cc)
    {
        var deselected = combinacoes.deselected();
        if (cc < 1 || cc > combinacoes.length()) {
            console.log("invalid combinacao [1," + cc + "," + combinacoes.length() + "]");
            return;
        }
        if (deselected) {
            for (var i in deselected) {
                var t = deselected[i];
                self.materias[t.codigo].row.getElementsByTagName("td")[1].innerHTML = "<strike>XXXXXX</strike>";
            }
        }

        var c = combinacoes.get(cc);
        if (!c) {
            self.horario.reset();
            return;
        }
        for (var dia = 0; dia < 6; dia++) {
            for (var hora = 0; hora < 14; hora++) {
                if (c[dia][hora] && c[dia][hora].horario)
                    self.horario.display_cell(dia, hora, normal_cell(c[dia][hora]));
                else
                    self.horario.clear_cell(dia, hora);
            }
        }
        for (var i in c.horarios_combo) {
            var t = c.horarios_combo[i].turma_representante;
            self.materias[t.materia.codigo].row.getElementsByTagName("td")[1].innerHTML = t.turma;
        }
        combinacoes.set_current(cc);
        ui_combinacoes.set_current(cc);
        ui_combinacoes.set_total(combinacoes.length());
    }

    var get_color = (function(){
        var cores = [ "lightblue", "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgreen",
                      "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightsteelblue",
                      "lightyellow" ];
        var counter = 0;
        return (function(){
            var ret = cores[counter++];
            if (counter >= cores.length)
                counter = 0;
            return ret;
        });
    })();

    self.adicionar = list_add_item;
    function list_add_item(str)
    {
        var array = str.split("\n"); /* uma turma por item */
        var split = array[0].split("\t");

        if (self.materias[split[0]]) {
            ui_logger.set_text("'" + split[0] + "' ja foi adicionada", "lightcoral");
            return;
        }

        /* parte de dados */
        var materia = new Object();
        materia.codigo = split[0];
        materia.nome   = split[1];
        materia.cor    = get_color();

        materia.turmas = new Array();
        for (var i = 1; i < array.length - 1; i++) {
            var split = array[i].split("\t");
            var turma = new Object();
            turma.turma     = split[0];
            turma.xyz = split[3]; /* HACK */
            turma.aulas     = criar_aulas(split[3]);
            turma.professor = split[4];
            turma.selected  = 1;
            turma.materia   = materia;
            materia.turmas[turma.turma] = turma;
        }

        materia.horarios = new Object();
        for (var i in materia.turmas) {
            var turma = materia.turmas[i];
            var index = turma.aulas.index();
            if (!materia.horarios[index]) {
                materia.horarios[index] = new Object();
            }
            if (!materia.horarios[index].turmas) {
                materia.horarios[index].turmas = new Object();
            }
            if (!materia.horarios[index].turma_representante) {
                materia.horarios[index].turma_representante = turma;
            }
            materia.horarios[index].turmas[turma.turma] = turma;
            materia.horarios[index].materia = materia;
            materia.horarios[index].aulas = turma.aulas;
        }

        self.materias[materia.codigo] = materia;

        combinacoes.generate(self.materias);

        ui_materias.add_item(materia);

        display_combinacao(1);

        ui_logger.set_text("'" + materia.codigo + "' adicionada", "lightgreen");

//console.log(self.salvar());
    }

    self.horario = horario;

    self.materias = new Object();
    self.selected_materia = "";
    self.displaying_turma = "";

    self.previous = function() {
        if (!combinacoes.length())
            return;
        var c = combinacoes.current() - 1;
        if (c < 1)
            c = combinacoes.length();
        display_combinacao(c);
    };
    self.next = function() {
        if (!combinacoes.length())
            return;
        var c = combinacoes.current() + 1;
        if (c > combinacoes.length())
            c = 1;
        display_combinacao(c);
    };

    self.salvar = function() {
        var ret = "";
        for (var i in self.materias) {
            var materia = self.materias[i];
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
        var codigo = this.parentNode.getElementsByTagName("td")[0].innerHTML;

        if (self.selected_materia.codigo == codigo) {
            self.turmas_list.innerHTML = "";
        }

        self.materias[codigo].row.parentNode.removeChild(self.materias[codigo].row);
        delete self.materias[codigo];

        combinacoes.generate(self.materias);

        display_combinacao(1);

        ui_logger.set_text("'" + codigo + "' removida", "lightgreen");
    }
    function materia_onclick()
    {
        var materia = self.materias[this.parentNode.getElementsByTagName("td")[0].innerHTML];
        ui_turmas.create(materia);
        self.selected_materia = materia;
    }
    ui_materias.onclick_add = materia_onclick_add;
    ui_materias.materia_onclick_remove = materia_onclick_remove;
    ui_materias.materia_onclick = materia_onclick;
    /* UI_turmas */
    function turma_changed()
    {
        var split   = this.value.split(" ");
        var materia = self.materias[split[0]];
        var turma   = materia.turmas[split[1]];
        turma.selected = this.checked;
        combinacoes.generate(self.materias);
        display_combinacao(1);
        undisplay_turma(turma);
        display_turma(turma);
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
            var materia = self.materias[split[0]];
            var turma   = materia.turmas[split[1]];
            turma.selected        = !at_least_one_selected;
            checkboxes[i].checked = !at_least_one_selected;
        }
        combinacoes.generate(self.materias);
        display_combinacao(1);
        undisplay_turma(turma);
        display_turma(turma);
    }
    ui_turmas.turma_onmouseover = function () { display_turma(this.turma); };
    ui_turmas.turma_onmouseout = function () { undisplay_turma(this.turma); };
    ui_turmas.turma_changed = turma_changed;
    ui_turmas.turma_onmouseup = turma_onmouseup;
}

window.onload = function() {
    var combinacoes = new Combinacoes();

    dconsole = new Dconsole("dconsole");
    var ui_logger      = new UI_logger("logger");
    var horario = new Horario("horario");
    var ui_combinacoes = new UI_combinacoes();
    var ui_materias = new UI_materias("materias_list", ui_combinacoes);
    var ui_turmas   = new UI_turmas("turmas_list", horario.height());
    var lista   = new Lista(ui_materias, ui_turmas, ui_logger, horario, ui_combinacoes, combinacoes);
    var combo   = new Combobox("materias_input", "materias_suggestions", ui_logger);

    combo.add_item = lista.adicionar;

    document.onkeydown = function(e) {
        var ev = e ? e : event;
        var c = ev.keyCode;
        if (ev.srcElement == combo.input)
            return;
        if (ev.srcElement == lista.selecao_atual) {
            var pos = -1;
            if (document.selection) {
                var range = document.selection.createRange();
                range.moveStart('character', -ev.srcElement.value.length);
                pos = range.text.length;
            } else {
                pos = ev.srcElement.selectionStart;
            }
            if (c == 13) {
                lista.selecao_atual.blur();
                lista.selecao_atual.focus();
            } else if (pos == ev.srcElement.value.length && c == 39) {
                lista.next();
            } else if (pos == 0 && c == 37) {
                lista.previous();
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
            lista.next();
        } else if (c == 37) {
            lista.previous();
        }
    };
    if (0) {
    //1a fase
    lista.adicionar("EEL7010");
    lista.adicionar("EEL7011");
    lista.adicionar("EGR5619");
    lista.adicionar("MTM5183");
    lista.adicionar("MTM5512");
    lista.adicionar("QMC5106");
    } else if (0) {
    //2a fase
    lista.adicionar("EEL7020");
    lista.adicionar("EEL7021");
    lista.adicionar("FSC5161");
    lista.adicionar("LLV5603");
    lista.adicionar("MTM5184");
    lista.adicionar("MTM5247");
    } else if (0) {
    //3a fase
    lista.adicionar("EEL7030");
    lista.adicionar("EEL7031");
    lista.adicionar("FSC5162");
    lista.adicionar("FSC5164");
    lista.adicionar("MTM5185");
    }
}
