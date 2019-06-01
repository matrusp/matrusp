/**
 * Object interface to manipulate the User Interface objects
 * 
 * @Constructor
 */
function UI() {
  // DOM Objects Reference Variables
  // ===============================
  this.accordion = document.getElementById('accordion');
  this.combinationTrack = document.getElementById('combination-track');
  this.combinationPaddleLeft = document.getElementById('combination-paddle-left');
  this.combinationPaddleRight = document.getElementById('combination-paddle-right');
  this.loadingBar = document.getElementById('loading-bar');
  this.banner = document.getElementById('msg-banner');
  this.bannerMsg = document.getElementById('msg-banner-message');
  this.timeTable = document.getElementById('time-table');
  this.lectureCredits = document.getElementById('lecture-credits');
  this.workCredits = document.getElementById('work-credits');
  this.plans = document.getElementById('plans');
  this.newPlan = document.getElementById('new-plan');
  this.planPaddleLeft = document.getElementById('plan-paddle-left');
  this.planPaddleRight = document.getElementById('plan-paddle-right');
  this.menuOverlay = document.getElementById('menu-overlay');
  this.dialogOverlay = document.getElementById('dialog-overlay');
  this.courseDialog = document.getElementById('course-dialog');
  this.shareDialog = document.getElementById('share-dialog');
  this.printDialog = document.getElementById('print-dialog');
  this.fitButton = document.getElementById('fit-time-table-button');
  this.undoButton = document.getElementById('undo');
  this.header = document.getElementById('header');
  this.headerIcons = document.getElementById('icons');

  // This comes from the SASS theme file
  //TODO: find better way to sync this
  this.colors =  [tinycolor("hsl(125, 70%, 61%)"), 
                  tinycolor("hsl(200, 94%, 61%)"),
                  tinycolor("hsl(24, 100%, 60%)"), 
                  tinycolor("hsl(298, 56%, 65%)"), 
                  tinycolor("hsl(46, 80%, 57%)"),
                  tinycolor("hsl(76, 80%, 60%)"),
                  tinycolor("hsl(176, 76%, 58%)"), 
                  tinycolor("hsl(50, 48%, 66%)"), 
                  tinycolor("hsl(225, 55%, 64%)"),
                  tinycolor("hsl(330, 85%, 59%)"), 
                  tinycolor("hsl(140 ,42%, 58%)"),
                  tinycolor("hsl(263, 78%, 65%)"),
                  tinycolor("hsl(33, 27%, 58%)")];
  
  this.darkColors = this.colors.map(color => color.clone().darken(25));
  this.lightColors = this.colors.map(color => color.clone().lighten(10));

  this.combinationTrackPageSize = 10;

  this.weekdays = [];    
  var lectureScheduleColumns = this.timeTable.getElementsByClassName('column-content');
  // Ignores i == 0 because it's the time column
  for (var i = 1; i < lectureScheduleColumns.length; i++) {
    this.weekdays.push(lectureScheduleColumns[i]);
  }
  this.timeColumn = lectureScheduleColumns[0]; 

  if(!localStorage.uiSettings)
    this.saveOnLocalStorage();
  else
    this.settings = JSON.parse(localStorage.uiSettings);

  new Slip(this.accordion,{minimumDistance: 10});

  this.makeTimeTable();

  //Override updateTimeTable's check
  let timeBegin = this.settings.timeBegin;
  let timeEnd = this.settings.timeEnd;
  let dayEnd = this.settings.dayEnd;

  delete this.settings.timeBegin;
  delete this.settings.timeEnd;
  delete this.settings.dayEnd;

  this.updateTimeTable(timeBegin, timeEnd, dayEnd);

  this.accordion.addEventListener('slip:beforewait',e => {
    if(e.detail.pointerType == 'mouse')
      e.preventDefault();
  });

  this.accordion.addEventListener('slip:beforereorder',e => {
    window.navigator.vibrate(25);
    e.target.closest('.lecture-info').classList.remove('lecture-open');
    this.hideContextMenu();
  });

  this.accordion.addEventListener('slip:reorder',e => {
    e.target.parentNode.insertBefore(e.target, e.detail.insertBefore);

    var plan = state.activePlan;

    plan.moveLecture(e.detail.originalIndex, e.detail.spliceIndex);

    plan.undoStackPush(() => {
      plan.moveLecture(e.detail.spliceIndex, e.detail.originalIndex);
    });
  });

  this.accordion.addEventListener('slip:swipe', e => {
    state.activePlan.removeLecture(state.activePlan.lectures[e.detail.originalIndex]);
  });

  this.newPlan.addEventListener('click',e => {var plan = state.addPlan(); state.activePlan = plan; this.plans.scrollLeft = this.plans.scrollWidth; });
  this.newPlan.addEventListener('contextmenu',e => {ui.createNewPlanContextMenu({x: e.clientX, y: e.clientY}); e.preventDefault();});

  this.plans.addEventListener('scroll', e => this.refreshPlanPaddles());
  this.refreshPlanPaddles();

  this.planPaddleLeft.addEventListener('click', e => {this.plans.scrollLeft -= 90});
  this.planPaddleRight.addEventListener('click', e => {this.plans.scrollLeft += 90});

  this.combinationPaddleLeft.addEventListener('click', e => {this.combinationTrack.scrollLeft -= 240});
  this.combinationPaddleRight.addEventListener('click', e => {this.combinationTrack.scrollLeft += 240});

  this.combinationTrack.addEventListener('scroll', e => {
    if(this.combinationTrack.scrollLeft > 300 * this.combinationTrackPageSize) {
      this.nextCombinationPage();
    }

    if(this.combinationTrack.scrollLeft < 100 * this.combinationTrackPageSize) {
      this.previousCombinationPage();
    }
  });

  window.addEventListener('resize', e => this.header.style.top = -this.headerIcons.offsetTop + 'px');
  this.header.style.top = -this.headerIcons.offsetTop + 'px';

  document.getElementById('msg-banner-close').addEventListener('click', () => this.closeBanner());

  this.menuOverlay.addEventListener('pointerdown', e => this.hideContextMenu());
  window.addEventListener('resize', e => this.hideContextMenu());
  window.addEventListener('scroll',e => this.hideContextMenu());

  this.fitButton.addEventListener('click', e => {
    this.settings.fitTimeTable = !this.settings.fitTimeTable;

    this.fitButton.classList.toggle('toggled', this.settings.fitTimeTable);
    this.timeTable.classList.toggle('fit', this.settings.fitTimeTable);

    localStorage.uiSettings = JSON.stringify(this.settings);
    });

    this.fitButton.classList.toggle('toggled', this.settings.fitTimeTable);
    this.timeTable.classList.toggle('fit', this.settings.fitTimeTable);

    document.addEventListener('keyup', e => {
      if(e.keyCode == 90 && e.ctrlKey)
        state.activePlan.undo();
    });
}

