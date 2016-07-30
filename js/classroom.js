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
    // Array.slice(0) copies the _entire_ array.
    this.teachers = jsonObj.teachers.slice(0);
    for (var i = 0; i < jsonObj.schedules.length; i++) {
      this.schedules.push(new Schedule(jsonObj.schedules[i], this));
    }
    this.htmlElement = ui.createClassroomInfo(this, parentLecture.code);
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
Classroom.prototype.setHighlight = function() {
  var lecture = this.parent;
  var activeClassroom = lecture.classrooms[lecture.activeClassroomIndex];
  activeClassroom.hideBox();
  this.addClassInSchedules('schedule-box-highlight');
}

/**
 *
 */
Classroom.prototype.unsetHighlight = function() {
  var lecture = this.parent;
  var activeClassroom = lecture.classrooms[lecture.activeClassroomIndex];
  activeClassroom.showBox();
  this.removeClassInSchedules('schedule-box-highlight');
}

/**
 *
 */
Classroom.prototype.toggleClassroomSelection = function() {
  toggleClass(this.htmlElement, 'classroom-selected');
  this.selected = !this.selected;
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
  this.htmlElement.addEventListener('click', this.toggleClassroomSelection.bind(this));
};