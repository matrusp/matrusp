/**
 * A class representing the course selection box
 *
 * @constructor
 */
function CourseBox() {
  document.getElementById('course-button').addEventListener('click', e => this.showCoursesWindow());

  this.overlay = document.getElementById('course-overlay');
  this.window = document.getElementById('course-window');
  this.closeButton = document.getElementById('course-window-close');
  this.campusSelect = document.getElementById('course-campus-select');
  this.unitSelect = document.getElementById('course-unit-select');
  this.courseSelect = document.getElementById('course-select');
  this.periodSelect = document.getElementById('course-period-select');
  this.lectureList = document.getElementById('course-lecture-list');
  this.acceptButton = document.getElementById('course-accept-button');
  this.optativeCheck = document.getElementById('course-optative-check');

  this.overlay.addEventListener('click', e => { this.hideCoursesWindow(); });
  this.closeButton.addEventListener('click', e => { this.hideCoursesWindow(); });
  this.window.addEventListener('click', e => {e.stopPropagation();});

  this.populateCampusSelect().then(() => this.campusChanged());

  this.optativeCheck.addEventListener('change', e => {
    [...this.window.getElementsByClassName('optative')].forEach(opt => {
      if(this.optativeCheck.checked)
        opt.classList.remove('optDisabled');
      else
        opt.classList.add('optDisabled');
    })
  });

  this.campusSelect.addEventListener('change', e => { this.campusChanged(); });
  this.unitSelect.addEventListener('change', e => { this.unitChanged(); });
  this.courseSelect.addEventListener('change', async e => { this.courseChanged(); });
  this.periodSelect.addEventListener('change', e => this.periodChanged(e));

  this.acceptButton.addEventListener('click', e => {
    state.plans[0].clear();
    this.selectedCourse.periodos[this.periodSelect.value].forEach(async lectureInfo => {
      if(lectureInfo.tipo != 'obrigatoria' && !this.optativeCheck.checked) return;

      var lecture = await matruspDB.lectures.get(lectureInfo.codigo);
      if(lecture) {
        state.lastColor = state.lastColor % state.numColors || 0;

        lecture.color = 1 + state.lastColor++; //colors are 1-based
        lecture.selected = 1;
        state.plans[state.activePlanIndex].addLecture(lecture);

        state.plans[state.activePlanIndex].lectures[state.plans[state.activePlanIndex].lectures.length-1].htmlElement.classList.add('lecture-info-plan-active');
      }
    });
    this.overlay.classList.remove('show');
  });
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
      'innerHTML': course.nome
    }));
    this.courseSelect.disabled = false;
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

CourseBox.prototype.campusChanged = async function(e) {
  await this.populateUnitSelect(this.campusSelect.value);
  return this.unitChanged(e);
}

CourseBox.prototype.unitChanged = async function(e) {
  await this.populateCourseSelect(this.unitSelect.value);
  return this.courseChanged(e);
}

CourseBox.prototype.courseChanged = async function(e) {
  this.selectedCourse = await matruspDB.courses.get(this.courseSelect.value);
  await this.populatePeriodSelect(await matruspDB.courses.get(this.courseSelect.value));
  return this.periodChanged(e);
}

CourseBox.prototype.periodChanged = function(e) {
    var fragment = document.createDocumentFragment();
    Promise.all(this.selectedCourse.periodos[this.periodSelect.value].map(async lectureInfo => {
      var lecture = await matruspDB.lectures.get(lectureInfo.codigo);
      if(lecture)
          return createAndAppendChild(fragment, 'div', {
            'innerHTML': `${lecture.codigo} - ${lecture.nome}` + 
              ((lecture.turmas.length) ? '' : ' (sem oferecimento)') +
              ((lectureInfo.tipo == 'optativa_livre')? ' (optativa livre)': '') + 
              ((lectureInfo.tipo == 'optativa_eletiva')? ' (optativa eletiva)': ''),
            'class': ((lectureInfo.tipo != "obrigatoria")? 'optative' + 
             ((this.optativeCheck.checked)? '' : ' optDisabled') : '')
          });
    })).then(all => {
        if(all.some(el => el)) {
          this.lectureList.innerHTML = "";
          this.lectureList.appendChild(fragment);
        }
        else {
          this.lectureList.innerHTML = "Nenhuma disciplina com oferecimento foi encontrada";
        }
    });
}

CourseBox.prototype.showCoursesWindow = function() {
  this.overlay.classList.add('show');
}

CourseBox.prototype.hideCoursesWindow = function() {
  this.overlay.classList.remove('show');
}