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
    self.input = input;
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

    var form = document.createElement("form");
    form.style.display = "none";
    form.method = "POST";
    form.enctype = "multipart/form-data";
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = "ping";
    form.appendChild(input);
    ui_saver.appendChild(form);
    self.form = form;
    self.form_input = input;

    var dropdown_menu = new widget_dropdown_menu(ui_saver, 230, 2, true);
    dropdown_menu.add("limpar tudo", function(e) {
        var really = confirm("Você quer mesmo limpar tudo?");
        if (really) {
            self.cb_cleanup();
            _gaq.push(['_trackEvent', 'state', 'reset', self.input.value]);
        }
    });
    dropdown_menu.add("exportar arquivo ODS (Excel)", function(e) { self.cb_ods(); _gaq.push(['_trackEvent', 'state', 'ods', self.input.value]); });
    dropdown_menu.add("exportar arquivo iCalendar", function(e) { self.cb_download(".ics"); _gaq.push(['_trackEvent', 'state', 'icalendar', self.input.value]); });
    dropdown_menu.add("exportar arquivo JSON", function(e) { self.cb_download(".json"); _gaq.push(['_trackEvent', 'state', 'download', self.input.value]); });
    dropdown_menu.add("importar arquivo JSON", function(e) { self.cb_upload(); _gaq.push(['_trackEvent', 'state', 'upload', self.input.value]); });

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
        self.button_save.onclick = function () { self.cb_save(self.input.value); return false; };
        self.button_load.onclick = function () { self.cb_load(self.input.value); return false; };
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
    self.cb_ods = null;
    self.cb_upload = null;
    self.cb_cleanup = null;
    self.cb_save = null;
    self.cb_load = null;
}
