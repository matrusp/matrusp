if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('serviceworker.js');
  navigator.serviceWorker.addEventListener('message', e => {
    ui.showBanner("Uma atualização está disponível. <a href='' target='_blank'>Atualize a página</a> para aplicar.");
  });
}

var dbworker = new Worker("js/dbupdate.js");

var matrusp_current_state_version = 7;

var state = new State();
var ui = new UI();
var searchBox = new SearchBox();
var courseBox = new CourseBox();
var shareBox = new ShareBox();
var saveBox = new SaveBox();
var printBox = new PrintBox();

dbworker.onmessage = e => {
  ui.setLoadingBar(e.data);
  if (e.data == 1) {
    searchBox.populateOptions();
  }
}

if (window.location.hash.substr(1)) {
  ui.loadStateFromServer(window.location.hash.substr(1));
  history.pushState('', document.title, window.location.pathname);
} 
else if (localStorage.getItem('state'))
  state.load(JSON.parse(localStorage.getItem('state')));
else state.load();

state.saveOnLocalStorage();

setTimeout(function() { ui.scrollActiveCombinationToView() }, 100);