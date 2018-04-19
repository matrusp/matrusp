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
function Plan(jsonObj, planId, isActivePlan) {
  this.lectures = new Array();
  this.combinations = new Array();
  this.planId = planId;

  // It's expected that div#plan-{planId} exists!
  this.html = {};
  this.html.tab = document.getElementById('plan-' + this.planId);
  this.html.tabName = this.html.tab.getElementsByClassName('plan-tab-name')[0];
  this.html.tabOptionsArrow = this.html.tab.getElementsByClassName('plan-tab-options-arrow')[0];
  this.html.clear = this.html.tab.getElementsByClassName('plan-tab-option')[0];
  this.html.copy1 = this.html.tab.getElementsByClassName('plan-tab-option')[1];
  this.html.copy2 = this.html.tab.getElementsByClassName('plan-tab-option')[2];

  this.addEventListeners();

  this.load(jsonObj, isActivePlan);
}

/**
 *
 **/
// TODO caso em que basePlan == null e isActivePlan eh valido existe! trata-la!
Plan.prototype.load = function(basePlan, isActivePlan) {
  this.lectures = new Array();
  this.combinations = new Array();
  if (basePlan != null) {
    var lecturePromises = basePlan.lectures.map(baseLecture =>
      matruspDB.lectures.get(baseLecture.code).then(result => {
        if (result)
          return result;
        else
          return fetch(`db/${baseLecture.code}.json`).then(response => response.json());
      }).then(lectureInfo => {
        var lecture = new Lecture(Object.assign({ 'color': baseLecture.color, 'selected': baseLecture.selected }, lectureInfo || {}), this);
        lecture.classrooms.forEach(classroom => {
          if (baseLecture.classrooms.indexOf(classroom.code) == -1)
            classroom.toggleClassroomSelection(true);
        });
        ui.addLecture(lecture);
        return lecture;
      }));
    Promise.all(lecturePromises).then(lectures => {
      this.lectures = lectures;
      this.activeCombinationIndex = basePlan.activeCombinationIndex;
      this.computeCombinations();
      this.activeCombination = this.combinations[this.activeCombinationIndex];
      if (isActivePlan) {
        this.setActiveCombination();
        this.showPlan();
      }
    });
  }
}

Plan.prototype.delete = function() {
  this.unsetPlan();
  while (this.lectures.length) {
    this.lectures[0].delete();
  }
  this.removeEventListeners();
  // All htmlElements removed, now remove itself from the plan and
  // update it.
  var indexOnParent = state.plans.indexOf(this);
  state.plans.splice(indexOnParent, 1);
  // TODO change plans constructor to include this.parent
}

Plan.prototype.clear = function() {
  // commenting this generates bug?
  this.unsetPlan();
  while (this.lectures.length) {
    this.lectures[0].delete();
  }
}
/**
 *
 */
Plan.prototype.update = function(classroomUpdated) {
  var oldActiveCombination = null;
  //if (this.activeCombinationIndex != null) {
  if (this.activeCombination) {
    // There is an active combination.
    //oldActiveCombination = this.combinations[this.activeCombinationIndex];
    oldActiveCombination = this.activeCombination;
    this.unsetActiveCombination();
  }

  while (this.combinations.length > 0) {
    this.combinations[0].delete();
  }
  this.computeCombinations();
  this.activeCombinationIndex = this.closestCombination(oldActiveCombination, classroomUpdated);
  if (this.activeCombinationIndex != null) {
    // There is an active combination.
    this.activeCombination = this.combinations[this.activeCombinationIndex];
    this.setActiveCombination();
    if (this.planId == state.activePlanIndex) this.showPlan();
  } else {
    // If there are no combinations.
    this.activeCombination = null;
    document.getElementById('lecture-credits').innerHTML = '0';
    document.getElementById('work-credits').innerHTML = '0';

    //document.getElementById('combination-value').innerHTML = '0/0';
  }
  saveStateOnLocalStorage();
};

/**
 *
 */
