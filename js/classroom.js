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
 *	  dateEnd: "10/12/2016",
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
  this.teachers = [];
  this.schedules = [];
  this.vacancies = {total: {total: 0, subscribed: 0, pending: 0, enrolled: 0}};
  this.selected = true;
  if (jsonObj) {
    //Get info from json
    this.dateBegin = Date.parse(jsonObj.inicio,"dd/MM/yyyy");
    this.dateEnd = Date.parse(jsonObj.fim,"dd/MM/yyyy");
    this.code = jsonObj.codigo;
    this.shortCode = this.code.slice(-2);
    this.obs = jsonObj.observacoes || '';
    this.selected = jsonObj.selected === undefined? true : jsonObj.selected;
    if (jsonObj.horario) {
      //get teachers
      this.addTeachers([].concat.apply([], jsonObj.horario.map(x => x.professores)))
      this.schedules = jsonObj.horario.filter(horario => horario.inicio && horario.fim && horario.dia).map(horario => new Schedule(horario, this));
    }
    
    //Vacancy mapping
    for(vacancyType in jsonObj.vagas) {
      vacancy = {
        total: jsonObj.vagas[vacancyType].vagas,
        subscribed: jsonObj.vagas[vacancyType].inscritos,
        pending: jsonObj.vagas[vacancyType].pendentes,
        enrolled: jsonObj.vagas[vacancyType].matriculados,
        groups: {}
      };

      for(vacancyGroup in jsonObj.vagas[vacancyType].grupos) {
        group = jsonObj.vagas[vacancyType].grupos[vacancyGroup];
        vacancy.groups[vacancyGroup] = {
          total: group.vagas,
          subscribed: group.inscritos,
          pending: group.pendentes,
          enrolled: group.matriculados,
          groups: {}
        }
      }

      this.vacancies[vacancyType] = vacancy;

      this.vacancies.total.total += vacancy.total;
      this.vacancies.total.subscribed += vacancy.subscribed;
      this.vacancies.total.pending += vacancy.pending;
      this.vacancies.total.enrolled += vacancy.enrolled;
    }
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

  //Get data from JSONs
  classroom.dateBegin = Date.parse(jsonT.inicio);
  classroom.dateEnd = Date.parse(jsonT.fim);
  classroom.code = `${jsonT.codigo}+${jsonP.codigo.slice(-2)}`;
  classroom.shortCode = `${jsonT.codigo.slice(-2)}+${jsonP.codigo.slice(-2)}`;
  classroom.obs = [jsonT.observacoes, jsonP.observacoes].filter(el => el).join('\n');
  classroom.vacancies = {total: {total: 0, subscribed: 0, pending: 0, enrolled: 0}};

  if (jsonT.horario) {
    //Get teachers
    classroom.addTeachers([].concat.apply([], jsonT.horario.map(x => x.professores)))
    for (var i = 0; i < jsonT.horario.length; i++) {
      classroom.schedules.push(new Schedule(jsonT.horario[i], classroom));
    }
  }
  if (jsonP.horario) {
    //Get teachers
    classroom.addTeachers([].concat.apply([], jsonP.horario.map(x => x.professores)))
    for (var i = 0; i < jsonP.horario.length; i++) {
      classroom.schedules.push(new Schedule(jsonP.horario[i], classroom));
    }
  }

  //Vacancy mapping
  for(vacancyType in jsonT.vagas) {
      vacancy = {
        total: jsonT.vagas[vacancyType].vagas,
        subscribed: jsonT.vagas[vacancyType].inscritos,
        pending: jsonT.vagas[vacancyType].pendentes,
        enrolled: jsonT.vagas[vacancyType].matriculados,
        groups: {}
      };

      for(vacancyGroup in jsonT.vagas[vacancyType].grupos) {
        group = jsonT.vagas[vacancyType].grupos[vacancyGroup];
        vacancy.groups[vacancyGroup] = {
          total: group.vagas,
          subscribed: group.inscritos,
          pending: group.pendentes,
          enrolled: group.matriculados,
          groups: {}
        }
      }

      classroom.vacancies[vacancyType] = vacancy;

      classroom.vacancies.total.total += vacancy.total;
      classroom.vacancies.total.subscribed += vacancy.subscribed;
      classroom.vacancies.total.pending += vacancy.pending;
      classroom.vacancies.total.enrolled += vacancy.enrolled;
    }

  return classroom;
}

Classroom.prototype = {
  get htmlElement() {
    if(!this._htmlElement) {
      this._htmlElement = ui.createClassroomInfo(this);
      if (this.selected) {
        this.htmlElement.classList.add('classroom-selected');
      }
      this.addEventListeners();
    }
    return this._htmlElement
  }
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
    this.schedules[i].htmlElement.classList.add(className);
  }
};

/**
 *
 */
Classroom.prototype.removeClassInSchedules = function(className) {
  for (var i = 0; i < this.schedules.length; i++) {
    this.schedules[i].htmlElement.classList.remove(className);
  }
};

/**
 *
 */
