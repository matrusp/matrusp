




function loadJSON(fileName, callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', fileName, true);
  xobj.onreadystatechange = function() {
    if(xobj.readyState == 4 && xobj.status == 200) {
      callback(xobj.responseText);
    } 
  };
  xobj.send(null);
}

var ui = new UI();
var state;
var searchBox;

loadJSON('state_example.json', function(response) {
  var myJSON = JSON.parse(response);
  state = new State(myJSON); 
	searchBox= new SearchBox(state);
});



