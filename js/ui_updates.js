/**
 * @constructor
 */
function UI_updates(id)
{
    var self = this;

    var panel = document.getElementById(id);

    panel.className = "ui_update";

    /* functions */
    self.show = function() { panel.style.display = "block"; };
    self.hide = function() { panel.style.display = "none"; };
    self.reset = function() { panel.innerHTML = ""; self.hide(); };
    self.fill = function(issues) {
        self.reset();

        var div = document.createElement("div");
        div.innerHTML = "ATENÇÃO: Confira as mudanças no cadastro de turmas:";
        panel.appendChild(div);

        function arrow_toggle() {
            this.parentNode.criancas.forEach(function(pm){
                if (pm.style.display == "none")
                    pm.style.display = "block";
                else
                    pm.style.display = "none";
            });
        }

        panel.criancas = [];
        for (var m = 0; m < issues.length; m++) {
            var materia = issues[m];
            var materia_div = document.createElement("div");
            var arrow = document.createElement("span");
            arrow.innerHTML = "\u25b6&nbsp;";
            arrow.style.cursor = "pointer";
            arrow.onclick = arrow_toggle;
            materia_div.appendChild(arrow);
            var nome = document.createElement("span");
            nome.innerHTML = materia.materia.codigo;
            nome.style.cursor = "pointer";
            nome.onclick = arrow_toggle;
            materia_div.appendChild(nome);
            materia_div.criancas = [];
            for (var i = 0; i < materia.length; i++) {
                var issue = materia[i];
                var issue_div = document.createElement("div");
                var arrow = document.createElement("span");
                arrow.innerHTML = "&nbsp;\u25b6&nbsp;";
                issue_div.appendChild(arrow);
                var nome = document.createElement("span");
                nome.innerHTML = issue.text;
                issue_div.appendChild(nome);
                var button = document.createElement("span");
                button.className = "simple_button";
                button.action = issue.action;
                button.onclick = function() {
                    var a = this.parentNode;
                    var b = a.parentNode;
                    var c = b.parentNode;
                    this.action();
                    b.removeChild(a);
                    if (!b.childNodes[2])
                        c.removeChild(b);
                    if (!c.childNodes[1])
                        self.hide();
                    self.cb_update();
                };
                button.innerHTML = issue.button;
                issue_div.appendChild(button);
                if (issue.text_from) {
                    var text_from = document.createElement("div");
                    text_from.style.marginLeft = "30px";
                    text_from.innerHTML = "de&nbsp;&nbsp;: " + issue.text_from;
                    issue_div.appendChild(text_from);
                }
                if (issue.text_to) {
                    var text_to = document.createElement("div");
                    text_to.style.marginLeft = "30px";
                    text_to.innerHTML = "para: " + issue.text_to;
                    issue_div.appendChild(text_to);
                }
                issue_div.style.display = "none";
                materia_div.criancas.push(issue_div);
                materia_div.appendChild(issue_div);
            }
            panel.criancas.push(materia_div);
            panel.appendChild(materia_div);
        }
        self.show();
    };

    self.hide();
}
