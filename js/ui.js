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
  this.loadingBar = document.getElementById('loading-bar');
  this.banner = document.getElementById('msg-banner');
  this.bannerMsg = document.getElementById('msg-banner-message');
  this.timeTable = document.getElementById('time-table');
  this.lectureCredits = document.getElementById('lecture-credits');
  this.workCredits = document.getElementById('work-credits');
  this.plans = document.getElementById('plans');
  this.newPlan = document.getElementById('new-plan');
  this.menuOverlay = document.getElementById('menu-overlay');

  // This comes from the SASS theme file
  //TODO: find better way to sync this
  this.colors =  [[125, 70, 61], 
                  [200, 94, 61],
                  [24, 100, 60], 
                  [298, 56, 65], 
                  [46, 80, 57], 
                  [76, 80, 60],
                  [176, 76, 58], 
                  [50, 48, 66], 
                  [225, 55, 64],
                  [330, 85, 59], 
                  [140 ,42, 58],
                  [263, 78, 65],
                  [33, 27, 58]];

  this.weekdays = [];    
  var lectureScheduleColumns = this.timeTable.getElementsByClassName('column-content');
  // Ignores i == 0 because it's the time column
  for (var i = 1; i < lectureScheduleColumns.length; i++) {
    this.weekdays.push(lectureScheduleColumns[i]);
  }
  this.timeColumn = lectureScheduleColumns[0];  
  this.makeTimeTable(6,23,5);

  new Slip(this.accordion,{minimumDistance: 10});


  this.accordion.addEventListener('slip:beforewait',e => {
    if(e.detail.pointerType == 'mouse')
      e.preventDefault();
  });
  this.accordion.addEventListener('slip:beforereorder',e => {
    window.navigator.vibrate(25);
  });
  this.accordion.addEventListener('slip:reorder',e => {
    e.target.parentNode.insertBefore(e.target, e.detail.insertBefore);

    var lecture = state.activePlan.lectures[e.detail.originalIndex];
    state.activePlan.lectures.splice(e.detail.originalIndex, 1);
    state.activePlan.lectures.splice(e.detail.spliceIndex, 0, lecture);
    state.activePlan.update();
  });

  this.newPlan.addEventListener('click',e => {var plan = state.addPlan(); state.activePlan = plan; });

  document.getElementById('msg-banner-close').addEventListener('click', () => this.closeBanner());

  this.menuOverlay.addEventListener('pointerdown', e => this.hideContextMenu());
  window.addEventListener('resize', e => this.hideContextMenu());
  window.addEventListener('scroll',e => this.hideContextMenu());
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
UI.prototype.calcPositionForTime = function(schedule) {
  positionBegin = (1 / (this.timeEnd - this.timeBegin)) * ((schedule.timeBegin - Date.today()) / 3600000 - this.timeBegin);
  positionEnd = 1 - (1 / (this.timeEnd - this.timeBegin)) * ((schedule.timeEnd - Date.today()) / 3600000 - this.timeBegin);

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
    class: ['schedule-box', 'color-' + lecture.color],
    children: [{
        tag: 'span',
        class: ['timespan', 'timespan-begin'],
        innerHTML: schedule.timeBegin.toString('HH:mm')
      },
      {
        tag: 'span',
        class: ['timespan', 'timespan-end'],
        innerHTML: schedule.timeEnd.toString('HH:mm')
      },
      {
        tag: 'span',
        class: 'lecture-code',
        innerHTML: lecture.code
      }
    ]
  };


  // if the box is too small and can only fit the lecture code inside
  if (schedule.timeEnd - schedule.timeBegin <= 3600000) {
    scheduleBoxTreeObj.children[0].class.push('timespan-mini');
    scheduleBoxTreeObj.children[1].class.push('timespan-mini');
  }

  var scheduleBox = createHtmlElementTree(scheduleBoxTreeObj);

  var timePosition = this.calcPositionForTime(schedule);
  scheduleBox.style.cssText = `top: ${timePosition.positionBegin * 100 + '%'}; 
                              bottom: ${timePosition.positionEnd * 100 + '%'};`; //This is more efficient than setting top and bottom separately

  return scheduleBox;
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
        innerHTML: removeDuplicates(classroom.teachers).join('<br>')
      }
    ]
  };

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
      {
        tag: 'div',
        class: 'lecture-classrooms',
        children: [{
          tag: 'div',
          class: 'classrooms-header',
          children: [{
              tag: 'input',
              type: 'checkbox',
              class: 'classrooms-header-checkbox'
            },
            {
              tag: 'div',
              class: 'classroom-code',
              innerHTML: 'Turma'
            },
            {
              tag: 'div',
              class: 'classroom-teacher',
              innerHTML: 'Professor'
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
  var combinationBoardTreeObj = {
    tag: 'canvas',
    class: 'combination',
    width: 100,
    height: 100
  };

  var combinationBoard = createHtmlElementTree(combinationBoardTreeObj);
  var ctx = combinationBoard.getContext('2d');
  var columnHeight = (this.timeEnd - this.timeBegin);

  var classrooms = combination.classroomGroups.map(group => group[0]);
  classrooms.forEach(classroom => {
    classroom.schedules.forEach(schedule => {
      var day = indexOfDay(schedule.day);

      var position = this.calcPositionForTime(schedule);
      var boxTop = position.positionBegin * 100;
      var boxHeight = 100 - position.positionEnd * 100 - boxTop;
      var boxLeft = day * (100/this.dayEnd) + 1;

      var color = this.colors[classroom.parent.color];
      ctx.fillStyle = `hsl(${color[0]},${color[1]}%,${color[2]}%)`;
      ctx.fillRect(boxLeft, boxTop, (100/this.dayEnd) - 2, boxHeight);
      ctx.fillStyle = `hsl(${color[0]},${color[1]}%,${color[2] - 25}%)`;
      ctx.fillRect(boxLeft, boxTop, 2, boxHeight);
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
  combinations.forEach(combination => combination.htmlElement.parentNode.removeChild(combination.htmlElement));
}

UI.prototype.scrollActiveCombinationToView = function() {
  if (this.combinationTrack.children.length === 0 || !state.activePlan) return;
  if (!state.activePlan.activeCombination) return;
  state.activePlan.activeCombination.htmlElement.scrollIntoView();
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

  if(weekdayFragments[6].childElementCount) {
    this.makeTimeTable(6,23,7);
  }
  else if(weekdayFragments[5].childElementCount) {
    this.makeTimeTable(6,23,6);
  }
  else {
    this.makeTimeTable(6,23,5);
  }

  this.accordion.appendChild(accordionFragment);
  this.weekdays.forEach((weekday,i) => {weekday.appendChild(weekdayFragments[i]);});
}

/**
 *
 */
UI.prototype.removeLectures = function(lectures) {
  lectures.forEach(lecture => {
    lecture.htmlElement.parentNode.removeChild(lecture.htmlElement);

    lecture.classrooms.forEach(classroom => {
      classroom.schedules.forEach(schedule => {
          schedule.htmlElement.parentNode.removeChild(schedule.htmlElement)
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

UI.prototype.makeTimeTable = function(timeBegin, timeEnd, dayEnd = 5) {
  if(timeBegin == this.timeBegin && timeEnd == this.timeEnd && dayEnd == this.dayEnd) return;
  
  this.timeColumn.innerHTML = '';

  var bgs = this.timeTable.getElementsByClassName('column-bg');
  while(bgs.length) bgs[0].remove();

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add('column-bg');

  for(var i = timeBegin; i <= timeEnd; i++){
    var tick = (timeEnd - timeBegin < 8 || !(i%2))? i%24 : '';
    createAndAppendChild(this.timeColumn,'div',{'class':'hour', 'innerHTML': tick});
    j = i-timeBegin;
    pos = j / (timeEnd - timeBegin) * 100 + '%';
  
    var line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
    line.setAttribute('x1',0);
    line.setAttribute('y1',pos);
    line.setAttribute('x2','100%');
    line.setAttribute('y2',pos);
    line.setAttribute('class',i % 2 ? 'odd' : 'even');
    svg.appendChild(line);
  }

  for(var i = 0; i < this.weekdays.length; i++) {
    if(i < dayEnd) {
      this.weekdays[i].appendChild(i? svg.cloneNode(true) : svg);
      this.weekdays[i].parentElement.classList.remove('hidden');
    }
    else this.weekdays[i].parentElement.classList.add('hidden');
  }

  this.timeBegin = timeBegin;
  this.timeEnd = timeEnd;
  this.dayEnd = dayEnd;
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
        value: plan.name
      },
      {
        tag: 'div',
        class: 'plan-tab-close',
        innerHTML: '&times;'
      }
    ]
  });
  return this.plans.insertBefore(el,this.newPlan);
}

UI.prototype.addContextMenu = function(menu, position) {
  if(this.menu) {
    this.menuOverlay.removeChild(this.menu);
  }

  menu.addEventListener('pointerdown', e => e.stopPropagation());
  this.menuOverlay.classList.add('show');
  this.menuOverlay.appendChild(menu);
  var menuHeight = menu.offsetHeight;
  if(position.y < window.innerHeight - menuHeight)
    menu.style.cssText = `top: ${position.y + window.scrollY}px; left: ${position.x + window.scrollX}px;`;
  else
    menu.style.cssText = `top: ${position.y + window.scrollY - menuHeight}px; left: ${position.x + window.scrollX}px;`;
  this.menu = menu;
}

UI.prototype.hideContextMenu = function() {
  if(this.menu) {
    this.menuOverlay.classList.remove('show');
    this.menuOverlay.removeChild(this.menu);
    this.menu = null;
  }
}

UI.prototype.onPlanContextMenu = function(e, plan) {
  var menu = createHtmlElementTree({
    tag: 'div',
    class: 'context-menu',
    children: [
      {
        tag: 'div',
        innerHTML: 'Novo plano',
        class: 'context-menu-item',
        onclick: e => {state.addPlan(); 
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'div',
        innerHTML: 'Duplicar plano',
        class: 'context-menu-item context-divider',
        onclick: e => {state.copyPlan(plan);}
      },
      {
        tag: 'div',
        innerHTML: 'Remover plano',
        class: 'context-menu-item',
        onclick: e => {state.removePlan(plan);
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'div',
        innerHTML: 'Remover planos à direita',
        class: 'context-menu-item',
        onclick: e => {state.plans.slice(state.plans.indexOf(plan) + 1).forEach(statePlan => state.removePlan(statePlan));
                      this.hideContextMenu(); 
                      e.preventDefault();}
      },
      {
        tag: 'div',
        innerHTML: 'Remover outros planos',
        class: 'context-menu-item',
        onclick: e => {state.plans.slice().forEach(statePlan => {if(statePlan != plan) state.removePlan(statePlan);});
                      this.hideContextMenu(); 
                      e.preventDefault();}
      }
    ]
  });
  this.addContextMenu(menu,{x: e.clientX, y: e.clientY});
  e.preventDefault();
}