
var ui = new UI();
var state;
var searchBox;
var database;
// Old codebase was using 5
var matrusp_current_state_version = 6;

state = new State();
database = new Database();
database.loadDB('db/20162.txt', 1);
searchBox = new SearchBox();

if (window.location.hash.substr(1)) {
	ui.loadStateFromServer(window.location.hash.substr(1));
} else if (localStorage.getItem('state')) {
	state.clear();
	state.load(JSON.parse(localStorage.getItem('state')));
	saveStateOnLocalStorage();
}
setTimeout(function(){ui.scrollActiveCombinationToView()}, 100);

