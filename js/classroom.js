/**
 * A class representing classrooms.
 * 
 * @Constructor
 *
 * @example
 *  var classroomExample = {
 *    classroomCode: "43",
 *    selected: 1,
 *    horas_aula: 0,
 *    vagas_ofertadas: 0,
 *    vagas_ocupadas: 0,
 *    alunos_especiais: 0,
 *    saldo_vagas: 0,
 *    pedidos_sem_vaga: 0,
 *    teachers: [
 *      "First Guy",
 *      "Second Son",
 *      "third Weird"
 *    ],
 *    schedules: [{@link Schedule}],
 *    htmlElement: div.classroom-info
 *  }
 *
 * @see UI#createClassroomInfo
 */
 // IMPORTANT: the 'ui' variable must be already set up!
function Classroom(jsonObj, parentLecture) {
  this.parent = parentLecture;
  this.teachers = new Array();
  this.schedules = new Array();
  if (jsonObj) {
    this.classroomCode = jsonObj.classroomCode;
    this.horas_aula = jsonObj.horas_aula;
    this.vagas_ofertadas = jsonObj.vagas_ofertadas;
    this.vagas_ocupadas = jsonObj.vagas_ocupadas;
    this.alunos_especiais = jsonObj.alunos_especiais;
    this.saldo_vagas = jsonObj.saldo_vagas;
    this.pedidos_sem_vaga = jsonObj.pedidos_sem_vaga;
    this.selected = jsonObj.selected;
    //TODO: rever data de inicio/fim
    this.data_inicio = jsonObj.data_inicio;
    this.data_fim = jsonObj.data_fim;
    // Array.slice(0) copies the _entire_ array.
    this.teachers = jsonObj.teachers.slice(0);
    for (var i = 0; i < jsonObj.schedules.length; i++) {
      this.schedules.push(new Schedule(jsonObj.schedules[i], this));
    }
    this.htmlElement = ui.createClassroomInfo(this, parentLecture.code);
    if (this.selected) {
      addClass(this.htmlElement, 'classroom-selected');
    }
    this.addEventListeners();
  } else {
    this.classroomCode = null;
    this.horas_aula = null;
    this.vagas_ofertadas = null;
    this.vagas_ocupadas = null;
    this.alunos_especiais = null;
    this.saldo_vagas = null;
    this.pedidos_sem_vaga = null;
    this.selected = null;
    this.htmlElement = null;
  }
}

/**
 *
 */
// Doesn't need to remove htmlElement because parent Lecture will
// remove the entire div.lecture-info
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
};

/**
 *
 */
Classroom.prototype.hideBox = function() {
  this.removeClassInSchedules('schedule-box-show');
};

/**
 *
 */
// TODO mudar aqui quando tiver plan.activeCombination e lecture.activeClassroom
Classroom.prototype.setHighlight = function() {
  var lecture = this.parent;
  var activeClassroom = null;
  if (lecture.activeClassroom) {
    // There is an active classroom for this lecture.
    lecture.activeClassroom.hideBox();
  }
  this.addClassInSchedules('schedule-box-highlight');
  
  // Look for conflicting schedules. The active classroom doesn't have any
  // conflicts because it is active (obviously). Also there are conflicts only
  // if there is a combination being displayed.
  //if (this != activeClassroom && lecture.parent.activeCombinationIndex != null) {
  if (this != activeClassroom && lecture.parent.activeCombination) {
    //var activeCombination = lecture.parent.combinations[lecture.parent.activeCombinationIndex];
    //var lecturesClassroom = activeCombination.lecturesClassroom;
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
          }
        }
      }
    }
  }
}

/**
 *
 */
Classroom.prototype.unsetHighlight = function() {
  var lecture = this.parent;
  if (lecture.activeClassroom) {
    // There is an active classroom for this lecture.
    lecture.activeClassroom.showBox();
  }
  this.removeClassInSchedules('schedule-box-highlight');
  this.removeClassInSchedules('schedule-box-highlight-conflict');
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
 * @see Classroom#setHighlight
 * @see Classroom#unsetHighlight
 * @see Classroom#toggleClassroomSelection
 */
Classroom.prototype.addEventListeners = function() {
  this.htmlElement.addEventListener('mouseenter', this.setHighlight.bind(this));
  this.htmlElement.addEventListener('mouseleave', this.unsetHighlight.bind(this));
  var checkbox = this.htmlElement.getElementsByClassName('classroom-info-checkbox')[0];
  checkbox.addEventListener('click', this.toggleClassroomSelection.bind(this));
};
