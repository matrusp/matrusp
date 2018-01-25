function uploadFile(file) {

  var reader = new FileReader();
  reader.onload = (function parseAFile(aFile) {
    return function(e) {
      var jsonObj = JSON.parse(e.target.result);
      if (!jsonObj.version || jsonObj.version < matrusp_current_state_version) {
        // if the state being loaded is not updated, warn and don't load.
        addClass(document.getElementById('upload-warning'), 'upload-warning-old-version');
        return false;
      }
      document.getElementById('upload-name').innerHTML = shortenString(file.name);
      state.clear();
      if (state.load(jsonObj)) {
        removeClass(document.getElementById('upload-warning'), 'upload-warning-old-version');
      } else {
        // the way it is right now, this case never happens:
        // state.load() only return false if the json doesn't have .version or it is an old version
        // but this is also checked in this method, 10 lines above.
        addClass(document.getElementById('upload-warning'), 'upload-warning-old-version');
      }
    };
  })(file);
  reader.readAsText(file);
}

function handleDrop(e) {
  e.preventDefault(); 

  var dt = e.dataTransfer;
  if (dt.items) {
    for (var i=0; i < dt.items.length; i++) {
      if (dt.items[i].kind == "file") {
        var f = dt.items[i].getAsFile();
        uploadFile(f);
        this.classList.remove('overlay-show');
        return;
      }
    }
  } 
  else if(dt.files) {
    for (var i=0; i < dt.files.length; i++) {
      uploadFile(f);
      this.classList.remove('overlay-show');
      return;
    }  
  }
}

document.getElementById('upload-input').addEventListener('change', function(e) { uploadFile(this.files[0]); });
var dropoverlay = document.getElementById('drop-overlay');
document.addEventListener('dragenter', function(e) { dropoverlay.classList.add('overlay-show'); });
dropoverlay.addEventListener('dragover', function(e) { e.preventDefault();});
dropoverlay.addEventListener('drop', handleDrop);
dropoverlay.addEventListener('dragleave', function(e) { this.classList.remove('overlay-show'); });