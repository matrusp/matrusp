


var ui = new UI();
var state;
var searchBox;
if (localStorage.getItem('state')) {
	state = new State(JSON.parse(localStorage.getItem('state')));
} else {
	state = new State();
}

var database = new Database();
database.loadDB('db/db_usp.json', 1);
searchBox= new SearchBox();


setTimeout(function(){ui.scrollActiveCombinationToView()}, 100);

