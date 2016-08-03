/**
 * A class representing schedules.
 * 
 * @Constructor
 *
 * @example
 *  var scheduleExample = {
 *    day: "qua",
 *    timeBegin: "19:00",
 *    timeEnd: "20:40",
 *    htmlElement: div.schedule-box
 *  }
 *
 * @see UI#createScheduleBox
 */
 // IMPORTANT: the 'ui' variable must be already set up!
 function Schedule(jsonObj, parentClassroom) {
  this.parent = parentClassroom;
  if (jsonObj) {
    this.day = jsonObj.day;
    this.timeBegin = jsonObj.timeBegin;
    this.timeEnd = jsonObj.timeEnd;
    // parentClassroom.parent is this schedule's Lecture ancestor
    var lectureCode = parentClassroom.parent.code;
    this.htmlElement = ui.createScheduleBox(this, lectureCode);
  } else {
    this.day = null;
    this.timeBegin = null;
    this.timeEnd = null;
    this.htmlElement = null;
  }
}


/**
 *
 */
Schedule.prototype.delete = function() {
  this.htmlElement.parentNode.removeChild(this.htmlElement);
}