UI.prototype.saveOnLocalStorage = function() {
  if(!this.settings)
    this.settings = {
      fitTimeTable: false,
      defaultTimeBegin: 6,
      defaultTimeEnd: 24,
    };

  localStorage.uiSettings = JSON.stringify(this.settings);
}

// Functions
// =========

/**
 * Creates a string containing CSS calc() function to correctly position vertically the classroom schedule box
 *
 * @param {Schedule} schedule
 * @return {Object} <pre><code>{ 
 *  positionBegin : <i>string</i>, 
 *  positionEnd : <i>string</i> 
 * }</code></pre>
 */
UI.prototype.calcPositionForTime = function(schedule, timeBegin, timeEnd) {
  positionBegin = (1 / (timeEnd - timeBegin)) * ((schedule.timeBegin.getHours()*60 + schedule.timeBegin.getMinutes()) / 60 - timeBegin);
  positionEnd = 1 - (1 / (timeEnd - timeBegin)) * ((schedule.timeEnd.getHours()*60 + schedule.timeEnd.getMinutes()) / 60 - timeBegin);

  return {
    'positionBegin': positionBegin,
    'positionEnd': positionEnd
  };
}

/**
 * Creates boxes that represent lecture schedules in the schedule table.
 * <br>
 * Generates HTML elements with this form:
 *
 * <pre><code>&ltdiv class="lecture"&gt
 *   &ltspan class="timespan"&gt10:00 11:40&lt/span&gt
 *   &ltspan class="lecture-code"&gtMAC0110&lt/span&gt
 * &lt/div&gt</code></pre>
 *
 * @param {Schedule} schedule
 * @param {String} lectureCode
 * @return {div}
 */
UI.prototype.createScheduleBox = function(schedule) {
  // Lecture -> Classroom -> Schedule
  var lecture = schedule.parent.parent;
  var scheduleBoxTreeObj = {
    tag: 'div',
    title: `${lecture.code} - ${lecture.name}`,
    class: ['schedule-box', 'color-' + lecture.color],
    children: [{
        tag: 'span',
        class: ['timespan', 'timespan-begin'],
        innerHTML: schedule.timeBegin.toString('HH:mm')
      },
      {
        tag: 'span',
        class: 'lecture-code',
        innerHTML: lecture.code
      },
      {
        tag: 'span',
        class: ['timespan', 'timespan-end'],
        innerHTML: schedule.timeEnd.toString('HH:mm')
      }
    ]
  };

  var scheduleBox = createHtmlElementTree(scheduleBoxTreeObj);
  
  this.setScheduleBoxBoundaries(schedule, scheduleBox);

  return scheduleBox;
}

UI.prototype.setScheduleBoxBoundaries = function(schedule, scheduleBox) {
  // if the box is too small and can only fit the lecture code inside
  if (schedule.timeEnd - schedule.timeBegin <= 3600000)
    Array.from(scheduleBox.getElementsByClassName('timespan')).forEach(timespan => timespan.classList.add('timespan-mini'));

  var timePosition = this.calcPositionForTime(schedule,0,26);
  scheduleBox.style.cssText = `top: ${timePosition.positionBegin * 100 + '%'}; 
                              bottom: ${timePosition.positionEnd * 100 + '%'};`; //This is more efficient than setting top and bottom separately

  //scheduleBox.style.animationDelay = (schedule.timeBegin - schedule.timeBegin.clone().previous().sunday().at("0:00"))/432000000 + 0.3 + 's';
}


