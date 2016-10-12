document.getElementById('fbshare').addEventListener('click', generate_identifier);

function generate_identifier() {
  var identifier = (+new Date).toString(36);
  ui.saveStateOnServer(identifier);
  console.log(window.location.href + '#' + identifier);
  window.open("https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(window.location.href + '#' + identifier), '',
    'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
}