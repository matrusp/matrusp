/**
 * @constructor
 */
function UI_planos(id)
{
    var self = this;

    function hover_off() { this.style.backgroundColor = this.oldbg; this.style.color = "black"; };
    function hover_on()  { this.style.backgroundColor = "black"; this.style.color = this.oldbg; };

    var ui_planos = document.getElementById(id).parentNode;
    ui_planos.className = "ui_planos";

    var button = document.createElement("span");
    button.className = "ui_planos_menu_v";
    button.innerHTML = "V";
    button.onselectstart = function () { return false; };
    ui_planos.appendChild(button);
    self.button_menu = button;

    var menu = document.createElement("div");
    menu.className = "ui_planos_menu";
    button.appendChild(menu);

    var menu_op = document.createElement("div");
    self.menu_limpar = menu_op;
    menu_op.innerHTML = "Limpar plano atual";
    menu_op.onclick = function() { self.cb_clean(); };
    menu.appendChild(menu_op);
    var menu_op = document.createElement("div");
    self.menu_copiar1 = menu_op;
    menu_op.innerHTML = "Copiar plano atual";
    menu_op.onclick = function() { self.cb_dup(this.ix); };
    menu.appendChild(menu_op);
    var menu_op = document.createElement("div");
    self.menu_copiar2 = menu_op;
    menu_op.innerHTML = "Copiar plano atual";
    menu_op.onclick = function() { self.cb_dup(this.ix); };
    menu.appendChild(menu_op);
    var menu_op = document.createElement("div");
    self.menu_copiar3 = menu_op;
    menu_op.innerHTML = "Copiar plano atual";
    menu_op.onclick = function() { self.cb_dup(this.ix); };
    menu.appendChild(menu_op);

    function reset() {
        self.planos.forEach(function(plano) {
            ui_planos.removeChild(plano.span);
        });
        self.planos = [];
    }
    function add(plano) {
        var span = document.createElement("span");
        span.plano = plano;
        span.innerHTML = plano.nome;
        span.oldbg = "#eeeeee";
        span.onmouseout  = hover_off;
        span.onmouseover = hover_on;
        span.style.padding = "1px";
        span.style.border = "1px solid black";
        span.onclick = function() { self.cb_changed(this.plano); };
        ui_planos.appendChild(span);
        self.planos.push(plano);
        plano.span = span;
    }
    function select(plano) {
        var o = 0;
        for (var i = 0; i < self.planos.length; i++)
            if (self.planos[i] == plano) {
                index = i;
                break;
            }
        self.menu_limpar.innerHTML = "Limpar \"" + plano.nome + "\"";
        if (i == o) o++;
        self.menu_copiar1.ix = o;
        self.menu_copiar1.innerHTML = "Copiar para \"" + self.planos[o].nome + "\"";
        o++; if (i == o) o++;
        self.menu_copiar2.ix = o;
        self.menu_copiar2.innerHTML = "Copiar para \"" + self.planos[o].nome + "\"";
        o++; if (i == o) o++;
        self.menu_copiar3.ix = o;
        self.menu_copiar3.innerHTML = "Copiar para \"" + self.planos[o].nome + "\"";
        plano.span.style.backgroundColor = "black";
        plano.span.style.color = "#eeeeee";
        plano.span.onmouseout  = function() { };
        plano.span.onmouseover = function() { };
        self.planos.forEach(function(planox) {
            if (planox != plano) {
                planox.span.style.backgroundColor = "#eeeeee";
                planox.span.style.color = "black";
                planox.span.onmouseout  = hover_off;
                planox.span.onmouseover = hover_on;
            }
        });
    }
    function startup(state) {
        self.reset();
        for (var i = 0; i < state.planos.length; i++)
            add(state.planos[i]);
        self.select(state.plano);
    }
    self.planos = [];

    /* callbacks */
    self.cb_changed = null;
    self.cb_clean   = null;
    self.cb_dup     = null;
    /* procedures */
    self.reset   = reset;
    self.select  = select;
    self.startup = startup;
}
