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
    this.htmlLectureCheckbox = this.htmlElement.getElementsByClassName('lecture-info-checkbox')[0];
    this.htmlClassroomsCheckbox = this.htmlElement.getElementsByClassName('classrooms-header-checkbox')[0];
    for (var i = 0; i < jsonObj.classrooms.length; i++) {
      this.classrooms.push(new Classroom(jsonObj.classrooms[i], this));
    }

    this.appendHTMLChildren();
    this.updateClassroomsCheckbox();
    this.addEventListeners();
  } else {
    this.code = null;
    this.name = null;
    this.color = null;
    this.campus = null;
    this.selected = null;
    this.htmlElement = null;
    this.htmlLectureCheckbox = null;
    this.htmlClassroomsCheckbox = null;
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
Lecture.prototype.numberOfClassroomsSelected = function() {
  var classroomsSelected = 0;
  for (var i = 0; i < this.classrooms.length; i++) {
    if (this.classrooms[i].selected) {
      classroomsSelected++;
    }
  }
  return classroomsSelected;
}

/**
 *
 */
Lecture.prototype.allClassroomsSelected = function() {
  return this.numberOfClassroomsSelected() == this.classrooms.length;
}

/**
 *
 */
Lecture.prototype.noClassroomsSelected = function() {
  return this.numberOfClassroomsSelected() == 0;
}

/**
 *
 */
Lecture.prototype.updateClassroomsCheckbox = function() {
  this.htmlClassroomsCheckbox.checked = this.allClassroomsSelected();
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
Lecture.prototype.lectureSelect = function() {
  this.selected = true;
  this.htmlLectureCheckbox.checked = true;
}

/**
 * 
 */
Lecture.prototype.lectureUnselect = function() {
  this.selected = false;
  this.htmlLectureCheckbox.checked = false;
}

/**
 * Callback to the 'click' event on the lecture checkbox;
 */
Lecture.prototype.toggleLectureSelection = function() {
  this.selected = !this.selected;
  if (this.selected && this.noClassroomsSelected()) {
    this.htmlClassroomsCheckbox.checked = true;
    this.updateAllClassroomsSelections();
  }
  this.parent.update();
}

/**
 *
 */
Lecture.prototype.enableCheckbox = function() {
  this.htmlLectureCheckbox.disabled = false;
}

/**
 *
 */
Lecture.prototype.disableCheckbox = function() {
  this.htmlLectureCheckbox.disabled = true;
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
}

/**
 *
 */
Lecture.prototype.updateAllClassroomsSelections = function() {
  for (var i = 0; i < this.classrooms.length; i++) {
    if (this.classrooms[i].selected != this.htmlClassroomsCheckbox.checked) {
      var shouldUpdate = false;
      this.classrooms[i].toggleClassroomSelection(shouldUpdate);
    }
  }
  if (!this.htmlClassroomsCheckbox.checked) {
    this.activeClassroomIndex = null;
    this.lectureUnselect();
  }
  this.parent.update();
}

/**
 *
 */
Lecture.prototype.update = function(classroomUpdated) {
  if (this.noClassroomsSelected()) {
    this.activeClassroomIndex = null;
    this.lectureUnselect();
  } else if (!this.selected) {
    // When no classrooms were selected and right now one is, the lecture too
    // becomes selected. (Thinking about the use case where the user unchecks all
    // classrooms and then checks one back. I think the user wants that classroom
    // to be considered on the combinations.)
    this.lectureSelect();
  }
  this.updateClassroomsCheckbox();
  this.parent.update(classroomUpdated);
}


/**
 *
 */
Lecture.prototype.addEventListeners = function() {
  var lectureHeaderTitle = this.htmlElement.getElementsByClassName('lecture-info-header-title')[0];
  lectureHeaderTitle.addEventListener('click', this.toggleLectureOpen.bind(this));
  
  var lectureHeaderDelete = this.htmlElement.getElementsByClassName('lecture-info-delete')[0];
  lectureHeaderDelete.addEventListener('click', this.delete.bind(this));

  this.htmlLectureCheckbox.addEventListener('click', this.toggleLectureSelection.bind(this));

  this.htmlClassroomsCheckbox.addEventListener('click', this.updateAllClassroomsSelections.bind(this));
};









