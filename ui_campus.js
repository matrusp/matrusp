/**
 * @constructor
 */
function UI_campus(id)
{
    var self = this;

    var ui_campus = document.getElementById(id).parentNode;
    ui_campus.style.fontFamily = "monospace";
    ui_campus.style.fontSize   = "13px";
    ui_campus.appendChild(document.createTextNode("campus: "));
    var select = document.createElement("select");
    select.style.fontFamily = "monospace";
    select.style.fontSize   = "11px";
    var option = document.createElement("option");
    option.style.fontFamily = "monospace";
    option.style.fontSize   = "11px";
    option.value = "Florianópolis";
    option.innerHTML = "Florianópolis";
    select.appendChild(option);
    var option = document.createElement("option");
    option.style.fontFamily = "monospace";
    option.style.fontSize   = "11px";
    option.value = "Joinville";
    option.innerHTML = "Joinville";
    select.appendChild(option);
    ui_campus.appendChild(select);

    select.selectedIndex = 0;

    select.onchange = function() {
        if      (this.selectedIndex == 0)
            self.cb_set_suffix("");
        else if (this.selectedIndex == 1)
            self.cb_set_suffix("_JOI");
    }

    /* function */
    self.get_selected = function( ) { return select.selectedIndex; };
    /* procedures */
    self.set_selected = function(n) { select.selectedIndex = n; };
    /* callbacks */
    self.cb_set_suffix = null;
}
