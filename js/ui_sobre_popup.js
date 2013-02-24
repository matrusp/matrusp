/**
 * @constructor
 */
function UI_grayout(id)
{
    var self = this;

    self.grayout = document.getElementById(id);
    self.grayout.className = "ui_grayout";
    self.grayout.onclick = function() { self.cb_onclick(); };

    /* procedures */
    self.hide = function() { self.grayout.style.display = "none"; };
    self.show = function() { self.grayout.style.display = ""; };
    self.cb_onclick = null;

    self.hide();
}

/**
 * @constructor
 */
function UI_sobre_popup(id)
{
    var self = this;

    self.popup = document.getElementById(id);
    self.popup.className = "ui_sobre_popup";

    self.hide = function() { self.popup.style.display = "none"; };
    self.show = function() {
        self.popup.style.display = "";
        self.popup.style.marginLeft = "-" + (self.popup.offsetWidth /2) + "px";
    };
    self.hide();

    document.getElementById("fechar_sobre").onclick = function() { self.cb_fechar(); };
}
