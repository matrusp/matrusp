/**
 * A class representing classrooms.
 * 
 * @Constructor
 *
 * @example
 *  var classroomExample = {
 *    code: "2018132",
 *    shortCode: "32",
 *    selected: true,
 *	  dateBegin: "31/07/2016",
 *	  data_fim: "10/12/2016",
 *    obs: "Extra info goes here"
 *    teachers: [
 *      "First Teacher",
 *      "Second Teacher"
 *    ],
 *    schedules: [{@link Schedule}],
 *    htmlElement: div.classroom-info
 *  }
 *
 * @see UI#createClassroomInfo
 */
function Classroom(jsonObj, parentLecture) {
  this.parent = parentLecture;
  this.teachers = new Array();
  this.schedules = new Array();
  this.selected = true;
  if (jsonObj) {
    this.dateBegin = jsonObj.inicio;
    this.dateEnd = jsonObj.fim;
    this.code = jsonObj.codigo;
    this.shortCode = this.code.slice(-2);
    this.obs = jsonObj.observacoes;
    if (jsonObj.horario) {
      this.addTeachers([].concat.apply([], jsonObj.horario.map(x => x.professores)))
      for (var i = 0; i < jsonObj.horario.length; i++) {
        this.schedules.push(new Schedule(jsonObj.horario[i], this));
      }
    }
    this.htmlElement = ui.createClassroomInfo(this, parentLecture.code);
    if (this.selected) {
      addClass(this.htmlElement, 'classroom-selected');
    }
    this.addEventListeners();
  }
}

/**
 * Creates a new classroom based on theoretical and practical linked classrooms
 *
 * @param {jsonT} TheoreticalClassroom The theoretical classroom data
 * @param {jsonP} PracticalClassroom The practical classroom data
 * @param {parentLecture} ParentLecture The Lecture which contains these classrooms
 */
Classroom.fromLinked = function(jsonT, jsonP, parentLecture) {
  var classroom = new Classroom(null, parentLecture);
  classroom.dateBegin = jsonT.inicio;
  classroom.dateEnd = jsonT.fim;
  classroom.code = `${jsonT.codigo}+${jsonP.codigo.slice(-2)}`;
  classroom.shortCode = `${jsonT.codigo.slice(-2)}+${jsonP.codigo.slice(-2)}`;
  classroom.obs = jsonT.observacoes + '\n' + jsonP.observacoes;
  if (jsonT.horario) {
    classroom.addTeachers([].concat.apply([], jsonT.horario.map(x => x.professores)))
    for (var i = 0; i < jsonT.horario.length; i++) {
      classroom.schedules.push(new Schedule(jsonT.horario[i], classroom));
    }
  }
  if (jsonP.horario) {
    classroom.addTeachers([].concat.apply([], jsonP.horario.map(x => x.professores)))
    for (var i = 0; i < jsonP.horario.length; i++) {
      classroom.schedules.push(new Schedule(jsonP.horario[i], classroom));
    }
  }
  classroom.htmlElement = ui.createClassroomInfo(classroom, parentLecture.code);
  if (classroom.selected) {
    addClass(classroom.htmlElement, 'classroom-selected');
  }
  classroom.addEventListeners();
  return classroom;
}

/**
 *
 */
Classroom.prototype.addTeachers = function(teachers) {
  for (var i = 0; i < teachers.length; i++) {
    if (teachers[i].length > 1) {
      if (typeof(teachers[i]) == 'object') {
        var tmp = teachers[i].slice(0);
        for (var j = 0; j < tmp.length; j++) {
          this.teachers.push(tmp[j]);
        }
      } else {
        this.teachers.push(teachers[i]);
      }
    } else {
      var tmp = teachers[i].slice(0);
      this.teachers.push(tmp[0]);
    }
  }
  this.removeDuplicates(this.teachers);
}

/**
 *
 */
Classroom.prototype.removeDuplicates = function(teachers) {
  for (var i = 0; i < teachers.length; i++) {
    for (var j = i + 1; j < teachers.length; j++) {
      if (JSON.stringify(teachers[i]) == JSON.stringify(teachers[j])) {
        teachers.splice(j, 1);
        j--;
      }
    }
  }
}

/**
 *
 */
Classroom.prototype.delete = function() {
  for (var i = 0; i < this.schedules.length; i++) {
    this.schedules[i].delete();
  }
}

/**
 *
 */
