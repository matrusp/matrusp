/**
 * A class representing plans.
 * 
 * @Constructor
 *
 * @example
 *  var planExample = {
 *    planId: 0,
 *    activeCombinationIndex: 0,
 *    combinations: [{@link Combination}],
 *    lectures: [{@link Lecture}], 
 *    htmlElement: document.createElement('div'), // só existirá com o design finalizado
 *    htmlElementCombinations: [
 *      document.createElement('div'), // só existirá com o design finalizado
 *    ]     
 *  }
 */
function Plan(jsonObj, loadAsActive) {
  this.lectures = new Array();
  this.combinations = new Array();

  this.colors = Array(ui.colors.length).fill(0);

  this.load(jsonObj, loadAsActive);

  this.html = {};
  this.html.tab = ui.createPlanTab(this);
  this.html.closeButton = this.html.tab.getElementsByClassName('plan-tab-close')[0];
  this.html.tabName = this.html.tab.getElementsByClassName('plan-tab-name')[0];

  this.addEventListeners();
}

Plan.prototype = {
  get activeCombination() {
    return this._activeCombination;
  },
  set activeCombination(combination) {
    if (this._activeCombination == combination) return;

    //Unset the previous active combination
    if (this.activeCombination) {
      this.activeCombination.unsetHighlight();
      this.activeCombination.classroomGroups.forEach(group => {
        group[0].hideBox();
        group.forEach(classroom => { classroom.unsetActive(); });
        group[0].parent.activeClassrooms = [];
      });
    }

    //Set the new active combination
    this._activeCombination = combination;
    if (combination) {
      combination.setHighlight();
      combination.classroomGroups.forEach(group => {
        group[0].showBox();
        group.forEach(classroom => { if(classroom.selected) classroom.setActive(); });
        group[0].parent.activeClassrooms = group;
      });
      if(this == state.activePlan) {
        ui.setCredits(combination.lectureCredits, this.activeCombination.workCredits);
        ui.scrollActiveCombinationToView();
      }
    } 
    else ui.setCredits(0,0);
    state.saveOnLocalStorage();
  },

  get activeCombinationIndex() {
    return this.combinations.indexOf(this._activeCombination);
  },
  set activeCombinationIndex(index) {
    if(index >= 0)
      this.activeCombination = this.combinations[index];
  },
};

Plan.prototype.load = function(basePlan, loadAsActive) {
  this.lectures = [];
  this.combinations = [];

  if (basePlan) {
    this.name = basePlan.name || "Plano " + (state.plans.length + 1);
    var lecturePromises = basePlan.lectures.map(async baseLecture => {
      var lectureInfo = await matruspDB.lectures.get(baseLecture.code);
      if (!lectureInfo) lectureInfo = await fetch(`db/${baseLecture.code}.json`).then(response => response.ok ? response.json() : null);
      if (!lectureInfo) return;
      
      lectureInfo.color = baseLecture.color !== undefined ? baseLecture.color : this.colors.indexOf(Math.min(... this.colors));
      this.colors[lectureInfo.color]++;

      lectureInfo.selected = baseLecture.selected;

      var lecture = new Lecture(lectureInfo, this);

      lecture.classrooms.forEach(classroom => {
        if (baseLecture.classrooms && baseLecture.classrooms.indexOf(classroom.code) == -1)
          classroom.toggleClassroomSelection();
      });
      return lecture;
    });
    Promise.all(lecturePromises).then(lectures => {
      lectures = lectures.filter(el => el);
      this.lectures = lectures;

      if(basePlan.combinations)
        this.combinations = basePlan.combinations.map(baseCombination => new Combination(
          baseCombination.map(baseGroup => 
            this.lectures.find(lecture => lecture.code == baseGroup.lecture).classrooms.filter(classroom => 
              baseGroup.classrooms.find(baseClassroom => classroom.code == baseClassroom)
            )
          ), this)
        );
      else this.update();
      this.activeCombinationIndex = basePlan.activeCombinationIndex;
      if(loadAsActive) state.activePlan = this;
      else if(state.activePlan == this) this.showPlan();
    });
  }
  else {
    this.name = "Plano " + (state.plans.length + 1);
  }
};

