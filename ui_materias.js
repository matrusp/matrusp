function UI_materias(id, ui_combinacoes)
{
    var self = this;

    var list = document.getElementById(id);

    list.style.border = "1px solid black";
    list.style.width  = "770px";

    var table;
    var tbody;

    function create() {
        table = document.createElement("table");
        tbody = document.createElement("tbody");
        table.className = "materias";
        table.style.width="770px";
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
        data.style.width = "70px";
        data.innerHTML = "C\u00f3digo";
        row.appendChild(data);
        var data = document.createElement("td");
        data.style.width = "44px";
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

    function onclick() { self.cb_onclick(this.parentNode.materia); };
    function onremove() { self.cb_onremove(this.parentNode.materia); };
    function onmoveup() { self.cb_onmoveup(this.parentNode.materia); };
    function onmovedown() { self.cb_onmovedown(this.parentNode.materia); };
    function add_item(materia) {
        var row  = document.createElement("tr");
        row.style.backgroundColor = materia.cor;
        row.style.cursor="pointer";
        var data = document.createElement("td");
        var input = document.createElement("input");
        input.type     = "checkbox";
        input.value    = materia.codigo;
        materia_onchange = function() { self.cb_select(this.value, this.checked); };
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
        data.onclick = onclick;
        data.style.width = "70px";
        data.innerHTML = materia.codigo;
        row.appendChild(data);
        var data = document.createElement("td");
        data.onclick = onclick;
        data.style.width = "44px";
        materia.ui_turma = data;
        row.appendChild(data);
        var data = document.createElement("td");
        data.onclick = onclick;
        data.innerHTML = materia.nome;
        row.appendChild(data);
        var data = document.createElement("td");
        data.onclick = onmovedown;
        data.innerHTML = "v";
        data.style.width = "15px";
        data.style.textAlign = "center";
        row.appendChild(data);
        var data = document.createElement("td");
        data.onclick = onmoveup;
        data.innerHTML = "^";
        data.style.width = "15px";
        data.style.textAlign = "center";
        row.appendChild(data);
        var data = document.createElement("td");
        data.onclick = onremove;
        data.innerHTML = "X";
        data.style.width = "15px";
        data.style.textAlign = "center";
        row.appendChild(data);
        tbody.appendChild(row);
        row.materia = materia;
        materia.row = row;
    }

    /* functions */
    self.add_item = add_item;
    self.reset    = reset;
    /* callbacks */
    self.cb_select   = null;
    self.cb_onremove = null;
    self.cb_onclick  = null;
}
