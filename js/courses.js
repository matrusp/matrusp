/**
 * A class representing the course selection box
 *
 * @constructor
 */
function CourseBox() {
  //Element declarations
  this.dialog = document.getElementById('course-dialog');
  this.closeButton = document.getElementById('course-window-close');
  this.campusSelect = document.getElementById('course-campus-select');
  this.unitSelect = document.getElementById('course-unit-select');
  this.courseSelect = document.getElementById('course-select');
  this.periodSelect = document.getElementById('course-period-select');
  this.lectureList = document.getElementById('course-lecture-list');
  this.acceptButton = document.getElementById('course-accept-button');
  this.optativeCheck = document.getElementById('course-optative-check');

  this.optativeCheck.addEventListener('change', e => {
    [...this.dialog.getElementsByClassName('course-lecture-optative')].forEach(opt => {
      if(this.optativeCheck.checked)
        opt.classList.remove('course-lecture-disabled');
      else
        opt.classList.add('course-lecture-disabled');
    })
  });

  //Event listeners
  this.campusSelect.addEventListener('change', e => { this.campusChanged(); });
  this.unitSelect.addEventListener('change', e => { this.unitChanged(); });
  this.courseSelect.addEventListener('change', async e => { this.courseChanged(); });
  this.periodSelect.addEventListener('change', e => this.periodChanged(e));

  //Add lectures when acceptButton is clicked
  this.acceptButton.addEventListener('click', e => {
    var lecturePromises = this.selectedCourse.periodos[this.periodSelect.value].map(async lectureInfo => {
      var baseLecture = {code: lectureInfo.codigo, selected: (lectureInfo.tipo == 'obrigatoria' || this.optativeCheck.checked)};
      if(['noturno','diurno','matutino','vespertino'].indexOf(this.selectedCourse.periodo) == -1) return baseLecture; //Fallback for course timeframe info

      //Get lectures from DB
      var lecture = await matruspDB.lectures.get(lectureInfo.codigo);
      if(!lecture) return baseLecture;

      var classrooms = [];

      //Select only the classrooms with timeframe compatible with the course
      switch(this.selectedCourse.periodo){
          case 'diurno':
            classrooms = lecture.turmas.filter(turma => 
              turma.horario.every(horario => parseInt(horario.inicio.substring(0,2)) < 18));
            break;
          case 'noturno':
            classrooms = lecture.turmas.filter(turma => 
              turma.horario.every(horario => parseInt(horario.inicio.substring(0,2)) > 17));
            break;
          case 'matutino':
            classrooms = lecture.turmas.filter(turma => 
              turma.horario.every(horario => parseInt(horario.inicio.substring(0,2)) < 12));
            break;
          case 'vespertino':
            classrooms = lecture.turmas.filter(turma => 
              turma.horario.every(horario => {var inicio = parseInt(horario.inicio.substring(0,2)); return 10 < inicio && inicio < 19}));
            break;
        }
      
      baseLecture.classrooms = classrooms.map(classroom => classroom.codigo);
      return baseLecture;
    });
    Promise.all(lecturePromises).then(lectures => {

      //Criar um novo plano com as disciplinas validas
      lectures.filter(el => el);

      var planData = {"name": `${this.courseSelect.options[this.courseSelect.selectedIndex].innerHTML} - ${this.periodSelect.value}º período`,"lectures": lectures};
      if(!state.activePlan.lectures.length) state.removePlan(state.activePlan);
      var plan = state.addPlan(planData, true);
    });
    ui.closeDialog();
  });
}

CourseBox.prototype.open = function() {
  if(!this.campusSelect.value)
    //Populate the course box
    this.populateCampusSelect().then(() => this.campusChanged()); 
    ui.openCourseDialog();
}

/**
 * Populates the course campus dropbox
 */
CourseBox.prototype.populateCampusSelect = async function() {
  var fragment = document.createDocumentFragment();

  var campi = await matruspDB.campi.toCollection().primaryKeys();
  campi.forEach(campus => createAndAppendChild(fragment, 'option', {
    'innerHTML': campus
  }));

  this.campusSelect.innerHTML = '';
  this.campusSelect.appendChild(fragment);
}

/**
 * Populates the course units dropbox with units from the selected campus
 */
CourseBox.prototype.populateUnitSelect = async function(campus) {
  selectedUnit = this.campusSelect.value;

  var fragment = document.createDocumentFragment();

  if (campus)
    var units = await matruspDB.campi.get(campus);
  else
    var units = await matruspDB.units.toCollection().primaryKeys();

  units.forEach(unit => createAndAppendChild(fragment, 'option', {
    'value': unit,
    'innerHTML': unit,
    'selected': unit == selectedUnit
  }));

  this.unitSelect.innerHTML = '';
  this.unitSelect.appendChild(fragment);
}