/**
 * Creates boxes that represent lecture schedules in the schedule table.
 * <br>
 * Generates HTML elements with this form:
 *
 * <pre><code>&ltdiv class="lecture-classrooms"&gt
 *     &ltdiv class="classroom-info"&gt
 *       &ltinput type="checkbox" id="classroom-01" name="MAC0110"&gt
 *       &ltlabel class="classroom" for="classroom-01"&gt
 *         &ltdiv class="classroom-number"&gtN1&lt/div&gt
 *         &ltdiv class="classroom-teacher"&gtNome do Professor&lt/div&gt
 *         &ltdiv class="classroom-toggle"&gt+&lt/div&gt
 *       &lt/label&gt
 *     &lt/div&gt
 * &lt/div&gt</pre></code>
 *
 *
 * @param {Schedule} schedule
 * @param {String} lectureCode
 * @return {div}
 */
UI.prototype.createClassroomInfo = function(classroom) {
  var classroomInfoTreeObj = {
    tag: 'div',
    class: 'classroom-info',
    children: [
      {
        tag: 'div',
        class: 'classroom-info-header',
        children: [{
          tag: 'input',
          type: 'checkbox',
          class: 'classroom-info-checkbox',
          checked: classroom.selected
        },
        {
          tag: 'div',
          class: 'classroom-code',
          innerHTML: classroom.shortCode
        },
        {
          tag: 'div',
          class: 'classroom-teacher',
          innerHTML: classroom.teachers.length < 4? removeDuplicates(classroom.teachers.filter(el => el).map(teacher => 'Prof. ' + teacher)).join('<br>') ||
            'Sem professor designado':
            `Prof. ${classroom.teachers.filter(el => el)[0]} et al.`
        },
        {
          tag:'div',
          class: 'classroom-vacancies-summary',
          innerHTML: `${classroom.vacancies.total.subscribed}/${classroom.vacancies.total.total}`
        }
      ]},
      ... classroom.obs? [{
        tag: 'div',
        class: 'classroom-info-obs',
        innerHTML: classroom.obs
      }] : [],
      {
        tag: 'div',
        class: 'classroom-info-schedules',
        children: classroom.schedules.length? this.buildClassroomScheduleSummary(classroom) :
        [{
          tag: 'div',
          class: 'classroom-info-schedule',
          innerHTML: 'Sem horário definido'
        }]
      },
      {
        tag: 'table',
        class: 'classroom-info-vacancies',
        children: [].concat({tag:'tr', innerHTML:'<th>Vagas</th><th>V</th><th>I</th><th>P</th><th>M</th>'},
          ...Object.keys(classroom.vacancies).filter(x => x != "total").map(vacancyType => ([{
            tag: 'tr',
            class: 'classroom-vacancy',
            innerHTML: `<td>${vacancyType}</td><td>${classroom.vacancies[vacancyType].total}</td><td>${classroom.vacancies[vacancyType].subscribed}</td><td>${classroom.vacancies[vacancyType].pending}</td><td>${classroom.vacancies[vacancyType].enrolled}</td>`
          },
          ...Object.keys(classroom.vacancies[vacancyType].groups).map(vacancyGroup => ({
              tag: 'tr',
              class: 'classroom-vacancy classroom-vacancy-group',
              innerHTML: `<td>${vacancyGroup}</td><td>${classroom.vacancies[vacancyType].groups[vacancyGroup].total}</td><td>${classroom.vacancies[vacancyType].groups[vacancyGroup].subscribed}</td><td>${classroom.vacancies[vacancyType].groups[vacancyGroup].pending}</td><td>${classroom.vacancies[vacancyType].groups[vacancyGroup].enrolled}</td>`
            }))]
          )))
      }

    ]};

  var classroomInfo = createHtmlElementTree(classroomInfoTreeObj);
  return classroomInfo;
}

/**
 * Creates the Info section of a lecture, inside lecture explorer.
 *
 * @param {Lecture} lecture
 * @return {HTML_Element} div.lecture-info
 */
