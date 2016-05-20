/**
 * @constructor
 */
function UI_avisos(id)
{
    var self = this;

    var panel = document.getElementById(id);

    panel.className = "ui_avisos";

    /* functions */
    self.show = function() { panel.style.display = "block"; };
    self.hide = function() { panel.style.display = "none"; };
    self.reset = function() { panel.innerHTML = ""; self.hide(); };
    self.set_text = function(text) { panel.innerHTML = text; self.show(); };

    self.hide();
}
