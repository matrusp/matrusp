/**
 * A singleton class representing the state.
 * 
 * @Constructor
 *
 * @example
 *  var stateExemple = {
 *    version: 5,
 *    campus: "TODOS",
 *    semester: "20162",
 *    planIndex: 0,
 *    plans: [{@link Plan()}]
 *  }
 *
 * @see Plan
 */
function State(jsonObj) {
  this.plans = new Array();
  if (jsonObj) {
    this.version = jsonObj.version;
    this.campus = jsonObj.campus;
    this.semester = jsonObj.semester;
    this.activePlanIndex = jsonObj.planIndex;
    for (var i = 0; i < 3; i++) {
      if (i == this.activePlanIndex) {
        var isActivePlan = true;
        this.plans.push(new Plan(jsonObj.plans[i], i, isActivePlan));
      } else {
        this.plans.push(new Plan(jsonObj.plans[i], i));
      }
    }
    // TODO this is a hack to update the combination index and total combination number
    // ui below div#lecture-schedule
    if (this.plans[this.activePlanIndex].lectures.length == 0) {
      document.getElementById('combination-value').innerHTML = '0/0';
    } else {
      this.plans[this.activePlanIndex].setActiveCombination();
    }
  } else {
    this.version = null;
    this.campus = null;
    this.semester = null;
    this.activePlanIndex = null;
  }
}

State.prototype.delete = function() {
	 while (this.plans.length) {
		this.plans[0].delete();
	}
}

/**
 * Adds a lecture to the current active plan if no planIndex was given.
 *
 * @param {Lecture} lecture
 * @param {Number} [planIndex]
 */
State.prototype.addLecture = function(lecture, planIndex) {
  if (!planIndex) {
    planIndex = this.activePlanIndex;
  }
  this.plans[planIndex].addLecture(lecture);
};

State.prototype.nextCombination = function() {
  this.plans[this.activePlanIndex].nextCombination();
}

State.prototype.previousCombination = function() {
  this.plans[this.activePlanIndex].previousCombination();
}

/**
 * Full State example
 * 
 * @return {@link State}
 *
 * @example
 *  var stateExemple = {
 *    version: 5,
 *    campus: "TODOS",
 *    semester: "20162",
 *    planIndex: 0,
 *    plans: [
 *      {
 *        combination: 1,
 *        active: 1,
 *        lectures: [
 *          {
 *            code: "SCC0502",
 *            name: "Algoritmos e Estruturas de Dados I",
 *            color: "lightblue",
 *            campus: "TODOS",
 *            selected: 1,
 *            classrooms: [
 *              {
 *                classroomCode: "43",
 *                selected: 1,
 *                horas_aula: 0,
 *                vagas_ofertadas: 0,
 *                vagas_ocupadas: 0,
 *                alunos_especiais: 0,
 *                saldo_vagas: 0,
 *                pedidos_sem_vaga: 0,
 *                teachers: [
 *                  "First Guy",
 *                  "Second Son",
 *                  "third Weird"
 *                ],
 *                schedules: [
 *                  {
 *                    day: "qua",
 *                    timeBegin: "19:00",
 *                    timeEnd: "20:40",
 *                    htmlElement: div.schedule-box
 *                  }
 *                ],
 *                htmlElement: div.classroom-info
 *              }
 *            ],
 *            htmlElement: div.lecture-info
 *          }
 *        ], 
 *        htmlElement: document.createElement('div'), // só existirá com o design finalizado
 *        htmlElementCombinations: [
 *          document.createElement('div'), // só existirá com o design finalizado
 *        ]     
 *      }
 *    ]
 *  }
 */
State.prototype.fullExample = function() {
  var stateExample = {
    version: 5,
    campus: "TODOS",
    semester: "20162",
    planIndex: 0,
    plans: [ // Array of Plano()s
      {
        combinations: 1,
        active: 1,
        lectures: [ // Array of Lecture()s
          {
            code: "SCC0502",
            name: "Algoritmos e Estruturas de Dados I",
            color: "lightblue",
            campus: "TODOS",
            selected: 1,
            classrooms: [ // Array of Classroom()s
              {
                classroomCode: "43",
                horas_aula: 0,
                vagas_ofertadas: 0,
                vagas_ocupadas: 0,
                alunos_especiais: 0,
                saldo_vagas: 0,
                pedidos_sem_vaga: 0,
                selected: 1,
                teachers: [
                  "First Guy",
                  "Second Son",
                  "third Weird"
                ],
                schedules: [ // Array of Schedule()s
                  {
                    day: "seg",
                    timeBegin: "21:00",
                    timeEnd: "22:40",
                    htmlElement: document.createElement('div') // div.classroom-schedule-box
                  },
                  {
                    day: "qua",
                    timeBegin: "19:00",
                    timeEnd: "20:40",
                    htmlElement: document.createElement('div') // div.classroom-schedule-box
                  },

                ],
                htmlElement: document.createElement('div') // input + label.classroom OU (um novo container) div.classroom-info
              }
            ],
            htmlElement: document.createElement('div') // div.lecture-info
          }
        ],
        htmlElement: document.createElement('div'), // só existirá com o design finalizado
        htmlElementCombinations: [
          document.createElement('div'), // só existirá com o design finalizado
        ]
      }
    ]
  }

  return stateExample;
};











