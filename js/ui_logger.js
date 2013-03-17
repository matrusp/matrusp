/**
 * @constructor
 */
function UI_logger(id)
{
    var self = this;

    var persistent_color = null;
    var persistent_str = null;

    var ui_logger = document.getElementById(id).parentNode;
    ui_logger.className = "ui_logger";
    var stop = function() {
        if (self.timer) {
            clearTimeout(self.timer);
            self.timer = null;
        }
    }
    var reset = function(hard) {
        stop();
        if (hard)
            clear_persistent();
        ui_logger.innerHTML = persistent_str;
        ui_logger.style.backgroundColor = persistent_color;
        ui_logger.style.textAlign = "left";
    };
    var set_text = function(str, color) {
        stop();
        ui_logger.innerHTML = str;
        ui_logger.style.backgroundColor = color;
        ui_logger.style.textAlign = "left";
        self.timer = setTimeout((function(t){return function(){t.reset();}})(self), 5000);
    }
    var quick_text = "";
    var quick_color;
    var unset_quick_text = function() {
        if (quick_text) {
            stop();
            self.set_text(quick_text, quick_color);
            quick_text = "";
        }
    };
    var set_quick_text = function(str, color) {
        if (!quick_text) {
            quick_text = ui_logger.innerHTML;
            quick_color = ui_logger.style.backgroundColor;
        }
        stop();
        ui_logger.innerHTML = str;
        ui_logger.style.backgroundColor = color;
        ui_logger.style.textAlign = "center";
        self.timer = setTimeout((function(t){return function(){t.unset_quick_text()}})(self), 2000);
    };
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
        ui_logger.style.textAlign = "left";
    }
    var set_persistent = function(str, color) {
        persistent_str = str;
        persistent_color = color;
    }
    var clear_persistent = function() {
        persistent_str = "&lt;&lt;&lt;&lt; procure as disciplinas por nome ou código";
        persistent_color = "#eeeeee";
    }
    clear_persistent();
    reset();

    /* procedures */
    self.reset        = reset;
    self.stop         = stop;
    self.set_text     = set_text;
    self.set_quick_text= set_quick_text;
    self.unset_quick_text= unset_quick_text;
    self.set_persistent = set_persistent;
    self.clear_persistent = clear_persistent;
    self.updatesearch = updatesearch;
    self.waiting      = waiting;
}
