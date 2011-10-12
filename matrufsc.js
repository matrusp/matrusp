/*
   Provide the XMLHttpRequest constructor for Internet Explorer 5.x-6.x:
   Other browsers (including Internet Explorer 7.x-9.x) do not redefine
   XMLHttpRequest if it already exists.
 
   This example is based on findings at:
   http://blogs.msdn.com/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx
*/
if (typeof XMLHttpRequest == "undefined")
  XMLHttpRequest = function () {
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
      catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
      catch (e) {}
    try { return new ActiveXObject("Microsoft.XMLHTTP"); }
      catch (e) {}
    //Microsoft.XMLHTTP points to Msxml2.XMLHTTP and is redundant
    throw new Error("This browser does not support XMLHttpRequest.");
  };

function Combobox(input, suggestions, logger, lista)
{
    var lastfetch  = new String();

    function select_item(item)
    {
        if (!self.item_array.length)
            return;
        if (self.selected_item != -1)
            self.item_array[self.selected_item].style.backgroundColor = self.color_0;
        if        (item >= self.n_items) {
            self.selected_item = 0;
        } else if (item <             0) {
            self.selected_item = self.n_items - 1;
        } else {
            self.selected_item = item;
        }
        self.item_array[self.selected_item].style.backgroundColor = self.color_1;
        self.suggestions.style.display = "";
    }
    function deselect_item()
    {
        if (self.selected_item != -1) {
            self.item_array[self.selected_item].style.backgroundColor = self.color_0;
            self.selected_item = -1;
        }
    }

    var self = this;
    self.color_0 = "white";
    self.color_1 = "#eeeeee";
    self.input       = document.getElementById(input);
    self.suggestions = document.getElementById(suggestions);
    self.logger      = logger;
    self.suggestions.className = "combobox";

    self.create_suggestions_table = function(str) {
        var ul = document.createElement("ul");
        var array = str.split("\n");

        self.suggestions.innerHTML = "";
        self.item_index = new Array();
        self.selected_item = -1;
        self.n_items = 0;

        for (var i = 0; i < array.length - 1; i++) {
            var li = document.createElement("li");
            var codigo = array[i].split(" ")[0];

            li.innerHTML   = array[i];
            li.onmouseover = function() { select_item(self.item_index[this.innerHTML.split(" ")[0]]); };
            li.onmouseout  = function() { deselect_item(); };
            li.onmousedown = function() { return false; };
            li.onmouseup   = function() {
                deselect_item();
                self.input.value = this.innerHTML.split("\t")[0];
                self.lista.adicionar(self.input.value);
                self.suggestions.style.display = "none";
                self.input.focus();
            };
            self.item_index[codigo] = i;

            self.item_array[i] = li;
            ul.appendChild(li);
        }
        self.suggestions.appendChild(ul);
        self.suggestions.style.display = "";

        self.n_items = array.length - 1;
    };
    self.select_item = select_item;
    self.item_array = new Array();
    self.selected_item = -1;
    self.n_items       =  0;

    self.input.style.fontFamily = "monospace";
    self.input.style.fontSize   = "11px";
    self.suggestions.style.fontFamily = "monospace";
    self.suggestions.style.fontSize   = "11px";
    self.suggestions.style.display = "none";

    self.input.onblur    = function() { self.suggestions.style.display = "none"; };
    self.input.onfocus   = function() { if (self.item_array[0]) self.suggestions.style.display = ""; };
    self.input.onkeydown = function(e) {
        var c = (e) ? e.keyCode : event.keyCode;
        if (c == 40 /* down */) {
            select_item(self.selected_item + 1);
        } else if (c == 38 /* up */) {
            select_item(self.selected_item - 1);
        } else if (c == 27 /* esc */) {
            deselect_item();
            self.suggestions.style.display = "none";
        } else if (c == 13 /* enter */) {
            if (self.selected_item != -1) {
                self.input.value = self.item_array[self.selected_item].innerHTML.split("\t")[0];
                deselect_item();
                self.suggestions.style.display = "none";
            }
            self.lista.adicionar(self.input.value);
        }
    };
    function suggestions_onreadystatechange()
    {
        if ((this.readyState == 4) && (this.status == 200) &&
            (this.searchstr == lastfetch)) {
            var str = this.responseText;
            if (str.length > 0) {
                self.create_suggestions_table(str);
                var n = str.split("\n").length - 1;
                var v = new String();
                if (n == 1) {
                    v = "1 vez";
                } else if (n == 10) {
                    v = "10 vezes ou mais";
                } else {
                    v = n + " vezes";
                }
                self.logger.set_text("'" + self.fetch + "' encontrado " + v, "lightgreen");
            } else {
                self.suggestions.innerHTML = "";
                self.selected_item = -1;
                self.n_items = 0;
                self.suggestions.style.display = "none";
                self.logger.set_text("'" + self.fetch + "' nao encontrado", "lightcoral");
            }
        }
    }
    self.input.onkeyup   = function (e) {
        var c = (e) ? e.keyCode : event.keyCode;
        var fetch = self.input.value;

        if (!((c >= 65 /* a */) && (c <=  90 /* z */)) &&
            !((c >= 48 /* 0 */) && (c <=  57 /* 9 */)) &&
            !((c >= 96 /* 0 */) && (c <= 105 /* 9 */)) &&
            c != 46 /* del */ && c != 8 /* backspace */)
            return;

        if (fetch.length > 0) {
            if (fetch != lastfetch) {
                fetch_request = new XMLHttpRequest();
                fetch_request.searchstr = fetch;
                fetch_request.onreadystatechange = suggestions_onreadystatechange;
                fetch_request.open("GET", "cgi-bin/fetch.cgi?q=" + encodeURIComponent(fetch.toUpperCase()), true);
                fetch_request.send(null);
                self.fetch = fetch;
                self.pontos = new String();
                self.logger.waiting("procurando '" + fetch + "'");
                lastfetch = fetch;
            }
        } else {
            self.suggestions.innerHTML = "";
            self.selected_item = -1;
            self.n_items = 0;
            self.suggestions.style.display = "none";
        }
    };

    self.lista = lista;
}

