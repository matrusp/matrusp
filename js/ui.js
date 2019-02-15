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
  this.extendButton = document.getElementById('extended-time-table-button');

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

  this.weekdays = [];    
  var lectureScheduleColumns = this.timeTable.getElementsByClassName('column-content');
  // Ignores i == 0 because it's the time column
  for (var i = 1; i < lectureScheduleColumns.length; i++) {
    this.weekdays.push(lectureScheduleColumns[i]);
  }
  this.timeColumn = lectureScheduleColumns[0]; 

  if(!localStorage.uiSettings)
    localStorage.uiSettings = JSON.stringify(this.settings = {
      extendTimeTable: false,
      defaultTimeBegin: 6,
      defaultTimeEnd: 24,
    });
  else
    this.settings = JSON.parse(localStorage.uiSettings);

  new Slip(this.accordion,{minimumDistance: 10});

  this.makeTimeTable();

  this.accordion.addEventListener('slip:beforewait',e => {
    if(e.detail.pointerType == 'mouse')
      e.preventDefault();
  });

  this.accordion.addEventListener('slip:beforereorder',e => {
    window.navigator.vibrate(25);
  });

  this.accordion.addEventListener('slip:startreorder', e => {
    e.target.closest('.lecture-info').classList.remove('lecture-open');
    this.hideContextMenu();
  });


  this.accordion.addEventListener('slip:reorder',e => {
    if(e.detail.originalIndex == e.detail.spliceIndex)
      return;

    e.target.parentNode.insertBefore(e.target, e.detail.insertBefore);

    var lecture = state.activePlan.lectures[e.detail.originalIndex];
    state.activePlan.lectures.splice(e.detail.originalIndex, 1);
    state.activePlan.lectures.splice(e.detail.spliceIndex, 0, lecture);
    state.activePlan.update();
  });

  this.accordion.addEventListener('slip:swipe', e => {
    state.activePlan.lectures[e.detail.originalIndex].delete();
  });

  this.newPlan.addEventListener('click',e => {var plan = state.addPlan(); state.activePlan = plan; this.plans.scrollLeft = this.plans.scrollWidth; });
  this.newPlan.addEventListener('contextmenu',e => {ui.createNewPlanContextMenu({x: e.clientX, y: e.clientY}); e.preventDefault();});

  this.plans.addEventListener('scroll', e => this.refreshPlanPaddles());
  this.refreshPlanPaddles();

  this.planPaddleLeft.addEventListener('click', e => {this.plans.scrollLeft -= 90});
  this.planPaddleRight.addEventListener('click', e => {this.plans.scrollLeft += 90});

  this.combinationPaddleLeft.addEventListener('click', e => {this.combinationTrack.scrollLeft -= 240});
  this.combinationPaddleRight.addEventListener('click', e => {this.combinationTrack.scrollLeft += 240});


  document.getElementById('msg-banner-close').addEventListener('click', () => this.closeBanner());

  this.menuOverlay.addEventListener('pointerdown', e => this.hideContextMenu());
  window.addEventListener('resize', e => this.hideContextMenu());
  window.addEventListener('scroll',e => this.hideContextMenu());

  this.extendButton.addEventListener('click', e => {
    this.settings.extendTimeTable = !this.settings.extendTimeTable;

    toggleClass(this.extendButton,'toggled', this.settings.extendTimeTable);
    
    this.updateTimeTable(null,null,this.dayEnd);

    localStorage.uiSettings = JSON.stringify(this.settings);
    });
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
UI.prototype.createClassroomInfo = function(classroom, lectureCode) {
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
        children: classroom.schedules.length? classroom.schedules.map(schedule => ({
          tag: 'div',
          class: 'classroom-info-schedule',
          innerHTML: `${schedule.day} ${schedule.timeBegin.toString('HH:mm')} - ${schedule.timeEnd.toString('HH:mm')}`
        })) : [{
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
          {
            tag: 'div',
            class: 'lecture-info-delete',
            children: [{
              tag: 'img',
              src: 'images/ic_close.png'
            }]
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
  var columnHeight = (this.timeEnd - this.timeBegin);

  var classrooms = combination.classroomGroups.map(group => group[0]);
  classrooms.forEach(classroom => {
    classroom.schedules.forEach(schedule => {
      var day = indexOfDay(schedule.day);

      var position = this.calcPositionForTime(schedule,6,23);
      var boxTop = position.positionBegin * 100;
      var boxHeight = 100 - position.positionEnd * 100 - boxTop;
      var boxLeft = day * (100/this.dayEnd) + 1;

      var color = this.colors[classroom.parent.color];
      ctx.fillStyle = color.clone().lighten(10).toHslString();
      ctx.fillRect(boxLeft * scale, boxTop * scale, ((100/this.dayEnd) - 2) * scale, boxHeight * scale);
      ctx.fillStyle = color.clone().darken(25).toHslString();
      ctx.fillRect(boxLeft * scale, boxTop * scale, 2 * scale, boxHeight * scale);
    });
  });

  return combinationBoard;
}

UI.prototype.addCombinations = function(combinations) {
  var fragment = document.createDocumentFragment();
  combinations.forEach(combination => fragment.appendChild(combination.htmlElement));
  this.combinationTrack.appendChild(fragment);
}

UI.prototype.removeCombinations = function(combinations) {
  combinations.forEach(combination => combination.htmlElement.remove());
}

UI.prototype.scrollActiveCombinationToView = function() {
  if (!state.activePlan || !state.activePlan.activeCombination) return;
  this.scrollCombinationToView(state.activePlan.activeCombination);
}

UI.prototype.scrollCombinationToView = function(combination) {
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

  this.refreshPlanPaddles();
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

  if(this.weekdays[6].childElementCount > 1) {
    this.updateTimeTable(null, null, 7);
  }
  else if(this.weekdays[5].childElementCount > 1) {
    this.updateTimeTable(null, null, 6);
  }
  else {
    this.updateTimeTable(null, null, 5);
  }

  //lectures.forEach(lecture => lecture.classrooms.forEach(classroom => classroom.schedules.forEach(schedule => this.setScheduleBoxBoundaries(schedule, schedule.htmlElement))));
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
    var tick = (timeEnd - timeBegin < 8 || !(i%2))? i%24 : '';
    createAndAppendChild(this.timeColumn,'div',{'class':'hour', 'innerHTML': tick});
    j = i-timeBegin;
    if(tick == 12) {
      let pos = j / (timeEnd - timeBegin) * 100 + '%';
      let pos1 = `calc(${pos} - 1.5px)`;

      let line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
      line.setAttribute('x1',0);
      line.setAttribute('y1',pos1);
      line.setAttribute('x2','100%');
      line.setAttribute('y2',pos1);
      line.setAttribute('class','even noon');
      svg.appendChild(line);

      let pos2 = `calc(${pos} + 1.5px)`;
      line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
      line.setAttribute('x1',0);
      line.setAttribute('y1',pos2);
      line.setAttribute('x2','100%');
      line.setAttribute('y2',pos2);
      line.setAttribute('class','even noon');
      svg.appendChild(line);
    }
    else {
      let pos = j / (timeEnd - timeBegin) * 100 + '%';

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

UI.prototype.updateTimeTable = function(timeBegin, timeEnd, dayEnd = 5) {

  if(!this.settings.extendTimeTable) {
    if(state.activePlan && state.activePlan.activeCombination){
      if(timeBegin === null) {
        timeBegin = Math.min(...[].concat(...state.activePlan.activeCombination.classroomGroups.map(classroomGroup => classroomGroup[0].schedules.map(schedule => schedule.timeBegin.getHours()))));
      }
      if(timeEnd === null) {
        timeEnd = 1 + Math.max(...[].concat(...state.activePlan.activeCombination.classroomGroups.map(classroomGroup => classroomGroup[0].schedules.map(schedule => schedule.timeEnd.getHours()))));
      }
    }
  }
    
  if(timeBegin === null || timeBegin === undefined) {
    timeBegin = this.settings.defaultTimeBegin;
  }
  if(timeEnd === null || timeEnd === undefined) {
    timeEnd = this.settings.defaultTimeEnd;
  }

  this.timeBegin = timeBegin;
  this.timeEnd = timeEnd;
  this.dayEnd = dayEnd;

  var scale = 27 / (timeEnd - timeBegin + 1);
  var topOffset = (timeBegin)/27*scale;
  //var clientHeight = this.timeColumn.parentNode.clientHeight * scale;

  this.weekdays.forEach(column => {
    column.style.top = -topOffset * 100 + '%';
    column.style.height = scale * 100 + '%';
  });

  this.timeColumn.style.top = -topOffset * 100 + '%';
  this.timeColumn.style.height = scale * 100 + '%';

  for(var i = 0; i < this.weekdays.length; i++) {
    if(i < dayEnd) {
      if(hasClass(this.weekdays[i].parentElement.parentElement, 'hidden')) {
        this.weekdays[i].offsetWidth; //This is needed to trigger a reflow so the border-width will be transitioned
        this.weekdays[i].parentElement.parentElement.classList.remove('hidden');
      }
    }
    else this.weekdays[i].parentElement.parentElement.classList.add('hidden');
  }

  state.activePlan.combinations.forEach(combination => {
    var oldEl = combination.htmlElement;
    combination.htmlElement = ui.createCombinationBoard(combination);
    combination.addEventListeners();
    if(oldEl) {
      combination.htmlElement.classList = oldEl.classList;
      if(oldEl.parentNode)
        oldEl.parentNode.replaceChild(combination.htmlElement, oldEl);
    }
  });

}

UI.prototype.setCredits = function(lectureCredits,workCredits) {
    this.lectureCredits.innerHTML =lectureCredits;
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
  if(this.plans.scrollLeft > offsetLeft) {
    this.plans.scrollLeft = offsetLeft;
    return;
  }

  var tabWidth = plan.html.tab.clientWidth;
  var railWidth = this.plans.clientWidth;
  if(this.plans.scrollLeft + railWidth < offsetLeft + tabWidth) {
    this.plans.scrollLeft = offsetLeft + tabWidth - railWidth;
    return;
  }

  this.refreshPlanPaddles();
}

UI.prototype.refreshPlanPaddles = function() {
  this.planPaddleLeft.style.visibility = this.plans.scrollLeft ? 'visible' : 'hidden';
  var maxScroll = this.plans.scrollWidth - this.plans.clientWidth;
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

  var cssText = '';
  if(position.y < window.innerHeight - menuHeight)
    cssText += `top: ${position.y + window.scrollY}px;`;
  else
    cssText = `top: ${position.y + window.scrollY - menuHeight}px; left: ${position.x + window.scrollX}px;`;

  if(position.x < window.innerWidth - menuWidth)
    cssText += `left: ${position.x + window.scrollX}px;`;
  else
    cssText += `left: ${position.x + window.scrollX - menuWidth}px;`;

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
        innerHTML: 'Abrir no Jupiterweb <span class="fas fa-external-link-alt"></span>',
        class: 'context-menu-item context-divider',
        onclick: e => {
                      window.open(`https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=${lecture.code}`,'_blank');
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'button',
        innerHTML: 'Remover',
        class: 'context-menu-item',
        onclick: e => {lecture.delete(); 
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