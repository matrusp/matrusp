/**
 * @constructor
 */
function Persistence()
{
    var self = this;

    if (window.sessionStorage) {
        self.read_state  = function( ) { return sessionStorage.state3; };
        self.write_state = function(d) { sessionStorage.state3 = d; return true; };
        self.clear_state = function( ) { sessionStorage.clear(); };
        self.read_id     = function( ) { return localStorage.id2; };
        self.write_id    = function(d) { localStorage.id2 = d; return true; };
        self.clear_id    = function( ) { localStorage.clear(); };
    } else {
        var userdata = document.getElementById("userdata");

        if (userdata.addBehavior) {
            function userdata_read(id2) {
                userdata.load("persistence");
                return userdata.getAttribute(id2);
            }
            function userdata_write(id2, w) {
                userdata.setAttribute(id2, w);
                userdata.save("persistence");
                return true;
            }
            self.read_state  = function( ) { return userdata_read ("state3"   ); };
            self.write_state = function(d) { return userdata_write("state3", d); };
            self.clear_state = function( ) { userdata.removeAttribute("state3"); };
            self.read_id     = function( ) { return userdata_read ("id2"      ); };
            self.write_id    = function(d) { return userdata_write("id2"   , d); };
            self.clear_id    = function( ) { userdata.removeAttribute("id2"); };
        } else {
            self.read_state  = function( ) { return undefined; };
            self.write_state = function(d) { return false; };
            self.clear_state = function( ) { };
            self.read_id     = function( ) { return undefined; };
            self.write_id    = function(d) { return false; };
            self.clear_id    = function( ) { };
        }
    }
    self.reset = function() { self.clear_state(); self.clear_id(); };
}
