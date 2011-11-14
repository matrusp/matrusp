function Lista(materias_list, turmas_list, logger, horario, ui_combinacoes)
{
    var self = this;

    self.logger = logger;

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
    function turma_changed()
    {
        var split   = this.value.split(" ");
        var materia = self.materias[split[0]];
        var turma   = materia.turmas[split[1]];
        turma.selected = this.checked;
        gerar_combinacoes();
        display_combinacao(0);
        undisplay_turma(turma);
        display_turma(turma);
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
        var c       = self.combinacoes[self.combinacao_atual];
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
                self.logger.set_text("choque de horario", "lightcoral");
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
        var c       = self.combinacoes[self.combinacao_atual];
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

        self.logger.reset();

        self.displaying_turma = "";
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
        gerar_combinacoes();
        display_combinacao(0);
        undisplay_turma(turma);
        display_turma(turma);
    }
    function create_turmas_list(materia)
    {
        self.turmas_list.innerHTML = "";

        self.turmas_table = document.createElement("table");
        self.turmas_tbody = document.createElement("tbody");
        self.turmas_table.className = "materias";
        self.turmas_table.style.width="330px";
        self.turmas_table.cellPadding="1";
        self.turmas_table.cellSpacing="1";

        for (var i in materia.horarios) {
            var horario = materia.horarios[i];

            var row  = document.createElement("tr");
            row.style.backgroundColor = materia.cor;
            row.style.cursor="pointer";
            row.onmouseover = function () { display_turma(this.turma); };
            row.onmouseout  = function () { undisplay_turma(this.turma); };

            var data = document.createElement("td");
            for (var j in horario.turmas) {
                var turma = horario.turmas[j];
                var input = document.createElement("input");
                input.type     = "checkbox";
                input.value    = materia.codigo + " " + turma.turma;
                input.onchange = turma_changed;
                data.appendChild(input);
                input.checked  = turma.selected;
            }
            data.style.width = "22px";
            row.appendChild(data);

            var data = document.createElement("td");
            data.onmouseup = turma_onmouseup;
            var innerHTML = new String();
            for (var j in horario.turmas) {
                var turma = horario.turmas[j];
                innerHTML += turma.turma + "<br>";
                if (!row.turma)
                    row.turma = turma;
            }
            data.innerHTML = innerHTML;
            data.style.width = "44px";
            row.appendChild(data);

            var data = document.createElement("td");
            data.onmouseup = turma_onmouseup;
            var innerHTML = new String();
            for (var j in horario.turmas) {
                var turma = horario.turmas[j];
                innerHTML += turma.professor + /*"(" + turma.xyz + ")" + */ "<br>";
            }
            data.innerHTML = innerHTML;
            row.appendChild(data);

            self.turmas_tbody.appendChild(row);
        }

        self.turmas_table.appendChild(self.turmas_tbody);
        self.turmas_list.appendChild(self.turmas_table);

        /* TODO determine scrollbar width */
        if (self.turmas_table.offsetHeight >= self.turmas_list.offsetHeight)
            self.turmas_table.style.width="310px";

        self.selected_materia = materia;
    }
    function display_combinacao(cc)
    {
        if (self.deselecionadas) {
            for (var i in self.deselecionadas) {
                var t = self.deselecionadas[i];
                self.materias[t.codigo].row.getElementsByTagName("td")[1].innerHTML = "<strike>XXXXXX</strike>";
            }
        }

        var c = self.combinacoes[cc];
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
        self.combinacao_atual = cc;
        ui_combinacoes.set_atual(cc+1);
        ui_combinacoes.set_total(self.combinacoes.length);
    }
    function valor_combinacao(c) {
        var sum = 0;
        for (dia = 0; dia < 6; dia++) {
            for (hora = 0; hora < 14; hora++) {
                if (c[dia][hora]) {
                    sum += hora;
                }
            }
        }
        return sum;
    }
    function comparar_combinacoes(a, b) {
        var va = valor_combinacao(a);
        var vb = valor_combinacao(b);
        return va - vb;
    }

    function gerar_combinacoes()
    {
/* TODO tentar manter selecao anterior (ou mais semelhante) */
        var combinacoes = new Array();
        var deselecionadas = new Array();
        for (var i in self.materias) {
            var materia = self.materias[i];
            var ok = 0;

            /* se nenhuma turma de nenhum horario da materia esta
             * selecionada, pular materia */
            for (var j in materia.horarios) {
                var horario = materia.horarios[j];
                for (var k in horario.turmas) {
                    if (horario.turmas[k].selected) {
                        ok = 1;
                        break;
                    }
                }
                if (ok)
                    break;
            }
            if (!ok) {
                deselecionadas[materia.codigo] = materia;
                continue;
            }

            if (!combinacoes.length) {
                for (var j in materia.horarios) {
                    var horario = materia.horarios[j];
                    var ok = 0;
                    for (var k in horario.turmas) {
                        if (horario.turmas[k].selected) {
                            ok = 1;
                            break;
                        }
                    }
                    if (!ok)
                        continue;
                    var combinacao = new Array();
                    for (var i2 = 0; i2 < 6; i2++) {
                        combinacao[i2] = new Array();
                    }
                    for (var k in horario.aulas) {
                        var aula = horario.aulas[k];
                        var dia  = aula.dia;
                        var hora = aula.hora;
                        var n    = aula.n;
                        for (var i3 = 0; i3 < n; i3++) {
                            combinacao[dia][hora+i3] = new Object();
                            combinacao[dia][hora+i3].horario = horario;
                        }
                    }
                    combinacao[materia.codigo] = horario;
                    combinacao.horarios_combo = new Array();
                    combinacao.horarios_combo.push(horario);
                    combinacoes.push(combinacao);
                }
            } else {
                var ok3 = 0;
                var combinacoes2 = new Array();
                for (var c in combinacoes) {
                    var combinacao = combinacoes[c];
                    var ok2 = 0;

                    for (var j in materia.horarios) {
                        var horario = materia.horarios[j];
                        var ok = 0;
                        for (var k in horario.turmas) {
                            if (horario.turmas[k].selected)
                                ok = 1;
                        }
                        if (!ok)
                            continue;
                        for (var k in horario.aulas) {
                            var aula = horario.aulas[k];
                            var dia  = aula.dia;
                            var hora = aula.hora;
                            var n    = aula.n;
                            for (var i3 = 0; i3 < n; i3++) {
                                if (combinacao[dia][hora+i3]) {
                                    ok = 0;
                                    break;
                                }
                            }
                            if (!ok) {
                                break;
                            }
                        }
                        if (!ok)
                            continue;
                        var c2 = new Array();
                        for (var i2 = 0; i2 < 6; i2++) {
                            c2[i2] = new Array();
                            for (var i3 = 0; i3 < 14; i3++) {
                                if (combinacao[i2][i3]) {
                                    c2[i2][i3] = new Object();
                                    c2[i2][i3].horario = combinacao[i2][i3].horario;
                                }
                            }
                        }
                        c2[materia.codigo] = horario;
                        c2.horarios_combo = new Array();
                        for (var k in combinacao.horarios_combo) {
                            c2[combinacao.horarios_combo[k].materia.codigo] = combinacao.horarios_combo[k];
                            c2.horarios_combo.push(combinacao.horarios_combo[k]);
                        }
                        for (var k in horario.aulas) {
                            var aula = horario.aulas[k];
                            var dia  = aula.dia;
                            var hora = aula.hora;
                            var n    = aula.n;
                            for (var i3 = 0; i3 < n; i3++) {
                                c2[dia][hora+i3] = new Object();
                                c2[dia][hora+i3].horario = horario;
                            }
                        }
                        c2.horarios_combo.push(horario);
                        combinacoes2.push(c2);
                        ok2 = 1;
                        ok3 = 1;
                    }
                    if (!ok2) {
                        if (navigator.userAgent.toLowerCase().indexOf("msie") < 0)
                        console.log("choque de horario, horario nao pode ser adicionado em nenhuma combinacao");
                    }
                }
                if (!ok3) {
                    if (navigator.userAgent.toLowerCase().indexOf("msie") < 0)
                    console.log("choque de horario, materia ", materia.codigo, " nao pode ser adicionado em nenhuma combinacao");
                    deselecionadas[materia.codigo] = materia;
                    /* TODO dar essa informacao ao usuario */
                } else {
                    combinacoes = combinacoes2;
                }
            }
        }
        var comum = new Array();
        for (var i = 0; i < 6; i++) {
            comum[i] = new Array();
            for (var j = 0; j < 14; j++) {
                comum[i][j] = 1;
            }
        }
        for (var cc in combinacoes) {
            var c = combinacoes[cc];
            for (dia = 0; dia < 6; dia++) {
                for (hora = 0; hora < 14; hora++) {
                    if (comum[dia][hora] == 1 && c[dia][hora]) {
                        comum[dia][hora] = c[dia][hora];
                    } else if (!c[dia][hora] || !c[dia][hora].horario || !comum[dia][hora] || !comum[dia][hora].horario) {
                        comum[dia][hora] = 0;
                    } else if (c[dia][hora].horario.materia.codigo != comum[dia][hora].horario.materia.codigo) {
                        comum[dia][hora] = 0;
                    }
                }
            }
        }
        for (var cc in combinacoes) {
            var c = combinacoes[cc];
            for (dia = 0; dia < 6; dia++) {
                for (hora = 0; hora < 14; hora++) {
                    if (comum[dia][hora]) {
                        c[dia][hora].fixed = 1;
                    }
                }
            }
        }
        combinacoes.sort(comparar_combinacoes);
        self.combinacoes = combinacoes;
        self.deselecionadas = deselecionadas;
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

        gerar_combinacoes();

        display_combinacao(0);

        self.logger.set_text("'" + codigo + "' removida", "lightgreen");
    }
    function materia_onclick()
    {
        var materia = self.materias[this.parentNode.getElementsByTagName("td")[0].innerHTML];
        create_turmas_list(materia);
    }
    function list_add_item(str)
    {
        var array = str.split("\n"); /* uma turma por item */
        var split = array[0].split("\t");

        if (self.materias[split[0]]) {
            self.logger.set_text("'" + split[0] + "' ja foi adicionada", "lightcoral");
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

        gerar_combinacoes();

        /* parte gráfica */
        var row  = document.createElement("tr");
        row.style.backgroundColor = materia.cor;
        row.style.cursor="pointer";
        var data = document.createElement("td");
        data.onclick = materia_onclick;
        data.style.width = "70px";
        data.innerHTML = materia.codigo;
        row.appendChild(data);
        var data = document.createElement("td");
        data.onclick = materia_onclick;
        data.style.width = "44px";
        row.appendChild(data);
        var data = document.createElement("td");
        data.onclick = materia_onclick;
        data.innerHTML = materia.nome;
        row.appendChild(data);
        var data = document.createElement("td");
        data.onclick = materia_onclick_remove;
        data.innerHTML = "X";
        data.style.width = "15px";
        data.style.textAlign = "center";
        row.appendChild(data);
        self.materias_tbody.appendChild(row);

        self.materias[materia.codigo].row = row;

        display_combinacao(0);

        self.logger.set_text("'" + materia.codigo + "' adicionada", "lightgreen");

//console.log(self.salvar());
    }
    function list_onreadystatechange()
    {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var str = this.responseText;
                if (self.timer) {
                    clearTimeout(self.timer);
                    self.timer = null;
                }
                if (str.length > 0) {
                    list_add_item(str);
                } else {
                    self.logger.set_text("'" + self.full + "' nao adicionada", "lightcoral");
                }
            }
            this.available = true;
        }
    }
    var full_requests = new Array();
    function full_request(materia) {
        var n = full_requests.length;
        for (var i = 0; i < n; i++)
            if (full_requests[i].available)
                break;
        if (i == n) {
            full_requests[i] = new XMLHttpRequest();
        }
        full_requests[i].available = false;
        full_requests[i].open("GET", "cgi-bin/full.cgi?q=" + encodeURIComponent(materia), true);
        full_requests[i].onreadystatechange = list_onreadystatechange;
        full_requests[i].send(null);
    }
    function adicionar(materia)
    {
        full_request(materia);
        self.full = materia;
        self.logger.waiting("buscando '" + materia + "'");
    }

    self.horario = horario;

    self.adicionar = adicionar;

    self.materias_list = document.getElementById(materias_list);

    self.materias_list.style.border = "1px solid black";
    self.materias_list.style.width  = "770px";

    {
        self.materias_table = document.createElement("table");
        self.materias_tbody = document.createElement("tbody");
        self.materias_table.className = "materias";
        self.materias_table.style.width="770px";
        self.materias_table.cellPadding="1";
        self.materias_table.cellSpacing="1";
        self.materias_table.appendChild(self.materias_tbody);
        self.materias_list.appendChild(self.materias_table);
        var row  = document.createElement("tr");
        row.style.backgroundColor = "#eeeeee";
        var data = document.createElement("td");
        data.style.width = "70px";
        data.innerHTML = "C\u00f3digo";
        row.appendChild(data);
        var data = document.createElement("td");
        data.style.width = "44px";
        data.innerHTML = "Turma";
        row.appendChild(data);
        var data = document.createElement("td");

        var t2 = document.createElement("table");
        t2.cellPadding="0";
        t2.cellSpacing="0";
        t2.style.width="100%";
        var tb2 = document.createElement("tbody");
        var r2  = document.createElement("tr");
        r2.appendChild(ui_combinacoes.get_td());
        var d2 = document.createElement("td");
        d2.style.textAlign = "right";
        d2.style.width="250px";
        d2.style.fontFamily = "monospace";
        d2.style.fontSize = "13px";
        d2.innerHTML = "crie atividades aqui >>>>";

        r2.appendChild(d2);
        tb2.appendChild(r2);
        t2.appendChild(tb2);
        data.appendChild(t2);

        row.appendChild(data);
        var data = document.createElement("td");
        data.onclick = materia_onclick_add;
        data.innerHTML = "<strong>+</strong>";
        data.style.cursor="pointer";
        data.style.width = "15px";
        data.style.textAlign = "center";
        row.appendChild(data);
        self.materias_tbody.appendChild(row);
    }

    self.turmas_list   = document.getElementById(turmas_list);

    self.turmas_list.style.border = "1px solid black";
    self.turmas_list.style.width  = "330px";
    self.turmas_list.style.height    = (self.horario.height()-2) + "px";
    self.turmas_list.style.maxHeight = (self.horario.height()-2) + "px";

    self.materias = new Object();
    self.selected_materia = "";
    self.displaying_turma = "";

    self.combinacao_atual = -1;
    self.previous = function() {
        if (!self.combinacoes || !self.combinacoes.length)
            return;
        var c = self.combinacao_atual - 1;
        if (c < 0)
            c = self.combinacoes.length - 1;
        display_combinacao(c);
    };
    self.next = function() {
        if (!self.combinacoes || !self.combinacoes.length)
            return;
        var c = self.combinacao_atual + 1;
        if (c >= self.combinacoes.length)
            c = 0;
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
        if (!self.combinacoes || !self.combinacoes.length)
            return;
        var int = parseInt(val);
        if (int.toString() == val && val >= 1 && val <= self.combinacoes.length) {
            self.logger.reset();
            display_combinacao(val - 1);
        } else {
            self.logger.set_text("Combina\u00e7\u00e3o inv\u00e1lida", "lightcoral");
        }
    };
    ui_combinacoes.previous = self.previous;
    ui_combinacoes.next = self.next;
}

window.onload = function() {
    dconsole = new Dconsole("dconsole");
    var logger  = new Logger("logger");
    var horario = new Horario("horario");
    var ui_combinacoes = new UI_combinacoes();
    var lista   = new Lista("materias_list", "turmas_list", logger, horario, ui_combinacoes);
    var combo   = new Combobox("materias_input", "materias_suggestions", logger, lista.adicionar);

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