Plan.prototype.delete = function() {
  this.hidePlan();

  this.html.tab.parentNode.removeChild(this.html.tab);
}

Plan.prototype.clear = function() {
  while (this.lectures.length) {
    this.lectures[0].delete();
  }
}

/**
 *
 */
Plan.prototype.update = function() {
  if (this.activeCombination) {
    var oldActiveCombination = this.activeCombination;
  }

  while (this.combinations.length > 0) {
    this.combinations[0].delete();
  }

  this.computeCombinations();
  this.activeCombination = this.closestCombination(oldActiveCombination) || this.combinations[0];
  if(state.activePlan == this) this.showPlan();
};

/**
 *
 */
Plan.prototype.closestCombination = function(oldActiveCombination) {
  if (this.combinations.length == 0) {
    // No combination could be created, probably there isn't any lecture selected.
    return;
  }
  if (!oldActiveCombination) {
    return;
  }

  // If there is some combination, there is at least the index 0.
  var closestCombinationIndex = 0;
  var maximumScoreSoFar = -1;
  for (var i = 0; i < this.combinations.length; i++) {
    var score = oldActiveCombination.getSimilarityScore(this.combinations[i]);
    if (score > maximumScoreSoFar) {
      maximumScoreSoFar = score;
      closestCombinationIndex = i;
    }
  }
  return this.combinations[closestCombinationIndex];
}

/**
 *
 */
Plan.prototype.nextCombination = function() {
  this.activeCombinationIndex = (this.activeCombinationIndex + 1) % this.combinations.length;
};

/**
 *
 */
Plan.prototype.previousCombination = function() {
  this.activeCombinationIndex = ((this.activeCombinationIndex - 1) + this.combinations.length) % this.combinations.length;
};

/**
 * Adds a lecture to this plan.
 *
 * @param {Lecture} lecture
 */
Plan.prototype.addLecture = function(lecture) {
  if(!lecture.color) lecture.color = this.colors.indexOf(Math.min(... this.colors));
  if(lecture.selected === undefined) lecture.selected = true;
  this.colors[lecture.color]++;
  var lecture = lecture instanceof Lecture ? lecture : new Lecture(lecture, this);
  this.lectures.push(lecture);

  var combinations = this.combinations.map(combination => combination.classroomGroups);
  var activeCombination;

  var lectureCombinations = [];
  if(!lecture.selected) return;

  lecture.groupedClassrooms.forEach(classroomGroup => {
    if(!classroomGroup.some(classroom => classroom.selected)) return;
    if(!combinations.length)
      lectureCombinations.push([classroomGroup]);

    combinations.forEach(combination => {
      if(!combination.some(combinationClassroomGroup => combinationClassroomGroup[0].conflictsWith(classroomGroup[0]))) {
        var newCombination = combination.slice();
        newCombination.push(classroomGroup);
        lectureCombinations.push(newCombination);
      }
    });
  });
  if(lectureCombinations.length) {
    while (this.combinations.length > 0) {
      this.combinations[0].delete();
    }

    this.combinations = lectureCombinations.map(combination => new Combination(combination, this));
    if(this == state.activePlan) {
      ui.addCombinations(this.combinations);
    }

    this.activeCombination = this.closestCombination(this.activeCombination) || this.combinations[0];
  }
  else {
    lecture.available = false;
  }

  
  if(this == state.activePlan)
      ui.addLectures([lecture]);
}

Plan.prototype.removeLecture = function(lecture) {
  lecture.delete();
  this.lectures.splice(this.lectures.indexOf(lecture),1);
  this.colors[lecture.color]--;

  this.update();
}

