/**
 * Object interface to manipulate the User Interface objects
 * 
 * @Constructor
 */
function UI() {
  // DOM Objects Reference Variables
  // ===============================
  var accordion = document.getElementById('accordion');
  var weekdays = new Array();
  // Ignores i == 0 because it's the time column
  var lectureScheduleColumns = document.getElementsByClassName('column');
  for(var i = 1; i < lectureScheduleColumns.length; i++) {
    weekdays.push(lectureScheduleColumns[i]);
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
  function calcPositionForTime(schedule) {
    var hourBegin = schedule.timeBegin.substr(0,2);
    var minBegin = schedule.timeBegin.substr(3,2);
    var hourEnd = schedule.timeEnd.substr(0,2);
    var minEnd = schedule.timeEnd.substr(3,2);

    positionBegin = 'calc((100% / 18) * (' + hourBegin + ' + (' + minBegin + ' / 60) - 6) + 1px)';
    positionEnd = 'calc((100% / 18) * (' + hourEnd + ' - ' + hourBegin + ' - 1 + (60 - ' + minBegin + ') / 60 + ' + minEnd + ' / 60) + 1px)'; 

    return { 
      positionBegin, 
      positionEnd 
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
  this.createScheduleBox = function(schedule, lectureCode) {
    var scheduleBoxTreeObj = {
        tag: 'div',
        class:'schedule-box',
        children: [
        {
          tag: 'span',
          class: 'timespan',
          innerHTML: schedule.timeBegin + ' ' + schedule.timeEnd
        },
        {
          tag: 'span',
          class: 'lecture-code',
          innerHTML: lectureCode
        }
      ]
    };

    var scheduleBox = createHtmlElementTree(scheduleBoxTreeObj);

    var timePosition = calcPositionForTime(schedule);
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
  this.createClassroomInfo = function(classroom, lectureCode) {
    var classroomInfoTreeObj = {
      tag: 'div',
      class: 'classroom-info',
      children: [
        {
          tag: 'div',
          class: 'classroom-code',
          innerHTML: classroom.classroomCode
        },
        {
          tag: 'div',
          class: 'classroom-teacher',
          innerHTML: classroom.teachers.join('<br>')
        },
        {
          tag: 'div',
          class: 'classroom-toggle',
          innerHTML: 'x'
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
  this.createLectureInfo = function(lecture) {
    var lectureInfoTreeObj = {
      tag: 'div',
      class: 'lecture-info',
      children: [
        {
          tag: 'div',
          class: 'lecture-info-header',
          children: [
            {
              tag: 'div',
              class: 'lecture-info-header-title',
              children: [
                {
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
              class: 'lecture-info-delete',
              children: [
                {
                  tag: 'img',
                  src: 'images/ic_close.png'
                }
              ]
            }
          ]
        },
        {
          tag: 'div',
          class: 'lecture-classrooms',
          children: [
            {
              tag: 'div',
              class: 'classrooms-header',
              children: [
                {
                  tag: 'div',
                  class: 'classroom-code',
                  innerHTML: 'Turma'
                },
                {
                  tag: 'div',
                  class: 'classroom-teacher',
                  innerHTML: 'Professor'
                },
                {
                  tag: 'div',
                  class: 'classroom-toggle',
                  innerHTML: 'x'
                }
              ]
            }
          ]
        }
      ]
    }

    var lectureInfo = createHtmlElementTree(lectureInfoTreeObj);
    return lectureInfo;
  }

  /**
   *
   */
  this.addLecture = function(lecture) {
    accordion.appendChild(lecture.htmlElement);
    for (var i = 0; i < lecture.classrooms.length; i++) {
      var classroom = lecture.classrooms[i];
      for (var j = 0; j < classroom.schedules.length; j++) {
        var schedule = classroom.schedules[j];
        var day = indexOfDay(schedule.day);
        weekdays[day].appendChild(schedule.htmlElement);
      }
    }
  }
}
