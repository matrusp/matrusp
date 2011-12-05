function UI_saver(id, identificador)
{
    var self = this;

    var ui_logger = document.getElementById(id).parentNode;
    ui_logger.style.fontFamily = "monospace";
    ui_logger.style.fontSize   = "13px";
    ui_logger.style.width = "300px";
    ui_logger.appendChild(document.createTextNode("identificador: "));
    var input = document.createElement("input");
    input.style.fontFamily = "monospace";
    input.style.fontSize   = "11px";
    input.style.width = "90px"
    if (identificador)
        input.value = identificador;
    ui_logger.appendChild(input);
    ui_logger.appendChild(document.createTextNode(" "));
    var button = document.createElement("span");
    button.style.MozUserSelect = "none";
    button.style.KhtmlUserSelect = "none";
    button.style.border = "1px solid black";
    button.style.backgroundColor = "lightblue";
    button.style.cursor = "pointer";
    button.innerHTML = "salvar";
    button.onselectstart = function () { return false; };
    button.onclick = function () { self.cb_salvar(input.value); return false; };
    ui_logger.appendChild(button);
    ui_logger.appendChild(document.createTextNode(" "));
    var button = document.createElement("span");
    button.style.MozUserSelect = "none";
    button.style.KhtmlUserSelect = "none";
    button.style.border = "1px solid black";
    button.style.backgroundColor = "lightblue";
    button.style.cursor = "pointer";
    button.innerHTML = "carregar";
    button.onselectstart = function () { return false; };
    button.onclick = function () { self.cb_carregar(input.value); return false; };
    ui_logger.appendChild(button);

    self.input = input;

    /* callbacks */
    self.cb_salvar   = null;
    self.cb_carregar = null;
}
