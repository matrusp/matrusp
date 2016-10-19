
var ui = new UI();
var state;
var searchBox;
var database;

state = new State();
database = new Database();
database.loadDB('db/db_usp.txt', 1);
searchBox = new SearchBox();

if (window.location.hash.substr(1)) {
	ui.loadStateFromServer(window.location.hash.substr(1));
} else if (localStorage.getItem('state')) {
	state.clear();
	state.load(JSON.parse(localStorage.getItem('state')));
	saveStateOnLocalStorage();
}
setTimeout(function(){ui.scrollActiveCombinationToView()}, 100);

