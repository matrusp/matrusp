function UI_logger(id)
{
    var self = this;

    var persistent_color = null;
    var persistent_str = null;

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
        ui_logger.innerHTML = persistent_str;
        ui_logger.style.backgroundColor = persistent_color;
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
    var set_persistent = function(str, color) {
        persistent_str = str;
        persistent_color = color;
    }
    var clear_persistent = function() {
        persistent_str = "&lt;&lt;&lt;&lt; adicione mat\u00e9rias aqui";
        persistent_color = "#eeeeee";
    }
    clear_persistent();
    reset();

    /* procedures */
    self.reset        = reset;
    self.stop         = stop;
    self.set_text     = set_text;
    self.set_persistent = set_persistent;
    self.clear_persistent = clear_persistent;
    self.updatesearch = updatesearch;
    self.waiting      = waiting;
}