UI.prototype.createLectureInfo = function(lecture) {
  var lectureInfoTreeObj = {
    tag: 'div',
    class: ['lecture-info', 'color-' + lecture.color],
    children: [{
        tag: 'div',
        class: 'lecture-info-header',
        children: [{
            tag: 'input',
            type: 'checkbox',
            class: 'lecture-info-checkbox',
            checked: lecture.selected
          },
          {
            tag: 'div',
            class: 'lecture-info-code',
            innerHTML: lecture.code
          },
          {
            tag: 'div',
            class: 'lecture-info-name',
            innerHTML: lecture.name
          },
          { tag: 'div',
            class: 'lecture-info-handle fas fa-grip-vertical'
          },
          {
            tag: 'div',
            class: 'lecture-info-delete',
            innerHTML: '&times;',
            title: 'Remover disciplina'
          }
        ]
      },
      {tag: 'div',
       class: 'lecture-info-description',
       children: [

          {
            tag: 'div',
            class: 'lecture-info-unit',
            innerHTML: lecture.unit
          },
          {
            tag: 'div',
            class: 'lecture-info-department',
            innerHTML: lecture.department
          },
          {
            tag: 'div',
            class: 'lecture-info-credits',
            innerHTML: `<div class="lecture-info-credits-header">Créditos:</div> <div class="lecture-info-credits-content">${lecture.lectureCredits} Aula <br/> ${lecture.workCredits} Trabalho</div>`
          }]
      },
      {
        tag: 'div',
        class: 'lecture-classrooms',
        children: [{
          tag: 'div',
          class: 'classrooms-header',
          children: [
            {
              tag: 'div',
              class: 'classroom-code',
              innerHTML: 'Turmas'
            }
          ]
        }]
      }
    ]
  }

  var lectureInfo = createHtmlElementTree(lectureInfoTreeObj);
  return lectureInfo;
}

UI.prototype.buildClassroomScheduleSummary = function(classroom) {
  var days = {};
  var eltree = [];
  classroom.schedules.forEach(schedule => {
          if(!days[schedule.day]) days[schedule.day] = [];
          days[schedule.day].push([schedule.timeBegin, schedule.timeEnd]);
          
  });
  for(var day in days) {
    days[day].sort((a,b) => a - b);
    eltree.push({
      tag: 'div',
      class: 'classroom-info-schedule',
      innerHTML: `${day} ${days[day].map(s => `${s[0].toString('HH:mm')} - ${s[1].toString('HH:mm')}`).join(', ')}`,
    });
  }
  return eltree;
}

UI.prototype.createCombinationBoard = function(combination) {
  var scale = window.devicePixelRatio;

  var combinationBoardTreeObj = {
    tag: 'canvas',
    class: 'combination',
    width: 100 * scale,
    height: 100 * scale
  };

  var combinationBoard = createHtmlElementTree(combinationBoardTreeObj);
  var ctx = combinationBoard.getContext('2d');
  var columnHeight = (this.settings.timeEnd - this.settings.timeBegin);

  var classrooms = combination.classroomGroups.map(group => group[0]);
  classrooms.forEach(classroom => {
    classroom.schedules.forEach(schedule => {
      var day = indexOfDay(schedule.day);

      var position = this.calcPositionForTime(schedule,6,23);
      var boxTop = position.positionBegin * 100;
      var boxHeight = 100 - position.positionEnd * 100 - boxTop;
      var boxLeft = day * (100/this.settings.dayEnd) + 1;

      ctx.fillStyle = this.lightColors[classroom.parent.color].toHslString();
      ctx.fillRect(boxLeft * scale, boxTop * scale, ((100/this.settings.dayEnd) - 2) * scale, boxHeight * scale);
      ctx.fillStyle = this.darkColors[classroom.parent.color].toHslString();
      ctx.fillRect(boxLeft * scale, boxTop * scale, 2 * scale, boxHeight * scale);
    });
  });

  return combinationBoard;
}

UI.prototype.showCombinations = function(combinations) {
  this.combinations = combinations;

  this.combinationTrackStart = undefined;
  this.combinationTrackEnd = undefined;

  this.setCombinationPage(0);
}

UI.prototype.nextCombinationPage = function() {
  if(this.combinationTrackEnd == this.combinations.length)
    return;
  
  var pageSize = Math.min(this.combinations.length - this.combinationTrackEnd, this.combinationTrackPageSize);

  var fragment = document.createDocumentFragment();
  for(i = 0; i < pageSize; i++) {
    fragment.appendChild(this.combinations[this.combinationTrackEnd + i].htmlElement);
    this.combinationTrack.removeChild(this.combinations[this.combinationTrackStart + i].htmlElement);
  }
  this.combinationTrack.appendChild(fragment);

  this.combinationTrackStart += pageSize;
  this.combinationTrackEnd += pageSize;

  this.combinationTrack.scrollLeft -= 100 * pageSize;
}

UI.prototype.setCombinationPage = function(pageIndex) {
  if(pageIndex < 0 || pageIndex > this.combinations.length / this.combinationTrackPageSize || pageIndex == this.combinationTrackStart/this.combinationTrackPageSize)
    return;

  pageIndex = Math.floor(pageIndex);

  this.combinationTrackStart = pageIndex * this.combinationTrackPageSize;
  this.combinationTrackEnd = Math.min(this.combinationTrackStart + 4 * this.combinationTrackPageSize, this.combinations.length);

  this.combinationTrack.innerHTML = "";

  var fragment = document.createDocumentFragment();
  for(i = this.combinationTrackStart; i < this.combinationTrackEnd; i++) {
    fragment.appendChild(this.combinations[i].htmlElement);
  }
  this.combinationTrack.appendChild(fragment);

  this.combinationTrack.scrollLeft = 0;
}

