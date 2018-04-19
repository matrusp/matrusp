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

  this.weekdays = new Array();
  // Ignores i == 0 because it's the time column
  this.lectureScheduleColumns = document.getElementsByClassName('column');
  for (var i = 1; i < this.lectureScheduleColumns.length; i++) {
    this.weekdays.push(this.lectureScheduleColumns[i]);
  }

  document.getElementById('msg-banner-close').addEventListener('click', () => this.closeBanner());

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
    var hourBegin = schedule.timeBegin.substr(0, 2);
    var minBegin = schedule.timeBegin.substr(3, 2);
    var hourEnd = schedule.timeEnd.substr(0, 2);
    var minEnd = schedule.timeEnd.substr(3, 2);

    positionBegin = 'calc((100% / 18) * (' + hourBegin + ' + (' + minBegin + ' / 60) - 6) + 1px)';
    positionEnd = 'calc((100% / 18) * (' + hourEnd + ' - ' + hourBegin + ' - 1 + (60 - ' + minBegin + ') / 60 + ' + minEnd + ' / 60) + 1px)';

    return {
      'positionBegin': positionBegin,
      'positionEnd': positionEnd
    };
  }
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
        innerHTML: schedule.timeBegin
      },
      {
        tag: 'span',
        class: ['timespan', 'timespan-end'],
        innerHTML: schedule.timeEnd
      },
      {
        tag: 'span',
        class: 'lecture-code',
        innerHTML: lecture.code
      }
    ]
  };


  var hourBegin = parseInt(schedule.timeBegin.substr(0, 2), 10);
  var minBegin = parseInt(schedule.timeBegin.substr(3, 2), 10);
  var hourEnd = parseInt(schedule.timeEnd.substr(0, 2), 10);
  var minEnd = parseInt(schedule.timeEnd.substr(3, 2), 10);
  // if the box is too small and can only fit the lecture code inside
  if (((hourEnd - hourBegin) * 60 + minEnd - minBegin) <= 60) {
    scheduleBoxTreeObj.children[0].class.push('timespan-mini');
    scheduleBoxTreeObj.children[1].class.push('timespan-mini');
  }

  var scheduleBox = createHtmlElementTree(scheduleBoxTreeObj);

  var timePosition = this.calcPositionForTime(schedule);
  scheduleBox.style.top = timePosition.positionBegin;
  scheduleBox.style.height = timePosition.positionEnd;

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
            class: 'lecture-info-header-title',
            children: [{
                tag: 'div',
                class: 'lecture-info-code',
                innerHTML: lecture.code
              },
              {
                tag: 'div',
                class: 'lecture-info-name',
                innerHTML: lecture.name
              }
            ]
          },
          {
            tag: 'div',
            class: 'lecture-info-up',
            children: [{
              tag: 'img',
              src: 'images/ic_arrow_up.png'
            }]
          },
          {
            tag: 'div',
            class: 'lecture-info-down',
            children: [{
              tag: 'img',
              src: 'images/ic_arrow_down.png'
            }]
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
    width: 90,
    height: 90
  };

  var combinationBoard = createHtmlElementTree(combinationBoardTreeObj);
  var ctx = combinationBoard.getContext('2d');
  var columnHeight = parseInt(window.getComputedStyle(document.getElementById('time-table').getElementsByClassName('column')[0]).getPropertyValue("height"), 10);

  var classrooms = combination.lecturesClassroom;
  for (var i = 0; i < classrooms.length; i++) {
    var classroom = classrooms[i];
    for (var j = 0; j < classroom.schedules.length; j++) {
      var schedule = classroom.schedules[j];
      var day = indexOfDay(schedule.day);

      addClass(schedule.htmlElement, 'schedule-box-highlight');
      var css = window.getComputedStyle(schedule.htmlElement);

      var boxTop = Math.round(parseInt(css.getPropertyValue("top"), 10) / columnHeight * 90);
      var boxHeight = Math.round(parseInt(css.getPropertyValue("height"), 10) / columnHeight * 90);
      var boxLeft = day * 15 + 1;

      ctx.fillStyle = css.getPropertyValue("background-color");
      ctx.fillRect(boxLeft, boxTop, 13, boxHeight);
      ctx.fillStyle = css.getPropertyValue("border-left-color");
      ctx.fillRect(boxLeft, boxTop, 2, boxHeight);

      removeClass(schedule.htmlElement, 'schedule-box-highlight');
    }
  }

  this.combinationTrack.appendChild(combinationBoard);

  return combinationBoard;
}

