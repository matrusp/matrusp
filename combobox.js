function Combobox(input, suggestions, ui_logger)
{
    var lastfetch  = new String();

    function select_item(item)
    {
        if (!self.item_array.length)
            return;
        if (self.selected_item != -1)
            self.item_array[self.selected_item].style.backgroundColor = self.color_0;
        if        (item >= self.n_items) {
            self.selected_item = 0;
        } else if (item <             0) {
            self.selected_item = self.n_items - 1;
        } else {
            self.selected_item = item;
        }
        self.item_array[self.selected_item].style.backgroundColor = self.color_1;
        self.suggestions.style.display = "";
    }
    function deselect_item()
    {
        self.mouseisdown = false;
        if (self.selected_item != -1) {
            self.item_array[self.selected_item].style.backgroundColor = self.color_0;
            self.selected_item = -1;
        }
    }

    var self = this;
    self.color_0 = "white";
    self.color_1 = "#eeeeee";
    self.input       = document.getElementById(input);
    self.suggestions = document.getElementById(suggestions);
    self.suggestions.className = "combobox";
    self.mouseisdown = false;

    self.create_suggestions_table = function(str) {
        var ul = document.createElement("ul");
        var array = str.split("\n");

        self.suggestions.innerHTML = "";
        self.item_index = new Array();
        self.selected_item = -1;
        self.n_items = 0;

        for (var i = 0; i < array.length - 1; i++) {
            var li = document.createElement("li");
            var codigo = array[i].split(" ")[0];

            li.innerHTML   = array[i];
            li.onmouseover = function() { select_item(self.item_index[this.innerHTML.split(" ")[0]]); };
            li.onmouseout  = function() { deselect_item(); };
            li.onclick     = function() { deselect_item(); };
            li.onmousedown = function() { self.mouseisdown = true; return false; };
            li.onselectstart=function() { return false; }
            li.onmouseup   = function() {
                deselect_item();
                self.input.value = this.innerHTML.split(" ")[0];
                adicionar(self.input.value);
                self.suggestions.style.display = "none";
                self.input.blur();
            };
            self.item_index[codigo] = i;

            self.item_array[i] = li;
            ul.appendChild(li);
        }
        self.suggestions.appendChild(ul);
        self.suggestions.style.display = "";

        self.n_items = array.length - 1;
    };
    self.select_item = select_item;
    self.item_array = new Array();
    self.selected_item = -1;
    self.n_items       =  0;

    self.input.style.fontFamily = "monospace";
    self.input.style.fontSize   = "11px";
    self.suggestions.style.fontFamily = "monospace";
    self.suggestions.style.fontSize   = "11px";
    self.suggestions.style.display = "none";

    self.input.onblur    = function() {
        if (self.mouseisdown) {
            self.input.onfocus();
        } else {
            self.suggestions.style.display = "none";
        }
    };
    self.input.onfocus   = function() { if (self.item_array[0]) self.suggestions.style.display = ""; };
    self.input.onkeydown = function(e) {
        var c = (e) ? e.keyCode : event.keyCode;
        if (c == 40 /* down */) {
            select_item(self.selected_item + 1);
        } else if (c == 38 /* up */) {
            select_item(self.selected_item - 1);
        } else if (c == 27 /* esc */) {
            deselect_item();
            self.suggestions.style.display = "none";
        } else if (c == 13 /* enter */) {
            if (self.selected_item != -1) {
                self.input.value = self.item_array[self.selected_item].innerHTML.split(" ")[0];
                deselect_item();
                self.suggestions.style.display = "none";
            }
            adicionar(self.input.value);
            self.input.focus();
        }
    };
    function suggestions_onreadystatechange()
    {
        if ((this.readyState == 4) && (this.status == 200) &&
            (this.searchstr == lastfetch)) {
            var str = this.responseText;
            if (str.length > 0) {
                self.create_suggestions_table(str);
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
                self.suggestions.innerHTML = "";
                self.selected_item = -1;
                self.n_items = 0;
                self.suggestions.style.display = "none";
                ui_logger.set_text("'" + self.fetch + "' nao encontrado", "lightcoral");
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
                fetch_request = new XMLHttpRequest();
                fetch_request.searchstr = fetch;
                fetch_request.onreadystatechange = suggestions_onreadystatechange;
                fetch_request.open("GET", "cgi-bin/fetch.cgi?q=" + encodeURIComponent(fetch.toUpperCase()), true);
                fetch_request.send(null);
                self.fetch = fetch;
                self.pontos = new String();
                ui_logger.waiting("procurando '" + fetch + "'");
                lastfetch = fetch;
            }
        } else {
            self.suggestions.innerHTML = "";
            self.selected_item = -1;
            self.n_items = 0;
            self.suggestions.style.display = "none";
        }
    };

    function list_onreadystatechange()
    {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var str = this.responseText;
                if (self.timer) {
                    clearTimeout(self.timer);
                    self.timer = null;
                }
                if (str.length > 0) {
                    self.add_item(this.codigo, str);
                } else {
                    ui_logger.set_text("'" + this.codigo + "' nao adicionada", "lightcoral");
                }
            }
            this.available = true;
        }
    }
    var full_requests = new Array();
    function adicionar(codigo) {
        var n = full_requests.length;
        for (var i = 0; i < n; i++)
            if (full_requests[i].available)
                break;
        if (i == n) {
            full_requests[i] = new XMLHttpRequest();
        }
        full_requests[i].available = false;
        full_requests[i].codigo = codigo;
        full_requests[i].open("GET", "cgi-bin/full.cgi?q=" + encodeURIComponent(codigo), true);
        full_requests[i].onreadystatechange = list_onreadystatechange;
        full_requests[i].send(null);
        ui_logger.waiting("buscando '" + codigo + "'");
    }

    /* callbacks */
    self.add_item = null;
}
