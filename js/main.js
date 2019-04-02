if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('serviceworker.js');
  navigator.serviceWorker.addEventListener('message', e => {
    ui.showBanner("Uma atualização está disponível. <a href=''>Atualize a página</a> para aplicar.");
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

var params = new URLSearchParams(this.location.search);
try{
  if(params && params.has("data")) {
    state.load(JSON.parse(atob(params.get("data"))));
  }
  else if(params && params.has("id")) {
    state.loadFromServer(params.get("id"));
  }
  else if (localStorage.getItem('state'))
    state.load(JSON.parse(localStorage.getItem('state')));
  else state.load();
  
  history.replaceState(history.state, "MatrUSP", this.location.pathname);
}
catch(e) {
  ui.showBanner("Ocorreu um erro e não foi possível carregar sua grade.", 2000);
  if (localStorage.getItem('state'))
    state.load(JSON.parse(localStorage.getItem('state')));
  else state.load();
}

state.saveOnLocalStorage();

setTimeout(function() { ui.scrollActiveCombinationToView() }, 100);