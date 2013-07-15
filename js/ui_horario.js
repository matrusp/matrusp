/**
 * @constructor
 */
function UI_horario(id)
{
    var self = this;
    var dias  = [ "Segunda", "Ter\u00e7a", "Quarta", "Quinta", "Sexta", "S\u00e1bado" ];
    var horas = [ "07:30", "08:20", "09:10", "10:10", "11:00",
                  "13:30", "14:20", "15:10", "16:20", "17:10",
                  "18:30", "19:20", "20:20", "21:10"];
    var horas_fim = [ "08:20", "09:10", "10:00", "11:00", "11:50",
                      "14:20", "15:10", "16:00", "17:10", "18:00",
                      "19:20", "20:10", "21:10", "22:00"];
    var horas_fim_div = [];
    var mostrar_sala = false;
    var horario = document.getElementById(id);
    horario.className = "ui_horario";

    array = new Array();
    for (var i = 0; i < 6; i++) {
        array[i] = new Array();
    }

    var table = document.createElement("table");
    var thead = document.createElement("thead");

    var row = document.createElement("tr");
    var head = document.createElement("th");
    var input = document.createElement("input");
    input.title = "mostrar salas";
    input.type  = "checkbox";
    input.onchange = function() {
        mostrar_sala = this.checked;
        self.show_fim();
        self.cb_select();
    };
    head.appendChild(input);
    row.appendChild(head);
    for (var i = 0; i < dias.length; i++) {
        var head = document.createElement("th");
        head.innerHTML = dias[i];
        row.appendChild(head);
    }
    thead.appendChild(row);

    table.appendChild(thead);

    self.show_fim = function() {
        horas_fim_div.forEach(function(div) {
            if (mostrar_sala) {
                div.style.display = "block";
            } else {
                div.style.display = "none";
            }
        });
    }

    var tbody = document.createElement("tbody");
    for (var j = 0; j < horas.length; j++) {
        if (j == 5 || j == 10) {
            var row = document.createElement("tr");
            row.style.height = "4px";
            tbody.appendChild(row);
        }
        var row = document.createElement("tr");
        var hora = document.createElement("td");
        hora.style.fontSize = "11px";
        var div = document.createElement("div");
        div.innerHTML = horas[j];
        hora.appendChild(div);
        var div = document.createElement("div");
        div.innerHTML = horas_fim[j];
        hora.appendChild(div);
        horas_fim_div.push(div);
        row.appendChild(hora);
        for (var i = 0; i < dias.length; i++) {
            var data = document.createElement("td");
            data.className = "ui_horario_celula";
            data.innerHTML = "&nbsp;";

            if (mostrar_sala) {
                var div = document.createElement("div");
                div.style.fontSize = "10px";
                div.innerHTML = "&nbsp;";
                data.appendChild(div);
            }

            array[i][j] = data;
            row.appendChild(data);
        }
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    horario.appendChild(table);
    self.show_fim();

    var reset = function() {
        for (var dia = 0; dia < 6; dia++)
            for (var hora = 0; hora < 14; hora++)
                clear_cell(dia, hora);
    }
    var clear_cell = function(dia, hora) {
        var cell = array[dia][hora];
        cell.innerHTML = "&nbsp;";

        if (mostrar_sala) {
            var div = document.createElement("div");
            div.style.fontSize = "10px";
            div.innerHTML = "&nbsp;";
            cell.appendChild(div);
        }

        cell.style.backgroundColor = "white";
        cell.style.border = "1px solid black";
        cell.style.color = "black";
    }
    var display_cell = function(dia, hora, data) {
        var cell = array[dia][hora];
        cell.innerHTML = data.text;

        if (mostrar_sala) {
            var div = document.createElement("div");
            div.style.fontSize = "10px";
            if (data.sala) {
                div.innerHTML = data.sala;
            } else {
                div.innerHTML = "&nbsp;";
            }
            cell.appendChild(div);
        }

        if (data.fixed)
            cell.style.fontWeight = "";
        else
            cell.style.fontWeight = "bold";
        cell.style.backgroundColor = data.bgcolor;
        cell.style.color = data.color;
    }
    function set_toggle(func, onover, onout) {
        for (var dia = 0; dia < 6; dia++) {
            for (var hora = 0; hora < 14; hora++) {
                if (func) {
                    array[dia][hora].style.cursor = "pointer";
                    array[dia][hora].onclick     = function() { func(this.dia, this.hora); };
                    array[dia][hora].onmouseover = function() { onover(this.dia, this.hora); };
                    array[dia][hora].onmouseout  = function() { onout(this.dia, this.hora); };
                } else {
                    array[dia][hora].style.cursor = "";
                    array[dia][hora].onclick = null;
                    array[dia][hora].onmouseover = null;
                    array[dia][hora].onmouseout = null;
                }
                array[dia][hora].dia = dia;
                array[dia][hora].hora = hora;
            }
        }
        if (func) {
            horario.style.zIndex = "2000";
        } else {
            horario.style.zIndex = "0";
        }
    }

    /* procedures */
    self.set_toggle   = set_toggle;
    self.display_cell = display_cell;
    self.clear_cell   = clear_cell;
    self.reset        = reset;
    /* functions */
    self.height       = function() { return horario.offsetHeight; };
    /* callbacks */
    self.cb_select    = null;
}
var Cell = {
    normal: function(  d) { return {fixed:d.fixed,text:d.horario.materia.codigo,sala:d.sala,bgcolor:d.horario.materia.cor,color:"black"}; },
    red   : function(str) { return {fixed:true,text:str,bgcolor:"red",color:"black"}; },
    black : function(str) { return {fixed:false,text:str,bgcolor:"black",color:"white"}; }
};