Classroom.prototype.addClassInSchedules = function(className) {
  for (var i = 0; i < this.schedules.length; i++) {
    addClass(this.schedules[i].htmlElement, className);
  }
};

/**
 *
 */
Classroom.prototype.removeClassInSchedules = function(className) {
  for (var i = 0; i < this.schedules.length; i++) {
    removeClass(this.schedules[i].htmlElement, className);
  }
};

/**
 *
 */
Classroom.prototype.showBox = function() {
  this.addClassInSchedules('schedule-box-show');
  addClass(this.htmlElement, 'classroom-active');
};

/**
 *
 */
Classroom.prototype.hideBox = function() {
  this.removeClassInSchedules('schedule-box-show');
  removeClass(this.htmlElement, 'classroom-active');
};

Classroom.prototype.checkAndSetConflict = function() {
  var conflictNotSet = true;
  var lecture = this.parent;
  // Look for conflicting schedules. The active classroom doesn't have any
  // conflicts because it is active (obviously). Also there are conflicts only
  // if there is a combination being displayed.
  if (this != lecture.activeClassroom && lecture.parent.activeCombination) {
    var lecturesClassroom = lecture.parent.activeCombination.lecturesClassroom;
    for (var i = 0; i < lecturesClassroom.length; i++) {
      if (this.parent == lecturesClassroom[i].parent) {
        // Same lecture, skip.
        continue;
      }
      // Iterate over every schedule on this classroom and every active classroom
      // on the current active combination.
      for (var j = 0; j < this.schedules.length; j++) {
        for (var k = 0; k < lecturesClassroom[i].schedules.length; k++) {
          if (schedulesConflict(this.schedules[j], lecturesClassroom[i].schedules[k])) {
            // This schedule (one of many for this classroom) conflicts with some other
            // schedule from an active classroom. Set conflict highlight.
            addClass(this.schedules[j].htmlElement, 'schedule-box-highlight-conflict');
            if (conflictNotSet) {
              conflictNotSet = false;
              addClass(this.htmlElement, 'classroom-conflict');
            }
          }
        }
      }
    }
  }
}

/*
 * Maybe it's not needed, but to be safe and bug prone use it.
 */
Classroom.prototype.unsetConflict = function() {
  this.removeClassInSchedules('schedule-box-highlight-conflict');
}

/**
 * 
 */
Classroom.prototype.showOnHover = function() {
  var lecture = this.parent;

  if (!lecture.selected) {
    lecture.stopAnimationLoop();
  }

  if (lecture.activeClassroom) {
    lecture.activeClassroom.hideBox();
  }
  this.checkAndSetConflict();
  this.showBox();
  addClass(this.htmlElement, 'classroom-highlight');
}

/**
 *
 */
Classroom.prototype.hideOnHoverOut = function() {
  var lecture = this.parent;
  removeClass(this.htmlElement, 'classroom-highlight');
  this.hideBox();
  this.removeClassInSchedules('schedule-box-highlight-conflict');
  if (lecture.activeClassroom) {
    lecture.activeClassroom.showBox();
  }

  if (!lecture.selected) {
    lecture.animationLoopShowEachClassroom();
  }
}

/**
 * @param {Boolean} [shouldUpdate=true] - enables parent lecture and current plan's update
 */
Classroom.prototype.toggleClassroomSelection = function(shouldUpdate) {
  toggleClass(this.htmlElement, 'classroom-selected');
  this.selected = !this.selected;

  // These two lines are relevant when this function is called by effect of
  // toggling selection of all classrooms.
  var checkbox = this.htmlElement.getElementsByClassName('classroom-info-checkbox')[0];
  checkbox.checked = this.selected;

  // creates a 'true' default value for 'shouldUpdate'
  shouldUpdate = (typeof shouldUpdate !== 'undefined') ? shouldUpdate : true;
  if (shouldUpdate) {
    this.parent.update(this);
  }
}

/**
 * This function adds event listeners to 'mouseenter', 'mouseleave' and 'click'
 *
 * @see Classroom#showOnHover
 * @see Classroom#hideOnHoverOut
 * @see Classroom#toggleClassroomSelection
 */
Classroom.prototype.addEventListeners = function() {
  this.htmlElement.addEventListener('mouseenter', this.showOnHover.bind(this));
  this.htmlElement.addEventListener('mouseleave', this.hideOnHoverOut.bind(this));
  var checkbox = this.htmlElement.getElementsByClassName('classroom-info-checkbox')[0];
  checkbox.addEventListener('click', this.toggleClassroomSelection.bind(this));
};