/**
 * @constructor
 */
function UI_turmas(id)
{
    var self = this;

    var current_materia = null;
    var current_turma = null;
    var insert_before = null;
    var old_cb_onmouseout = null;

    list = document.getElementById(id);

    var thiswidth = 438;

    list.className = "ui_turmas";
    list.style.width  = thiswidth + "px";

    function onmouseup() {
        var checkboxes = this.parentNode.getElementsByTagName("td")[0].getElementsByTagName("input");
        var at_least_one_selected = 0;
        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                at_least_one_selected = 1;
                break;
            }
        }
        for (var i = 0; i < checkboxes.length; i++) {
            self.cb_changed(checkboxes[i].turma, !at_least_one_selected);
            checkboxes[i].checked = !at_least_one_selected;
        }
        self.cb_updated(null);
    }
    
    function add_row_horario(table, dia, hora_inicio, hora_fim, before){
			var tr = document.createElement("tr");
			
			var td = document.createElement("td");
			var div = document.createElement("div");
	        div.style.overflow="hidden";
			var select = document.createElement("select");
			var dias = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
			for (var i = 0; i < 6; i++){
				var option = document.createElement("option");
				if (i == dia)
					option.selected = "selected";
				option.value = i
				option.innerHTML = dias[i];
				select.appendChild(option);
			}
			div.appendChild(select);
			td.appendChild(div);
			tr.appendChild(td);
			
			var td = document.createElement("td");
			var div = document.createElement("div");
	        div.style.overflow="hidden";
			var input = document.createElement("input");
	        input.className = "ui_materias_edit_input";
	        input.value = hora_inicio;
			div.appendChild(input);
			td.appendChild(div);
			tr.appendChild(td);
			
			var td = document.createElement("td");
			var div = document.createElement("div");
	        div.style.overflow="hidden";
			var input = document.createElement("input");
	        input.className = "ui_materias_edit_input";
	        input.value = hora_fim;
			div.appendChild(input);
			td.appendChild(div);
			tr.appendChild(td);
	        
	        var td = document.createElement("td");
		    td.style.MozUserSelect = "none";
		    td.style.KhtmlUserSelect = "none";
		    td.onselectstart = function () { return false; };
			td.oldbg = "#EEEEEE";
		    td.onmouseout  = function() { this.style.backgroundColor = this.oldbg; this.style.color = "black"; };
		    td.onmouseover = function() { this.style.backgroundColor = "black"; this.style.color = this.oldbg; };
		    td.onclick = function() { this.parentNode.parentNode.removeChild(this.parentNode); };
		    td.innerHTML = "X";
		    td.title = "remover horário";
		    td.style.width = "15px";
			tr.appendChild(td);
			if(before)
			    table.insertBefore(tr, before);
			else
    			table.appendChild(tr);
    }
    
    function edit_start(turma) {
        current_turma = turma;
        var row = current_turma.row;
        row.style.backgroundColor = "black";
        row.style.color           = "white";
        
        var horarios = self.edit_horario.tBodies[0];
        horarios.innerHTML = "";
		
		turma.aulas.forEach(function (aula) {
			add_row_horario(horarios, aula.dia, aula.hora_inicio, aula.hora_fim);
		});
		
		var buttons_tr = document.createElement("tr");
		var buttons_td = document.createElement("td");
		buttons_td.colSpan = "4";
		buttons_td.style.padding = "10px";
		
		var new_aula = document.createElement("span");
		new_aula.className = "ui_turmas_big_button";
		new_aula.innerHTML = "nova aula";
        new_aula.onselectstart = function () { return false; };
		new_aula.onclick   = function () { add_row_horario(horarios, 0, "06:00", "07:00", buttons_tr); return false;};
		buttons_td.appendChild(new_aula);
		
		var save = document.createElement("span");
		save.className = "ui_turmas_big_button";
		save.marginLeft = (thiswidth/3);
		save.innerHTML = "salvar";
        save.onselectstart = function () { return false; };
		save.onclick   = function () { self.cb_ok(); return false;};
		buttons_td.appendChild(save);
		
		var cancel = document.createElement("span");
		cancel.className = "ui_turmas_big_button";
		cancel.marginLeft = 2 * (thiswidth/3);
		cancel.innerHTML = "cancelar";
        cancel.onselectstart = function () { return false; };
        cancel.onclick = function () { self.cb_cancel(); return false; };
		buttons_td.appendChild(cancel);
		
		buttons_tr.appendChild(buttons_td);
		horarios.appendChild(buttons_tr);
        
        self.edit_horario.style.display = "table";
        self.table.style.display = "none";
//        self.ok_button.style.display = "";
//        self.cancel_button.style.display = "";
        old_cb_onmouseout = self.cb_onmouseout;
        self.cb_onmouseout = function() {};
    }
    
    function get_aulas() {
        var aulas = [];
        var tabela = self.edit_horario.tBodies[0];
        for (var i = 0; i < tabela.rows.length - 1; i++) {
            var row = tabela.rows[i];
            var aula = []
            for (var j = 0; j < row.cells.length - 1; j++) {
                var cell = row.cells[j];
                aula.push(cell.firstChild.firstChild.value);
            }
            aulas.push(aula);
        }
        return aulas;
    }
    
    function edit_end() {
        if (current_turma) {
            var row = current_turma.row;
            row.style.backgroundColor = current_materia.cor;
            row.style.color           = "black";
//            self.ok_button.style.display = "none";
//            self.cancel_button.style.display = "none";
	        self.edit_horario.style.display = "none";
	        self.table.style.display = "table";
            self.cb_onmouseout = old_cb_onmouseout;
            
        }
    }
    function remove_turma(turma) {
        var row = turma.row;
        row.parentNode.removeChild(row);
        self.fix_height();
    }
    function stop_propagation(e)
    {
        if (!e) var e = window.event;
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    }
    function hover_off() { this.style.backgroundColor = this.oldbg; this.style.color = "black"; };
    function hover_on()  { this.style.backgroundColor = "black"; this.style.color = this.oldbg; };
    var mouseover_turma = null;
    var mouseout_turma = function() {
        if (mouseover_turma) {
            mouseover_turma.row.menu_div.style.display = "none";
            mouseover_turma.row.menu_v.style.borderBottom = "1px solid black";
            mouseover_turma.row.menu_v.onmouseout  = hover_off;
            mouseover_turma.row.menu_v.onmouseover = hover_on;
            mouseover_turma.row.menu_v.style.backgroundColor = current_materia.cor;
            mouseover_turma.row.menu_v.style.color = "black";
            mouseover_turma.row.menu.style.display = "none";
            mouseover_turma.row.menu.style.top = "0px";
            mouseover_turma.row.inner_div.style.zIndex = 0;
            self.cb_onmouseout(mouseover_turma);
            mouseover_turma = null;
        }
    };
    function new_turma(horario) {
        var row  = document.createElement("tr");
        row.style.backgroundColor = current_materia.cor;
        row.onmouseover = function() {
            if (mouseover_turma == this.turma)
                return;
            mouseout_turma();
            this.menu.style.display = "block";
            self.cb_onmouseover(this.turma);
            mouseover_turma = this.turma;
        };
        mouseover_turma = null;

        var data = document.createElement("td");
        for (var j in horario.turmas) {
            var turma = horario.turmas[j];
            var input = document.createElement("input");
            input.title = "selecionar/deselecionar turma";
            input.type     = "checkbox";
            input.turma    = turma;
            input.onchange = function() {
                self.cb_changed(this.turma, this.checked);
                self.cb_updated(null);
            };
            if (navigator.userAgent.toLowerCase().indexOf("msie") > -1) {
                input.onclick = function() { this.blur() };
            }
            data.appendChild(input);
            input.checked  = turma.selected;
        }
        row.appendChild(data);

        var data = document.createElement("td");
        data.onmouseup = onmouseup;
        for (var j in horario.turmas) {
            var turma = horario.turmas[j];
            var div = document.createElement("div");
            var content = turma.nome;
            var index_plus = content.indexOf("+");
            if (index_plus == -1)
            	content = "<a href=\"https://uspdigital.usp.br/jupiterweb/jupTurma?sgldis=" + 
            	turma.materia.codigo + "&codtur="+ content + "\" target=\"_blank\">" + content.slice(5) + "</a>";
            else
            	content = "<a href=\"https://uspdigital.usp.br/jupiterweb/jupTurma?sgldis=" + 
            	turma.materia.codigo + "&codtur="+ content.slice(0,index_plus) + "\" target=\"_blank\">" + 
            	content.slice(5, index_plus) + "</a>+<a href=\"https://uspdigital.usp.br/jupiterweb/jupTurma?sgldis=" + 
            	turma.materia.codigo + "&codtur="+ content.slice(0, 5) + content.slice(index_plus + 1) + 
            	"\" target=\"_blank\">" + content.slice(index_plus + 1) + "</a>";
            
            div.innerHTML = content;
            div.style.textAlign = "center";
            data.appendChild(div);
            if (!row.turma) {
                row.turma = turma;
                turma.row = row;
            }
        }
        row.appendChild(data);

/*        var twochars = function(n) {
            var str = "";
            if (n < 10)
                str += "&nbsp;";
            str += n;
            return str;
        }
        var data = document.createElement("td");
        data.onmouseup = onmouseup;
        for (var j in horario.turmas) {
            var div = document.createElement("div");
            var turma = horario.turmas[j];
            var innerHTML = "(" + twochars(turma.vagas_ocupadas);
            if (turma.pedidos_sem_vaga != 0)
                innerHTML += "+" + twochars(turma.pedidos_sem_vaga);
            else
                innerHTML += "&nbsp;&nbsp;&nbsp;";
            innerHTML += ")/" + twochars(turma.vagas_ofertadas);
            div.innerHTML = innerHTML;
            if (turma.vagas_ocupadas >= turma.vagas_ofertadas || turma.pedidos_sem_vaga)
                div.style.color = "red";
            else
                div.style.color = "green";
            data.appendChild(div);
            if (!row.turma) {
                row.turma = turma;
                turma.row = row;
            }
        }
        row.appendChild(data);
*/
        var data = document.createElement("td");
        data.onmouseup = onmouseup;
        var inner_div = document.createElement("div");
        inner_div.style.position = "relative";
        for (var j in horario.turmas) {
            var turma = horario.turmas[j];
            var prof = new String;
            for (var p = 0; p < turma.professores.length; p++) {
                var div = document.createElement("div");
                div.innerHTML = turma.professores[p];
                inner_div.appendChild(div);
            }
        }
        if (!inner_div.innerHTML)
            inner_div.innerHTML = "&nbsp;";
        data.appendChild(inner_div);
        row.appendChild(data);

        var menu = document.createElement("div");
        menu.className = "ui_turmas_menu";
        inner_div.appendChild(menu);

        var menu_v = document.createElement("div");
        menu_v.className = "ui_turmas_menu_v";
        menu_v.style.backgroundColor = current_materia.cor;
        menu_v.innerHTML = "V";
        menu_v.title = "clique aqui para editar ou remover turma";
        menu_v.oldbg = current_materia.cor;
        menu_v.onmouseout  = hover_off;
        menu_v.onmouseover = hover_on;
        menu_v.row = row;
        menu_v.data = data;
        menu_v.onmouseup = function(e) {
            if (menu_div.style.display == "block") {
                menu_div.style.display = "none";
                menu_v.style.borderBottom = "1px solid black";
                menu_v.onmouseout  = hover_off;
                menu_v.onmouseover = hover_on;
                menu_v.style.backgroundColor = current_materia.cor;
                menu_v.style.color = "black";
                menu.style.top = "0px";
                inner_div.style.zIndex = 0;
            } else {
                menu_div.style.display = "block";
                menu_v.style.borderBottom = "0";
                menu_v.onmouseout  = function(){};
                menu_v.onmouseover = function(){};
                menu_v.style.backgroundColor = "black";
                menu_v.style.color = current_materia.cor;
                var goback = (list.offsetHeight + list.scrollTop) - (menu_div.offsetHeight + menu_v.offsetHeight + menu_v.row.offsetTop);
                if (goback > 0)
                    goback = 0;
                menu.style.top = goback + "px";
                inner_div.style.zIndex = 100;
            }
            stop_propagation(e);
        }
        menu_v.onselectstart = function () { return false; };
        menu.appendChild(menu_v);

        var menu_div = document.createElement("div");
        menu_div.className = "ui_turmas_menu_div";
        menu_div.style.backgroundColor = current_materia.cor;
        menu.appendChild(menu_div);

        var menu_soessa = document.createElement("div");
        menu_soessa.innerHTML = "selecionar só<br />essa turma";
        menu_soessa.title = "seleciona só essa turma";
        menu_soessa.oldbg = current_materia.cor;
        menu_soessa.onmouseout  = hover_off;
        menu_soessa.onmouseover = hover_on;
        menu_soessa.onselectstart = function () { return false; };
        menu_soessa.horario = row.turma.horario;
        menu_soessa.onmouseup = function(e) {
            var at_least_one_selected = false;
            for (var i in current_materia.turmas) {
                var turma = current_materia.turmas[i];
                if (turma.horario == this.horario && turma.selected) {
                    at_least_one_selected = true;
                    break;
                }
            }
            for (var i in current_materia.turmas) {
                var turma = current_materia.turmas[i];
                if (turma.horario == this.horario) {
                    if (!at_least_one_selected)
                        self.cb_changed(turma, true);
                } else {
                    self.cb_changed(turma, false);
                }
            }
            stop_propagation(e);
            self.cb_updated(current_materia);
        }
        menu_div.appendChild(menu_soessa);
        var menu_remover = document.createElement("div");
        menu_remover.innerHTML = "remover turma";
        menu_remover.title = "remover turma";
        menu_remover.oldbg = current_materia.cor;
        menu_remover.onmouseout  = hover_off;
        menu_remover.onmouseover = hover_on;
        menu_remover.onselectstart = function () { return false; };
        menu_remover.turma = row.turma;
        menu_remover.onmouseup = function(e) {
            self.cb_remove_turma(row.turma);
            stop_propagation(e);
        }
        menu_div.appendChild(menu_remover);
        var menu_editar = document.createElement("div");
        menu_editar.innerHTML = "editar turma";
        menu_editar.title = "editar horário desta turma";
        menu_editar.oldbg = current_materia.cor;
        menu_editar.onmouseout  = hover_off;
        menu_editar.onmouseover = hover_on;
        menu_editar.onselectstart = function () { return false; };
        menu_editar.turma = row.turma;
        menu_editar.onmouseup = function(e) {
            self.cb_edit_turma(row.turma);
            stop_propagation(e);
        }
        menu_div.appendChild(menu_editar);

        row.menu = menu;
        row.menu_v = menu_v;
        row.menu_div = menu_div;
        row.inner_div = inner_div;

        self.tbody.insertBefore(row, insert_before);
        self.fix_height();
    }
    var create = function(materia) {
        list.innerHTML = "<table id=\"edit_horario\"><thead><tr><td>Dia</td>\
        <td>Hora início</td><td>Hora fim</td><td class=\"edit_horario_remover\"></td></tr></thead><tbody>\
        </tbody></table>";
        
		self.edit_horario = document.getElementById("edit_horario");
        insert_before = null;

        current_materia = materia;

        self.table = document.createElement("table");
        self.tbody = document.createElement("tbody");
        self.table.style.width= thiswidth + "px";
        self.table.cellPadding="1";
        self.table.cellSpacing="1";

        self.thead = document.createElement("thead");
        self.table.style.width= thiswidth + "px";
        self.table.cellPadding="1";
        self.table.cellSpacing="1";
        self.table.appendChild(self.thead);
        var row  = document.createElement("tr");
        row.style.backgroundColor = "#eeeeee";
        row.onmouseover = mouseout_turma;
        var data = document.createElement("td");
        var button = document.createElement("div");
        button.className = "ui_turmas_all_menu_v";
        button.innerHTML = "V";
        button.onselectstart = function () { return false; };
        data.appendChild(button);
        self.button_menu = button;
        var menu = document.createElement("div");
        menu.className = "ui_turmas_all_menu";
        button.appendChild(menu);
        var menu_op = document.createElement("div");
        menu_op.innerHTML = "selecionar tudo";
        menu_op.onclick = function(e) {
            for (var i in current_materia.turmas)
                self.cb_changed(current_materia.turmas[i], true);
            stop_propagation(e);
            self.cb_updated(current_materia);
        };
        menu.appendChild(menu_op);
        var menu_op = document.createElement("div");
        menu_op.innerHTML = "selecionar nada";
        menu_op.onclick = function(e) {
            for (var i in current_materia.turmas)
                self.cb_changed(current_materia.turmas[i], false);
            stop_propagation(e);
            self.cb_updated(current_materia);
        };
        menu.appendChild(menu_op);
        var menu_op = document.createElement("div");
        menu_op.innerHTML = "adicionar turma";
        menu_op.onclick = function(e) { self.cb_new_turma(); };
        menu.appendChild(menu_op);
        data.style.width = "22px";
        row.appendChild(data);
        var data = document.createElement("td");
        data.style.textAlign = "center";
        data.innerHTML = "Turma";
        data.style.width = "44px";
        row.appendChild(data);
/*        var data = document.createElement("td");
        data.style.textAlign = "center";
        data.title = "Ocupadas / Oferdatas (+ Pedidos sem vaga)";
        data.innerHTML = "Vagas Ocupadas";
        data.style.width = "72px";
        row.appendChild(data);
*/        var data = document.createElement("td");
        data.style.textAlign = "center";
        data.innerHTML = "Professores";
        row.appendChild(data);
        self.thead.appendChild(row);

        self.table.onmouseout = function(e) {
            if (!e) var e = window.event;
            var t = (window.event) ? e.srcElement : e.target;
            var rt = (e.relatedTarget) ? e.relatedTarget : e.toElement;
            while ( t &&  t.nodeName != "TABLE")
                 t =  t.parentNode;
            while (rt && rt.nodeName != "TABLE")
                rt = rt.parentNode;
            if (rt && t && t == rt)
                return;
            mouseout_turma();
        };

        for (var i in current_materia.horarios) {
            var horario = current_materia.horarios[i];
            if (current_materia.agrupar == 1) {
                new_turma(horario);
            } else {
                for (var k in horario.turmas) {
                    var turma = horario.turmas[k];
                    var tmp = new Object();
                    tmp.turmas = new Object();
                    tmp.turmas[turma.nome] = turma;
                    new_turma(tmp);
                }
            }
        }
        var row  = document.createElement("tr");
        row.style.backgroundColor = "#eeeeee";
        row.onmouseover = mouseout_turma;

        var data = document.createElement("td");
        var input = document.createElement("input");
        input.type     = "checkbox";
        input.onchange = function() { self.cb_toggle_agrupar(); };
        if (navigator.userAgent.toLowerCase().indexOf("msie") > -1) {
            input.onclick = function() { this.blur() };
        }
        data.appendChild(input);
        input.checked = materia.agrupar;
        data.style.width = "22px";
        row.appendChild(data);

        var data = document.createElement("td");
        data.colSpan = "2";
        data.onmouseup = function() { self.cb_toggle_agrupar(); };
        data.style.fontSize = "13px"
        data.innerHTML = "agrupar turmas com horários iguais";
        row.appendChild(data);

        self.tbody.appendChild(row);
        insert_before = row;

/*
        var button = document.createElement("span");
        button.className = "ui_turmas_big_button";
        button.style.marginLeft = ((thiswidth/2) - 100) + "px";
        button.style.display = "none";
        button.innerHTML = "<strong>OK</strong>";
        button.onselectstart = function () { return false; };
        button.onclick = function () { self.cb_ok(); return false; };
        list.appendChild(button);
        self.ok_button = button;

        var button = document.createElement("span");
        button.className = "ui_turmas_big_button";
        button.style.marginLeft = ((thiswidth/2)) + "px";
        button.style.display = "none";
        button.innerHTML = "<strong>Cancelar</strong>";
        button.onselectstart = function () { return false; };
        button.onclick = function () { self.cb_cancel(); return false; };
        list.appendChild(button);
        self.cancel_button = button;
*/

        self.table.appendChild(self.tbody);
        list.appendChild(self.table);
        self.fix_height();
    }

    self.old_cb_onmouseover = null;
    self.old_cb_onmouseout  = null;

    /* procedures */
    self.create = create;
    self.reset = function() { list.innerHTML = ""; insert_before = null; current_materia = null; };
    self.new_turma = new_turma;
    self.remove_turma = remove_turma;
    self.edit_start = edit_start;
    self.edit_end   = edit_end;
    /* functions */
    self.get_current = function() { return current_materia; };
    self.set_height = function(height) {
        list.style.height    = (height-2) + "px";
        list.style.maxHeight = (height-2) + "px";
        self.fix_height();
    };
    self.get_aulas = get_aulas;
    self.fix_height = function() {
        if (!self.table || !self.edit_horarios)
            return;
        if (self.table.offsetHeight < list.offsetHeight) {
        	self.edit_horarios.style.width = thiswidth + "px";
            self.table.style.width = thiswidth + "px";
        }
        else {
        	self.edit_horarios.style.width = (thiswidth - document.scrollbar_width) + "px";
            self.table.style.width = (thiswidth - document.scrollbar_width) + "px";
        }
    };
    /* callbacks */
    self.cb_toggle_agrupar= null;
    self.cb_edit_turma   = null;
    self.cb_remove_turma = null;
    self.cb_new_turma    = null;
    self.cb_onmouseover  = null;
    self.cb_onmouseout   = null;
    self.cb_updated      = null;
    self.cb_changed      = null;
    self.cb_ok           = null;
    self.cb_cancel       = null;
}
