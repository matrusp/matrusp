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
    option.value = "Florianópolis";
    option.innerHTML = "Florianópolis";
    select.appendChild(option);
    var option = document.createElement("option");
    option.value = "Joinville";
    option.innerHTML = "Joinville";
    select.appendChild(option);
    ui_campus.appendChild(select);

    select.selectedIndex = 0;

    select.onchange = function() {
        if      (this.selectedIndex == 0)
            database.set_campus("FLO");
        else if (this.selectedIndex == 1)
            database.set_campus("JOI");
    }
    database.set_campus("FLO");

    /* function */
    self.get_selected = function( ) { return select.selectedIndex; };
    /* procedures */
    self.set_selected = function(n) { select.selectedIndex = n; select.onchange(); };
}
