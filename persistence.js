/**
 * @constructor
 */
function Persistence()
{
    var self = this;

    if (window.sessionStorage) {
        self.read_state  = function( ) { return sessionStorage.state3; };
        self.write_state = function(d) { sessionStorage.state3 = d; return true; };
        self.read_id     = function( ) { return localStorage.id; };
        self.write_id    = function(d) { localStorage.id = d; return true; };
    } else {
        var userdata = document.getElementById("userdata");

        if (userdata.addBehavior) {
            function userdata_read(id) {
                userdata.load("persistence");
                return userdata.getAttribute(id);
            }
            function userdata_write(id, w) {
                userdata.setAttribute(id, w);
                userdata.save("persistence");
                return true;
            }
            self.read_state  = function( ) { return userdata_read ("state3"   ); };
            self.write_state = function(d) { return userdata_write("state3", d); };
            self.read_id     = function( ) { return userdata_read ("id"       ); };
            self.write_id    = function(d) { return userdata_write("id"    , d); };
        } else {
            self.read_state  = function( ) { return undefined; };
            self.write_state = function(d) { return false; };
            self.read_id     = function( ) { return undefined; };
            self.write_id    = function(d) { return false; };
        }
    }
}
