function UI_turmas(id, height)
{
    var self = this;

    var current_materia = null;

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
    function adicionar_turma_atividade() {
        var row  = document.createElement("tr");
        row.style.backgroundColor = current_materia.cor;
        row.style.cursor="pointer";
        row.onmouseover = function() { self.onmouseover(this.turma); }
        row.onmouseout  = function() { self.onmouseout(this.turma); }

        var turma = new Object();
        turma.turma     = "xturma";
        turma.aulas     = null;
        turma.professor = "xprofessor";
        turma.selected  = 1;
        turma.materia   = current_materia;
        current_materia.turmas[turma.turma] = turma;

        var data = document.createElement("td");
        var input = document.createElement("input");
        input.type     = "checkbox";
        input.value    = current_materia.codigo + " " + turma.turma;
        input.onchange = function() {
            var split = this.value.split(" ");
            self.set(split[0], split[1], this.checked);
            self.updated();
        };
        data.appendChild(input);
        input.checked  = turma.selected;
        data.style.width = "22px";
        row.appendChild(data);

        var data = document.createElement("td");
        data.onmouseup = onmouseup;
        data.innerHTML = "turma";
        data.style.width = "44px";
        row.appendChild(data);

        var data = document.createElement("td");
        data.onmouseup = onmouseup;
        data.innerHTML = "professor";
        row.appendChild(data);

        self.tbody.appendChild(row);
    }
    var create = function(materia) {
        list.innerHTML = "";

        current_materia = materia;

        var table = document.createElement("table");
        self.tbody = document.createElement("tbody");
        table.className = "materias";
        table.style.width="330px";
        table.cellPadding="1";
        table.cellSpacing="1";

        if (materia.editavel) {
            var row  = document.createElement("tr");
            row.style.backgroundColor = materia.cor;

            var row  = document.createElement("tr");
            row.style.backgroundColor = materia.cor;
            row.materia = materia;

            var data = document.createElement("td");
            data.style.width = "22px";
            row.appendChild(data);
            var data = document.createElement("td");
            data.style.width = "44px";
            row.appendChild(data);

            var data = document.createElement("td");
            data.style.cursor = "pointer";
            data.style.textAlign = "center";
            data.onmouseup = adicionar_turma_atividade;
            data.innerHTML = ">>>> adicione turmas aqui <<<<";
            row.appendChild(data);

            self.tbody.appendChild(row);
        }
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

            self.tbody.appendChild(row);
        }

        table.appendChild(self.tbody);
        list.appendChild(table);

        /* TODO determine scrollbar width */
        if (table.offsetHeight >= list.offsetHeight)
            table.style.width="310px";
    }

    /* procedures */
    self.create = create;
    self.reset = function() { list.innerHTML = ""; };
    /* callbacks */
    self.new_turma    = null;
    self.onmouseover  = null;
    self.onmouseout   = null;
    self.updated      = null;
    self.set          = null;
}
