/**
 * A singleton class representing the state.
 * 
 * @Constructor
 *
 * @example
 *  var stateExemple = {
 *    version: 5,
 *    campus: "TODOS",
 *    semester: "20162",
 *    planIndex: 0,
 *    plans: [{@link Plan()}]
 *  }
 *
 * @see Plan
 */
function State(jsonObj) {
	this.plans = new Array();
	this.colors = new Array();
	this.numColors = 10; // represents the number of colors on system
	for (var i = 0; i < this.numColors; i++) { 
		this.colors[i] = 0;
	}
	this.lastColor = 0;

  this.html = {
    previousCombination: document.getElementsByClassName('combination-button-left')[0],
    nextCombination: document.getElementsByClassName('combination-button-right')[0],
    upload: document.getElementById('upload-input'),
    download: document.getElementById('download')
  }
  this.addEventListeners();

  // variable set on main.js
  this.version = matrusp_current_state_version;
  this.campus = 'TODOS';
  this.semester = '20162';//chooses some standard values once they don't change
  this.activePlanIndex = 0;

  var isActivePlan = false;
  for (var i = 0; i < 3; i++) {
    if (i == 0) {
      var isActivePlan = true;
    }
    this.plans.push(new Plan(null, i, isActivePlan));
  }

  this.load(jsonObj);
}

State.prototype.delete = function() {
   while (this.plans.length) {
   this.plans[0].delete();
  }
}

State.prototype.clear = function() {
  for (var i = 0; i < this.plans.length; i++) {
    this.plans[i].clear();
  }
}

State.prototype.load = function(baseState) {
  if (baseState) {
    if (!baseState.version || baseState.version < matrusp_current_state_version) {
      // if the state being loaded is not updated, don't load.
			alert ('Este identificador não é mais valido');
      return false;
    }
    this.lastColor = baseState.lastColor || 0;
    this.version = baseState.version;
    this.campus = baseState.campus;
    this.semester = baseState.semester;
    this.activePlanIndex = baseState.activePlanIndex;
		if (baseState.colors != null) {
			for (var i = 0; i < this.colors.length; i++) {
				this.colors[i] = baseState.colors[i];
			}
		}
    for (var i = 0; i < 3; i++) {
      if (i == this.activePlanIndex) {
        var isActivePlan = true;
        this.plans[i].load(baseState.plans[i], isActivePlan);
      } else {
        this.plans[i].load(baseState.plans[i]);
      }
    }
    // TODO this is a hack to update the combination index and total combination number
    // ui below div#lecture-schedule
    if (this.plans[this.activePlanIndex].lectures.length == 0) {
      //document.getElementById('combination-value').innerHTML = '0/0';
    } else {
      this.plans[this.activePlanIndex].setActiveCombination();
    }
    return true;
  }
  return false;
}

State.prototype.reload = function(baseState) {
  this.clear();
  this.load(baseState);
}

/**
 * Adds a lecture to the current active plan if no planIndex was given.
 *
 * @param {Lecture} lecture
 * @param {Number} [planIndex]
 */
State.prototype.addLecture = function(lecture, planIndex) {
  if (planIndex == null) {
    planIndex = this.activePlanIndex;
  }
  this.plans[planIndex].addLecture(lecture);
};

State.prototype.nextCombination = function() {
  this.plans[this.activePlanIndex].nextCombination();
}

State.prototype.previousCombination = function() {
  this.plans[this.activePlanIndex].previousCombination();
}

// TODO remover essa funcao daqui?? faz sentido ela ser do state?
State.prototype.uploadFile = function() {
  var file = this.html.upload.files[0];

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

State.prototype.downloadFile = function() {
  var objectJSON = new Object();
  objectJSON = ui.copyState();

  var dataString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(objectJSON));
  var element = document.createElement('a');
  element.setAttribute("href", dataString);
  element.style.display = 'none';
  if (document.getElementById('user-identifier').value) {
    element.setAttribute('download', document.getElementById('user-identifier').value + '.json');
  } else {
    element.setAttribute('download', 'matrusp_'+ (new Date).getFullYear() + '.json');
  }
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

State.prototype.addEventListeners = function() {
  this.html.previousCombination.addEventListener('click', this.previousCombination.bind(this));
  this.html.nextCombination.addEventListener('click', this.nextCombination.bind(this));
  this.html.upload.addEventListener('change', this.uploadFile.bind(this));
  this.html.download.addEventListener('click', this.downloadFile.bind(this));
};




