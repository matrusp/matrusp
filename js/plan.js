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
function Plan(jsonObj) {
  this.lectures = new Array();
  this.combinations = new Array();
  if (jsonObj) {
    this.activeCombinationIndex = jsonObj.activeCombinationIndex;
    for (var i = 0; i < jsonObj.lectures.length; i++) {
      this.lectures.push(new Lecture(jsonObj.lectures[i], this));
      ui.addLecture(this.lectures[i]);
    }
    // TODO arrumar isso para o design final
    this.htmlElement = document.createElement('div');
    this.computeCombinations();
    this.setActiveCombination();
  } else {
    this.combinationIndex = null;
    this.htmlElement = null;
  }
}

/**
 *
 */
Plan.prototype.update = function() {
  this.combinations = new Array();
  // recalculate every htmlElement element and combination ?
  // or just combinations ?
};

/**
 * Adds a lecture to this plan.
 *
 * @param {Lecture} lecture
 */
Plan.prototype.addLecture = function(lecture) {
  this.lectures.push(lecture);
  ui.addLecture(lecture);
  this.update();
}

/**
 *
 */
Plan.prototype.testCombination = function(potentialCombination) {
  // Combinations only exist with all lectures included. So if
  // a classroom isn't selected, the combination is invalid.
  for(var i = 0; i < potentialCombination.length - 1; i++) {
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
      var classroom2Index = potentialCombination[j]
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
}

/**
 *
 */
Plan.prototype.computeCombinations = function() {
  var potentialCombination = Array(this.lectures.length).fill(0);
  var leftmostSelectedLectureIndex = -1;
  // Initialize to something like this:
  // [-1, -1, 0, -1, 0, 0, 0, -1]
  //       ___^____
  // where this guy is the leftmostSelectedLectureIndex
  for (var i = 0; i < this.lectures.length; i++) {
    if (!this.lectures[i].selected) {
      potentialCombination[i] = -1;
    } else if (leftmostSelectedLectureIndex == -1) {
      leftmostSelectedLectureIndex = i;
    }
  }

  // while condition can be this without affecting the logic:
  // potentialCombination[leftmostSelectedLectureIndex] >= this.lectures[leftmostSelectedLectureIndex].classrooms.length
  while (true) {
    if (this.testCombination(potentialCombination)) {
      console.log('combination', potentialCombination);
      combination = new Combination(potentialCombination, this);
      this.combinations.push(combination);
    }

    // This process is similar to adding 1 to a number, where each slot is a digit
    // we begin at the rightmost digit and whenever a value reaches its maximum
    // capacity we turn it in zero and add one to the one to its left.
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
  var activeCombination = this.combinations[this.activeCombinationIndex]
  for (var i = 0; i < activeCombination.lecturesClassroom.length; i++) {
    var activeClassroom = activeCombination.lecturesClassroom[i];
    activeClassroom.showBox();
    // TODO refatorar essa linha ou o codigo. Opcao: guardar a active classroom ao inves de guardar seu indice
    //      possivelmente fazer o mesmo com as combinacoes e so mudar na hora de salvar o json. Isso sera usado,
    //      por exemplo, no setHighlight em Classroom()
    activeClassroom.parent.activeClassroomIndex = activeClassroom.parent.classrooms.indexOf(activeClassroom);
  }
};
