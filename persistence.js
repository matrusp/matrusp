/**
 * @constructor
 */
function Persistence()
{
    var self = this;

    if (window.sessionStorage) {
        self.read_state  = function( ) { return sessionStorage.state3; };
        self.write_state = function(d) { sessionStorage.state3 = d; return true; };
        self.read_id     = function( ) { return localStorage.id2; };
        self.write_id    = function(d) { localStorage.id2 = d; return true; };
        self.reset       = function( ) { sessionStorage.clear(); localStorage.clear(); };
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
            self.read_id     = function( ) { return userdata_read ("id2"      ); };
            self.write_id    = function(d) { return userdata_write("id2"   , d); };
            self.reset       = function( ) { userdata.removeAttribute("id2"); userdata.removeAttribute("state3"); };
        } else {
            self.read_state  = function( ) { return undefined; };
            self.write_state = function(d) { return false; };
            self.read_id     = function( ) { return undefined; };
            self.write_id    = function(d) { return false; };
            self.reset       = function( ) { };
        }
    }
}
