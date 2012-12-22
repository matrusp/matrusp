/**
 * @constructor
 */
function Dconsole(id)
{
    var self = this;

    var dconsole = document.getElementById(id);
    var dconsoletext = new String();

    self.hexdump = function hexdump(prefix, str)
    {
        var hexstring = prefix + ": ";
        for (var i = 0; i < str.length; i++)
            hexstring += "0x" + str.charCodeAt(i).toString(16) + " ";
        hexstring += "\n";
        dprintf(hexstring);
    }
    self.printf = function printf(str)
    {
        var innerHTML = new String();
        var newstr = new String();
        var split = dconsoletext.split("\n");
        var n = split.length;
        var offset = n - 10;

        if (offset < 0)
            offset = 0;

        for (var i = 0; i < 8 && i < n-2; i++) {
            newstr += split[i+offset] + "\n";
            innerHTML += split[i+offset] + "<br />";
        }
        innerHTML += str + "<br />";
        newstr += str + "\n";
        dconsoletext = newstr;
        dconsole.innerHTML = innerHTML;
    }
}
