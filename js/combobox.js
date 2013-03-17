/**
 * @constructor
 */
function Combobox(input, suggestions, ui_logger, database)
{
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
        var s_top    = self.suggestions.scrollTop;
        var s_height = self.suggestions.clientHeight;
        var i_top    = self.array[self.selected_item].offsetTop;
        var i_height = self.array[self.selected_item].clientHeight;
        if        ( s_top             > i_top) {
            self.suggestions.scrollTop = i_top;
        } else if ((s_top + s_height) < (i_top + i_height)) {
            self.suggestions.scrollTop = i_top + i_height - s_height;
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
    self.color_0 = "white";
    self.color_1 = "#eeeeee";
    self.input       = document.getElementById(input);
    self.input.className = "combobox_input";
    self.suggestions = document.getElementById(suggestions);
    self.suggestions.className = "combobox_suggestions";
    self.mouse_over_suggestions = false;

    function list_create() {
        self.internal_div = document.createElement("div");
        self.internal_div.style.marginRight = (document.scrollbar_width+1) + "px";

        self.array = new Array();
        self.selected_item = -1;

        self.suggestions.onmouseover = function() { self.mouse_over_suggestions = true; };
        self.suggestions.onmouseout  = function() { self.mouse_over_suggestions = false; };
        self.suggestions.appendChild(self.internal_div);
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
    }
    function list_add_item(str, title) {
        var li = document.createElement("div");
        li.style.cursor = "pointer";
        if (title)
            li.title = title;

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
    function do_search_more() {
        var fetch_result = database.page(self.page++);
        self.internal_div.removeChild(self.array[self.more]);
        self.array.splice(self.more, 1);
        self.more = null;
        if (fetch_result.length > 0)
            list_add_items(fetch_result);
    };
    function list_add_items(items) {
        var first = self.array.length;
//        items.forEach(function(item){var str = item.codigo + " " + item.score + " " + item.nome; list_add_item(str);});
        items.forEach(function(item){var str = item.codigo + " " + item.nome; list_add_item(str);});
        if (items.length == 10) {
            self.more = list_add_item("Buscar mais...");
            self.array[self.more].style.fontSize = "13px";
            self.array[self.more].style.fontWeight = "bold";
            self.array[self.more].onmouseup = do_search_more;
        } else {
            self.more = 0;
        }
        select_item(first);
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
            if (self.more && self.selected_item == self.more) {
                do_search_more();
                return;
            } else
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
    self.input.onkeyup   = function (e) {
        var c = (e) ? e.keyCode : event.keyCode;
        var fetch = self.input.value;

        if (!((c >= 65 /* a */) && (c <=  90 /* z */)) &&
            !((c >= 48 /* 0 */) && (c <=  57 /* 9 */)) &&
            !((c >= 96 /* 0 */) && (c <= 105 /* 9 */)) &&
            c != 46 /* del */ && c != 8 /* backspace */)
            return;

        list_clear();
        if (fetch.length > 0) {
            database.fetch(fetch);
            var fetch_result = database.page(0);
            if (fetch_result.length > 0) {
                list_add_items(fetch_result);
                var n = fetch_result.length;
                var v = new String();
                if (n == 1)
                    v = "1 vez";
                else
                    v = n + " vezes";
                if (n == 10)
                    v = v + " ou mais";
                ui_logger.set_text("'" + fetch + "' encontrado " + v, "lightgreen");
            } else {
                ui_logger.set_text("'" + fetch + "' n\u00e3o encontrado", "lightcoral");
            }
            list_show();
        } else {
            ui_logger.reset();
            list_hide();
        }
    };

    function add_item(codigo) {
        var full_result = database.full(codigo.toUpperCase());
        if (full_result) {
            self.cb_add_materia(full_result);
        } else {
            ui_logger.set_text("'" + codigo + "' n\u00e3o adicionada", "lightcoral");
        }
    }

    /* procedures */
    self.add_item    = add_item;
    /* callbacks */
    self.cb_add_materia = null;
    self.cb_new_materia = null;
}
