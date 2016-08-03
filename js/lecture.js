/**
 * A class representing lectures.
 * 
 * @Constructor
 *
 * @example
 *  var lectureExample = {
 *    code: "SCC0502",
 *    name: "Algoritmos e Estruturas de Dados I",
 *    color: "lightblue",
 *    campus: "TODOS",
 *    selected: 1,
 *    classrooms: [{@link Classroom}],
 *    htmlElement: div.lecture-info
 *  }
 *
 * @see UI#createLectureInfo
 */
 // IMPORTANT: the 'ui' variable must be already set up!
function Lecture(jsonObj, parentPlan) {
  this.parent = parentPlan;
  this.classrooms = new Array();
  // activeClassroomIndex is set after combinations are computed (last thing of creating a plan)
  this.activeClassroomIndex = null;
  if (jsonObj) {
    this.code = jsonObj.code;
    this.name = jsonObj.name;
    this.color = jsonObj.color;
    this.campus = jsonObj.campus;
    this.selected = jsonObj.selected;
    this.htmlElement = ui.createLectureInfo(this);
    for (var i = 0; i < jsonObj.classrooms.length; i++) {
      this.classrooms.push(new Classroom(jsonObj.classrooms[i], this));
    }

    this.appendHTMLChildren();
    this.addEventListeners();
  } else {
    this.code = null;
    this.name = null;
    this.color = null;
    this.campus = null;
    this.selected = null;
    this.htmlElement = null;
  }
}

/**
 *
 */
Lecture.prototype.appendHTMLChildren = function() {
  // this.htmlElement.children[1] is equivalent (30.jul.16)
  var classroomsDiv = this.htmlElement.getElementsByClassName('lecture-classrooms')[0];
  for (var i = 0; i < this.classrooms.length; i++) {
    classroomsDiv.appendChild(this.classrooms[i].htmlElement);
  }
}

/**
 *
 */
Lecture.prototype.toggleLectureOpen = function() {
  toggleClass(this.htmlElement, 'lecture-open');
}

/**
 *
 */
Lecture.prototype.delete = function() {
  for (var i = 0; i < this.classrooms.length; i++) {
    this.classrooms[i].delete();
  }
  this.htmlElement.parentNode.removeChild(this.htmlElement);

  // All htmlElements removed, now remove itself from the plan and
  // update it.
  var indexOnParent = this.parent.lectures.indexOf(this);
  this.parent.lectures.splice(indexOnParent, 1);

  this.parent.update();
};


/**
 *
 */
Lecture.prototype.addEventListeners = function() {
  // this.htmlElement.children[0] is equivalent (30.jul.16)
  var lectureHeaderTitle = this.htmlElement.getElementsByClassName('lecture-info-header-title')[0];
  lectureHeaderTitle.addEventListener('click', this.toggleLectureOpen.bind(this));
  
  // this.htmlElement.children[0] is equivalent (31.jul.16)
  var lectureHeaderDelete = this.htmlElement.getElementsByClassName('lecture-info-delete')[0];
  lectureHeaderDelete.addEventListener('click', this.delete.bind(this));
};