UI.prototype.previousCombinationPage = function() {
  if(this.combinationTrackStart == 0)
    return;

  var pageSize = Math.min(this.combinationTrackStart, this.combinationTrackPageSize);

  var fragment = document.createDocumentFragment();
  for(i = 0; i < pageSize; i++) {
    fragment.appendChild(this.combinations[this.combinationTrackStart - pageSize + i].htmlElement);
    this.combinationTrack.removeChild(this.combinations[this.combinationTrackEnd - 1 - i].htmlElement);
  }
  this.combinationTrack.insertBefore(fragment, this.combinations[this.combinationTrackStart].htmlElement);

  this.combinationTrackStart -= pageSize;
  this.combinationTrackEnd -= pageSize;

  this.combinationTrack.scrollLeft += 100 * pageSize;
}

UI.prototype.clearCombinations = function() {
  this.combinationTrack.innerHTML = "";
}

UI.prototype.scrollActiveCombinationToView = function() {
  if (!state.activePlan || !state.activePlan.activeCombination) return;
  
  this.scrollCombinationToView(state.activePlan.activeCombination);
}

UI.prototype.scrollCombinationToView = function(combination) {
  var i = combination.parent.combinations.indexOf(combination);

  if(i > this.combinationTrackEnd || i < this.combinationTrackStart)
    this.setCombinationPage(i/this.combinationTrackPageSize);

  var offsetLeft = combination.htmlElement.offsetLeft;

  if(this.combinationTrack.scrollLeft > offsetLeft) {
    this.combinationTrack.scrollLeft = offsetLeft;
    return;
  }

  var boardWidth = combination.htmlElement.clientWidth;
  var railWidth = this.combinationTrack.clientWidth;
  if(this.combinationTrack.scrollLeft + railWidth < offsetLeft + boardWidth) {
    this.combinationTrack.scrollLeft = offsetLeft + boardWidth - railWidth;
    return;
  }
}

UI.prototype.refreshAccordion = function() {
  this.accordion.innerHTML = "";
  state.activePlan.lectures.forEach(lecture => this.accordion.appendChild(lecture.htmlElement));
}

/**
 *
 */
UI.prototype.addLectures = function(lectures) {
  var accordionFragment = document.createDocumentFragment();

  var weekdayFragments = Array(7).fill(0).map(x => document.createDocumentFragment());
  
  lectures.forEach(lecture => {
    accordionFragment.appendChild(lecture.htmlElement);

    lecture.classrooms.forEach(classroom => {
      classroom.schedules.forEach(schedule => {
        var day = indexOfDay(schedule.day);
        if (day < this.weekdays.length)
          weekdayFragments[day].appendChild(schedule.htmlElement);
      });
    });
  });

  this.accordion.appendChild(accordionFragment);
  this.weekdays.forEach((weekday,i) => {weekday.appendChild(weekdayFragments[i]);});

  this.updateTimeTable();
}

/**
 *
 */
UI.prototype.removeLectures = function(lectures) {
  lectures.forEach(lecture => {
    lecture.htmlElement.remove();

    lecture.classrooms.forEach(classroom => {
      classroom.schedules.forEach(schedule => {
          schedule.htmlElement.remove();
      });
    });
  });
}

UI.prototype.setLoadingBar = function(load) {
  this.loadingBar.style.width = load * 100 + '%';
}

UI.prototype.showBanner = function(message, time) {
  this.bannerMsg.innerHTML = message;
  this.banner.classList.add('banner-open');

  if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
  if (time)
    this.bannerTimeout = setTimeout(() => this.closeBanner(), time);
}

UI.prototype.closeBanner = function() {
  this.banner.classList.remove('banner-open');
}

UI.prototype.makeTimeTable = function() {
  var timeBegin = 0;
  var timeEnd = 26;
  var dayEnd = 5;
  
  this.timeColumn.innerHTML = '';

  var bgs = this.timeTable.getElementsByClassName('column-bg');
  while(bgs.length) bgs[0].remove();

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  for(var i = timeBegin; i <= timeEnd; i++){
    var tick = i%24;
    createAndAppendChild(this.timeColumn,'div',{'class':'hour', 'innerHTML': tick});
    j = i-timeBegin;
    let pos = j / (timeEnd - timeBegin) * 100 + '%';
    
    if(tick == 12) {
      let line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
      line.setAttribute('x1',0);
      line.setAttribute('y1',pos);
      line.setAttribute('x2','100%');
      line.setAttribute('y2',pos);
      line.setAttribute('class','even noon-outline');
      svg.appendChild(line);
      
      line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
      line.setAttribute('x1',0);
      line.setAttribute('y1',pos);
      line.setAttribute('x2','100%');
      line.setAttribute('y2',pos);
      line.setAttribute('class','even noon-center');
      svg.appendChild(line);
    }
    else {
      let line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
      line.setAttribute('x1',0);
      line.setAttribute('y1',pos);
      line.setAttribute('x2','100%');
      line.setAttribute('y2',pos);
      line.setAttribute('class',i % 2 ? 'odd' : 'even');
      svg.appendChild(line);
    }
  }

  var bgDiv = createHtmlElementTree({
    tag: 'div',
    class: 'column-bg',
  });

  bgDiv.appendChild(svg);

  for(var i = 0; i < this.weekdays.length; i++) {
    this.weekdays[i].appendChild(i? bgDiv.cloneNode(true) : bgDiv);
  }
}

