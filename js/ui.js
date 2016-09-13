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
  this.createScheduleBox = function(schedule) {
    // Lecture -> Classroom -> Schedule
    var lecture = schedule.parent.parent;
    var scheduleBoxTreeObj = {
        tag: 'div',
        class: ['schedule-box', 'color-' + lecture.color],
        children: [
        {
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


    var hourBegin = parseInt(schedule.timeBegin.substr(0,2), 10);
    var minBegin = parseInt(schedule.timeBegin.substr(3,2), 10);
    var hourEnd = parseInt(schedule.timeEnd.substr(0,2), 10);
    var minEnd = parseInt(schedule.timeEnd.substr(3,2), 10);
    // if the box is too small and can only fit the lecture code inside
    if (((hourEnd - hourBegin)*60 + minEnd - minBegin) <= 60) {
      scheduleBoxTreeObj.children[0].class.push('timespan-mini');
      scheduleBoxTreeObj.children[1].class.push('timespan-mini');
    }

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
          tag: 'input',
          type: 'checkbox',
          class: 'classroom-info-checkbox',
          checked: classroom.selected
        },
        {
          tag: 'div',
          class: 'classroom-code',
          innerHTML: classroom.classroomCode
        },
        {
          tag: 'div',
          class: 'classroom-teacher',
          innerHTML: classroom.teachers.join('<br>')
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
      class: ['lecture-info', 'color-' + lecture.color],
      children: [
        {
          tag: 'div',
          class: 'lecture-info-header',
          children: [
            {
              tag: 'input',
              type: 'checkbox',
              class: 'lecture-info-checkbox',
              checked: lecture.selected
            },
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
              class: 'lecture-info-up',
              children: [
                {
                  tag: 'img',
                  src: 'images/ic_arrow_up.png'
                }
              ]
            },
            {
              tag: 'div',
              class: 'lecture-info-down',
              children: [
                {
                  tag: 'img',
                  src: 'images/ic_arrow_down.png'
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
	
	/**
	 *
	 */
	this.removeLecture = function(lecture) {
		accordion.removeChild(lecture.htmlElement);
		for (var i = 0; i < lecture.classrooms.length; i++) {
			var classroom = lecture.classrooms[i];
			for (var j = 0; j < classroom.schedules.length; j++) {
				var schedule = classroom.schedules[j];
				var day = indexOfDay(schedule.day);
				weekdays[day].removeChild(schedule.htmlElement);
			}
		}
	}

	/**
	 *
	 */
	 this.saveStateOnServer = function(identifier) {
		if (!identifier || identifier == '') {
			//TODO print info about use		
			return;
		}
			var objectJSON = new Object();
			objectJSON = this.copyState(objectJSON);
			objectJSON = JSON.stringify(objectJSON);
			var xobj = new XMLHttpRequest();
			xobj.onreadystatechange = function() {
				if (this.readyState == 4) {
					if (this.status == 200 && this.responseText == "OK") {
						console.log('copiado com sucesso!');
						//TODO print information of succes
					} else {
						console.log('falhou!!');
						//TODO print information about fail
					}
				}
			};
			xobj.open('POST', './php/save.php?identifier=' + encodeURIComponent(identifier), true);
			xobj.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xobj.send('data=' + encodeURIComponent(objectJSON));
	 }

	 /**
	  *
		**/
	 this.copyState = function(object) {
		 object = {
			 'planIndex': state.activePlanIndex,
			 'campus': state.campus,
			 'semester': state.semester,
			 'version': state.version,
			 'plans': new Array()
		 };
		 var plan = new Object();
		 for (var i = 0; i < state.plans.length; i++) {
			 if (state.plans[i].lectures.length == 0) continue;
			 var active = 0;
			 if (i == state.activePlanIndex) {
				 active = 1;
			 }
			 plan = {
				 'activeCombinationIndex': state.plans[i].activeCombinationIndex,/*this value can't be null*/
				 'activePlan': active,
				 'lectures': new Array()
			 };
			 for (var j = 0; j < state.plans[i].lectures.length; j++) {
				 var lecture = new Object();
				 var lectureState = state.plans[i].lectures[j];
				 lecture = {
					 'campus': lectureState.campus,
					 'code': lectureState.code,
					 'color': lectureState.color,
					 'selected': lectureState.selected,
					 'name': lectureState.name,
					 'classrooms': new Array()
				 };
				 for (var k = 0; k < state.plans[i].lectures[j].classrooms.length; k++) {
					 var classroom = new Object();
					 var classroomState = state.plans[i].lectures[j].classrooms[k];
					 classroom = {
						 'data_inicio' : classroomState.data_inicio,
						 'data_fim' : classroomState.data_fim,
						 'alunos_especiais': classroomState.alunos_especiais,
						 'classroomCode': classroomState.classroomCode,
						 'horas_aula': classroomState.horas_aula,
						 'pedidos_sem_vagas': classroomState.pedidos_sem_vagas,
						 'saldo_vagas': classroomState.saldo_vagas,
						 'selected': classroomState.selected,
						 'vagas_ocupadas': classroomState.vagas_ocupadas,
						 'schedules': new Array(),
						 'teachers': classroomState.teachers.slice(0)
					 };
					 for (var l = 0; l < state.plans[i].lectures[j].classrooms[k].schedules.length; l++) {
						 var schedule = new Object();
						 var scheduleState = state.plans[i].lectures[j].classrooms[k].schedules[l];
						 schedule = {
							 'day': scheduleState.day,
							 'timeBegin': scheduleState.timeBegin,
							 'timeEnd': scheduleState.timeEnd
						 };
						 classroom.schedules.push(schedule);
					 }
					 lecture.classrooms.push(classroom);
				 }
				 plan.lectures.push(lecture);
			 }
			 object.plans.push(plan);
		 }
		 return object;
	 }

	 /**
	  *
		**/
	 this.loadJSON = function(pathAndNameOfJSON, callback) {
		 var xobj = new XMLHttpRequest();
		 xobj.overrideMimeType("application/json");
		 xobj.open('GET', pathAndNameOfJSON, true);
		 xobj.onreadystatechange = function() {
			 if(xobj.readyState == 4 && xobj.status == 200) {
				 callback(xobj.responseText);
			 }	
		 };
		 xobj.send(null);
	 }

	 this.loadStateFromServer = function(identifier) {
		if (!identifier || identifier == '') {
			//TODO print info about use		
			return;
		}
		this.loadJSON('data/' + identifier + '.json', function(response) {
				//TODO if identifier not exist show status
				var newState = JSON.parse(response);
				seeksChanges(newState);
				state.delete();
				state = new State(newState);
				localStorage.setItem('state', JSON.stringify(ui.copyState(state)));
			});
	 }
		
	 function tester(obj, objOnDB) { 
		 var keys = Object.keys(obj);
		 for (var i = 0; i < keys.length; i++) {
			 if (typeof(obj[keys[i]]) == 'object' || keys[i] == 'color') {
				 continue;
			 }
			 if (obj[keys[i]] != objOnDB[keys[i]]) {
				 console.log('obj :', obj[keys[i]], ' key: ', keys[i]); 
				 console.log('objOnDB :', objOnDB[keys[i]], ' key: ', keys[i]); 
				 console.log('legal ele percebe que mudou!');
				 obj[keys[i]] = objOnDB[keys[i]];
			 }
		 }
	 }

	 function seeksChanges(state) {
		 for (var i = 0; i < state.plans.length; i++) {
			 for(var j = 0; j < state.plans[i].lectures.length; j++) {
				 var lecture = state.plans[i].lectures[j];
				 database.fetchLectureOnDB(lecture.code);
				 var lectureOnDB = database.sliceObjectDB();
				 lectureOnDB = searchBox.parseDBToLectureFormat(lectureOnDB[0]);
				 tester(lecture, lectureOnDB);
				 tester(lecture.classrooms[0], lectureOnDB.classrooms[0]);
				 for (var k = 0; k < lecture.classrooms[0].schedules.length; k++) {
					 tester(lecture.classrooms[0].schedules[k], lectureOnDB.classrooms[0].schedules[k]);
				 }
				 for (var k = 0; k < lecture.classrooms[0].teachers.length; k++) {
					 tester(lecture.classrooms[0].teachers[k], lectureOnDB.classrooms[0].teachers[k]);
				 }
			 }
		 }
	 }
	
}



//TODO get the absulute path to folders, the implemented way may not work properly
