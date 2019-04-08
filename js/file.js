function uploadFile(file) {
  var reader = new FileReader();
  reader.onload = (function parseAFile(aFile) {
    return function(e) {
      try {
        var jsonObj = JSON.parse(e.target.result);
        if (!jsonObj.version) {
          ui.showBanner("Não foi possível abrir o arquivo. Verifique se é um arquivo do MatrUSP.",2000);
          return false;
        }
        state.load(jsonObj);
      }
      catch(e) {
        ui.showBanner("Não foi possível abrir o arquivo. Verifique se é um arquivo do MatrUSP.",2000);
        return false;
      }
    };
  })(file);
  if(file) reader.readAsText(file);
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  this.classList.remove('overlay-show');

  var dt = e.dataTransfer;
  if (dt.items) {
    for (var i=0; i < dt.items.length; i++) {
      if (dt.items[i].kind == "file") {
        var f = dt.items[i].getAsFile();
        uploadFile(f);
        return;
      }
    }
  } 
  else if(dt.files) {
    for (var i=0; i < dt.files.length; i++) {
      var f = dt.files[i];
      uploadFile(f);
      return;
    }  
  }
}

document.getElementById('upload-input').addEventListener('change', function(e) { uploadFile(this.files[0]); });
var dropoverlay = document.getElementById('drop-overlay');
document.addEventListener('dragenter', function(e) { dropoverlay.classList.add('overlay-show'); });
dropoverlay.addEventListener('dragover', function(e) { e.preventDefault(); e.stopPropagation();});
dropoverlay.addEventListener('drop', handleDrop);
dropoverlay.addEventListener('dragleave', function(e) { this.classList.remove('overlay-show'); });