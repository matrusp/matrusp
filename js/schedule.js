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
function Schedule(jsonObj, parentClassroom) {
  this.parent = parentClassroom;
  if (jsonObj) {
    this.day = jsonObj.dia;
    this.timeBegin = Date.parse(jsonObj.inicio);
    this.timeEnd = Date.parse(jsonObj.fim);
    // parentClassroom.parent is this schedule's Lecture ancestor
    var lectureCode = parentClassroom.parent.code;
    this.htmlElement = ui.createScheduleBox(this, lectureCode);
  }
}

Schedule.prototype.conflictsWith = function(schedule) {
  return this.day == schedule.day && this.timeBegin < schedule.timeEnd && this.timeEnd > schedule.timeBegin;
}

/**
 *
 */
Schedule.prototype.delete = function() {
  this.htmlElement.remove();
}