/**
 * A class representing plans.
 * 
 * @Constructor
 *
 * @example
 *  var planExample = {
 *    combination: 1,
 *    lectures: [{@link Lecture}], 
 *    htmlElement: document.createElement('div'), // só existirá com o design finalizado
 *    htmlElementCombinations: [
 *      document.createElement('div'), // só existirá com o design finalizado
 *    ]     
 *  }
 */
 // IMPORTANT: the 'ui' variable must be already set up!
function Plan(jsonObj, planId, isActivePlan) {
  this.lectures = new Array();
  this.combinations = new Array();
  this.planId = planId;
  // It is expected that div#plan-{planId} exists!
  this.htmlElement = document.getElementById('plan-' + this.planId);
  this.addEventListeners();

  if (jsonObj) {
    this.activeCombinationIndex = jsonObj.activeCombinationIndex;
    for (var i = 0; i < jsonObj.lectures.length; i++) {
      this.lectures.push(new Lecture(jsonObj.lectures[i], this));
      if (isActivePlan) {
        ui.addLecture(this.lectures[i]);
      }
    }
    if (isActivePlan) {
      addClass(this.htmlElement, 'plan-active');
    }
    this.computeCombinations();
    this.setActiveCombination();
  } else {
    this.activeCombinationIndex = null;
  }
}

/**
 *
 */
Plan.prototype.update = function(classroomUpdated) {
  var oldActiveCombination = null;
  if (this.activeCombinationIndex != null) {
    // There is an active combination.
    oldActiveCombination = this.combinations[this.activeCombinationIndex];
    this.unsetActiveCombination();
  }
  this.combinations = new Array();
  this.computeCombinations();
  this.activeCombinationIndex = this.closestCombination(oldActiveCombination, classroomUpdated);
  if (this.activeCombinationIndex != null) {
    // There is an active combination.
    this.setActiveCombination();
  } else {
    // If there are no combinations.
    document.getElementById('combination-value').value = 0;
    document.getElementById('combination-total').innerHTML = 0;
  }

  if (!classroomUpdated) {
    // Plan.update() was called from an insertion or deletion of a lecture.
    // Nothing more to be done.
    return;
  }

  // If this was called by an classroom update, classroomUpdated exists.
  // At this moment, the mouse pointer (if it's not a touch screen) is over
  // the classroomUpdated. If it has a sibling classroom that is active it
  // will show up as a consequence of setActiveCombination. So we update the 
  // highlight status to it (only hides if it was displayed, naturally).
  if (hasClass(classroomUpdated.schedules[0].htmlElement, 'schedule-box-highlight')) {
    classroomUpdated.setHighlight();
  }
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
  this.setActiveCombination();
};

/**
 *
 */
Plan.prototype.previousCombination = function() {
  this.unsetActiveCombination();
  this.activeCombinationIndex = ((this.activeCombinationIndex - 1) + this.combinations.length) % this.combinations.length;
  this.setActiveCombination();
};

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
  for(var i = 0; i < potentialCombination.length; i++) {
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
    for (var j = i+1; j < potentialCombination.length; j++) {
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
  var activeCombination = this.combinations[this.activeCombinationIndex];
  for (var i = 0; i < activeCombination.lecturesClassroom.length; i++) {
    var activeClassroom = activeCombination.lecturesClassroom[i];
    activeClassroom.showBox();
    // TODO refatorar essa linha ou o codigo. Opcao: guardar a active classroom ao inves de guardar seu indice
    //      possivelmente fazer o mesmo com as combinacoes e so mudar na hora de salvar o json. Isso sera usado,
    //      por exemplo, no setHighlight em Classroom()
    activeClassroom.parent.activeClassroomIndex = activeClassroom.parent.classrooms.indexOf(activeClassroom);
  }

  document.getElementById('combination-value').innerHTML = (this.activeCombinationIndex + 1) + '/' + this.combinations.length;
};

/**
 * 
 */
Plan.prototype.unsetActiveCombination = function() {
  var activeCombination = this.combinations[this.activeCombinationIndex];
  for (var i = 0; i < activeCombination.lecturesClassroom.length; i++) {
    var activeClassroom = activeCombination.lecturesClassroom[i];
    activeClassroom.hideBox();
    activeClassroom.parent.activeClassroomIndex = null;
  }
};
/**
 *
 */
Plan.prototype.setActivePlan = function(newPlanIndex) {
	this.cleanPlan(state.activePlanIndex);
	var newLectures = state.plans[newPlanIndex].lectures;
	for (var i = 0; i < newLectures.length; i++) {
		ui.addLecture(newLectures[i]);
	}
	state.activePlanIndex = newPlanIndex;
};


/**
 *
 **/
Plan.prototype.cleanPlan = function(planIndex) {
	var currentLectures = state.plans[planIndex].lectures;
	for (var i = 0; i < currentLectures.length; i++) {
		ui.removeLecture(currentLectures[i]);
	}
};

Plan.prototype.unsetPlan = function() {
  if (this.planId == state.activePlanIndex) {
    // TODO separar em ui_plan.js e plan.js. A linha abaixo fica no primeiro arquivo
    removeClass(this.htmlElement, 'plan-active');
    for (var i = 0; i < this.lectures.length; i++) {
      ui.removeLecture(this.lectures[i]);
    }
  }
}

/**
 *
 **/
Plan.prototype.copyToPlan = function(planIndex) {
	if (planIndex == state.activePlanIndex) return;
	var newPlan = state.plans[planIndex];
	newPlan.activeCombinationIndex = state.plans[state.activePlanIndex].activeCombinationIndex;
	newPlan.lectures = new Array();
	for (var i = 0; i < state.plans[state.activePlanIndex].lectures.length; i++) {
		newPlan.lectures.push(new Lecture(state.plans[state.activePlanIndex].lectures[i], newPlan));
	}
	newPlan.htmlElement = document.createElement('div');
	newPlan.computeCombinations();
	newPlan.update();
	this.setActivePlan(planIndex);
}



Plan.prototype.setPlan = function() {
  if (this.planId == state.activePlanIndex) {
    // This plan is already set.
    return;
  }

  state.plans[state.activePlanIndex].unsetPlan();
  for (var i = 0; i < this.lectures.length; i++) {
    ui.addLecture(this.lectures[i]);
  }
  state.activePlanIndex = this.planId;

  // TODO separar em ui_plan.js e plan.js. A linha abaixo fica no primeiro arquivo
  addClass(this.htmlElement, 'plan-active');

  // TODO this is a hack to update the combination index and total combination number
  // ui below div#lecture-schedule
  if (this.lectures.length == 0) {
    document.getElementById('combination-value').innerHTML = '0/0';
  } else {
    this.setActiveCombination();
  }
};


/**
 *
 */
Plan.prototype.addEventListeners = function() {
  this.htmlElement.addEventListener('click', this.setPlan.bind(this));
};