Plan.prototype.closestCombination = function(oldActiveCombination) {
  if (this.combinations.length == 0) {
    // No combination could be created, probably there isn't any lecture selected.
    return null;
  }
  if (!oldActiveCombination) {
    // Now there is only one combination: if there wasn't any and 
    // update was called from one single event that is the inclusion 
    // of a single classroom. Return the index of this single 
    // combination.
    return 0;
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
  return closestCombinationIndex;
}

/**
 *
 */
Plan.prototype.nextCombination = function() {
  this.unsetActiveCombination();
  this.activeCombinationIndex = (this.activeCombinationIndex + 1) % this.combinations.length;
  this.activeCombination = this.combinations[this.activeCombinationIndex];
  this.setActiveCombination();
  ui.scrollActiveCombinationToView();
};

/**
 *
 */
Plan.prototype.previousCombination = function() {
  this.unsetActiveCombination();
  this.activeCombinationIndex = ((this.activeCombinationIndex - 1) + this.combinations.length) % this.combinations.length;
  this.activeCombination = this.combinations[this.activeCombinationIndex];
  this.setActiveCombination();
  ui.scrollActiveCombinationToView();
};

Plan.prototype.setCombination = function(combination) {
  if (!combination || this.activeCombination == combination) return;
  this.unsetActiveCombination();
  this.activeCombinationIndex = this.combinations.indexOf(combination);
  this.activeCombination = combination;
  this.setActiveCombination();
  ui.scrollActiveCombinationToView();
}

/**
 * Adds a lecture to this plan.
 *
 * @param {Lecture} lecture
 */
Plan.prototype.addLecture = function(lecture) {
  var newLecture = new Lecture(lecture, this);
  this.lectures.push(newLecture);
  ui.addLecture(newLecture);
  this.update();
}

Plan.prototype.findNextCombinationBase = function(lastCombinationBase) {
  // Using another variable name to make it more readable (regarding semantics).
  var combinationBase = lastCombinationBase;
  if (!combinationBase) {
    // If it is the first possible combination, just return it.
    combinationBase = Array(this.lectures.length).fill(0);
    for (var i = combinationBase.length - 1; i >= 0; i--) {
      if (!this.lectures[i].selected) {
        combinationBase[i] = -1;
      }
    }
    return combinationBase;
  }

  var rightmostSelectedLectureIndex = -1;
  for (var i = combinationBase.length - 1; i >= 0; i--) {
    if (rightmostSelectedLectureIndex == -1) {
      rightmostSelectedLectureIndex = i;
    }
  }
  if (rightmostSelectedLectureIndex == -1) {
    // There are no selected lectures, return all values equal to -1.
    combinationBase = Array(this.lectures.length).fill(-1);
    return combinationBase;
  }

  // Next base is generated like summing 1 to a base-2 number.
  // If array A generates no valid combinations, B should be the next tried base:
  // Example 1
  // A = [ 0, unselectedLecture,  0, -1, -1, unselectedLecture, -1]
  // B = [ 0, unselectedLecture, -1,  0,  0, unselectedLecture,  0]
  // Example 2
  // A = [ 0, unselectedLecture, -1,  0, -1, unselectedLecture, -1]
  // B = [ 0, unselectedLecture, -1, -1,  0, unselectedLecture,  0]
  // Example 3
  // A = [ 0,  0,  0, unselectedLecture, unselectedLecture]
  // B = [ 0,  0, -1, unselectedLecture, unselectedLecture]
  // Obs.: The value 'unselectedLecture' is actually -1 on the real array.
  var i = rightmostSelectedLectureIndex;
  while (i >= 0) {
    if (!this.lectures[i].selected) {
      i--;
      continue;
    }
    if (combinationBase[i] == -1) {
      combinationBase[i] = 0;
      i--;
    } else {
      combinationBase[i] = -1;
      return combinationBase;
    }
  }

  // If got here, it means that every selected lecture was set to -1 until the
  // last loop. Set them again to -1 and return.
  combinationBase = Array(this.lectures.length).fill(-1);
  return combinationBase;
};

/**
 *
 */
Plan.prototype.computeCombinations = function() {
  for (var i = 0; i < this.lectures.length; i++) {
    if (this.lectures[i].htmlLectureCheckbox.disabled) {
      this.lectures[i].enableCheckbox();
      if (!this.lectures[i].noClassroomsSelected()) {
        this.lectures[i].lectureSelect();
      }
    }
  }
  // Try first combination base, where all selected lectures are considered.
  var combinationBase = this.findNextCombinationBase();
  this.computeCombinationsFromBase(combinationBase);
  // If all entries in combinationBase are -1 it means that there are no possible combinations.
  // Otherwise combinationBase.indexOf(0) > -1.
  while (this.combinations.length == 0 && combinationBase.indexOf(0) > -1) {
    combinationBase = this.findNextCombinationBase(combinationBase);
    this.computeCombinationsFromBase(combinationBase);
  }
  if (this.combinations.length == 0) {
    return;
  }
  for (var i = 0; i < this.lectures.length; i++) {
    if (combinationBase[i] == -1 && this.lectures[i].selected) {
      this.lectures[i].lectureUnselect();
      this.lectures[i].disableCheckbox();
    }
  }
}

/**
 *
 */
Plan.prototype.testCombination = function(potentialCombination) {
  for (var i = 0; i < potentialCombination.length; i++) {
    var classroom1Index = potentialCombination[i];
    if (classroom1Index == -1) {
      // Lecture isn't selected. Obs.: A combination without any
      // selected lecture, is still valid.
      continue;
    }
    var classroom1 = this.lectures[i].classrooms[classroom1Index];
    if (!classroom1.selected) {
      return false;
    }
    for (var j = i + 1; j < potentialCombination.length; j++) {
      var classroom2Index = potentialCombination[j];
      if (classroom2Index == -1) {
        // Lecture isn't selected.
        continue;
      }
      var classroom2 = this.lectures[j].classrooms[classroom2Index];
      if (!classroom2.selected) {
        return false;
      }

      if (classroomsConflict(classroom1, classroom2)) {
        return false;
      }
    }
  }
  return true;
};


/**
 *
 */
Plan.prototype.computeCombinationsFromBase = function(combinationBase) {
  var leftmostSelectedLectureIndex = -1;
  // combinationBase is something like this:
  // [-1, -1, 0, -1, 0, 0, 0, -1]
  //       ___^____
  // where this guy is the leftmostSelectedLectureIndex
  for (var i = 0; i < combinationBase.length; i++) {
    if (combinationBase[i] != -1 && leftmostSelectedLectureIndex == -1) {
      leftmostSelectedLectureIndex = i;
    }
  }

  if (leftmostSelectedLectureIndex == -1) {
    // combinationBase has all values equal to -1, meaning that no lecture is 
    // selected. There are no combinations.
    return;
  }

  // newArray = oldArray.slice() => it copies array by value, since the original array
  // is composed of numbers.
  // See: http://stackoverflow.com/questions/7486085/copying-array-by-value-in-javascript
  var potentialCombination = combinationBase.slice();

  // illustrating an upper bound: 8 lectures with 3 classrooms each -> 3^8 combinations = 6561
  // var loop existis only to foolproof the alternative "while (true)"
  // while condition could be this one without affecting the logic (?):
  // potentialCombination[leftmostSelectedLectureIndex] >= this.lectures[leftmostSelectedLectureIndex].classrooms.length
  var loop = 0;
  while (loop++ < 7000) {
    if (this.testCombination(potentialCombination)) {
      combination = new Combination(potentialCombination, this);
      this.combinations.push(combination);
    }

    // This process is similar to adding 1 to a number, where each slot is a digit
    // we begin at the rightmost digit and whenever a value reaches its maximum
    // capacity we turn it to zero and add 1 to the one on its left.
    // The first lecture will be last to change (when traveling in the combinations).
    // Also, when there are '-1's (lecture not selected), it jumps. For that matter,
    // the loop stops when the leftmost selected lecture excedes its maximum capacity.
    for (var slot = potentialCombination.length - 1; slot >= 0; slot--) {
      if (potentialCombination[slot] == -1) {
        // Lecture not selected.
        continue;
      }
      potentialCombination[slot]++;
      if (potentialCombination[slot] >= this.lectures[slot].classrooms.length) {
        // Just exceded maximum capacity.
        // Obs.: Should never get to 'more than'.
        if (slot == leftmostSelectedLectureIndex) {
          // All combinations seen. We can return.
          return;
        }
        // There are more combinations to test. At the next potentialCombination,
        // 'lectures[slot]' lecture will have its first classroom: classrooms[0].
        potentialCombination[slot] = 0;
      } else {
        // next potentialCombination is already set. Loop to test it.
        break;
      }
    }
  }
}

/**
 * 
 */
Plan.prototype.setActiveCombination = function() {
  // if there is an activeCombinationIndex set
  /*if(this.activeCombinationIndex != null) {
		var activeCombination = this.combinations[this.activeCombinationIndex];
		for (var i = 0; i < activeCombination.lecturesClassroom.length; i++) {
			var activeClassroom = activeCombination.lecturesClassroom[i];
			activeClassroom.showBox();
      activeClassroom.parent.activeClassroom = activeClassroom;
		} */
  // if there is an active combination
  if (this.activeCombination) {
    this.activeCombination.setHighlight();
    var lecturesClassrooms = this.activeCombination.lecturesClassroom;
    for (var i = 0; i < lecturesClassrooms.length; i++) {
      lecturesClassrooms[i].showBox();
      lecturesClassrooms[i].parent.activeClassroom = lecturesClassrooms[i];
    }
    document.getElementById('lecture-credits').innerHTML = this.activeCombination.lectureCredits;
    document.getElementById('work-credits').innerHTML = this.activeCombination.workCredits;

    //document.getElementById('combination-value').innerHTML = (this.activeCombinationIndex + 1) + '/' + this.combinations.length;
  } else {
    document.getElementById('lecture-credits').innerHTML = '0';
    document.getElementById('work-credits').innerHTML = '0';
  }
  saveStateOnLocalStorage();
};

/**
 * 
 */
Plan.prototype.unsetActiveCombination = function() {
  /*
	if(this.activeCombinationIndex != null) {
		var activeCombination = this.combinations[this.activeCombinationIndex];
		for (var i = 0; i < activeCombination.lecturesClassroom.length; i++) {
			var activeClassroom = activeCombination.lecturesClassroom[i];
			activeClassroom.hideBox();
      activeClassroom.parent.activeClassroom = null;
		}
	} */
  // if there is an active combination
  if (this.activeCombination) {
    this.activeCombination.unsetHighlight();
    var lecturesClassrooms = this.activeCombination.lecturesClassroom;
    for (var i = 0; i < lecturesClassrooms.length; i++) {
      lecturesClassrooms[i].hideBox();
      lecturesClassrooms[i].parent.activeClassroom = null;
    }
    //document.getElementById('combination-value').innerHTML =  '0/0';
  }
};

Plan.prototype.showPlan = function() {
  // TODO separar em ui_plan.js e plan.js. A linha abaixo fica no primeiro arquivo
  addClass(this.html.tab, 'plan-active');
  for (var i = 0; i < this.lectures.length; i++) {
    addClass(this.lectures[i].htmlElement, 'lecture-info-plan-active');
  }
  for (var i = 0; i < this.combinations.length; i++) {
    addClass(this.combinations[i].htmlElement, 'combination-plan-active');
  }
}

Plan.prototype.hidePlan = function() {
  // TODO separar em ui_plan.js e plan.js. A linha abaixo fica no primeiro arquivo
  removeClass(this.html.tab, 'plan-active');
  for (var i = 0; i < this.lectures.length; i++) {
    removeClass(this.lectures[i].htmlElement, 'lecture-info-plan-active');
  }
  for (var i = 0; i < this.combinations.length; i++) {
    removeClass(this.combinations[i].htmlElement, 'combination-plan-active');
  }
}

Plan.prototype.unsetPlan = function() {
  if (this.planId == state.activePlanIndex) {
    // TODO separar em ui_plan.js e plan.js. A linha abaixo fica no primeiro arquivo
    this.hidePlan();
    this.unsetActiveCombination();
  }
}

// Calls unsetPlan() on current active plan
Plan.prototype.setPlan = function() {
  // This cannot go below the if to prevent bug: setPlan should always display it's objects
  this.showPlan();

  if (this.planId == state.activePlanIndex) {
    // This plan is already set.
    return;
  }

  state.plans[state.activePlanIndex].unsetPlan();
  this.setActiveCombination();
  state.activePlanIndex = this.planId;



  ui.scrollActiveCombinationToView();

  // TODO this is a hack to update the combination index and total combination number
  // ui below div#lecture-schedule
  if (this.lectures.length == 0) {
    //document.getElementById('combination-value').innerHTML = '0/0';
    saveStateOnLocalStorage()
  } else {
    // TODO comentar a linha de baixo, falar com bruno
    this.setActiveCombination();
  }

};

/**
 *
 **/
Plan.prototype.copyToPlan = function(receivingPlan) {
  var planData = {};
  planData.activeCombinationIndex = this.activeCombinationIndex;
  planData.lectures = [];
  this.lectures.forEach(lecture => {
    var lectureData = {};
    lectureData.code = lecture.code;
    lectureData.color = lecture.color;
    lectureData.selected = lecture.selected;
    lectureData.classrooms = [];

    lecture.classrooms.forEach(classroom => {
      if (classroom.selected)
        lectureData.classrooms.push(classroom.code);
    });

    planData.lectures.push(lectureData);
  });

  receivingPlan.clear();
  receivingPlan.load(planData, true);
  receivingPlan.setPlan();
}

Plan.prototype.copy1 = function() {
  if (this.planId != 0) {
    this.copyToPlan(state.plans[0]);
  } else {
    this.copyToPlan(state.plans[1]);
  }
}

Plan.prototype.copy2 = function() {
  if (this.planId != 2) {
    this.copyToPlan(state.plans[2]);
  } else {
    this.copyToPlan(state.plans[1]);
  }
}

Plan.prototype.toggleOptionsOpen = function() {
  toggleClass(this.html.tab, 'plan-options-open');
}

Plan.prototype.optionsClose = function() {
  removeClass(this.html.tab, 'plan-options-open');
}

Plan.prototype.otherPlansOptionsClose = function() {
  for (var i = 0; i < state.plans.length; i++) {
    if (this == state.plans[i]) continue;
    state.plans[i].optionsClose();
  }
}

Plan.prototype.clearOnClick = function() {
  this.clear();
  this.setPlan();
  this.toggleOptionsOpen();
}

/**
 *
 */
Plan.prototype.addEventListeners = function() {
  // TODO testar subir um identificador mudando state.plans[i].delete->plan.delete para
  // state.plans[i].delete->plan.clear; com isso não precisa mais do setPlanBoundCallback
  // pode usar direto o setPlan.bind(this); com isso tbm não precisa mais do removeEventListeners
  this.setPlanBoundCallback = this.setPlan.bind(this);
  this.html.tab.addEventListener('click', this.otherPlansOptionsClose.bind(this));
  this.html.tabName.addEventListener('click', this.setPlanBoundCallback);
  this.html.tabOptionsArrow.addEventListener('click', this.setPlanBoundCallback);
  this.html.tabOptionsArrow.addEventListener('click', this.toggleOptionsOpen.bind(this));
  this.html.clear.addEventListener('click', this.clearOnClick.bind(this));
  this.html.copy1.addEventListener('click', this.copy1.bind(this));
  this.html.copy1.addEventListener('click', this.toggleOptionsOpen.bind(this));
  this.html.copy2.addEventListener('click', this.copy2.bind(this));
  this.html.copy2.addEventListener('click', this.toggleOptionsOpen.bind(this));
};

/**
 *
 */

//TODO move this function to utils when pull changes in git

function saveStateOnLocalStorage() {
  if (state) {
    localStorage.setItem('state', state.toJSON());
  }
}