/*
 * @constructor
 */

function SearchBox(state) {
	var self = this;

	self.searchBox = document.getElementById('search');
	self.searchResultBox = document.getElementById('search-result-box');
	self.overSearchResultBox = false;
	self.selectedLectureIndex = -1;
	self.lecturesSuggestionList = new Array();
	self.heightSoFar = 0;

	function addLectures(lectures) {
		var suggestionLectures = self.searchResultBox.childNodes;
		for(var i = 0; i < lectures.length; i++) {

				var searchResultLectureInfo = createAndAppendChild(self.searchResultBox, 'div', {
						'class' : ['search-result', 'lecture-info']
						});
				var lectureIndoCode = createAndAppendChild(searchResultLectureInfo, 'div', {
						'class' : 'lecture-info-code',
						'innerHTML' : lectures[i]['code']
						});
				var lectureIndoDescription = createAndAppendChild(searchResultLectureInfo, 'div', {
						'class' : 'lecture-info-description', 
						'innerHTML' : lectures[i]['name']
						});


				var addLectureCallback = function(iterator) {
					return function() {
						console.log(lectures[iterator]);
						var obj = new Object();
						obj = {
							'code' : lectures[iterator].code,
							'name' : lectures[iterator].name,
							'color' : '1',
							'campus' : 'TODOS',
							'selected' : 1,
							'classrooms' : new Array()
						};
						lectures[iterator].classrooms.forEach(function(classroom) {
								var specification = {
								'classroomCode' : '43',
								'horas_aula' : 0,
								'vaga_ofertadas' : 0,
								'vagas_ocupadas' : 0,
								'alunos_especiais' : 0,
								'saldo_vagas' : 0,
								'pedidos_sem_vaga' : 0,
								'selected' : 1,
								'teachers' : new Array(),
								'schedules' : new Array()
								};
								classroom.schedule.forEach(function(schedules) {
										var schedule = {
										'day' : schedules.day,
										'timeBegin' : schedules.begin_time,
										'timeEnd' : schedules.end_time
										};
										specification.teachers.push(schedules.teacher);
										specification.schedules.push(schedule);
										});
								obj.classrooms.push(specification);
						});
						console.log(obj);
						state.addLecture(obj);
						searchResultBoxHide();
						self.overSearchResultBox = false;
						removeLecturesSuggestionList();
						self.searchBox.value = '';
					}
				}
				searchResultLectureInfo.addEventListener('click', addLectureCallback(i));

				var selectLectureCallback = function(iterator, serachResultLectureInfo) {
					return function() {
						addClass(serachResultLectureInfo, 'search-result-selected');
						if(self.selectedLectureIndex != -1 && serachResultLectureInfo != suggestionLectures[self.selectedLectureIndex]) {
							removeClass(suggestionLectures[self.selectedLectureIndex], 'search-result-selected');
						}
						self.heightSoFar = 0;
						for(var i = 0; i <= iterator; i++) {
							self.heightSoFar += suggestionLectures[i].offsetHeight;
						}
						self.selectedLectureIndex = iterator;
					}
				}
				
				var deselectLectureCallback = function(serachResultLectureInfo) {
					return function() {
						removeClass(serachResultLectureInfo, 'search-result-selected');
					}
				}

				searchResultLectureInfo.addEventListener('mouseenter', selectLectureCallback(i, searchResultLectureInfo));
				searchResultLectureInfo.addEventListener('mouseleave', deselectLectureCallback(searchResultLectureInfo));
		}
	}

	function removeLecturesSuggestionList() {
		while(self.searchResultBox.firstChild) {
			self.searchResultBox.removeChild(self.searchResultBox.firstChild);
		}
	}

	function searchResultBoxShow() {
		self.searchResultBox.style.visibility = "visible";
	}

	function searchResultBoxHide() {
		self.searchResultBox.style.visibility = "hidden";
	}

	self.searchBox.onfocus = function() {
		if(self.searchBox.value) {
			searchResultBoxShow();
		}
	};

	self.searchBox.onblur = function() {
		if(!self.overSearchResultBox) {
			searchResultBoxHide();
		}
	};

	self.searchResultBox.onmouseover = function() {
		self.overSearchResultBox = true;
	};

	self.searchResultBox.onmouseout = function() {
		self.overSearchResultBox = false;
	}

	self.searchBox.onkeyup = function(e) {
		if(!e) {
			e = event;
		}
		keyPress = (e.key) ? e.key : e.keyCode;


		var suggestionLectures = self.searchResultBox.childNodes;
		var sizeOfSearchResultBox = self.searchResultBox.offsetHeight > 300 ? 300 : self.searchResultBox.offsetHeight; //300 is the max-height of div "search-result-box"

		switch(keyPress) {
			case 27:
			case "Escape":
				searchResultBoxHide();
				return;
			case 40:
			case "ArrowDown":
				if(self.selectedLectureIndex < self.lecturesSuggestionList.length-1) {
					self.selectedLectureIndex++;
				} else {
					return;
				}
				if(self.selectedLectureIndex > 0) {
					removeClass(suggestionLectures[self.selectedLectureIndex-1], 'search-result-selected');
				}
				addClass(suggestionLectures[self.selectedLectureIndex], 'search-result-selected');

				if(self.heightSoFar < sizeOfSearchResultBox) {
					if(self.heightSoFar + suggestionLectures[self.selectedLectureIndex].offsetHeight < sizeOfSearchResultBox) {
						self.heightSoFar += suggestionLectures[self.selectedLectureIndex].offsetHeight;
					} else {
						self.heightSoFar += suggestionLectures[self.selectedLectureIndex].offsetHeight;
						self.searchResultBox.scrollTop += self.heightSoFar - sizeOfSearchResultBox;
						self.heightSoFar = sizeOfSearchResultBox;
					} 
				} else {
					self.searchResultBox.scrollTop += suggestionLectures[self.selectedLectureIndex].offsetHeight;
				}
				return;
			case 38:
			case "ArrowUp":
				if(self.selectedLectureIndex > 0) {
					self.selectedLectureIndex--;
				} else {
					return;
				}
				if(self.selectedLectureIndex < self.lecturesSuggestionList.length) {
					removeClass(suggestionLectures[self.selectedLectureIndex+1], 'search-result-selected');
				}
				addClass(suggestionLectures[self.selectedLectureIndex], 'search-result-selected');

				if(self.heightSoFar > 26) { //26 is the minimum height of a suggested lecture
					if(self.heightSoFar - suggestionLectures[self.selectedLectureIndex].offsetHeight > 26) {
						self.heightSoFar -= suggestionLectures[self.selectedLectureIndex].offsetHeight;
					} else {
						self.heightSoFar -= suggestionLectures[self.selectedLectureIndex].offsetHeight;
						self.searchResultBox.scrollTop -= suggestionLectures[self.selectedLectureIndex].offsetHeight - self.heightSoFar;
						self.heightSoFar = suggestionLectures[self.selectedLectureIndex].offsetHeight;
					} 
				} else {
					self.searchResultBox.scrollTop -= suggestionLectures[self.selectedLectureIndex].offsetHeight;
				}
				return;
			case 13:
			case "Enter":
				ui.addLecture(self.lecturesSuggestionList[self.selectedLectureIndex]);
				searchResultBoxHide();
				self.overSearchResultBox = false;
				removeLecturesSuggestionList();
				self.searchBox.value = '';
				return;
		}
		self.selectedLectureIndex = -1;// if new key was press, reset for new search
		self.heightSoFar = 0;
		var fetchValue = self.searchBox.value;
		removeLecturesSuggestionList();
		if(fetchValue.length > 0) {
			database.fetchLectureOnDB(fetchValue);
			self.lecturesSuggestionList = database.sliceObjectDB();
			if(self.lecturesSuggestionList.length > 0) {
				addLectures(self.lecturesSuggestionList);
				searchResultBoxShow();
			} else {
				searchResultBoxHide();
				self.overSearchResultBox = false;
			}
		} else {
			searchResultBoxHide();
			self.overSearchResultBox = false;
		}
	}
}


var searchBox = new SearchBox();



//TODO quando coloca o mouse sobre a div 'search-result-box' perco a referencia da altura que se encontra em relacao ao scroll
//TODO refatorar if elses da funcao searchBox.onkeyup