UI.prototype.updateTimeTable = function(timeBegin, timeEnd, dayEnd) {
  if(timeBegin == this.settings.timeBegin && timeEnd == this.settings.timeEnd && dayEnd == this.settings.dayEnd)
    return;
 
  if(state.activePlan && state.activePlan.activeCombination && state.activePlan.activeCombination.classroomGroups.some(group => group[0].schedules.length)){
    if(timeBegin === null || timeBegin === undefined) {
      timeBegin = Math.min(...[].concat(...state.activePlan.activeCombination.classroomGroups.map(classroomGroup => classroomGroup[0].schedules.map(schedule => schedule.timeBegin.getHours()))));
    }
    if(timeEnd === null || timeEnd === undefined) {
      timeEnd = 1 + Math.max(...[].concat(...state.activePlan.activeCombination.classroomGroups.map(classroomGroup => classroomGroup[0].schedules.map(schedule => schedule.timeEnd.getHours()))));
    }
  }
    
  if(timeBegin === null || timeBegin === undefined) {
    timeBegin = this.settings.defaultTimeBegin;
  }
  if(timeEnd === null || timeEnd === undefined) {
    timeEnd = this.settings.defaultTimeEnd;
  }

  if(dayEnd === null || dayEnd === undefined) {
    if(this.weekdays[6].childElementCount > 1) {
      dayEnd = 7;
    }
    else if(this.weekdays[5].childElementCount > 1) {
      dayEnd = 6;
    }
    else {
      dayEnd = 5;
    }
  }

  if(timeBegin == this.settings.timeBegin && timeEnd == this.settings.timeEnd && dayEnd == this.settings.dayEnd)
    return;

  this.settings.timeBegin = timeBegin;
  this.settings.timeEnd = timeEnd;
  this.settings.dayEnd = dayEnd;

  if(timeEnd - timeBegin < 8)
    this.timeTable.classList.add('short');
  else
    this.timeTable.classList.remove('short');

  var scale = 27 / (timeEnd - timeBegin + 1);
  var topOffset = (timeBegin)/27*scale;
  //var clientHeight = this.timeColumn.parentNode.clientHeight * scale;

  this.timeTable.style.setProperty("--col-top", -topOffset * 100 + '%');
  this.timeTable.style.setProperty("--col-height", scale * 100 + '%');

  for(var i = 0; i < this.weekdays.length; i++) {
    if(i < dayEnd) {
      if(this.weekdays[i].parentElement.parentElement.classList.contains( 'hidden')) {
        this.weekdays[i].offsetWidth; //This is needed to trigger a reflow so the border-width will be transitioned
        this.weekdays[i].parentElement.parentElement.classList.remove('hidden');
      }
    }
    else this.weekdays[i].parentElement.parentElement.classList.add('hidden');
  }

  this.saveOnLocalStorage();
}

UI.prototype.setCredits = function(lectureCredits,workCredits) {
    this.lectureCredits.innerHTML = lectureCredits;
    this.workCredits.innerHTML = workCredits;
}

UI.prototype.createPlanTab = function(plan) {
  var el = createHtmlElementTree({
    tag: 'div',
    class:'plan', 
    title: plan.name,
    children: [
      {
        tag: 'input',
        type: 'text',
        disabled: true,
        class: 'plan-tab-name',
        size: plan.name.length + 1,
        value: plan.name
      },
      {
        tag: 'div',
        class: 'plan-tab-close',
        innerHTML: '&times;'
      }
    ]
  });
  el.childNodes[0].addEventListener('input', e => {e.target.setAttribute('size', e.target.value.length + 1)});
  return this.plans.insertBefore(el,this.newPlan);
}

UI.prototype.scrollActivePlanTabToView = function() {
  if (!state.activePlan) return;
  this.scrollPlanToView(state.activePlan);
}

UI.prototype.scrollPlanToView = function(plan) {
  var offsetLeft = plan.html.tab.offsetLeft;

  var tabWidth = plan.html.tab.clientWidth;
  var railWidth = this.plans.clientWidth;

  if(this.plans.scrollLeft > offsetLeft) {
    this.plans.scrollLeft = offsetLeft;
    return;
  }

  if(this.plans.scrollLeft + railWidth < offsetLeft + tabWidth) {
    this.plans.scrollLeft = offsetLeft + tabWidth - railWidth;
    return;
  }

  this.refreshPlanPaddles();
}

