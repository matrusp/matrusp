function UI_logger(id)
{
    var self = this;

    var ui_logger = document.getElementById(id).parentNode;
    ui_logger.style.fontFamily = "monospace";
    ui_logger.style.fontSize   = "13px";
    self.stop      = function() {
        if (self.timer) {
            clearTimeout(self.timer);
            self.timer = null;
        }
    }
    self.reset     = function () {
        self.stop();
        ui_logger.innerHTML = "&lt;&lt;&lt;&lt; adicione materias aqui";
        ui_logger.style.backgroundColor = "#eeeeee";
    };
    self.set_text  = function(str, color) {
        self.stop();
        ui_logger.innerHTML = str;
        ui_logger.style.backgroundColor = color;
        self.timer = setTimeout((function(t){return function(){t.reset();}})(self), 5000);
    }
    self.updatesearch = function() {
        self.pontos += ".";
        if (self.pontos == "....")
            self.pontos = ".";
        ui_logger.innerHTML = self.str + self.pontos;
        self.timer = setTimeout((function(t){return function(){t.updatesearch();}})(self), 200);
    }
    self.waiting = function(str) {
        self.str = str;
        self.stop();
        self.pontos = "";
        self.updatesearch();
        ui_logger.style.backgroundColor = "lightyellow";
    }

    self.reset();
}
