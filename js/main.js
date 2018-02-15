if('serviceWorker' in navigator) {
	navigator.serviceWorker.register('serviceworker.js');
	navigator.serviceWorker.addEventListener('message',e => {
		ui.showBanner("Uma atualização está disponível. <a href=''>Atualize a página</a> para aplicar.");
	});
}

if('Worker' in window) {
	var dbworker = new Worker("js/dbupdate.js");
}
else location.href = "https://bcc.ime.usp.br/matrusp_v1";

var ui = new UI();
var state;
var searchBox;
// Old codebase was using 5
var matrusp_current_state_version = 6;

dbworker.onmessage = e => {
	ui.setLoadingBar(e.data);
}

state = new State();
searchBox = new SearchBox();

if (window.location.hash.substr(1)) {
	ui.loadStateFromServer(window.location.hash.substr(1));
	history.pushState('', document.title, window.location.pathname);
} else if (localStorage.getItem('state')) {
	state.clear();
	state.load(JSON.parse(localStorage.getItem('state')));
	saveStateOnLocalStorage();
}
setTimeout(function(){ui.scrollActiveCombinationToView()}, 100);
