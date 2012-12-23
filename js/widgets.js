/**
 * @constructor
 */
function widget_dropdown_menu(parent, width, padding, left)
{
    var self = this;

    var button = document.createElement("span");
    button.onselectstart = function () { return false; };
    button.className = "widget_dropdown_menu_button";
    button.innerHTML = "V";
    parent.appendChild(button);
    self.button_menu = button;

    var menu = document.createElement("div");
    menu.className = "widget_dropdown_menu";
    menu.style.width = width + "px";
    if (left) {
        menu.style.top = "18px";
        menu.style.left = (19 - width) + "px";
    }
    button.appendChild(menu);

    self.opcoes = [];

    self.add = function(nome, onclick) {
        var menu_op = document.createElement("div");
        menu_op.className = "widget_dropdown_menu_op";
        menu_op.style.padding = padding + "px";
        menu_op.innerHTML = nome;
        menu_op.onclick = onclick;
        menu.appendChild(menu_op);
        self.opcoes.push(menu_op);
    };
}
