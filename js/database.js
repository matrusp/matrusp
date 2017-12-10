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
			.replace(/ß/g, "SS");
	}

	function trigramsFromString(str) {
		var trigrams = new Array();

		str.split(" ").forEach(function(substr) {
			trigrams.push(substr[0] + "#");
			if(substr.length > 2) trigrams.push(substr[0] + substr[1]  + substr[2]  + "!");
			trigrams.push(substr + "$"); //exact word match
		});
			
		for(var i = 0; i < str.length; i++) {
			if(i < str.length - 2)
				trigrams.push(str[i] + str[i+1] + str[i+2]);
			if(str.length < 5) //small words will be treated as acronyms e.g GA, SD
				trigrams.push(str[i] + "#");
		}

		trigrams.push(str + "&"); //exact match
 
		return trigrams;
	}

	this.fetchLectureOnDB = function(word) {
		word = changingSpecialCharacters(word);
		var self = this;
		for(var code in this.currDB) {
			if(code === word) {
				this.result = [self.currDB[code]];
				return;
			}
		}

		var scores = new Object();
		this.result = new Array();

		trigramsFromString(word).forEach(function(trigram) {
			if(self.currDB.trigrams[trigram]) {
				var weight = Math.sqrt(Math.log(self.currDB.trigrams.length/self.currDB.trigrams[trigram].length));

				self.currDB.trigrams[trigram].forEach(function(code) {
					if(!scores[code]) {
						self.result.push(self.currDB[code]);
						scores[code] = 0;
					}
					scores[code] += weight;
				});
			}
		});

		this.result.sort(function(first, second) {
			return scores[second.code] - scores[first.code];
		});
	}


	this.loadDB = function(pathAndNameOfJSON, semester) {
		var self = this;
		ui.loadJSON(pathAndNameOfJSON, function(response) {
				var myJSON = JSON.parse(response);

				self.db[semester] = new Object();
				for(var campus in myJSON) {
				self.db[semester][campus] = new Object();
				self.db[semester][campus].trigrams = new Object();
				self.db[semester][campus].trigrams.length = 0;
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
						self.db[semester][campus][lecture.code] = lecture;

						var trigramList = self.db[semester][campus].trigrams;
						
						trigramsFromString(lecture.code).forEach(function(trigram){
							if(!trigramList[trigram]) trigramList[trigram] = [];
							trigramList[trigram].push(lecture.code);
							trigramList.length++;
						});
						trigramsFromString(changingSpecialCharacters(lecture.name)).forEach(function(trigram){
							if(!trigramList[trigram]) trigramList[trigram] = [];
							trigramList[trigram].push(lecture.code);
							trigramList.length++;
						});
				});
				}
				self.currDB = self.db[semester][campus];
		});
	}

	this.sliceObjectDB= function() {
		return this.result.slice(0, 100);
	}
}













