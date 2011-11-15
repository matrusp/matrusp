function UI_materias(id, ui_combinacoes)
{
    var self = this;

    var list = document.getElementById(id);

    list.style.border = "1px solid black";
    list.style.width  = "770px";

    var table = document.createElement("table");
    var tbody = document.createElement("tbody");
    table.className = "materias";
    table.style.width="770px";
    table.cellPadding="1";
    table.cellSpacing="1";
    table.appendChild(tbody);
    list.appendChild(table);
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
    var d2  = document.createElement("td");
    d2.id = "combinacoes";
    r2.appendChild(d2);
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
//    data.onclick = materia_onclick_add;
    data.innerHTML = "<strong>+</strong>";
    data.style.cursor="pointer";
    data.style.width = "15px";
    data.style.textAlign = "center";
    row.appendChild(data);
    tbody.appendChild(row);

    function onclick() { self.onclick(this.parentNode.materia); };
    function onremove() { self.onremove(this.parentNode.materia); };
    function add_item(materia) {
        var row  = document.createElement("tr");
        row.style.backgroundColor = materia.cor;
        row.style.cursor="pointer";
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
    /* callbacks */
    self.onadd    = null;
    self.onremove = null;
    self.onclick  = null;
}
