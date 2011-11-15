function UI_turmas(id, height)
{
    var self = this;

    list = document.getElementById(id);

    list.style.border = "1px solid black";
    list.style.width  = "330px";
    list.style.height    = (height-2) + "px";
    list.style.maxHeight = (height-2) + "px";

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
            var split   = checkboxes[i].value.split(" ");
            self.set(split[0], split[1], !at_least_one_selected);
            checkboxes[i].checked = !at_least_one_selected;
        }
        self.updated();
    }
    var create = function(materia) {
        list.innerHTML = "";

        var table = document.createElement("table");
        var tbody = document.createElement("tbody");
        table.className = "materias";
        table.style.width="330px";
        table.cellPadding="1";
        table.cellSpacing="1";

        for (var i in materia.horarios) {
            var horario = materia.horarios[i];

            var row  = document.createElement("tr");
            row.style.backgroundColor = materia.cor;
            row.style.cursor="pointer";
            row.onmouseover = function() { self.onmouseover(this.turma); }
            row.onmouseout  = function() { self.onmouseout(this.turma); }

            var data = document.createElement("td");
            for (var j in horario.turmas) {
                var turma = horario.turmas[j];
                var input = document.createElement("input");
                input.type     = "checkbox";
                input.value    = materia.codigo + " " + turma.turma;
                input.onchange = function() {
                    var split = this.value.split(" ");
                    self.set(split[0], split[1], this.checked);
                    self.updated();
                };
                data.appendChild(input);
                input.checked  = turma.selected;
            }
            data.style.width = "22px";
            row.appendChild(data);

            var data = document.createElement("td");
            data.onmouseup = onmouseup;
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
            data.onmouseup = onmouseup;
            var innerHTML = new String();
            for (var j in horario.turmas) {
                var turma = horario.turmas[j];
                innerHTML += turma.professor + "<br>";
            }
            data.innerHTML = innerHTML;
            row.appendChild(data);

            tbody.appendChild(row);
        }

        table.appendChild(tbody);
        list.appendChild(table);

        /* TODO determine scrollbar width */
        if (table.offsetHeight >= list.offsetHeight)
            table.style.width="310px";
    }

    /* procedures */
    self.create = create;
    self.reset = function() { list.innerHTML = ""; };
    /* callbacks */
    self.onmouseover  = null;
    self.onmouseout   = null;
    self.updated      = null;
    self.set          = null;
}
