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
    var horario = document.getElementById(id);
    horario.className = "ui_horario";

    array = new Array();
    for (var i = 0; i < 6; i++) {
        array[i] = new Array();
    }

    var table = document.createElement("table");
    var thead = document.createElement("thead");

    var row = document.createElement("tr");
    row.appendChild(document.createElement("th"));
    for (var i = 0; i < dias.length; i++) {
        var head = document.createElement("th");
        head.innerHTML = dias[i];
        row.appendChild(head);
    }
    thead.appendChild(row);

    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    for (var j = 0; j < horas.length; j++) {
        var row = document.createElement("tr");
        var hora = document.createElement("td");
        hora.innerHTML = horas[j];
        row.appendChild(hora);
        for (var i = 0; i < dias.length; i++) {
            var data = document.createElement("td");
            data.className = "ui_horario_celula";
            data.innerHTML = "&nbsp;";
            array[i][j] = data;
            row.appendChild(data);
        }
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    horario.appendChild(table);

    var reset = function() {
        for (var dia = 0; dia < 6; dia++)
            for (var hora = 0; hora < 14; hora++)
                clear_cell(dia, hora);
    }
    var clear_cell = function(dia, hora) {
        var cell = array[dia][hora];
        cell.innerHTML = "&nbsp;";
        cell.style.backgroundColor = "white";
        cell.style.border = "1px solid black";
        cell.style.color = "black";
    }
    var display_cell = function(dia, hora, data) {
        var cell = array[dia][hora];
        cell.innerHTML = data.text;
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
}
