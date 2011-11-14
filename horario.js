function Horario(horario)
{
    var self = this;
    var dias  = [ "Segunda", "Ter\u00e7a", "Quarta", "Quinta", "Sexta", "S\u00e1bado" ];
    var horas = [ "07:30", "08:20", "09:10", "10:10", "11:00",
                  "13:30", "14:20", "15:10", "16:20", "17:10",
                  "18:30", "19:20", "20:20", "21:10"];
    var horario = document.getElementById(horario);

    horario.style.border = "1px solid black";

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
            data.innerHTML = "&nbsp;";
            self.array[i][j] = data;
            row.appendChild(data);
        }
        self.tbody.appendChild(row);
    }

    self.table.appendChild(self.tbody);
    horario.appendChild(self.table);

    self.reset = function () {
        for (var dia = 0; dia < 6; dia++)
            for (var hora = 0; hora < 14; hora++)
                self.clear_cell(dia, hora);
    }
    self.clear_cell = function (dia, hora) {
        var cell = self.array[dia][hora];
        cell.innerHTML = "&nbsp;";
        cell.style.backgroundColor = "white";
        cell.style.border = "1px solid black";
        cell.style.color = "black";
    }
    self.display_cell = function (dia, hora, data) {
        var cell = self.array[dia][hora];
        var innerHTML = new String();
        if (data.strong)
            innerHTML += "<strong>";
        innerHTML += data.text;
        if (data.strong)
            innerHTML += "</strong>";
        cell.innerHTML = innerHTML;
        cell.style.backgroundColor = data.bgcolor;
        cell.style.color = data.color;
    }
    self.height = function () {
        return horario.offsetHeight;
    }
}
