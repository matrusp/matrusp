/**
 * @constructor
 */
function UI_combinacoes(id)
{
    var self = this;

    var d2 = document.getElementById(id);
    d2.className = "ui_combinacoes";
    self.selecao_atual = document.createElement("input");
    self.selecao_atual.value = 0;
    self.selecao_atual.onchange = function () { self.cb_changed(this.value); };
    d2.appendChild(document.createTextNode("Combina\u00e7\u00f5es "));
    var button = document.createElement("span");
    button.innerHTML = "<strong>&nbsp;<&nbsp;</strong>";
    button.title = "combinação anterior";
    button.onselectstart = function () { return false; };
    button.onclick = function () { self.cb_previous(); return false; };
    if (navigator.userAgent.toLowerCase().indexOf("msie") > -1) {
        button.ondblclick = function () { self.cb_previous(); };
    }
    d2.appendChild(button);
    d2.appendChild(document.createTextNode(" "));
    d2.appendChild(self.selecao_atual);
    d2.appendChild(document.createTextNode("/"));
    var numero_selecoes = document.createTextNode("0");
    d2.appendChild(numero_selecoes);
    d2.appendChild(document.createTextNode(" "));
    var button = document.createElement("span");
    button.innerHTML = "<strong>&nbsp;>&nbsp;</strong>";
    button.title = "próxima combinação";
    button.onselectstart = function () { return false; };
    button.onclick = function () { self.cb_next(); return false; };
    if (navigator.userAgent.toLowerCase().indexOf("msie") > -1) {
        button.ondblclick = function () { self.cb_next(); };
    }
    d2.appendChild(button);
    d2.appendChild(document.createTextNode(" Horas por semana: "));
    var horas_aula = document.createTextNode("0");
    d2.appendChild(horas_aula);

    /* procedures */
    self.set_current = function(n) { self.selecao_atual.value = n; };
    self.set_total = function(n) { numero_selecoes.nodeValue = n; };
    self.set_horas_aula = function(n) { horas_aula.nodeValue = n; };
    self.reset = function() {
        self.set_current(0);
        self.set_total(0);
        self.set_horas_aula(0);
    };
    /* callbacks */
    self.cb_previous = null;
    self.cb_next     = null;
    self.cb_changed  = null;
}
