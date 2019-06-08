/**
 * A class representing lectures.
 * 
 * @Constructor
 *
 * @example
 *  var lectureExample = {
 *    code: "SCC0502",
 *    name: "Algoritmos e Estruturas de Dados I",
 *    color: 1,
 *    campus: "São Carlos",
 *    selected: true,
 *    classrooms: [{@link Classroom}],
 *    htmlElement: div.lecture-info
 *  }
 *
 * @see UI#createLectureInfo
 */
function Lecture(jsonObj, parentPlan) {
  this.parent = parentPlan;
  this.classrooms = [];
  this.activeClassrooms = [];
  this._available = true;
  if (jsonObj) {
    this.code = jsonObj.codigo;
    this.name = jsonObj.nome;
    this.lectureCredits = jsonObj.creditos_aula;
    this.workCredits = jsonObj.creditos_trabalho;
    this.unit = jsonObj.unidade;
    this.department = jsonObj.departamento;
    this.campus = jsonObj.campus;
    this.color = jsonObj.color;
    this.selected = jsonObj.selected;
    
    var linkedT = [];
    var linkedP = [];
    jsonObj.turmas.forEach(classroom => {
      switch(classroom.tipo) {
        case "Teórica Vinculada":
          linkedT.push(classroom);
          break;
        case "Prática Vinculada":
          linkedP.push(classroom);
          break;
        default:
          this.classrooms.push(new Classroom(classroom, this));
          break;
      }
    });

    linkedP.forEach(p => {
      this.classrooms.push(Classroom.fromLinked(linkedT.find(t => t.codigo == p.codigo_teorica),p,this));
    });

    this.groupedClassrooms = [];
    this.classrooms.forEach(classroom => {
      var group = this.groupedClassrooms.find(classroomGroup =>
          classroomGroup[0].schedules.every(groupSchedule => 
            classroom.schedules.some(schedule => 
              groupSchedule.day == schedule.day && groupSchedule.timeBegin.equals(schedule.timeBegin) && groupSchedule.timeEnd.equals(schedule.timeEnd)
            )
          )
        );
        if(group) group.push(classroom);
        else this.groupedClassrooms.push([classroom]);
    });
  }
}

Lecture.load = async function(baseLecture,parentPlan) {
  var lectureInfo = await matruspDB.lectures.get(baseLecture.code);
  if (!lectureInfo) lectureInfo = await fetch(`db/${baseLecture.code}.json`).then(response => response.ok ? response.json() : null);
  if (!lectureInfo) return;

  lectureInfo.color = baseLecture.color !== undefined ? baseLecture.color : parentPlan.colors.indexOf(Math.min(... parentPlan.colors));
  if(parentPlan) {
    parentPlan.colors[lectureInfo.color]++;
  }

  lectureInfo.selected = baseLecture.selected;

  var lecture = new Lecture(lectureInfo, parentPlan);

  lecture.classrooms.forEach(classroom => {
      classroom.toggleClassroomSelection(!(baseLecture.classrooms && baseLecture.classrooms.indexOf(classroom.code) == -1), false);
  });
  return lecture;
}

Lecture.prototype = {
  get available() {
    return this._available;
  },

  set available(val) {
    if(val) {
      this.htmlLectureCheckbox.disabled = false;
      this.htmlElement.classList.remove('lecture-unavailable');
    } 
    else {
      this.htmlLectureCheckbox.disabled = true;
      this.htmlElement.classList.add('lecture-unavailable');
    }

    this._available = val;
  },

  get htmlElement() {
    if(!this._htmlElement) {
      this._htmlElement = ui.createLectureInfo(this);  
      this.appendHTMLChildren();
      this.addEventListeners();
    }
    return this._htmlElement
  },
  
  get htmlLectureCheckbox() {
    if(!this._htmlLectureCheckbox) {
      this._htmlLectureCheckbox = this.htmlElement.getElementsByClassName('lecture-info-checkbox')[0];
    }
    return this._htmlLectureCheckbox;
  },
}

