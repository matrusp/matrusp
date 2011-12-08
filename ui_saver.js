function UI_saver(id, identificador)
{
    var self = this;

    var ui_saver = document.getElementById(id).parentNode;
    ui_saver.style.fontFamily = "monospace";
    ui_saver.style.fontSize   = "13px";
    ui_saver.style.width = "300px";
    ui_saver.appendChild(document.createTextNode("identificador: "));
    var input = document.createElement("input");
    input.style.fontFamily = "monospace";
    input.style.fontSize   = "11px";
    input.style.width = "90px"
    if (identificador)
        input.value = identificador;
    ui_saver.appendChild(input);
    ui_saver.appendChild(document.createTextNode(" "));
    var button = document.createElement("span");
    button.style.MozUserSelect = "none";
    button.style.KhtmlUserSelect = "none";
    button.style.border = "1px solid black";
    button.style.backgroundColor = "lightblue";
    button.style.cursor = "pointer";
    button.innerHTML = "salvar";
    button.title = "salvar estado do programa";
    button.onselectstart = function () { return false; };
    button.onclick = function () { self.cb_salvar(input.value); return false; };
    ui_saver.appendChild(button);
    ui_saver.appendChild(document.createTextNode(" "));
    var button = document.createElement("span");
    button.style.MozUserSelect = "none";
    button.style.KhtmlUserSelect = "none";
    button.style.border = "1px solid black";
    button.style.backgroundColor = "lightblue";
    button.style.cursor = "pointer";
    button.innerHTML = "carregar";
    button.title = "carregar estado do programa";
    button.onselectstart = function () { return false; };
    button.onclick = function () { self.cb_carregar(input.value); return false; };
    ui_saver.appendChild(button);

    self.input = input;

    /* callbacks */
    self.cb_salvar   = null;
    self.cb_carregar = null;
}
