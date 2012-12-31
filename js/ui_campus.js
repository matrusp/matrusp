/**
 * @constructor
 */
function UI_campus(id)
{
    var self = this;

    var ui_campus = document.getElementById(id).parentNode;
    ui_campus.className = "ui_campus";
    ui_campus.appendChild(document.createTextNode("campus: "));
    var campus = document.createElement("select");
    var option = document.createElement("option");
    option.value = "TODOS";
    option.innerHTML = "Todos";
    campus.appendChild(option);
    ui_campus.appendChild(campus);

    campus.value = "TODOS";

    campus.onchange = function() {
        self.cb_campus(this.value);
    }

    var semestre = document.createElement("select");
    var option = document.createElement("option");
    option.value = "20131";
    option.innerHTML = "2013-1";
    semestre.appendChild(option);
    ui_campus.appendChild(semestre);

    semestre.value = "20131";

    semestre.onchange = function() {
        self.cb_semestre(this.value);
    }

    /* callbacks */
    self.cb_campus = null;
    self.cb_semestre = null;
    /* procedures */
    self.set_campus = function(value) { campus.value = value; };
    self.set_semestre = function(value) { semestre.value = value; };
}