UI.prototype.refreshPlanPaddles = function() {
  var maxScroll = this.plans.scrollWidth - this.plans.clientWidth;

  this.planPaddleLeft.style.visibility = this.plans.scrollLeft ? 'visible' : 'hidden';
  this.planPaddleRight.style.visibility = maxScroll > 0 && this.plans.scrollLeft < maxScroll ? 'visible' : 'hidden';
}

UI.prototype.addContextMenu = function(menu, position) {
  if(this.menu) {
    this.menuOverlay.removeChild(this.menu);
  }

  menu.addEventListener('pointerdown', e => e.stopPropagation());
  this.menuOverlay.classList.add('show');
  this.menuOverlay.appendChild(menu);
  var menuHeight = menu.offsetHeight;
  var menuWidth = menu.offsetWidth;
  var windowWidth = window.innerWidth;

  var cssText = '';
  if(position.y < window.innerHeight - menuHeight)
    cssText += `top: ${position.y + window.scrollY}px;`;
  else
    cssText = `top: ${position.y + window.scrollY - menuHeight}px; left: ${position.x + window.scrollX}px;`;

  if(position.x < windowWidth - menuWidth)
    cssText += `left: ${position.x + window.scrollX}px;`;
  else if(position.x > menuWidth)
    cssText += `left: ${position.x + window.scrollX - menuWidth}px;`;
  else
    cssText += `left: ${window.scrollX + (windowWidth - menuWidth)/2}px`;

  menu.style.cssText = cssText;
  this.menu = menu;
}

UI.prototype.hideContextMenu = function() {
  if(this.menu) {
    this.menuOverlay.classList.remove('show');
    this.menuOverlay.removeChild(this.menu);
    this.menu = null;
  }
}

