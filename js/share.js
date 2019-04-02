function ShareBox() {
  this.dialog = document.getElementById('share-dialog');

  this.clipboardButton = document.getElementById('share-clipboard');
  this.mailButton = document.getElementById('share-mail');
  this.facebookButton = document.getElementById('share-facebook');
  this.whatsappButton = document.getElementById('share-whatsapp');

  this.gcalButton = document.getElementById('share-gcal');
  this.icsButton = document.getElementById('share-ics');

  this.downloadButton = document.getElementById('share-download');

  this.linkBox = document.getElementById('share-link');

  this.addEventListeners();
}

ShareBox.prototype.open = function() {
  ui.openShareDialog();

  var params = new URLSearchParams();
  if(state.identifier)
    params.append("id",state.identifier);
  else
    params.append("data",btoa(state.toJSON()));
    
  this.linkBox.value = location.toString() + '?' + params.toString();
}

ShareBox.prototype.addEventListeners = function() {
  this.clipboardButton.addEventListener('click', e => {navigator.clipboard.writeText(this.linkBox.value)});
  this.whatsappButton.addEventListener('click', e => {window.open(`http://api.whatsapp.com/send?text=${encodeURIComponent('Esta é minha grade horária no MatrUSP: '+ this.linkBox.value)}`,'_blank')});
  this.facebookButton.addEventListener('click', e => {window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.linkBox.value)}`, '',
    'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=500,width=600');});
  this.mailButton.addEventListener('click', e => {location.href = `mailto:?subject=${encodeURI('Grade Horária MatrUSP')}&body=${encodeURIComponent('Esta é minha grade horária no MatrUSP: '+ this.linkBox.value)}`});

  this.gcalButton.addEventListener('click', e => {handleGAuthClick(e); ui.closeDialog();});
  this.icsButton.addEventListener('click', e => {download_icalendar(); ui.closeDialog();});
  this.downloadButton.addEventListener('click', e => {state.downloadFile(); ui.closeDialog();});
}