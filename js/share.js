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

ShareBox.prototype.addEventListeners = function() {
  this.clipboardButton.addEventListener('click', e => {navigator.clipboard.writeText(this.linkBox.value)});
  this.whatsappButton.addEventListener('click', e => {window.open(`http://api.whatsapp.com/send?text=${encodeURI('Esta é minha grade horária no MatrUSP: '+ this.linkBox.value)}`,'_blank')});
  this.facebookButton.addEventListener('click', e => {window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURI(this.linkBox.value)}`, '',
    'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');});
  this.mailButton.addEventListener('click', e => {window.open(`mailto:?subject=${encodeURI('Grade Horária MatrUSP')}&body=${encodeURI('Esta é minha grade horária no MatrUSP: '+ this.linkBox.value)}`)});

  this.icsButton.addEventListener('click', e => {download_icalendar()});
  this.downloadButton.addEventListener('click', e => {state.downloadFile();})
}