Plan.prototype.computeCombinations = function() {
  var combinations = [];
  this.lectures.forEach(lecture => {
    var lectureCombinations = [];
    if(!lecture.selected) return;

    lecture.groupedClassrooms.forEach(classroomGroup => {
      if(!classroomGroup.some(classroom => classroom.selected)) return;
      if(!combinations.length)
        lectureCombinations.push([classroomGroup]);

      combinations.forEach(combination => {
        if(!combination.some(combinationClassroomGroup => combinationClassroomGroup[0].conflictsWith(classroomGroup[0]))) {
          combination = combination.slice();
          combination.push(classroomGroup);
          lectureCombinations.push(combination);
        }
      });
    });
    if(lectureCombinations.length) {
      combinations = lectureCombinations;
      lecture.available = true;
    } else {
      lecture.available = false;
    }
  });
  this.combinations = combinations.map(combination => new Combination(combination, this));
}

Plan.prototype.showPlan = function() {
  addClass(this.html.tab, 'plan-active');

  ui.addLectures(this.lectures);
  ui.addCombinations(this.combinations);
  if(this.activeCombination)
    ui.setCredits(this.activeCombination.lectureCredits, this.activeCombination.workCredits);
  else ui.setCredits(0,0);
}

Plan.prototype.hidePlan = function() {
  if(state.activePlan != this) return;

  removeClass(this.html.tab, 'plan-active');
  
  ui.removeLectures(this.lectures);
  ui.removeCombinations(this.combinations);
}


Plan.prototype.tabNameChanged = function(e) {
  this.name = this.html.tabName.value.trim();
  this.html.tabName.disabled = true;
  state.saveOnLocalStorage();
}

Plan.prototype.serialize = function() {
  var planData = {};
  planData.activeCombinationIndex = this.activeCombinationIndex;
  planData.name = this.name;
  planData.colors = this.colors;
  planData.lectures = this.lectures.map(lecture => {
    var lectureData = {};
    lectureData.code = lecture.code;
    lectureData.color = lecture.color;
    lectureData.selected = lecture.selected;
    lectureData.classrooms = [];

    lecture.classrooms.forEach(classroom => {
      if (classroom.selected)
        lectureData.classrooms.push(classroom.code);
    });

    return lectureData;
  });

  //Sometimes combinations length will explode to insane amounts
  //Keep this in check so we don't exceed the quota for localStorage
  if(this.combinations.length < 50)
    planData.combinations = this.combinations.map(combination => 
      combination.classroomGroups.map(group => ({'lecture': group[0].parent.code, 'classrooms': group.map(classroom => classroom.code)}))
    );

  return planData;
}

/**
 *
 */
Plan.prototype.addEventListeners = function() {
  this.html.tab.addEventListener('click', e => {state.activePlan = this;});
  this.html.tab.addEventListener('mousedown', e => {if(e.button == 1) {state.removePlan(this); e.stopPropagation(); }});
  //this.html.tab.addEventListener('auxclick', e => {if(e.which == 2) {state.removePlan(this); e.stopPropagation(); }});
  this.html.closeButton.addEventListener('click', e => {state.removePlan(this); e.stopPropagation();});
  this.html.tab.addEventListener('dblclick', e => {this.html.tabName.disabled = false; this.html.tabName.focus();});
  this.html.tabName.addEventListener('change', this.tabNameChanged.bind(this));
  this.html.tabName.addEventListener('blur', this.tabNameChanged.bind(this));
  this.html.tabName.addEventListener('keydown',e => {
    if(e.key != "Escape") return true;
    this.html.tabName.value = this.name; 
    this.html.tabName.blur(); 
    e.preventDefault();
  });
  this.html.tab.addEventListener('contextmenu',e => {ui.createPlanContextMenu(this,{x: e.clientX, y: e.clientY}); e.preventDefault();});
};