/**
 * Populates the courses dropbox with courses from the selected unit
 */
CourseBox.prototype.populateCourseSelect = async function(unit) {
  var fragment = document.createDocumentFragment();

  if (unit) {
    var courses = await matruspDB.courses.where('unidade').equals(unit).toArray();
    courses.forEach(course => createAndAppendChild(fragment, 'option', {
      'value': course.codigo,
      'innerHTML': `${course.nome} (${course.periodo})`
    }));
    if(courses.length)
      this.courseSelect.disabled = false;
    else {
      createAndAppendChild(fragment, 'option', {'value': null, 'innerHTML': 'Nenhum curso disponível'});
      this.courseSelect.disabled = true;
    }
  } else {
    this.courseSelect.disabled = true;
  }

  this.courseSelect.innerHTML = '';
  this.courseSelect.appendChild(fragment);
}

/**
 * Populates the course period dropbox with periods from the selected course
 */
CourseBox.prototype.populatePeriodSelect = async function(course) { 
  var fragment = document.createDocumentFragment()
  if(course) {
    var periods = Object.keys(course.periodos);
    periods.forEach(periodo => createAndAppendChild(fragment, 'option', {
      'value': periodo,
      'innerHTML': periodo + 'º'
    }));
  this.periodSelect.disabled = false;
  }
  else {
    this.periodSelect.disabled = true;
  }

  this.periodSelect.innerHTML = '';
  this.periodSelect.appendChild(fragment);
}

// Listen to change in the campus dropdown
CourseBox.prototype.campusChanged = async function(e) {
  await this.populateUnitSelect(this.campusSelect.value);
  return this.unitChanged(e);
}

// Listen to change in the unit dropdown
CourseBox.prototype.unitChanged = async function(e) {
  await this.populateCourseSelect(this.unitSelect.value);
  return this.courseChanged(e);
}

// Listen to change in the course dropdown
CourseBox.prototype.courseChanged = async function(e) {
  this.selectedCourse = await matruspDB.courses.get(this.courseSelect.value);
  await this.populatePeriodSelect(await matruspDB.courses.get(this.courseSelect.value));
  return this.periodChanged(e);
}

// Listen to change in the period dropdown
CourseBox.prototype.periodChanged = async function(e) {
    if(!this.selectedCourse || !this.periodSelect.value) {
        this.lectureList.innerHTML = '';
        return;
    }

    //Get and append the selected period lectures in the box
    var fragment = document.createDocumentFragment();
    createAndAppendChild(fragment, 'div', {
      'innerHTML': 'Obrigatórias',
      'class': 'course-lecture-type'
    });
    await this.appendLectures(fragment, this.selectedCourse.periodos[this.periodSelect.value].filter(lectureInfo => lectureInfo.tipo == 'obrigatoria'));

    createAndAppendChild(fragment, 'div', {
      'innerHTML': 'Optativas',
      'class': 'course-lecture-type'
    });
    await this.appendLectures(fragment, this.selectedCourse.periodos[this.periodSelect.value].filter(lectureInfo => lectureInfo.tipo != 'obrigatoria'));
    this.lectureList.innerHTML = '';
    this.lectureList.append(fragment);
}

CourseBox.prototype.appendLectures = async function(parent, lectures) {
  var fragment = document.createDocumentFragment();

  //Await for the lecture info from the DB and create a div for each, then append
  return await Promise.all(lectures.map(async lectureInfo => {
    var lecture = await matruspDB.lectures.get(lectureInfo.codigo);
    if(lecture)
        return createAndAppendChild(fragment, 'div', {
          'innerHTML': `${lecture.codigo} - ${lecture.nome}` + 
            ((lecture.turmas.length) ? '' : ' (sem oferecimento)') +
            ((lectureInfo.tipo == 'optativa_livre')? ' (optativa livre)': '') + 
            ((lectureInfo.tipo == 'optativa_eletiva')? ' (optativa eletiva)': ''),
          'class': 'course-lecture' + ((lectureInfo.tipo != "obrigatoria")? ' course-lecture-optative' + 
           ((this.optativeCheck.checked)? '' : ' course-lecture-disabled') : '')
        });
  })).then(all => {
      if(all.some(el => el)) {
        parent.appendChild(fragment);
      }
      else {
        //Fallback in case no lectures are available
        createAndAppendChild(fragment, 'div', {
          'class': 'course-no-lectures',
          'innerHTML': 'Nenhuma disciplina deste tipo'
        });
        parent.appendChild(fragment);
      }
  });
}