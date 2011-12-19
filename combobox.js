/**
 * @constructor
 */
function Combobox(input, suggestions, ui_logger)
{
    var lastfetch  = new String();

    function select_item(item)
    {
        if (!self.array.length)
            return;
        if (self.selected_item != -1)
            self.array[self.selected_item].style.backgroundColor = self.color_0;
        if        (item >= self.array.length) {
            self.selected_item = 0;
        } else if (item <             0) {
            self.selected_item = self.array.length - 1;
        } else {
            self.selected_item = item;
        }
        self.array[self.selected_item].style.backgroundColor = self.color_1;
        list_show();
    }
    function deselect_item()
    {
        if (self.selected_item != -1) {
            self.array[self.selected_item].style.backgroundColor = self.color_0;
            self.selected_item = -1;
        }
    }

    var self = this;
    self.suffix = "";
    self.color_0 = "white";
    self.color_1 = "#eeeeee";
    self.input       = document.getElementById(input);
    self.suggestions = document.getElementById(suggestions);
    self.mouse_over_suggestions = false;

    function list_create() {
        self.suggestions.style.overflowY = "auto";
        self.suggestions.style.overflowX = "hidden";
        self.suggestions.style.maxHeight = "300px";
        self.suggestions.style.border = "1px solid black";
        self.suggestions.style.position = "absolute";
        self.suggestions.style.padding = "0";
        self.suggestions.style.margin = "0";
        self.suggestions.style.backgroundColor = "white";
        self.internal_div = document.createElement("div");
        self.internal_div.style.backgroundColor = "white";
        self.internal_div.style.padding = "0";
        self.internal_div.style.zIndex = "1";
        self.internal_div.style.marginRight = document.scrollbar_width + "px";

        self.array = new Array();
        self.selected_item = -1;

        self.suggestions.onmouseover = function() { self.mouse_over_suggestions = true; };
        self.suggestions.onmouseout  = function() { self.mouse_over_suggestions = false; };
        self.suggestions.appendChild(self.internal_div);
        self.suggestions.style.minWidth = "300px";
        list_add_item("Criar atividade extra", "Clique aqui para criar uma atividade extra-curricular, adicionando seus próprios horários");
        self.array[0].style.fontSize = "13px";
        self.array[0].style.fontWeight = "bold";
        self.array[0].onmouseup = function() {
            deselect_item();
            self.cb_new_materia(self.input.value);
            list_hide();
            self.input.blur();
        };
        list_hide();

        self.input.style.fontFamily = "monospace";
        self.input.style.fontSize   = "11px";
        self.suggestions.style.fontFamily = "monospace";
        self.suggestions.style.fontSize   = "11px";
        self.suggestions.style.zIndex = "3000";
    }
    function list_add_item(str, title) {
        var li = document.createElement("div");
        if (title)
            li.title = title;
        li.style.whiteSpace = "nowrap";
        li.style.backgroundColor = "white";
        li.style.display = "block";
        li.style.width = "110%";

        li.innerHTML   = str;
        li.onmouseover = function() { select_item(this.index); };
        li.onmouseout  = function() { deselect_item(); };
        li.onselectstart=function() { return false; }
        li.onmouseup   = function() {
            deselect_item();
            self.input.value = this.codigo;
            add_item(self.input.value);
            list_hide();
            self.input.blur();
        };
        li.codigo = str.split(" ")[0];
        li.index = self.array.length;
        self.array.push(li);
        self.internal_div.appendChild(li);
        return self.array.length-1;
    };
    self.stopsearch = function() {
        if (self.timer) {
            clearTimeout(self.timer);
            self.timer = null;
        }
    }
    self.updatesearch = function() {
        if (!self.more)
            return;
        self.pontos += ".";
        if (self.pontos == "....")
            self.pontos = ".";
        self.array[self.more].innerHTML = self.str + self.pontos;
        self.timer = setTimeout((function(t){return function(){t.updatesearch();}})(self), 200);
    }
    var more_suggestions = function() {
        if ((this.readyState == 4) && (this.status == 200)) {
            var str = this.responseText;
            if (str.length > 0) {
                self.internal_div.removeChild(self.array[self.more]);
                self.array.splice(self.more, 1);
                self.more = null;
                list_add_items(str);
                self.stopsearch();
            } else {
                self.internal_div.removeChild(self.array[self.more]);
                self.array.splice(self.more, 1);
                self.more = null;
            }
        }
    }
    function list_add_items(str) {
        var split = str.split("\n");
        for (var i = 0; i < split.length - 1; i++)
            list_add_item(split[i]);
        if (split.length == 11) {
            self.more = list_add_item("Buscar mais...");
            self.array[self.more].style.fontSize = "13px";
            self.array[self.more].style.fontWeight = "bold";
            self.array[self.more].onmouseup = function() {
                var fetch_request = new XMLHttpRequest();
                fetch_request.onreadystatechange = more_suggestions;
                fetch_request.open("GET", "cgi-bin/fetch2" + self.suffix + ".cgi?p=" + self.page++ + "&q=" + encodeURIComponent(self.fetch.toUpperCase()), true);
                fetch_request.send(null);
                self.str = "Buscando mais";
                self.pontos = ".";
                self.updatesearch();
            };
        } else {
            self.more = 0;
        }
    }
    function list_clear() {
        for (var i = 1; i < self.array.length; i++)
            self.internal_div.removeChild(self.array[i]);
        self.array.splice(1, self.array.length);
        self.selected_item = -1;
        self.page = 1;
    };
    function list_show() {
        self.suggestions.style.display = "";
    }
    function list_hide() {
        self.mouse_over_suggestions = false;
        self.suggestions.style.display = "none";
    }

    list_create();

    self.input.onblur    = function() {
        if (self.mouse_over_suggestions) {
            setTimeout("document.getElementById(\"" + input + "\").focus();",1);
            self.input.focus();
        } else {
            list_hide();
        }
    };
    self.input.onfocus   = function() { if (self.input.value) list_show(); };
    self.input.onkeydown = function(e) {
        var c = (e) ? e.keyCode : event.keyCode;
        if (c == 40 /* down */) {
            select_item(self.selected_item + 1);
        } else if (c == 38 /* up */) {
            select_item(self.selected_item - 1);
        } else if (c == 27 /* esc */) {
            deselect_item();
            list_hide();
        } else if (c == 13 /* enter */) {
            if (self.selected_item == 0) {
                deselect_item();
                list_hide();
                self.cb_new_materia(self.input.value);
                self.input.focus();
                return;
            } else
            if (self.selected_item != -1) {
                self.input.value = self.array[self.selected_item].codigo;
                deselect_item();
                list_hide();
            }
            add_item(self.input.value);
            self.input.focus();
        }
    };
    function suggestions_onreadystatechange()
    {
        if ((this.readyState == 4) && (this.status == 200) &&
            (this.searchstr == lastfetch)) {
            var str = this.responseText;
            if (str.length > 0) {
                list_clear();
                list_add_items(str);
                list_show();
                var n = str.split("\n").length - 1;
                var v = new String();
                if (n == 1) {
                    v = "1 vez";
                } else if (n == 10) {
                    v = "10 vezes ou mais";
                } else {
                    v = n + " vezes";
                }
                ui_logger.set_text("'" + self.fetch + "' encontrado " + v, "lightgreen");
            } else {
                list_clear();
                list_show();
                ui_logger.set_text("'" + self.fetch + "' n\u00e3o encontrado", "lightcoral");
            }
        }
    }
    self.input.onkeyup   = function (e) {
        var c = (e) ? e.keyCode : event.keyCode;
        var fetch = self.input.value;

        if (!((c >= 65 /* a */) && (c <=  90 /* z */)) &&
            !((c >= 48 /* 0 */) && (c <=  57 /* 9 */)) &&
            !((c >= 96 /* 0 */) && (c <= 105 /* 9 */)) &&
            c != 46 /* del */ && c != 8 /* backspace */)
            return;

        if (fetch.length > 0) {
            if (fetch != lastfetch) {
                var fetch_request = new XMLHttpRequest();
                fetch_request.searchstr = fetch;
                fetch_request.onreadystatechange = suggestions_onreadystatechange;
                fetch_request.open("GET", "cgi-bin/fetch2" + self.suffix + ".cgi?q=" + encodeURIComponent(fetch.toUpperCase()), true);
                fetch_request.send(null);
                self.fetch = fetch;
                ui_logger.waiting("procurando '" + fetch + "'");
                lastfetch = fetch;
            }
        } else {
            lastfetch = null;
            list_clear();
            ui_logger.reset();
            list_hide();
        }
    };

    function list_onreadystatechange()
    {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var xml = this.responseXML;
                if (self.timer) {
                    clearTimeout(self.timer);
                    self.timer = null;
                }
                if (this.responseText != "") {
                    self.cb_add_materia(this.codigo, xml);
                } else {
                    ui_logger.set_text("'" + this.codigo + "' n\u00e3o adicionada", "lightcoral");
                }
            }
            this.available = true;
        }
    }
    var full_requests = new Array();
    function add_item(codigo) {
        var n = full_requests.length;
        for (var i = 0; i < n; i++)
            if (full_requests[i].available)
                break;
        if (i == n) {
            full_requests[i] = new XMLHttpRequest();
        }
        full_requests[i].available = false;
        full_requests[i].codigo = codigo;
        full_requests[i].open("GET", "cgi-bin/full2" + self.suffix + ".cgi?q=" + encodeURIComponent(codigo.toUpperCase()), true);
        full_requests[i].onreadystatechange = list_onreadystatechange;
        full_requests[i].send(null);
        ui_logger.waiting("buscando '" + codigo + "'");
    }

    /* procedures */
    self.add_item    = add_item;
    /* callbacks */
    self.cb_add_materia = null;
    self.cb_new_materia = null;
}
