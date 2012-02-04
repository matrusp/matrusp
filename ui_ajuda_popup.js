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
function UI_ajuda_popup(id)
{
    var self = this;

    self.popup = document.getElementById(id);
    self.popup.className = "ui_ajuda_popup";

    function show() {
        self.popup.style.display = "";
        self.popup.style.marginLeft = "-" + (self.popup.offsetWidth /2) + "px";
    }

    /* procedures */
    self.hide         = function() { self.popup.style.display = "none"; };
    self.show         = show;

    self.hide();
}