Classroom.prototype.setActive = function() {
  this.htmlElement.classList.add('classroom-active');
}

/**
 *
 */
Classroom.prototype.unsetActive = function() {
  this.htmlElement.classList.remove('classroom-active');
}


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

Classroom.prototype.checkAndSetConflict = function() {
  var conflictNotSet = true;
  var lecture = this.parent;
  // Look for conflicting schedules. The active classroom doesn't have any
  // conflicts because it is active (obviously). Also there are conflicts only
  // if there is a combination being displayed.
  if (this != lecture.activeClassroom && lecture.parent.activeCombination) {
    var lecturesClassroom = lecture.parent.activeCombination.classroomGroups.map(group => group[0]);
    for (var i = 0; i < lecturesClassroom.length; i++) {
      if (this.parent == lecturesClassroom[i].parent) {
        // Same lecture, skip.
        continue;
      }
      // Iterate over every schedule on this classroom and every active classroom
      // on the current active combination.
      for (var j = 0; j < this.schedules.length; j++) {
        for (var k = 0; k < lecturesClassroom[i].schedules.length; k++) {
          if (this.schedules[j].conflictsWith(lecturesClassroom[i].schedules[k])) {
            // This schedule (one of many for this classroom) conflicts with some other
            // schedule from an active classroom. Set conflict highlight.
            this.schedules[j].htmlElement.classList.add('schedule-box-highlight-conflict');
            if (conflictNotSet) {
              conflictNotSet = false;
              this.htmlElement.classList.add('classroom-conflict');
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

  if (lecture.activeClassrooms.length) {
    lecture.activeClassrooms[0].hideBox();
  }

  if(lecture.activeClassrooms.indexOf(this) == -1) {
    ui.timeTable.classList.toggle('fit', false);
  }
  this.checkAndSetConflict();
  this.showBox();
  this.htmlElement.classList.add('classroom-highlight');
}

/**
 *
 */
Classroom.prototype.hideOnHoverOut = function() {
  var lecture = this.parent;
  this.htmlElement.classList.remove('classroom-highlight');
  this.hideBox();
  this.removeClassInSchedules('schedule-box-highlight-conflict');
  if (lecture.activeClassrooms.length) {
    lecture.activeClassrooms[0].showBox();
  }

  if (!lecture.selected) {
    lecture.animationLoopShowEachClassroom();
  }

  ui.timeTable.classList.toggle('fit', ui.settings.fitTimeTable);
}

/**
 * @param {Boolean} [shouldUpdate=true] - enables parent lecture and current plan's update
 */
Classroom.prototype.toggleClassroomSelection = function(value, shouldUpdate) {
  if(value === undefined || value === null) {
    value = !this.selected;
  }

  if(this._htmlElement) {
    var checkbox = this._htmlElement.getElementsByClassName('classroom-info-checkbox')[0];
    checkbox.checked = value;
    this._htmlElement.classList.toggle('classroom-selected', value);
  }
  
  this.selected = value;

  // creates a 'true' default value for 'shouldUpdate'
  shouldUpdate = (typeof shouldUpdate !== 'undefined') ? shouldUpdate : true;
  if (shouldUpdate) {
    this.parent.update(this);
  }
}

/**
 *
 */
Classroom.prototype.toggleClassroomOpen = function(val) {
  this.htmlElement.classList.toggle( 'classroom-open', val);
}

Classroom.prototype.conflictsWith = function(classroom) {
  return this.dateBegin < classroom.dateEnd && this.dateEnd > classroom.dateBegin &&
          classroom.schedules.some(classroomSchedule => 
                                    this.schedules.some(schedule => 
                                      classroomSchedule.conflictsWith(schedule)));
}

Classroom.prototype.blink = function() {
  this.htmlElement.classList.remove('classroom-blink');
  this.htmlElement.offsetHeight;
  this.htmlElement.classList.add('classroom-blink');
}

/**
 * This function adds event listeners to 'mouseenter', 'mouseleave' and 'click'
 *
 * @see Classroom#showOnHover
 * @see Classroom#hideOnHoverOut
 * @see Classroom#toggleClassroomSelection
 */
Classroom.prototype.addEventListeners = function() {
  this._htmlElement.addEventListener('mouseenter', this.showOnHover.bind(this));
  this._htmlElement.addEventListener('mouseleave', this.hideOnHoverOut.bind(this));

  this._htmlElement.addEventListener('click', e => { this.toggleClassroomOpen(); e.stopPropagation(); });

  this._htmlElement.addEventListener('animationend', e => this.htmlElement.classList.remove('classroom-blink'));

  this._htmlElement.addEventListener('contextmenu', e => {ui.createClassroomContextMenu(this, {x: e.clientX, y: e.clientY}); e.preventDefault(); e.stopPropagation();});

  var checkbox = this._htmlElement.getElementsByClassName('classroom-info-checkbox')[0];
  checkbox.addEventListener('click', e => {this.toggleClassroomSelection(null, true); e.stopPropagation();} );
};