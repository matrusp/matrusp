function UI_combinacoes()
{
    var self = this;

    var d2 = document.createElement("td");
    d2.style.textAlign = "center";
    var selecao_atual = document.createElement("input");
    selecao_atual.style.fontFamily = "monospace";
    selecao_atual.style.fontSize   = "11px";
    selecao_atual.style.width      = "30px";
    selecao_atual.style.height     = "13px";
    selecao_atual.value = 0;
    selecao_atual.onchange = function () { self.changed(this.value); };
    d2.appendChild(document.createTextNode("Combina\u00e7\u00f5es "));
    var button = document.createElement("span");
    button.style.MozUserSelect = "none";
    button.style.KhtmlUserSelect = "none";
    button.style.border = "1px solid black";
    button.style.backgroundColor = "lightblue";
    button.style.cursor = "pointer";
    button.innerHTML = "<strong>&nbsp;<&nbsp;</strong>";
    button.onselectstart = function () { return false; };
    button.onclick = function () { self.previous(); return false; };
    if (navigator.userAgent.toLowerCase().indexOf("msie") > -1) {
        button.ondblclick = function () { self.previous(); };
    }
    d2.appendChild(button);
    d2.appendChild(document.createTextNode(" "));
    d2.appendChild(selecao_atual);
    d2.appendChild(document.createTextNode("/"));
    var numero_selecoes = document.createTextNode("0");
    d2.appendChild(numero_selecoes);
    d2.appendChild(document.createTextNode(" "));
    var button = document.createElement("span");
    button.style.MozUserSelect = "none";
    button.style.KhtmlUserSelect = "none";
    button.style.border = "1px solid black";
    button.style.backgroundColor = "lightblue";
    button.style.cursor = "pointer";
    button.innerHTML = "<strong>&nbsp;>&nbsp;</strong>";
    button.onselectstart = function () { return false; };
    button.onclick = function () { self.next(); return false; };
    if (navigator.userAgent.toLowerCase().indexOf("msie") > -1) {
        button.ondblclick = function () { self.next(); };
    }
    d2.appendChild(button);

    /* procedures */
    self.set_current = function(n) { selecao_atual.value = n; };
    self.set_total = function(n) { numero_selecoes.nodeValue = n; };
    /* functions */
    self.get_td    = function()  { return d2; };
    /* callbacks */
    self.previous = null;
    self.next     = null;
    self.changed  = null;
}
