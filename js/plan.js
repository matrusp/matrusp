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
  this.htmlElementCombinations = new Array();
  if (jsonObj) {
    this.combinationIndex = jsonObj.combinationIndex;
    for (var i = 0; i < jsonObj.lectures.length; i++) {
      this.lectures.push(new Lecture(jsonObj.lectures[i], this));
      ui.addLecture(this.lectures[i]);
    }
    // TODO arrumar isso para o design final
    this.htmlElement = document.createElement('div');

  } else {
    this.combinationIndex = null;
    this.htmlElement = null;
  }
}

/**
 *
 */
Plan.prototype.update = function() {
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
