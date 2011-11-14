function UI_logger(id)
{
    var self = this;

    var ui_logger = document.getElementById(id).parentNode;
    ui_logger.style.fontFamily = "monospace";
    ui_logger.style.fontSize   = "13px";
    var stop = function() {
        if (self.timer) {
            clearTimeout(self.timer);
            self.timer = null;
        }
    }
    var reset = function() {
        stop();
        ui_logger.innerHTML = "&lt;&lt;&lt;&lt; adicione materias aqui";
        ui_logger.style.backgroundColor = "#eeeeee";
    };
    var set_text = function(str, color) {
        stop();
        ui_logger.innerHTML = str;
        ui_logger.style.backgroundColor = color;
        self.timer = setTimeout((function(t){return function(){t.reset();}})(self), 5000);
    }
    var updatesearch = function() {
        self.pontos += ".";
        if (self.pontos == "....")
            self.pontos = ".";
        ui_logger.innerHTML = self.str + self.pontos;
        self.timer = setTimeout((function(t){return function(){t.updatesearch();}})(self), 200);
    }
    var waiting = function(str) {
        self.str = str;
        stop();
        self.pontos = "";
        self.updatesearch();
        ui_logger.style.backgroundColor = "lightyellow";
    }
    reset();

    /* procedures */
    self.reset        = reset;
    self.stop         = stop;
    self.set_text     = set_text;
    self.updatesearch = updatesearch;
    self.waiting      = waiting;
}
