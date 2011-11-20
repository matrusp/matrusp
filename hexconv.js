/**
 *
 * Based on:
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 **/

var HexConv = {

	// private property
        _keys : "0123456789ABCDEF",

encode : function(input) {
 input = HexConv._utf8_encode(input);
 var output = new String();
 var l = input.length;
 for (var i = 0; i < l; i++) {
  var c  = input.charCodeAt(i);
  var o1 = c >> 4;
  var o2 = c & 15;
  output += this._keys.charAt(o1) + this._keys.charAt(o2);
 }
 return output;
},

decode : function(input) {
 input = input.toUpperCase();
 var output = new String();
 var l = input.length;
 for (var i = 0; i < l; i+=2) {
  var in1 = this._keys.indexOf(input.charAt(i+0));
  var in2 = this._keys.indexOf(input.charAt(i+1));
  var c = (in1 << 4) | in2;
  output += String.fromCharCode(c);
 }
 return HexConv._utf8_decode(output);
},

	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			} else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			} else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	},

	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
		while ( i < utftext.length ) {
			c = utftext.charCodeAt(i);
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			} else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			} else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
		return string;
	}
}
