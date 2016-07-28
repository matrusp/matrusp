/*
 * @constructor
 */

function Database() {
	this.db = new Object();
	this.currDB = new Object();// Necessario porque se não perco a referencia do semestre atual

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
		var self = this;
		word = changingSpecialCharacters(word);

		var searchWholeString = new Array;
		var searchPartialString = new Array;
		word.split(" ").forEach(function(character) {
				if(character != "") {
				searchWholeString.push(new RegExp("\\b" + character + "\\b", "g"));
				searchPartialString.push(new RegExp(character, "g"));
				}
				});

		self.result = new Array;
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
				self.result = [haystack];
				break;
			}
			if(score) {
				haystack.score = score;
				self.result.score = score;
				self.result.push(haystack);
			}
		}

		self.result.sort(function(first, second) {
				return first.score - second.score;
		});
		self.result.forEach(function(t) {
				delete t.score;
		});
	}

	function loadJSON(callback) {
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open('GET', 'db/db_usp.json', true);
		xobj.onreadystatechange = function() {
			if(xobj.readyState == 4 && xobj.status == 200) {
				callback(xobj.responseText);
			}	
		};
		xobj.send(null);
	}

	this.loadDB = function(semester) {
		var self = this;
		loadJSON(function(response) {
				var myJSON = JSON.parse(response);

				self.db[semester] = new Object();
				for(var campus in myJSON) {
				self.db[semester][campus] = new Object();
				myJSON[campus].forEach(function(description) {
						var lecture = new Object();
						lecture = {
						'code' : description[0],
						'name' : description[1],
						'classrooms' : new Array()
						};
						description[2].forEach(function(specifications) {
								var specification = new Object();
								specification = {
								'code' : specifications[0],
								'start_date' : specifications[1],
								'end_date' : specifications[2],
								'type' : specifications[3],
								'schedule' : new Array()
								};
								if(specifications[4] != null) {
								specifications[4].forEach(function(schedules) {
										var schedule = new Object();
										schedule = {
										'day' : schedules[0],
										'begin_time' : schedules[1],
										'end_time' : schedules[2],
										'teacher' : schedules[3]
										};
										specification.schedule.push(schedule);
										});
								}
								specification.numVacancies = specifications[5];
								lecture.classrooms.push(specification);
						});
						self.db[semester][campus][lecture.code] = lecture;
				});
				}
				self.currDB = self.db[semester][campus];
		});
	}

	this.sliceObjectDB= function() {
		return this.result.slice();
	}
}


//TODO verificar se limitar o sliceObjectDB torna a busca mais rapida












