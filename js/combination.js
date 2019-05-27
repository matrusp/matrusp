/**
 * A class representing combinations.
 * 
 * @Constructor
 *
 * @example
 *  var combinationExemple = {
 *    parent: {@link Plan},
 *    lecturesClassrooms: [{@link Classroom}], // classrooms.length === parent.lectures.length
 *    lectureCredits: 0,
 *    workCredits:0,
 *    htmlElement: div
 *  }
 *
 * @see Plan#computeCombinations
 */
function Combination(classroomGroups, plan) {
  this.parent = plan;
  this.lectureCredits = 0;
  this.workCredits = 0;

  this.classroomGroups = classroomGroups;
  this.classroomGroups.forEach(classroomGroup => {
    this.lectureCredits += classroomGroup[0].parent.lectureCredits;
    this.workCredits += classroomGroup[0].parent.workCredits;
  });
}

Combination.prototype = {
  get htmlElement() {
    if(!this._htmlElement) {
      this._htmlElement = ui.createCombinationBoard(this);
      this.addEventListeners();
    }
    return this._htmlElement;
  }
}

/**
 *
 */
Combination.prototype.delete = function() {
  if(this._htmlElement && this._htmlElement.parentNode)
    this._htmlElement.parentNode.removeChild(this.htmlElement);

  // All htmlElements removed, now remove itself from the plan and
  // update it.
  var indexOnParent = this.parent.combinations.indexOf(this);
  this.parent.combinations.splice(indexOnParent, 1);
}

/**
 *
 */
Combination.prototype.getSimilarityScore = function(otherCombination) {
  var sameClassroomsCounter = 0;
  for (var i = 0; i < this.classroomGroups.length; i++) {
    for (var j = 0; j < otherCombination.classroomGroups.length; j++) {
      if (this.classroomGroups[i][0] == otherCombination.classroomGroups[j][0]) {
        sameClassroomsCounter++;
      }
    }
  }
  return sameClassroomsCounter;
};

/**
 *
 */
Combination.prototype.setHighlight = function() {
  this.htmlElement.classList.add('combination-highlight');
};

/**
 *
 */
Combination.prototype.unsetHighlight = function() {
  this.htmlElement.classList.remove('combination-highlight');
};

/**
 *
 */
Combination.prototype.setCombination = function() {
  this.parent.activeCombination = this;
};

Combination.prototype.addEventListeners = function() {
  this.htmlElement.addEventListener('click', this.setCombination.bind(this));
}