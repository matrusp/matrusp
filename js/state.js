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

  this.html = {
    previousCombination: document.getElementsByClassName('combination-button-left')[0],
    nextCombination: document.getElementsByClassName('combination-button-right')[0],
    upload: document.getElementById('upload-input')
  }
	for (var i = 0; i < 3; i++) {
		this.plans.push(new Plan(null, i));
	}
  this.addEventListeners();
	this.load(jsonObj);
}

State.prototype.load = function(jsonObj) { 
  if (jsonObj) {
		this.version = jsonObj.version;
		this.campus = jsonObj.campus;
		this.semester = jsonObj.semester;
		this.activePlanIndex = jsonObj.activePlanIndex;
		this.colors = jsonObj.colors;
		for (var i = 0; i < jsonObj.plans.length; i++) {
			if (i == this.activePlanIndex) {
				this.plans[i].load(jsonObj.plans[i], true);
			} else {
				this.plans[i].load(jsonObj.plans[i], false);
			}
		}
    // TODO this is a hack to update the combination index and total combination number
    // ui below div#lecture-schedule
    if (this.plans[this.activePlanIndex].lectures.length == 0) {
      //document.getElementById('combination-value').innerHTML = '0/0';
    } else {
      this.plans[this.activePlanIndex].setActiveCombination();
    }
  } else {
    this.version = 5;
    this.campus = 'TODOS';
    this.semester = '20162';//chooses some standard values once they don't change
    this.activePlanIndex = 0;
  }
}

State.prototype.delete = function() {
	 while (this.plans.length) {
		this.plans[0].delete();
	}
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
      document.getElementById('upload-name').innerHTML = shortenString(file.name);
      state.delete();
      state = new State(jsonObj);
    };
  })(file);
  reader.readAsText(file);
}

State.prototype.addEventListeners = function() {
  this.html.previousCombination.addEventListener('click', this.previousCombination.bind(this));
  this.html.nextCombination.addEventListener('click', this.nextCombination.bind(this));
  this.html.upload.addEventListener('change', this.uploadFile.bind(this));
};