function Lista(materias_list, turmas_list, combinacoes_selector, logger, horario)
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
    }
    function turma_onmouseover()
    {
        var c       = self.combinacoes[self.combinacao_atual];
        var materia = self.selected_materia;
        var turmas  = this.getElementsByTagName("td")[1].innerHTML.split("<br>");
        var turma   = materia.turmas[turmas[0]];
        var current_turma = c && c[materia.codigo] ? c[materia.codigo].turma_representante : null;

        if (turma == self.displaying_turma)
            return;

        if (current_turma) {
            for (var i = 0; i < current_turma.aulas.length; i++) {
                var dia  = current_turma.aulas[i].dia;
                var hora = current_turma.aulas[i].hora;
                var n    = current_turma.aulas[i].n;
                for (var j = 0; j < n; j++) {
                    self.horario.array[dia][hora+j].innerHTML = materia.codigo;
                    self.horario.array[dia][hora+j].style.backgroundColor = "black";
                    self.horario.array[dia][hora+j].style.color = "white";
                }
            }
        }
        if (turma != current_turma) {
            for (var i = 0; i < turma.aulas.length; i++) {
                var dia  = turma.aulas[i].dia;
                var hora = turma.aulas[i].hora;
                var n    = turma.aulas[i].n;
                for (var j = 0; j < n; j++) {
                    self.horario.array[dia][hora+j].innerHTML = materia.codigo;
                    if (c && c[dia][hora+j] && c[dia][hora+j].horario.materia != materia) {
                        self.logger.set_text("choque de horario", "lightcoral");
                        self.horario.array[dia][hora+j].style.backgroundColor = "red";
                        self.horario.array[dia][hora+j].style.color = "black";
                    } else {
                        self.horario.array[dia][hora+j].style.backgroundColor = materia.cor;
                        self.horario.array[dia][hora+j].style.color = "black";
                    }
                }
            }
        }

        self.displaying_turma = turma;
    }
    function turma_onmouseout()
    {
        var c       = self.combinacoes[self.combinacao_atual];
        var materia = self.selected_materia;
        var turmas  = this.getElementsByTagName("td")[1].innerHTML.split("<br>");
        var turma   = materia.turmas[turmas[0]];
        var current_turma = c && c[materia.codigo] ? c[materia.codigo].turma_representante : null;

        if (!c) {
            self.displaying_turma = "";
            reset();
            return;
        }

        if (turma != current_turma) {
            for (var i = 0; i < turma.aulas.length; i++) {
                var dia  = turma.aulas[i].dia;
                var hora = turma.aulas[i].hora;
                var n    = turma.aulas[i].n;
                for (var j = 0; j < n; j++) {
                    display_cell(c[dia][hora+j], self.horario.array[dia][hora+j]);
                }
            }
        }

        if (current_turma) {
            for (var i = 0; i < current_turma.aulas.length; i++) {
                var dia  = current_turma.aulas[i].dia;
                var hora = current_turma.aulas[i].hora;
                var n    = current_turma.aulas[i].n;
                for (var j = 0; j < n; j++) {
                    display_cell(c[dia][hora+j], self.horario.array[dia][hora+j]);
                }
            }
        }

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
    }
    function create_turmas_list(materia)
    {
        self.turmas_list.innerHTML = "";

        self.turmas_table = document.createElement("table");
        self.turmas_tbody = document.createElement("tbody");
        self.turmas_table.className = "materias";
        self.turmas_table.style.width="100%";

        for (var i in materia.horarios) {
            var horario = materia.horarios[i];

            var row  = document.createElement("tr");
            row.onmouseover = turma_onmouseover;
            row.onmouseout  = turma_onmouseout;

            var data = document.createElement("td");
            for (var j in horario.turmas) {
                var turma = horario.turmas[j];
                var input = document.createElement("input");
                input.type     = "checkbox";
                input.checked  = turma.selected;
                input.value    = materia.codigo + " " + turma.turma;
                input.onchange = turma_changed;
                data.appendChild(input);
            }
            data.style.backgroundColor = materia.cor;
            data.style.width = "22px";
            row.appendChild(data);

            var data = document.createElement("td");
            data.onmouseup = turma_onmouseup;
            var innerHTML = new String();
            for (var j in horario.turmas) {
                var turma = horario.turmas[j];
                innerHTML += turma.turma + "<br>";
            }
            data.innerHTML = innerHTML;
            data.style.backgroundColor = materia.cor;
            data.style.width = "44px";
            row.appendChild(data);

            var data = document.createElement("td");
            data.onmouseup = turma_onmouseup;
            var innerHTML = new String();
            for (var j in horario.turmas) {
                var turma = horario.turmas[j];
                innerHTML += turma.professor + /*"(" + turma.xyz + ")" + */ "<br>";
            }
            data.style.backgroundColor = materia.cor;
            data.innerHTML = innerHTML;
            row.appendChild(data);

            self.turmas_tbody.appendChild(row);
        }

        self.turmas_table.appendChild(self.turmas_tbody);
        self.turmas_list.appendChild(self.turmas_table);

        self.selected_materia = materia;
    }

    function display_cell(data, graphic)
    {
        if (data && data.horario) {
            var innerHTML = new String();
            if (data.fixed)
                innerHTML += "<strong>";
            innerHTML += data.horario.materia.codigo;
            if (data.fixed)
                innerHTML += "</strong>";
            graphic.innerHTML = innerHTML;
            graphic.style.backgroundColor = data.horario.materia.cor;
            graphic.style.color = "black";
//if (data.fixed)
//    graphic.style.border = "2px solid black";
        } else {
            graphic.innerHTML = "";
            graphic.style.backgroundColor = "white";
            graphic.style.border = "1px solid black";
            graphic.style.color = "black";
        }
    }
    function reset()
    {
        for (var dia = 0; dia < 6; dia++) {
            for (var hora = 0; hora < 14; hora++) {
                var graphic = self.horario.array[dia][hora];
                graphic.innerHTML = "";
                graphic.style.backgroundColor = "white";
                graphic.style.border = "1px solid black";
                graphic.style.color = "black";
            }
        }
    }
    function display_combinacao(cc)
    {
        if (self.deselecionadas) {
            for (var i in self.deselecionadas) {
                var t = self.deselecionadas[i];
                self.materias[t.codigo].row.getElementsByTagName("td")[1].innerHTML = "xxxx";
            }
        }

        var c = self.combinacoes[cc];
        if (!c) {
            reset();
            return;
        }
        for (var dia = 0; dia < 6; dia++) {
            for (var hora = 0; hora < 14; hora++) {
                display_cell(c[dia][hora], self.horario.array[dia][hora]);
            }
        }
        for (var i in c.horarios_combo) {
            var t = c.horarios_combo[i].turma_representante;
            self.materias[t.materia.codigo].row.getElementsByTagName("td")[1].innerHTML = t.turma;
        }
        self.combinacao_atual = cc;
        self.combinacoes_selector.innerHTML = self.combinacoes.length + " combinacoes (" + cc + ")";
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
                        console.log("choque de horario, horario nao pode ser adicionado em nenhuma combinacao");
                    }
                }
                if (!ok3) {
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
        if (!self.materias_tbody) {
            self.materias_table = document.createElement("table");
            self.materias_tbody = document.createElement("tbody");
            self.materias_table.className = "materias";
            self.materias_table.style.width="100%";
            self.materias_table.appendChild(self.materias_tbody);
            self.materias_list.appendChild(self.materias_table);
        }

        var row  = document.createElement("tr");
        var data = document.createElement("td");
        data.onclick = materia_onclick;
        data.style.backgroundColor = materia.cor;
        data.style.width = "70px";
        data.innerHTML = materia.codigo;
        row.appendChild(data);
        var data = document.createElement("td");
        data.onclick = materia_onclick;
        data.style.backgroundColor = materia.cor;
        data.style.width = "44px";
        row.appendChild(data);
        var data = document.createElement("td");
        data.onclick = materia_onclick;
        data.style.backgroundColor = materia.cor;
        data.innerHTML = materia.nome;
        row.appendChild(data);
        var data = document.createElement("td");
        data.style.backgroundColor = materia.cor;
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
        if ((this.readyState == 4) && (this.status == 200)) {
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
    }
    function adicionar(materia)
    {
        full_request = new XMLHttpRequest();
        full_request.onreadystatechange = list_onreadystatechange;
        full_request.open("GET", "cgi-bin/full.cgi?q=" + encodeURIComponent(materia), true);
        full_request.send(null);
        self.full = materia;
        self.logger.waiting("buscando '" + materia + "'");
    }

    self.horario = horario;

    self.adicionar = adicionar;

    self.materias_list = document.getElementById(materias_list);

    self.materias_list.style.border = "1px solid black";
    self.materias_list.style.width  = "100%";
    self.materias_list.style.maxHeight = "110px"; // certinho 6 matérias
    self.materias_list.style.minHeight = "20px";

    self.turmas_list   = document.getElementById(turmas_list);

    self.turmas_list.style.border = "1px solid black";
    self.turmas_list.style.width  = "100%";
    self.turmas_list.style.height    = (self.horario.horario.offsetHeight-2) + "px";
    self.turmas_list.style.maxHeight = (self.horario.horario.offsetHeight-2) + "px";

    self.combinacoes_selector = document.getElementById(combinacoes_selector);
    self.combinacoes_selector.className = "horario";
    self.combinacoes_selector.style.border = "1px solid black";

    self.materias = new Object();
    self.selected_materia = "";
    self.displaying_turma = "";

    self.combinacao_atual = -1;
    self.previous = function(e) {
        if (!self.combinacoes || !self.combinacoes.length)
            return;
        var c = self.combinacao_atual - 1;
        if (c < 0)
            c = self.combinacoes.length - 1;
        display_combinacao(c);
    };
    self.next = function(e) {
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
}

function Horario(horario)
{
    var self = this;
    var dias  = [ "Segunda", "Ter\u00e7a", "Quarta", "Quinta", "Sexta", "S\u00e1bado" ];
    var horas = [ "07:30", "08:20", "09:10", "10:10", "11:00",
                  "13:30", "14:20", "15:10", "16:20", "17:10",
                  "18:30", "19:20", "20:20", "21:10"];
    self.horario = document.getElementById(horario);

    self.horario.style.border = "1px solid black";
    self.horario.style.width  = "100%";

    self.array = new Array();
    for (var i = 0; i < 6; i++) {
        self.array[i] = new Array();
    }

    self.table = document.createElement("table");
    self.thead = document.createElement("thead");

    var row = document.createElement("tr");
    row.appendChild(document.createElement("th"));
    for (var i = 0; i < dias.length; i++) {
        var head = document.createElement("th");
        head.className = "feiras";
        head.innerHTML = dias[i];
        row.appendChild(head);
    }
    self.thead.appendChild(row);

    self.table.appendChild(self.thead);

    self.tbody = document.createElement("tbody");
    for (var j = 0; j < horas.length; j++) {
        var row = document.createElement("tr");
        var hora = document.createElement("td");
        hora.innerHTML = horas[j];
        hora.className = "horario";
        row.appendChild(hora);
        for (var i = 0; i < dias.length; i++) {
            var data = document.createElement("td");
            data.className = "aula";
            self.array[i][j] = data;
            row.appendChild(data);
        }
        self.tbody.appendChild(row);
    }

    self.table.appendChild(self.tbody);
    self.horario.appendChild(self.table);
}

function Logger(logger)
{
    var self = this;

    self.logger = document.getElementById(logger).parentNode;
    self.logger.style.fontFamily = "monospace";
    self.logger.style.fontSize   = "13px";
    self.stop      = function() {
        if (self.timer) {
            clearTimeout(self.timer);
            self.timer = null;
        }
    }
    self.reset     = function () {
        self.stop();
        self.logger.innerHTML = "&lt;&lt;&lt;&lt; adicione materias aqui";
        self.logger.style.backgroundColor = "#eeeeee";
    };
    self.set_text  = function(str, color) {
        self.stop();
        self.logger.innerHTML = str;
        self.logger.style.backgroundColor = color;
        self.timer = setTimeout((function(t){return function(){t.reset();}})(self), 5000);
    }
    self.updatesearch = function() {
        self.pontos += ".";
        if (self.pontos == "....")
            self.pontos = ".";
        self.logger.innerHTML = self.str + self.pontos;
        self.timer = setTimeout((function(t){return function(){t.updatesearch();}})(self), 200);
    }
    self.waiting = function(str) {
        self.str = str;
        self.stop();
        self.pontos = "";
        self.updatesearch();
        self.logger.style.backgroundColor = "lightyellow";
    }
}

window.onload = function() {
    var logger  = new Logger("logger");
    var horario = new Horario("horario");
    var lista   = new Lista("materias_list", "turmas_list", "combinacoes_selector", logger, horario);
    var combo   = new Combobox("materias_input", "materias_suggestions", logger, lista);

    document.onkeypress = function(e) {
        var c = (e) ? e.charCode : event.keyCode;
        if (c == 46) {
            lista.next();
        } else if (c == 44) {
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

    logger.reset();
}
