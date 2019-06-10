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

  this.undoStack = [];

  this.colors = Array(ui.colors.length).fill(0);

  this.load(jsonObj, loadAsActive);

  this.html = {};
  this.html.tab = ui.createPlanTab(this);
  this.html.closeButton = this.html.tab.getElementsByClassName('plan-tab-close')[0];
  this.html.tabName = this.html.tab.getElementsByClassName('plan-tab-name')[0];

  if(loadAsActive) state.activePlan = this;

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
    ui.updateTimeTable(null,null,5);
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
  this.initiated = false;
  this.loaded = false;

  this.basePlan = basePlan;

  if (basePlan) {
    this.name = basePlan.name || "Plano " + (state.plans.length + 1);
    var lecturePromises = basePlan.lectures.map(baseLecture => Lecture.load(baseLecture, this));
    Promise.all(lecturePromises).then(lectures => {
      lectures = lectures.filter(el => el);
      this.lectures = lectures;

      this.loaded = true;
      delete this.basePlan;

      this.activeCombinationIndex = basePlan.activeCombinationIndex;
      if(this == state.activePlan) {
        ui.addLectures(lectures);
        this.update();
      }
    });
  }
  else {
    this.loaded = true;
    this.name = "Plano " + (state.plans.length + 1);
  }
};

Plan.prototype.delete = function() {
  this.hidePlan();
  this.undoStack = [];

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
  if(state.activePlan == this) {
    ui.showCombinations(this.combinations);
    ui.refreshAccordion();
  }
  this.activeCombination = this.closestCombination(oldActiveCombination) || this.combinations[0];

  ui.updateTimeTable();

  this.initiated = true;
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
      ui.showCombinations(this.combinations);
    }

    this.activeCombination = this.closestCombination(this.activeCombination) || this.combinations[0];
  }
  else {
    lecture.available = false;
  }

  
  if(this == state.activePlan)
      ui.addLectures([lecture]);

  state.saveOnLocalStorage();

  return lecture;
}

Plan.prototype.removeLecture = function(lecture, preventUndoPush) {
  var lectureIndex = this.lectures.indexOf(lecture);
  if(lectureIndex == -1)
    return;

  if(!preventUndoPush) {
    var lectureData = lecture.serialize();
    this.undoStackPush(async () => {
      this.lectures.splice(lectureIndex, 0, await Lecture.load(lectureData, this));
      ui.addLectures([this.lectures[lectureIndex]]);
      this.update();
    });

    ui.showBanner(`Disciplina '${lecture.name}' removida. <a onclick="state.activePlan.undo()">Desfazer</a>`, 1500);
  }

  lecture.delete();
  this.lectures.splice(lectureIndex,1);
  this.colors[lecture.color]--;
  this.update();
}

Plan.prototype.moveLecture = function(sourceIndex, targetIndex) {
  if(sourceIndex == targetIndex)
    return;

  var lecture = this.lectures[sourceIndex];

  var lecture = this.lectures.splice(sourceIndex, 1)[0];
  this.lectures.splice(targetIndex, 0, lecture);

  state.saveOnLocalStorage();

  this.update();
}

function getLectureCombinations (lecture, combinations) {
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
      lecture.available = true;
      return lectureCombinations;
    } else {
      lecture.available = false;
      return;
    }
}

Plan.prototype.computeCombinations = function() {
  var combinations = [];
  this.lectures.forEach(lecture => {combinations = getLectureCombinations(lecture, combinations) || combinations});
  this.combinations = combinations.map(combination => new Combination(combination, this));

  if(combinations.length > 200) {
    ui.showBanner(`Mais de ${(combinations.length % 100) * 100} combinações encontradas. Tente remover algumas turmas para facilitar sua escolha`, 5000);
  }
}

Plan.prototype.showPlan = function() {
  this.html.tab.classList.add('plan-active');

  if(!this.initiated) {
    this.update();
  }

  ui.addLectures(this.lectures);
  ui.showCombinations(this.combinations);

  ui.scrollActiveCombinationToView();
  
  if(this.activeCombination)
    ui.setCredits(this.activeCombination.lectureCredits, this.activeCombination.workCredits);
  else ui.setCredits(0,0);

  ui.undoButton.disabled = !this.undoStack.length;
}

Plan.prototype.hidePlan = function() {
  if(state.activePlan != this) return;

  this.html.tab.classList.remove('plan-active');
  
  ui.removeLectures(this.lectures);
  ui.clearCombinations();
}


Plan.prototype.tabNameChanged = function(e) {
  this.name = this.html.tabName.value.trim();
  this.html.tabName.disabled = true;
  state.saveOnLocalStorage();
}

Plan.prototype.serialize = function() {
  if(!this.loaded) {
    return this.basePlan;
  }
  
  var planData = {};
  planData.activeCombinationIndex = this.activeCombinationIndex;
  planData.name = this.name;
  planData.colors = this.colors;
  planData.lectures = this.lectures.map(lecture => lecture.serialize());

  return planData;
}

Plan.prototype.undoStackPush = function(action) {
  this.undoStack.push(action);
  ui.undoButton.disabled = false;
}

Plan.prototype.undo = function() {
  if(!this.undoStack.length)
    return;

  this.undoStack.pop()();

  if(!this.undoStack.length)
    ui.undoButton.disabled = true;
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