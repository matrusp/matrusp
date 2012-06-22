/**
 * @constructor
 */
function UI_saver(id)
{
    var self = this;

    var ui_saver = document.getElementById(id).parentNode;
    ui_saver.className = "ui_saver";
    ui_saver.appendChild(document.createTextNode("identificador: "));
    var input = document.createElement("input");
    input.title = "Escolha um identificador qualquer para salvar/abrir seus horários. O identificador pode ser qualquer coisa (por exemplo seu número de matrícula). Cuidado: qualquer um pode usar qualquer identificador.";
    ui_saver.appendChild(input);
    ui_saver.appendChild(document.createTextNode(" "));
    var button = document.createElement("span");
    button.innerHTML = "abrir";
    button.onselectstart = function () { return false; };
    ui_saver.appendChild(button);
    self.button_load = button;
    ui_saver.appendChild(document.createTextNode(" "));
    var button = document.createElement("span");
    button.innerHTML = "salvar";
    button.onselectstart = function () { return false; };
    ui_saver.appendChild(button);
    self.button_save = button;
    ui_saver.appendChild(document.createTextNode(" "));
    var button = document.createElement("span");
    button.className = "ui_saver_menu_v";
    button.innerHTML = "V";
    button.onselectstart = function () { return false; };
    ui_saver.appendChild(button);
    self.button_menu = button;

    var menu = document.createElement("div");
    menu.className = "ui_saver_menu";
    button.appendChild(menu);

    var menu_op = document.createElement("div");
    menu_op.innerHTML = "limpar tudo";
    menu_op.onclick = function() {
        var really = confirm("Você tem certeza que quer limpar tudo?");
        if (really)
            self.cb_cleanup();
    };
    menu.appendChild(menu_op);
    var menu_op = document.createElement("div");
    menu_op.innerHTML = "download para seu HD";
    menu_op.onclick = function() { self.cb_download(); };
    menu.appendChild(menu_op);
    var menu_op = document.createElement("div");
    menu_op.innerHTML = "upload de seu HD";
    menu_op.onclick = function() { self.cb_upload(); };
    menu.appendChild(menu_op);
    var menu_op = document.createElement("div");
    menu_op.innerHTML = "abrir MatrUFSC 2012-1";
    menu_op.onclick = function() { window.open("/matrufsc-20121", "_notab"); };
    menu.appendChild(menu_op);

    self.input = input;

    self.enabled = true;
    self.disable = function() {
        if (!self.enabled) return;
        self.button_save.style.backgroundColor = "lightgrey";
        self.button_load.style.backgroundColor = "lightgrey";
        self.button_save.onclick = function () { return false; };
        self.button_load.onclick = function () { return false; };
        self.button_save.style.opacity = ".6";
        self.button_save.style.filter = "alpha(opacity=60)";
        self.button_load.style.opacity = ".6";
        self.button_load.style.filter = "alpha(opacity=60)";
        self.button_save.title = "escolha um identificador primeiro";
        self.button_load.title = "escolha um identificador primeiro";
        self.enabled = false;
    }
    self.enable = function() {
        if (self.enabled) return;
        self.button_save.style.backgroundColor = "lightblue";
        self.button_load.style.backgroundColor = "lightblue";
        self.button_save.onclick = function () { self.cb_save(input.value); return false; };
        self.button_load.onclick = function () { self.cb_load(input.value); return false; };
        self.button_save.style.opacity = "";
        self.button_save.style.filter = "";
        self.button_load.style.opacity = "";
        self.button_load.style.filter = "";
        self.button_save.title = "salvar horário";
        self.button_load.title = "abrir horário";
        self.enabled = true;
    }
    self.input.onkeyup = function(e) {
        var c = (e) ? e.keyCode : event.keyCode;
        if (this.value.length == 0) {
            self.disable();
        } else {
            self.enable();
        }
    }

    self.disable();
    /* procedures */
    self.identificar = function(identificador) {
        if (identificador != null && identificador != "") {
            self.input.value = identificador;
            self.enable();
        }
    }
    self.reset = function() {
        self.input.value = "";
        self.disable();
    }
    /* callbacks */
    self.cb_download = null;
    self.cb_upload = null;
    self.cb_cleanup = null;
    self.cb_save = null;
    self.cb_load = null;
}