UI.prototype.createNewPlanContextMenu = function(pos) {
  var menu = createHtmlElementTree({
    tag: 'div',
    class: 'context-menu',
    children: [
      {
        tag: 'button',
        innerHTML: 'Novo plano',
        class: 'context-menu-item',
        onclick: e => {state.addPlan(); 
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'button',
        innerHTML: 'Carregar grade ideal',
        class: 'context-menu-item',
        onclick: e => {this.openCourseDialog();
                       this.hideContextMenu();
                       e.preventDefault;}
      },
      {
        tag: 'button',
        innerHTML: 'Reabrir plano fechado',
        class: 'context-menu-item context-divider',
        disabled: !state.removedPlans.length,
        onclick: e => {state.activePlan = state.addPlan(state.removedPlans.pop());
                       this.hideContextMenu();
                       e.preventDefault();}
      },
      {
        tag: 'button',
        innerHTML: 'Remover todos os planos',
        class: 'context-menu-item',
        onclick: e => {state.plans.slice().forEach(statePlan => state.removePlan(statePlan));
                      this.hideContextMenu(); 
                      e.preventDefault();}
      }
    ]
  });
  this.addContextMenu(menu, pos);
}

UI.prototype.createPlanContextMenu = function(plan, pos) {
  var menu = createHtmlElementTree({
    tag: 'div',
    class: 'context-menu',
    children: [
      {
        tag: 'button',
        innerHTML: 'Novo plano',
        class: 'context-menu-item',
        onclick: e => {state.addPlan(); 
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'button',
        innerHTML: 'Duplicar plano',
        class: 'context-menu-item context-divider',
        onclick: e => {state.activePlan = state.copyPlan(plan);
                       this.hideContextMenu();
                       e.preventDefault;}
      },
      {
        tag: 'button',
        innerHTML: 'Remover plano',
        class: 'context-menu-item',
        onclick: e => {state.removePlan(plan);
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'button',
        innerHTML: 'Remover planos à direita',
        class: 'context-menu-item',
        disabled: state.plans.indexOf(plan) == state.plans.length - 1,
        onclick: e => {state.plans.slice(state.plans.indexOf(plan) + 1).forEach(statePlan => state.removePlan(statePlan));
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'button',
        innerHTML: 'Remover outros planos',
        class: 'context-menu-item context-divider',
        disabled: state.plans.length < 2,
        onclick: e => {state.plans.slice().forEach(statePlan => {if(statePlan != plan) state.removePlan(statePlan);});
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'button',
        innerHTML: 'Reabrir plano fechado',
        class: 'context-menu-item',
        disabled: !state.removedPlans.length,
        onclick: e => {state.activePlan = state.addPlan(state.removedPlans.pop());
                       this.hideContextMenu();
                       e.preventDefault();}
      }
    ]
  });
  this.addContextMenu(menu, pos);
}


UI.prototype.createLectureContextMenu = function(lecture, pos) {
  var menu = createHtmlElementTree({
    tag: 'div',
    class: 'context-menu',
    children: [
      {
        tag: 'button',
        innerHTML: 'Abrir no Jupiterweb',
        class: 'context-menu-item context-divider context-external-link',
        onclick: e => {
                      window.open(`https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=${lecture.code}`,'_blank');
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'div',
        class: 'context-menu-item context-divider color-picker',
        children: [].concat(this.colors.map((color, i) => ({
          tag: 'button', 
          class: 'color-picker-button color-picker-button-color-' + i + (lecture.color == i? " selected" : ''),
          onclick: e => {
              if(lecture.color != i) {
                let oldcolor = lecture.color;
                lecture.color = i;
                lecture.parent.combinations.forEach(combination => {
                  var oldEl = combination._htmlElement;
                  if(!oldEl) return;
                  
                  combination._htmlElement = ui.createCombinationBoard(combination);
                  combination.addEventListeners();
                  if(oldEl) {
                    combination.htmlElement.classList = oldEl.classList;
                    if(oldEl.parentNode)
                      oldEl.parentNode.replaceChild(combination.htmlElement, oldEl);
                  }
                });

                lecture.htmlElement.classList.remove('color-'+oldcolor);
                lecture.htmlElement.classList.add('color-'+i);
                lecture.classrooms.forEach(classroom => classroom.schedules.forEach(schedule => {
                  schedule.htmlElement.classList.remove('color-'+oldcolor);
                  schedule.htmlElement.classList.add('color-'+i);
                }));
                lecture.parent.colors[oldcolor]--;
                lecture.parent.colors[i]++;
                state.saveOnLocalStorage();
                this.hideContextMenu();
                e.preventDefault();
              }
          }
          })), [{
              tag: 'button', 
              class: 'color-picker-button color-picker-random-button fas fa-question',
              onclick: e => {
                  i = lecture.parent.colors.indexOf(Math.min(... lecture.parent.colors));

                  if(lecture.color != i) {
                    let oldcolor = lecture.color;
                    lecture.color = i;
                    lecture.parent.combinations.forEach(combination => {
                      var oldEl = combination.htmlElement;
                      combination.htmlElement = ui.createCombinationBoard(combination);
                      combination.addEventListeners();
                      if(oldEl) {
                        combination.htmlElement.classList = oldEl.classList;
                        if(oldEl.parentNode)
                          oldEl.parentNode.replaceChild(combination.htmlElement, oldEl);
                      }
                    });
                    lecture.htmlElement.classList.remove('color-'+oldcolor);
                    lecture.htmlElement.classList.add('color-'+i);
                    lecture.classrooms.forEach(classroom => classroom.schedules.forEach(schedule => {
                      schedule.htmlElement.classList.remove('color-'+oldcolor);
                      schedule.htmlElement.classList.add('color-'+i);
                    }));
                    lecture.parent.colors[oldcolor]--;
                    lecture.parent.colors[i]++;
                    state.saveOnLocalStorage();
                    this.hideContextMenu();
                    e.preventDefault();
                  }
              }
        }])
      },
      {
        tag: 'button',
        innerHTML: 'Remover disciplina',
        class: 'context-menu-item',
        onclick: e => {lecture.delete(); 
                      this.hideContextMenu(); 
                      e.preventDefault();}
      }
    ]
  });
  this.addContextMenu(menu, pos);
}

UI.prototype.createClassroomContextMenu = function(classroom, pos) {
  var menu = createHtmlElementTree({
    tag: 'div',
    class: 'context-menu',
    children: [
      {
        tag: 'button',
        innerHTML: 'Abrir no Jupiterweb',
        class: 'context-menu-item context-divider context-external-link',
        onclick: e => {
                      window.open(`https://uspdigital.usp.br/jupiterweb/obterTurma?sgldis=${classroom.parent.code}&codtur=${classroom.code}`,'_blank');
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'button',
        innerHTML: classroom.selected? 'Deselecionar turma' : 'Selecionar turma',
        class: 'context-menu-item',
        onclick: e => {
                      classroom.toggleClassroomSelection(null,true);
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'button',
        innerHTML: 'Selecionar apenas esta turma',
        class: 'context-menu-item context-divider',
        onclick: e => {
                      classroom.parent.classrooms.forEach(c => c.toggleClassroomSelection(c == classroom, false));
                      classroom.parent.update();
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'button',
        innerHTML: 'Remover disciplina',
        class: 'context-menu-item',
        onclick: e => {
                      classroom.parent.delete(); 
                      this.hideContextMenu(); 
                      e.preventDefault();}
      }
    ]
  });
  this.addContextMenu(menu, pos);
}

UI.prototype.openCourseDialog = function() {
  this.dialogOverlay.classList.add('show');
  this.courseDialog.classList.add('show');
  this.openDialog = this.courseDialog;
}

UI.prototype.openShareDialog = function() {
  this.dialogOverlay.classList.add('show');
  this.shareDialog.classList.add('show');
  this.openDialog = this.shareDialog;
}

UI.prototype.openPrintDialog = function() {
  this.dialogOverlay.classList.add('show');
  this.printDialog.classList.add('show');
  this.openDialog = this.printDialog;
}

UI.prototype.closeDialog = function() {
  if(!this.openDialog) return;

  this.dialogOverlay.classList.remove('show');
  this.openDialog.classList.remove('show');
  this.openDialog = null;
}