UI.prototype.scrollActiveCombinationToView = function() {
  if (this.combinationTrack.children.length === 0 || state.activePlanIndex == undefined || state.activePlanIndex == null) return 0;
  var activePlan = state.plans[state.activePlanIndex];
  if (activePlan.activeCombinationIndex == undefined || activePlan.activeCombinationIndex == null) return 1;
  var cc = this.combinationTrack.children[activePlan.activeCombinationIndex];
  var ctw = this.combinationTrack;
  if (cc.offsetLeft < ctw.scrollLeft) {
    ctw.scrollLeft = cc.offsetLeft;
  } else if (cc.offsetLeft + cc.offsetWidth > ctw.scrollLeft + ctw.offsetWidth) {
    ctw.scrollLeft = cc.offsetLeft + cc.offsetWidth - ctw.offsetWidth;
  }
}

/**
 *
 */
UI.prototype.addLecture = function(lecture) {
  this.accordion.appendChild(lecture.htmlElement);
  for (var i = 0; i < lecture.classrooms.length; i++) {
    var classroom = lecture.classrooms[i];
    for (var j = 0; j < classroom.schedules.length; j++) {
      var schedule = classroom.schedules[j];
      var day = indexOfDay(schedule.day);
      if (day < this.weekdays.length)
        this.weekdays[day].appendChild(schedule.htmlElement);
    }
  }
}

/**
 *
 */
UI.prototype.removeLecture = function(lecture) {
  this.accordion.removeChild(lecture.htmlElement);
  for (var i = 0; i < lecture.classrooms.length; i++) {
    var classroom = lecture.classrooms[i];
    for (var j = 0; j < classroom.schedules.length; j++) {
      var schedule = classroom.schedules[j];
      var day = indexOfDay(schedule.day);
      this.weekdays[day].removeChild(schedule.htmlElement);
    }
  }
}

function tester(obj, objOnDB) {
  if (typeof(obj) == 'object') {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      if (typeof(obj[keys[i]]) == 'object' || keys[i] == 'color') {
        continue;
      }
      if (obj[keys[i]] != objOnDB[keys[i]]) {
        //console.log('obj :', obj[keys[i]], ' key: ', keys[i]); 
        //console.log('objOnDB :', objOnDB[keys[i]], ' key: ', keys[i]); 
        //console.log('legal ele percebe que mudou!');
        obj[keys[i]] = objOnDB[keys[i]];
      }
    }
  } else {
    if (obj != objOnDB) {
      //console.log('obj :', obj);
      //console.log('objOnDB :', objOnDB);
      //console.log('percebeu que tava errado!');
      obj = objOnDB;
    }
  }
}

function seeksChanges(state) {
  var plans = state.plans;
  for (var i = 0; i < plans.length; i++) {
    if (plans[i]) {
      var lectures = plans[i].lectures;
      for (var j = 0; j < lectures.length; j++) {
        var lecture = lectures[j];
        database.fetchLectureByCode(lecture.code, {
          success: function(result) {
            Object.assign(lectures[j], result[0]);
          }
        });
      }
    }
  }
}

function shallowCopy(obj) {
  var objC = new Object();
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    if (typeof(obj[keys[i]]) == 'array' || typeof(obj[keys[i]]) == 'object') {} else {
      objC[keys[i]] = obj[keys[i]];
    }
  }
  return objC;
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