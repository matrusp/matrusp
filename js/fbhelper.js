document.getElementById('fbshare').addEventListener('click', generate_identifier);

function generate_identifier() {
  var identifier;
  if (sessionStorage.getItem('identifier') == null) {
    identifier = (+new Date).toString(36);
    sessionStorage.setItem('identifier', identifier);
  } else {
    identifier = sessionStorage.getItem('identifier');
  }
  ui.saveStateOnServer(identifier);
  window.open("https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(window.location.href + '#' + identifier), '',
    'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
}