/**
 *
 */
Lecture.prototype.appendHTMLChildren = function() {
  // this.htmlElement.children[1] is equivalent (30.jul.16)
  var classroomsDiv = this._htmlElement.getElementsByClassName('lecture-classrooms')[0];
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
Lecture.prototype.toggleLectureOpen = function() {
  this.htmlElement.classList.toggle('lecture-open');
}

/**
 * 
 */
Lecture.prototype.lectureSelect = function() {
  this.stopAnimationLoop();
  this.selected = true;
  this.htmlLectureCheckbox.checked = true;
}

/**
 * 
 */
Lecture.prototype.lectureUnselect = function() {
  this.selected = false;
  this.htmlLectureCheckbox.checked = false;

  this.classrooms.forEach(classroom => classroom.toggleClassroomSelection(false,false));
}

/**
 * Callback to the 'click' event on the lecture checkbox;
 */
Lecture.prototype.toggleLectureSelection = function() {
  if (this.selected) {
    this.lectureUnselect();
  } else {
    this.lectureSelect();
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
  this.htmlElement.remove();
}

/**
 *
 */
Lecture.prototype.update = function(classroomUpdated) {
  if (this.noClassroomsSelected()) {
    this.activeClassrooms = [];
    this.lectureUnselect();
  } else if (this.allClassroomsSelected() || (classroomUpdated && classroomUpdated.selected)) {
    // When no classrooms were selected and right now at least one is, the lecture too
    // becomes selected. (Thinking about the use case where the user unchecks all
    // classrooms and then checks one back. I think the user wants that classroom
    // to be considered on the combinations.)
    this.lectureSelect();
  }
  this.parent.update(classroomUpdated);
}

/**
 *
 */
Lecture.prototype.moveUp = function() {
  var lectureIndex = this.parent.lectures.indexOf(this);
  if (lectureIndex == 0) {
    return;
  }
  this.parent.lectures.splice(lectureIndex, 1);
  this.parent.lectures.splice(lectureIndex - 1, 0, this);

  // Updating the GUI
  var htmlParentElement = this.htmlElement.parentElement;
  var indexOnParent;
  for (var i = 0; i < htmlParentElement.children.length; i++) {
    if (htmlParentElement.children[i] == this.htmlElement) {
      indexOnParent = i;
      break;
    }
  }
  var htmlElementBefore = htmlParentElement.children[indexOnParent - 1];
  // this.htmlElement doesn't have to be removed because one element can
  // exist only in one place. So when reinserting it is automatically removed
  // from its original place.
  htmlParentElement.insertBefore(this.htmlElement, htmlElementBefore);

  this.parent.update();
}

/**
 *
 */
Lecture.prototype.moveDown = function() {
  var lectureIndex = this.parent.lectures.indexOf(this);
  if (lectureIndex == this.parent.lectures.length - 1) {
    return;
  }
  this.parent.lectures[lectureIndex + 1].moveUp();
}

Lecture.prototype.showNextClassroom = function() {
  var currentClassroomIndex = 0;
  for (var i = 0; i < this.classrooms.length; i++) {
    var classroomHtmlBoxExample = this.classrooms[i].schedules[0].htmlElement;
    if (classroomHtmlBoxExample.classList.contains( 'schedule-box-show')) {
      this.classrooms[i].hideBox();
      this.classrooms[i].unsetConflict();
      currentClassroomIndex = i;
      break;
    }
  }

  var nextClassroomIndex = (currentClassroomIndex + 1) % this.classrooms.length;
  this.classrooms[nextClassroomIndex].showBox();
  this.classrooms[nextClassroomIndex].checkAndSetConflict();
}

Lecture.prototype.animationLoopShowEachClassroom = function() {
  this.classrooms[0].showBox();
  this.classrooms[0].checkAndSetConflict();
  if (!this.hoverAnimationIntervals) {
    // I still don't know why, but more than one interval were being
    // created when moving lectures up/down or clicking 
    // (on unchecked checkbox but active one (bug).
    // To reproduce: change here to not be an array anymore, 
    // put two lectures that conflict (every two classrooms)
    // unselect both, select the one on top and see that the checkbox on the
    // other one is still active, although unchecked. Click on it.)
    // or 
    this.hoverAnimationIntervals = Array();
  }
  var newIntervalId = setInterval(this.showNextClassroom.bind(this), 1000);
  this.hoverAnimationIntervals.push(newIntervalId);
}

// side-effect: hides all boxes! Should be called before something like
// plan.update to, in the end, show the selected boxes.
Lecture.prototype.stopAnimationLoop = function() {
  if (!this.hoverAnimationIntervals) {
    return;
  }
  while (this.hoverAnimationIntervals.length > 0) {
    clearInterval(this.hoverAnimationIntervals[0]);
    // remove first element of array
    this.hoverAnimationIntervals.splice(0, 1);
  }

  for (var i = 0; i < this.classrooms.length; i++) {
    // Hide pending boxes. Probably, clearIntervals was called
    // while one classroom was being displayed.
    this.classrooms[i].hideBox();
    this.classrooms[i].unsetConflict();
  }
  
  if(this.activeClassrooms.length)
    this.activeClassrooms[0].showBox();
}

Lecture.prototype.setHighlight = function() {
  for (var i = 0; i < this.classrooms.length; i++) {
    this.classrooms[i].addClassInSchedules('schedule-box-highlight');
  }

  if (!this.selected || !this.available) {
    this.animationLoopShowEachClassroom();
  }
};

Lecture.prototype.unsetHighlight = function() {
  for (var i = 0; i < this.classrooms.length; i++) {
    this.classrooms[i].removeClassInSchedules('schedule-box-highlight');
  }

  this.stopAnimationLoop();
};

Lecture.prototype.open = function() {
  this.htmlElement.classList.add('lecture-open');
  this.htmlElement.scrollIntoView();
}

Lecture.prototype.close = function() {
  this.htmlElement.classList.remove('lecture-open');
}

Lecture.prototype.serialize = function() {
    var lectureData = {};
    lectureData.code = this.code;
    lectureData.color = this.color;
    lectureData.selected = this.selected;
    lectureData.classrooms = [];

    this.classrooms.forEach(classroom => {
      if (classroom.selected)
        lectureData.classrooms.push(classroom.code);
    });
    return lectureData;
}


/**
 *
 */
Lecture.prototype.addEventListeners = function() {
  this._htmlElement.addEventListener('mouseenter', this.setHighlight.bind(this));
  this._htmlElement.addEventListener('mouseleave', this.unsetHighlight.bind(this));
  this._htmlElement.addEventListener('contextmenu', e => {ui.createLectureContextMenu(this, {x: e.clientX, y: e.clientY}); e.preventDefault();});

  var lectureHeader = this._htmlElement.getElementsByClassName('lecture-info-header')[0];
  this._htmlElement.addEventListener('click', e => { this.toggleLectureOpen(); });
  
  var lectureHeaderDelete = this._htmlElement.getElementsByClassName('lecture-info-delete')[0];
  lectureHeaderDelete.addEventListener('click', e => { this.parent.removeLecture(this); e.stopPropagation(); });

  this.htmlLectureCheckbox.addEventListener('click', e => {   
    this.classrooms.forEach(classroom => classroom.toggleClassroomSelection(e.target.checked,false));
    this.toggleLectureSelection();
    e.stopPropagation(); 
  });
};

Lecture.prototype.safeCopy = function () {
  var copy = {};
  copy.codigo = jsonObj.code;
  copy.nome = jsonObj.name;
  copy.color = jsonObj.color;

  copy.classrooms = [];
  for(var classroom in this.classrooms) {
    copy.classrooms.push(classroom.safeCopy());
  }
}







