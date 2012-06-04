/**
 * @constructor
 */
function UI_campus(id)
{
    var self = this;

    var ui_campus = document.getElementById(id).parentNode;
    ui_campus.className = "ui_campus";
    ui_campus.appendChild(document.createTextNode("campus: "));
    var select = document.createElement("select");
    var option = document.createElement("option");
    option.value = "FLO";
    option.innerHTML = "Florianópolis";
    select.appendChild(option);
    var option = document.createElement("option");
    option.value = "JOI";
    option.innerHTML = "Joinville";
    select.appendChild(option);
    ui_campus.appendChild(select);

    select.value = "FLO";

    select.onchange = function() {
        self.cb_changed(this.value);
    }

    /* callbacks */
    self.cb_changed   = null;
    /* procedures */
    self.set_selected = function(value) { select.value = value; };
}
