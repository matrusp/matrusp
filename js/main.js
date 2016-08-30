



var ui = new UI();
var state;
var searchBox;

ui.loadJSON('state_example.json', function(response) {
  var myJSON = JSON.parse(response);
  state = new State(myJSON); 
	searchBox= new SearchBox(state);
});



