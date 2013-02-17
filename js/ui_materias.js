/**
 * @constructor
 */
function UI_materias(id)
{
    var self = this;

    var list = document.getElementById(id);

    list.className = "ui_materias"

    var thiswidth = 882;

    var table;
    var thead;
    var tbody;
    var scroll_div;

    var mouseover_materia = null;
    var mouseout_materia = function() {
        if (mouseover_materia) {
            self.cb_onmouseout(mouseover_materia);
            mouseover_materia = null;
        }
    };
    function create() {
        table = document.createElement("table");
        thead = document.createElement("thead");
        table.cellPadding="1";
        table.cellSpacing="1";
        table.appendChild(thead);
        list.appendChild(table);
        var row  = document.createElement("tr");
        row.onmouseover = mouseout_materia;
        row.style.backgroundColor = "#eeeeee";
        var data = document.createElement("th");
        data.style.width = "22px";
        row.appendChild(data);
        var data = document.createElement("th");
        data.style.textAlign = "center";
        data.style.width = "60px";
        data.innerHTML = "C\u00f3digo";
        row.appendChild(data);
        var data = document.createElement("th");
        data.style.textAlign = "center";
        data.style.width = "50px";
        data.innerHTML = "Turma";
        row.appendChild(data);
        var data = document.createElement("th");
        data.style.textAlign = "center";
        data.style.width = "60px";
        data.innerHTML = "Período";
        row.appendChild(data);
        var data = document.createElement("th");
        data.id = "combinacoes";
        row.appendChild(data);
        thead.appendChild(row);

        scroll_div = document.createElement("div");
        scroll_div.style.overflow = "auto";
        scroll_div.style.maxHeight = "231px";
        table = document.createElement("table");
        table.cellPadding="1";
        table.cellSpacing="1";
        table.onmouseout = function(e) {
            if (!e) var e = window.event;
            var t = (window.event) ? e.srcElement : e.target;
            var rt = (e.relatedTarget) ? e.relatedTarget : e.toElement;
            while ( t &&  t.nodeName != "TABLE")
                 t =  t.parentNode;
            while (rt && rt.nodeName != "TABLE")
                rt = rt.parentNode;
            if (rt && t && t == rt)
                return;
            if (mouseover_materia) {
                self.cb_onmouseout(mouseover_materia);
                mouseover_materia = null;
            }
        };
        tbody = document.createElement("tbody");
        table.appendChild(tbody);
        scroll_div.appendChild(table);
        list.appendChild(scroll_div);
    }
    create();

    function reset() {
        var rows = tbody.getElementsByTagName("tr");
        while (rows[0])
            tbody.removeChild(rows[0]);
        self.fix_width();
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
        row.onmouseover = function() {
            if (mouseover_materia == this.materia)
                return;
            mouseout_materia();
            self.cb_onmouseover(this.materia);
            mouseover_materia = this.materia;
        };
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
        data.onclick = onclick;
        data.style.textAlign = "center";
        data.style.width = "60px";
        data.innerHTML = "";
        var semestre_str = materia.semestre.substring(0, 4) + "-" + materia.semestre.substring(4, 5);
        data.appendChild(document.createTextNode(semestre_str));
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
        self.fix_width();
    }

    /* functions */
    self.add = add;
    self.reset    = reset;
    self.fix_width = function() {
        if (table.offsetHeight <= scroll_div.offsetHeight)
            table.style.width = thiswidth + "px";
        else
            table.style.width = (thiswidth - document.scrollbar_width) + "px";
    };
    /* callbacks */
    self.cb_changed  = null;
    self.cb_select   = null;
    self.cb_onmouseover = null;
    self.cb_onmouseout = null;
    self.cb_onremove = null;
    self.cb_onclick  = null;
}
