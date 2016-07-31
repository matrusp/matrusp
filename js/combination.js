/**
 * A class representing combinations.
 * 
 * @Constructor
 *
 * @example
 *  var combinationExemple = {
 *    parent: {@link Plan},
 *    classrooms: [{@link Classroom}], // classrooms.length === parent.lectures.length
 *    htmlElement: div
 *  }
 *
 * @see Plan#computeCombinations
 */
function Combination(combinationIndices, plan) {
  this.parent = plan;
  this.lecturesClassroom = new Array();
  this.htmlElement  = null;

  for (var i = 0; i < combinationIndices.length; i++) {
    var classroomIndex = combinationIndices[i];
    if (classroomIndex == -1) {
      // Lecture not selected
      continue;
    }
    this.lecturesClassroom.push(plan.lectures[i].classrooms[classroomIndex]);
  }
}