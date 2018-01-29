function uploadFile(file) {

  var reader = new FileReader();
  reader.onload = (function parseAFile(aFile) {
    return function(e) {
      var uploadWarning = document.getElementById('upload-warning');
      try {
        var jsonObj = JSON.parse(e.target.result);
        if (!jsonObj.version) {
          uploadWarning.innerHTML = "Arquivo inválido!";
          addClass(uploadWarning, 'upload-warning-old-version');
          return false;
        }
        else if(jsonObj.version < matrusp_current_state_version) {
          // if the state being loaded is not updated, warn and don't load.
          uploadWarning.innerHTML = "Arquivo da versão antiga é incompatível!";
          addClass(uploadWarning, 'upload-warning-old-version');
          return false;
        }
        document.getElementById('upload-name').innerHTML = shortenString(file.name);
        state.clear();
        if (state.load(jsonObj)) {
          removeClass(uploadWarning, 'upload-warning-old-version');
        } else {
          // the way it is right now, this case never happens:
          // state.load() only return false if the json doesn't have .version or it is an old version
          // but this is also checked in this method, 10 lines above.
          addClass(uploadWarning, 'upload-warning-old-version');
        }
      }
      catch(e) {
        uploadWarning.innerHTML = "Arquivo inválido!";
        addClass(uploadWarning, 'upload-warning-old-version');
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