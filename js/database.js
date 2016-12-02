/*
 * @constructor
 */

function Database() {
	this.db = new Object();
	this.currDB = new Object();//Needed because I don't have reference to semester inside of function fetchLectureOnDB

	function changingSpecialCharacters(word) {
		return word.toUpperCase()
			.replace(/[ÀÁÂÃÄÅ]/g, "A")
			.replace(/Ç/g, "C")
			.replace(/[ÈÉÊË]/g, "E")
			.replace(/[ÌÎÍÏ]/g, "I")
			.replace(/Ð/g, "D")
			.replace(/Ñ/g, "N")
			.replace(/[ÒÓÔÕÖØ]/g, "O")
			.replace(/[ÙÚÛÜ]/g, "U")
			.replace(/Ý/g, "Y")
			.replace(/ß/g, "B");
	}

	function calcScore(haystack, needle, value) {
		needle.lastIndex = 0;
		var tmp = haystack.match(needle);
		if(tmp === null) return 0;

		return tmp.length * value;
	}

	this.fetchLectureOnDB = function(word) {
		word = changingSpecialCharacters(word);

		var searchWholeString = new Array;
		var searchPartialString = new Array;
		word.split(" ").forEach(function(character) {
				if(character != "") {
				searchWholeString.push(new RegExp("\\b" + character + "\\b", "g"));
				searchPartialString.push(new RegExp(character, "g"));
				}
				});

		this.result = new Array;
		for(var code in this.currDB) {
			var haystack = this.currDB[code];
			var exactly = false;
			var score = 0;
			for(var i = 0; i < searchWholeString.length; i++) {
				var tmpScore = 0;
				searchWholeString[i].lastIndex = 0;
				if(searchWholeString[i].test(haystack.code)) {
					exactly = true;
					break;
				}

				var nameWithoutSpecialChar =  changingSpecialCharacters(haystack.name);
				tmpScore += calcScore(nameWithoutSpecialChar, searchWholeString[i], 100);
				tmpScore += calcScore(nameWithoutSpecialChar, searchPartialString[i], 10);
				tmpScore += calcScore(haystack.code, searchPartialString[i], 10);

				if(tmpScore) {
					score += tmpScore;
				}	else {
					score = 0;
					break;
				}
			}

			if(exactly) {
				this.result = [haystack];
				break;
			}
			if(score) {
				haystack.score = score;
				this.result.score = score;
				this.result.push(haystack);
			}
		}

		this.result.sort(function(first, second) {
			return second.score - first.score;
		});
		this.result.forEach(function(t) {
			delete t.score;
		});
	}


	this.loadDB = function(pathAndNameOfJSON, semester) {
		var self = this;
		ui.loadJSON(pathAndNameOfJSON, function(response) {
				var myJSON = JSON.parse(response);

				self.db[semester] = new Object();
				for(var campus in myJSON) {
				self.db[semester][campus] = new Object();
				myJSON[campus].forEach(function(description) {
						var lecture = new Object();
						lecture = {
						'code' : description[0],
						'name' : description[1],
						'selected': 1,
						'campus' : 'TODOS',
						'classrooms' : new Array()
						};
						description[2].forEach(function(specifications) {
								var specification = new Object();
								specification = {
								'classroomCode' : new Array(),
								'data_inicio' : specifications[1],
								'data_fim' : specifications[2],
								'type' : specifications[3],
								'selected' : 1,
								'alunos_especiais' : 0,
								'horas_aula' : 0,
								'pedidos_sem_vaga' : 0,
								'saldo_vagas' : 0,
								'vagas_ocupadas' : 0,
								'teachers' : new Array(),
								'schedules' : new Array()
								};
								specification.classroomCode.push(specifications[0].replace(/.{5}/, ''));
								if(specifications[4] != null) {
								specifications[4].forEach(function(schedules) { //TODO verificar se os parametros nao sao nulls
										var schedule = new Object();
										schedule = {
										'day' : schedules[0],
										'timeBegin' : schedules[1],
										'timeEnd' : schedules[2],
										};
										if (schedules[3] == "" || schedules == null) {
											schedules[3] = 'Não disponibilizado pelo JupiterWeb';
										}
										specification.teachers.push(schedules[3]);
										specification.schedules.push(schedule);
										});
								} else {
									specification.teachers.push('Não disponibilizado pelo JupiterWeb');
								}
								//specification.numVacancies = specifications[5];
								// specifications[5] contains information about number
								// of vacancies
								lecture.classrooms.push(specification);
						});
						searchBox.aggregateAndSortLectures(lecture);
						self.db[semester][campus][lecture.code] = lecture;
				});
				}
				self.currDB = self.db[semester][campus];
		});
	}

	this.sliceObjectDB= function() {
		return this.result.slice(0, 100);
	}
}













