/**
 * Object interface to manipulate the User Interface objects
 * 
 * @Constructor
 */
function UI() {

  // DOM Objects Reference Variables
  var lectureScheduleColumns = document.getElementsByClassName('column');
  var weekdays = new Array();
  // Ignores i == 0 because it's the time column
  for(var i = 1; i < lectureScheduleColumns.length; i++) {
    weekdays.push(lectureScheduleColumns[i]);
  }
  var accordion = document.getElementById('accordion');

  var labelCount = 0;

  /**
   * Creates a string containing CSS calc() function to correctly position vertically the classroom schedule box
   *
   * @param {Object} classroomSchedule
   * @return {Object} <pre><code>{ positionBegin : <i>string</i>, positionEnd : <i>string</i> }</code></pre>
   */
  function calcPositionForTime(classroomSchedule) {
    var hourBegin = classroomSchedule.begin_time.substr(0,2);
    var minBegin = classroomSchedule.begin_time.substr(3,2);
    var hourEnd = classroomSchedule.end_time.substr(0,2);
    var minEnd = classroomSchedule.end_time.substr(3,2);

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
   *   &ltdiv class="color-box"&gt
   *     &ltspan class="lecture-code"&gtMAC0110&lt/span&gt
   *   &lt/div&gt
   * &lt/div&gt</code></pre>
   *
   * @param {Array} lecture Lecture object
   * @return {Array} classroomBoxesGroups 
   * Groups of boxes representing each schedule/classroom. 
   * Boxes are HTML div objects to be appended on the DOM Tree.
   */
  function createLectureBoxes(lecture, combinationClassroomIndex) {
    var code = lecture.code;
    var classrooms = lecture.classrooms;
    var classroomBoxesGroups = new Array();

    for (var i = 0; i < classrooms.length; i++) {
      var schedule = classrooms[i].schedule;
      var boxes = new Array();
      for (var j = 0; j < schedule.length; j++) {
        var lectureBox = createElementWithAttributes('div', {'class':'lecture'});
        if (i == combinationClassroomIndex) {
          addClass(lectureBox, 'lecture-selected');
        } else {
          addClass(lectureBox, 'lecture-hide');
        }
        var timePosition = calcPositionForTime(schedule[j])
        lectureBox.style.top = timePosition.positionBegin;
        lectureBox.style.height = timePosition.positionEnd;

        createAndAppendChild(lectureBox, 'span', {
          'class': 'timespan',
          'innerHTML': schedule[j].begin_time + ' ' + schedule[j].end_time
        });
        var colorBox = createAndAppendChild(lectureBox, 'div', {'class':'color-box'});
        createAndAppendChild(colorBox, 'span', {
          'class': 'lecture-code',
          'innerHTML': code
        });

        boxes.push(lectureBox);
      }
      classroomBoxesGroups.push(boxes);
    }

    return classroomBoxesGroups;
  }

  /**
   * Creates boxes that represent lecture schedules in the schedule table in this format:
   * 
   * <pre><code>&ltinput type="checkbox" id="lecture-info-01" name="lecture-info"&gt
   * &ltdiv class="lecture-info-header"&gt
   *     &ltlabel for="lecture-info-01"&gt
   *       &ltdiv class="lecture-info-code"&gtMAC0110 -&lt/div&gt
   *       &ltdiv class="lecture-info-description"&gtIntrodução à Análise de Algoritmos&lt/div&gt
   *     &lt/label&gt
   *     &ltdiv class="lecture-delete"&gt&ltimg src="images/ic_close.png" alt=""&gt&lt/div&gt
   * &lt/div&gt</code></pre>
   *
   * @param {String} code
   * @param {String} name
   */
  function createLectureInfoHeaders(code, name) {
    // Creating the header
    var checkboxInput = createElementWithAttributes('input', {
      'type': 'checkbox',
      'id': 'lecture-info-' + labelCount++,
      'name': 'lecture-info'
    });
    var lectureHeader = createElementWithAttributes('div', {'class': 'lecture-info-header'});
    var checkboxLabel = createAndAppendChild(lectureHeader, 'label', {'htmlFor': checkboxInput.id});
    createAndAppendChild(checkboxLabel, 'div', {
      'class': 'lecture-info-code',
      'innerHTML': (code + ' -')
    });
    createAndAppendChild(checkboxLabel, 'div', {
      'class': 'lecture-info-description',
      'innerHTML': ('&nbsp' + name)
    });
    var lectureDelete = createAndAppendChild(lectureHeader, 'div', {'class': 'lecture-delete'});
    createAndAppendChild(lectureDelete, 'img', {'src': 'images/ic_close.png'});

    return {
      input: checkboxInput,
      header: lectureHeader
    }
  }

  /**
   * Creates the body of the lecture info inside lecture explorer. It has this format:
   *
   * <pre><code>&ltdiv class="lecture-classrooms"&gt
   *     &ltdiv class="classrooms-header"&gt
   *         &ltdiv class="classroom-number"&gtTurma&lt/div&gt
   *         &ltdiv class="classroom-teacher"&gtProfessor&lt/div&gt
   *         &ltdiv class="classroom-toggle"&gt+&lt/div&gt
   *     &lt/div&gt
   *     &ltinput type="radio" id="classroom-01" name="classroom-lecture-10"&gt
   *     &ltlabel class="classroom" for="classroom-01"&gt
   *         &ltdiv class="classroom-number"&gtN1&lt/div&gt
   *         &ltdiv class="classroom-teacher"&gtNome do Professor&lt/div&gt
   *         &ltdiv class="classroom-toggle"&gt+&lt/div&gt
   *     &lt/label&gt
   *     &ltinput type="radio" id="classroom-31" name="classroom-lecture-10"&gt
   *     &ltlabel ...
   *     &lt/label&gt
   * &lt/div&gt</pre></code>
   *
   * @param {Array} classrooms
   * @param {Number} combinationClassroomIndex
   * @return {Object} {div : HTML Element, classroomsDivs : Array}
   */
  function createLectureInfoBody(classrooms, combinationClassroomIndex) {
    var lectureClassrooms = createElementWithAttributes('div', {'class': 'lecture-classrooms'});
    var classroomHeader = createAndAppendChild(lectureClassrooms, 'div', {'class': 'classrooms-header'});
    createAndAppendChild(classroomHeader, 'div', {
      'class': 'classroom-number',
      'innerHTML': 'Turma'
    });
    createAndAppendChild(classroomHeader, 'div', {
      'class': 'classroom-teacher',
      'innerHTML': 'Professor'
    });
    createAndAppendChild(classroomHeader, 'div', {
      'class': 'classroom-toggle',
      'innerHTML': '+'
    });

    var classroomsDivs = new Array();

    var radioInputName = 'classroom-lecture-' + labelCount++;
    for (var i = 0; i < classrooms.length; i++) {
      var radioInput = createAndAppendChild(lectureClassrooms, 'input', {
        'type': 'radio',
        'id': 'classroom-' + labelCount++,
        'name': radioInputName
      });
      var radioLabel = createAndAppendChild(lectureClassrooms, 'label', {
        'class': 'classroom',
        'htmlFor': radioInput.id
      });
      createAndAppendChild(radioLabel, 'div', {
        'class': 'classroom-number',
        'innerHTML': classrooms[i].code
      });

      // junta os nomes de professores de todos os dias (ordenados da forma como recebeu)
      var teachers = new Array();
      var schedule = classrooms[i].schedule;
      if (schedule) {
        for (var j = 0; j < schedule.length; j++) {
          teachers = teachers.concat(schedule[j].teacher);
        }
        teachers = removeDuplicates(teachers);
      }

      createAndAppendChild(radioLabel, 'div', {
        'class': 'classroom-teacher',
        'innerHTML': teachers.join('<br>')
      });
      createAndAppendChild(radioLabel, 'div', {
        'class': 'classroom-toggle',
        'innerHTML': '+'
      });

      if (i == combinationClassroomIndex) {
        radioInput.checked = 'checked';
      }

      classroomsDivs.push(radioLabel);
    }

    return {
      div: lectureClassrooms,
      classroomsDivs: classroomsDivs
    }
  }

  /**
   * Creates the Info section of a lecture, inside lecture explorer.
   *
   * @param {Object} lecture
   * @param {Number} combinationClassroomIndex
   */
  function createLectureInfo(lecture, combinationClassroomIndex) {
    var lectureInfo = createElementWithAttributes('div', {'class':'lecture-info'});

    var headers = createLectureInfoHeaders(lecture.code, lecture.name);
    lectureInfo.appendChild(headers.input);
    lectureInfo.appendChild(headers.header);

    var body = createLectureInfoBody(lecture.classrooms, combinationClassroomIndex);
    lectureInfo.appendChild(body.div);

    return { 
      div: lectureInfo,
      classroomsDivs: body.classroomsDivs
    };
  }

  /**
   * This function exists to preserve the value of i when the callback is created for when it's called.
   * <br>
   * See <a href="http://stackoverflow.com/questions/750486/javascript-closure-inside-loops-simple-practical-example">
   * this Stack Overflow question</a>.
   *
   * @param {Number} i
   * @param {Array} lectureBoxes
   */
  function createShowBoxCallback(i, lectureBoxes) {
    return function() {
      for (j = 0; j < lectureBoxes.length; j++) {
        for (k = 0; k < lectureBoxes[j].length; k++) {
          if (i == j) {
            removeClass(lectureBoxes[j][k], 'lecture-hide');
          } else {
            addClass(lectureBoxes[j][k], 'lecture-hide');
          }
        }
      }
    }
  }

  /**
   * This function exists to preserve the value of i when the callback is created for when it's called.
   * <br>
   * See <a href="http://stackoverflow.com/questions/750486/javascript-closure-inside-loops-simple-practical-example">
   * this Stack Overflow question</a>.
   *
   * @param {Number} i
   * @param {Array} lectureBoxes
   */
  // 'i' isn't used anymore, also this function could be not anonymous, directly declared
  function createHideBoxCallback(i, lectureBoxes) {
    return function() {
      for (j = 0; j < lectureBoxes.length; j++) {
        for (k = 0; k < lectureBoxes[j].length; k++) {
          if (hasClass(lectureBoxes[j][k], 'lecture-selected')) {
            removeClass(lectureBoxes[j][k], 'lecture-hide');
          } else {
            addClass(lectureBoxes[j][k], 'lecture-hide');
          }
        }
      }
    }
  }

  /**
   * This function exists to preserve the value of i when the callback is created for when it's called.
   * <br>
   * See <a href="http://stackoverflow.com/questions/750486/javascript-closure-inside-loops-simple-practical-example">
   * this Stack Overflow question</a>.
   *
   * @param {Number} i
   * @param {Array} lectureBoxes
   */
  function createUpdateSelectedCallback(i, lectureBoxes) {
    return function() {
      console.log('createShowBoxCallBack', i, lectureBoxes[i]);
      for (j = 0; j < lectureBoxes.length; j++) {
        for (k = 0; k < lectureBoxes[j].length; k++) {
          if (i == j) {
            addClass(lectureBoxes[j][k], 'lecture-selected');
          } else {
            removeClass(lectureBoxes[j][k], 'lecture-selected');
          }
        }
      }
    }
  }

  /**
   * Bind hover and click events between boxes and infos for one lecture.
   *
   * @param {Object} lectureInfo Classroom divs and whole "lecture info div".
   * @param {Array} lectureBoxes HTML div elements representing each box.
   */
  function bindEvents(lectureInfo, lectureBoxes) {
    var classroomsDivs = lectureInfo.classroomsDivs;
    for (var i = 0; i < classroomsDivs.length; i++) {
      showBoxCallback = createShowBoxCallback(i, lectureBoxes);
      classroomsDivs[i].addEventListener('mouseover', showBoxCallback);
      hideBoxCallback = createHideBoxCallback(i, lectureBoxes);
      classroomsDivs[i].addEventListener('mouseout', hideBoxCallback);
      updateSelectedCallback = createUpdateSelectedCallback(i, lectureBoxes);
      classroomsDivs[i].addEventListener('click', updateSelectedCallback);
    }

    var highlightCallback = function() {
      for (var i = 0; i < lectureBoxes.length; i++) {
        for (j = 0; j < lectureBoxes[i].length; j++) {
          toggleClass(lectureBoxes[i][j], 'lecture-highlight');
        }
      }
    }

    lectureInfo.div.addEventListener('mouseover', highlightCallback);
    lectureInfo.div.addEventListener('mouseout', highlightCallback);
  }

  /**
   * Adds a lecture to the User Interface
   *
   * @param {Object} lecture Lecture object.
   * @param {Number} combinationClassroomIndex Index of the set classroom, the one for this combination scheme.
   */
  this.addLecture = function(lecture, combinationClassroomIndex) {
    if (!lecture.classrooms[combinationClassroomIndex].selected) {
      console.log('Inside addLecture(): combinationClassroomIndex doesn\'t refer to a selected classroom.');
      console.log('lecture', lecture, 'combinationClassroomIndex', combinationClassroomIndex);
      var i;
      for (i = 0; i < lecture.classrooms.length; i++) {
        console.log('class selected', lecture.classrooms[i].selected);
        if (lecture.classrooms[i].selected) {
          combinationClassroomIndex = i;
          break;
        }
      }
      if (i == lecture.classrooms.length) {
        console.log('Inside addLecture(): no classroom selected. Returning without adding this lecture.');
        return;
      }
    }

    var lectureInfo = createLectureInfo(lecture, combinationClassroomIndex);
    var lectureBoxes = createLectureBoxes(lecture, combinationClassroomIndex);
    console.log('lectureBoxes', lectureBoxes, 'lectureInfo', lectureInfo);

    // classrooms and boxes are created iterating over 'lecture'
    // so they have the same order of information and we just have
    // to bind them (their events) in the same order
    bindEvents(lectureInfo, lectureBoxes);
    
    // Appending to the DOM Tree
    accordion.appendChild(lectureInfo.div);
    for (var i = 0; i < lecture.classrooms.length; i++) {
      var schedule = lecture.classrooms[i].schedule;
      for (var j = 0; j < schedule.length; j++) {
        var day = indexOfDay(schedule[j].day);
        weekdays[day].appendChild(lectureBoxes[i][j]);
      }
    }
  }

}

var ui = new UI();

var lectureEx = {
  code: 'MAC0110',
  name: 'Introdução à Análise de Algoritmos',
  classrooms: [
    {
      code: '2016145',
      start_date: '01/02/2016',
      end_date: '10/07/2016',
      type: 'obrigatoria',
      selected: 1,
      schedule: [
        {
          day: 'qua',
          begin_time: '08:00',
          end_time: '09:40',
          teacher: ['Professor Objeto Completo', 'Petrisson 2 oqueoque']
        },
        {
          day: 'sex',
          begin_time: '10:00',
          end_time: '11:40',
          teacher: ['Professor Objeto Completo']
        }
      ],
      num_vacancies: [
        // ...
      ]
    },
    {
      code: '2016143',
      start_date: '01/02/2016',
      end_date: '10/07/2016',
      type: 'obrigatoria',
      selected: 1,
      schedule: [
        {
          day: 'ter',
          begin_time: '10:00',
          end_time: '11:40',
          teacher: ['Professor Farta Completo', 'Professor Farta Muito']
        },
        {
          day: 'qui',
          begin_time: '17:10',
          end_time: '18:00',
          teacher: ['Professor Farta Completo']
        }
      ],
      num_vacancies: [
        // ...
      ]
    },
    {
      code: '2016143',
      start_date: '01/02/2016',
      end_date: '10/07/2016',
      type: 'obrigatoria',
      selected: 1,
      schedule: [
        {
          day: 'sex',
          begin_time: '10:50',
          end_time: '11:35',
          teacher: ['Professor Farta Completo']
        },
        {
          day: 'sex',
          begin_time: '08:00',
          end_time: '09:40',
          teacher: ['Professor Farta Completo']
        }
      ],
      num_vacancies: [
        // ...
      ]
    }
  ]
}

// TODO dividir createLectureInfoBody e criar createLectureInfoClassroom

// TODO fazer script pra descobrir se existe schedule com objetos com professores diferentes!
//  profA leciona segundas, profB leciona quartas-feiras

// TODO trocar classrooms por lclasses
//  classroom por lclass, meaning lecture-class, ou pclass for 'private' ou mclass for 'my'

// TODO func bindEvents(): atualmente recebe uma lista de boxes e outra de classroomInfos
//  e cria os event handlers para cada par relacionado. Verificar se é possível receber um único par
//  e loopar em volta da função, assim "fica mais limpo"? Teria que ser chamada na criação dos elementos?
//  A função perderia a característica intrínseca
//  de assumir que as duas listas estão na mesma ordem e já guardaríamos a referencia destes objetos no
//  variavel State, acho que faz mais sentido.

// TODO mudar classe lecture-info-description para lecture-info-name, alterar no html e no sass

// TODO mudar classroom-lecture-xx para lecture-classroom-xx. Vai precisar mudar no sass tudo lá, 
//  verificar se ja nao é usado esse nome.

// TODO verificar se o State guarda os dias ordenados cronologicamente

// TODO melhorar os logs, e marcar locais que lidam com erros, como o inicio da UI -> addLecture().
//  #ifdefined, ou só um condicional if, mas criar uma forma de compilar com e sem logs, console output,
//  mensagens de verificação de erros (essas sempre devem aparecer? quais sim, quais não?), etc.

// TODO definir quais tipos colocaremos dentro das chaves em '@param {Type} nomeDoParam Definicao do parametro'
//  Usaremos 'Object' genérico ou criamos objetos (e.g. Lecture, Classroom) e colocamos @param {Lecture}?
//  Então, colocar descrições dos objetos e referencias deles quando forem citados

// TODO documentar os @return com o modelo em calcPositionForTime()

/*

TODO <<=====================================================================================================================

- 
- verificar conflito de matérias
- verificar conflito de turmas e criar classe para pintar de acordo
- refatorar codigo onde possivel, criar outros arquivos?
  - separar criacao dos elementos e configuracao de handlers dos eventos

*/





