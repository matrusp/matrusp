function Logger(logger)
{
    var self = this;

    self.logger = document.getElementById(logger).parentNode;
    self.logger.style.fontFamily = "monospace";
    self.logger.style.fontSize   = "13px";
    self.stop      = function() {
        if (self.timer) {
            clearTimeout(self.timer);
            self.timer = null;
        }
    }
    self.reset     = function () {
        self.stop();
        self.logger.innerHTML = "&lt;&lt;&lt;&lt; adicione materias aqui";
        self.logger.style.backgroundColor = "#eeeeee";
    };
    self.set_text  = function(str, color) {
        self.stop();
        self.logger.innerHTML = str;
        self.logger.style.backgroundColor = color;
        self.timer = setTimeout((function(t){return function(){t.reset();}})(self), 5000);
    }
    self.updatesearch = function() {
        self.pontos += ".";
        if (self.pontos == "....")
            self.pontos = ".";
        self.logger.innerHTML = self.str + self.pontos;
        self.timer = setTimeout((function(t){return function(){t.updatesearch();}})(self), 200);
    }
    self.waiting = function(str) {
        self.str = str;
        self.stop();
        self.pontos = "";
        self.updatesearch();
        self.logger.style.backgroundColor = "lightyellow";
    }

    self.reset();
}
