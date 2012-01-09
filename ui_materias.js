/**
 * @constructor
 */
function UI_materias(id, ui_combinacoes)
{
    var self = this;

    var list = document.getElementById(id);

    list.className = "ui_materias"

    var table;
    var tbody;

    function create() {
        table = document.createElement("table");
        tbody = document.createElement("tbody");
        table.cellPadding="1";
        table.cellSpacing="1";
        table.appendChild(tbody);
        list.appendChild(table);
        var row  = document.createElement("tr");
        row.style.backgroundColor = "#eeeeee";
        var data = document.createElement("td");
        data.style.width = "22px";
        row.appendChild(data);
        var data = document.createElement("td");
        data.style.textAlign = "center";
        data.style.width = "60px";
        data.innerHTML = "C\u00f3digo";
        row.appendChild(data);
        var data = document.createElement("td");
        data.style.textAlign = "center";
        data.style.width = "50px";
        data.innerHTML = "Turma";
        row.appendChild(data);
        var data = document.createElement("td");
        data.id = "combinacoes";
        row.appendChild(data);
        var data = document.createElement("td");
        data.innerHTML = "";
        data.style.width = "15px";
        row.appendChild(data);
        var data = document.createElement("td");
        data.innerHTML = "";
        data.style.width = "15px";
        row.appendChild(data);
        var data = document.createElement("td");
        data.innerHTML = "";
        data.style.width = "15px";
        row.appendChild(data);
        tbody.appendChild(row);
    }
    create();

    function reset() {
        var rows = tbody.getElementsByTagName("tr");
        while (rows[1])
            tbody.removeChild(rows[1]);
    }

    self.input = null;

    function onclick() { self.cb_onclick(this.parentNode.materia); };
    function onremove() { this.onmouseout(); self.cb_onremove(this.parentNode.materia); };
    function onmoveup() { this.onmouseout(); self.cb_onmoveup(this.parentNode.materia); };
    function onmovedown() { this.onmouseout(); self.cb_onmovedown(this.parentNode.materia); };
    function hover_off() { this.style.backgroundColor = this.oldbg; this.style.color = "black"; };
    function hover_on()  { this.style.backgroundColor = "black"; this.style.color = this.oldbg; };
    function edit_start(row, attr) {
        var data = row.editable_cell[attr];
        data.innerHTML = "";
        var div = document.createElement("div");
        div.style.overflow="hidden";
        var input = document.createElement("input");
        input.className = "ui_materias_edit_input";
        input.value = row.materia[attr];
        if (attr == "codigo")
            input.maxLength = "7";
        input.onblur = function() {
            if (this.value != row.materia[attr])
                self.cb_changed(row.materia, attr, this.value);
            data.innerHTML = "";
            data.appendChild(document.createTextNode(row.materia[attr]));
            self.input = null;
        };
        input.onkeydown = function(e) {
            var ev = e ? e : event;
            var c = ev.keyCode;
            if (c == 27) {
                this.value = row.materia[attr];
                this.blur();
            } else if (c == 13) {
                this.blur();
            }
        }
        self.input = input;
        div.appendChild(input);
        data.appendChild(div);
        input.focus();
    };
    function add(materia) {
        var row  = document.createElement("tr");
        row.editable_cell = new Object();
        row.onmouseover = function() { self.cb_onmouseover(this.materia); };
        row.onmouseout  = function() { self.cb_onmouseout(this.materia); };
        row.style.backgroundColor = materia.cor;
        row.style.cursor="pointer";
        var data = document.createElement("td");
        var input = document.createElement("input");
        input.title = "selecionar/deselecionar matéria";
        input.type     = "checkbox";
        input.materia  = materia;
        materia_onchange = function() { self.cb_select(this.materia, this.checked); };
        input.onchange = materia_onchange;
        if (navigator.userAgent.toLowerCase().indexOf("msie") > -1) {
            input.onclick = function() { this.blur() };
        }
        input.checked  = true;
        data.appendChild(input);
        materia.ui_selected = input;
        data.style.width = "22px";
        row.appendChild(data);
        var data = document.createElement("td");
        data.ondblclick = function() { edit_start(this.parentNode, "codigo"); };
        data.onclick = onclick;
        data.style.textAlign = "center";
        data.style.width = "60px";
        data.innerHTML = "";
        data.appendChild(document.createTextNode(materia.codigo));
        row.appendChild(data);
        row.editable_cell["codigo"] = data;
        var data = document.createElement("td");
        data.onclick = onclick;
        data.style.width = "50px";
        materia.ui_turma = data;
        row.appendChild(data);
        var data = document.createElement("td");
        data.ondblclick = function() { edit_start(this.parentNode, "nome"); };
        data.onclick = onclick;
        data.innerHTML = "";
        data.appendChild(document.createTextNode(materia.nome));
        row.appendChild(data);
        row.editable_cell["nome"] = data;
        var data = document.createElement("td");
        data.style.fontSize = "15px";
        data.style.MozUserSelect = "none";
        data.style.KhtmlUserSelect = "none";
        data.onselectstart = function () { return false; };
        data.oldbg = materia.cor;
        data.onmouseout  = hover_off;
        data.onmouseover = hover_on;
        data.onclick = onmovedown;
        data.innerHTML = "\u2193";
        data.title = "diminuir prioridade da matéria";
        data.style.width = "15px";
        data.style.textAlign = "center";
        row.appendChild(data);
        var data = document.createElement("td");
        data.style.fontSize = "15px";
        data.style.MozUserSelect = "none";
        data.style.KhtmlUserSelect = "none";
        data.onselectstart = function () { return false; };
        data.oldbg = materia.cor;
        data.onmouseout  = hover_off;
        data.onmouseover = hover_on;
        data.onclick = onmoveup;
        data.innerHTML = "\u2191";
        data.title = "aumentar prioridade da matéria";
        data.style.width = "15px";
        data.style.textAlign = "center";
        row.appendChild(data);
        var data = document.createElement("td");
        data.style.MozUserSelect = "none";
        data.style.KhtmlUserSelect = "none";
        data.onselectstart = function () { return false; };
        data.oldbg = materia.cor;
        data.onmouseout  = hover_off;
        data.onmouseover = hover_on;
        data.onclick = onremove;
        data.innerHTML = "X";
        data.title = "remover matéria";
        data.style.width = "15px";
        data.style.textAlign = "center";
        row.appendChild(data);
        tbody.appendChild(row);
        row.materia = materia;
        materia.row = row;
    }

    /* functions */
    self.add = add;
    self.reset    = reset;
    /* callbacks */
    self.cb_changed  = null;
    self.cb_select   = null;
    self.cb_onmouseover = null;
    self.cb_onmouseout = null;
    self.cb_onremove = null;
    self.cb_onclick  = null;
}
