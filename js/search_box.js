/*
 * @constructor
 */

function SearchBox(database) {
	var self = this;//TODO captura o estado do sistema na hora da sua criacao

	self.database = database;
	self.searchBox = document.getElementById('search');
	self.searchResultBox = document.getElementById('search-result-box');
	self.overSearchResultBox = false;
	self.selectedLectureIndex = -1;//TODO nome estranho
	self.lecturesSuggestionList = new Array();

	function addLectures(lectures) {
		lectures.forEach(function(lecture) {

			var searchResultLectureInfo = createAndAppendChild(self.searchResultBox, 'div', {
				'class' : 'search-result lecture-info'
				});
			var lectureIndoCode = createAndAppendChild(searchResultLectureInfo, 'div', {
				'class' : 'lecture-info-code',
				'innerHTML' : lecture['code']
				});
			var lectureIndoDescription = createAndAppendChild(searchResultLectureInfo, 'div', {
				'class' : 'lecture-info-description', 
				'innerHTML' : lecture['name']
				});

			
			var addLectureCallback = function() {
				addLecture(lecture);
				searchResultBoxHide();
				self.overSearchResultBox = false;
			}
			searchResultLectureInfo.addEventListener('click', addLectureCallback);
		});
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
		if(!e.key) {
			var keyPress = e.keyCode;
		//	if(!((keyPress >= 65) && (keyPress <= 90)) &&
	//			!((keyPress >= 48) && (keyPress <= 57)) &&
	//			keyPress != 46 && keyPress != 8) { //TODO achar uma maneira melhor do que essa!
	//		return;
	//	}
		} else {
			var keyPress = e.key;
		}

		var suggestionLectures = self.searchResultBox.childNodes;
		var selectedClass = "search-result-selected";
		switch(keyPress) {
			case 27:
			case "Escape":
				searchResultBoxHide();
				return;
			case 40:
			case "ArrowDown":
				if(self.selectedLectureIndex < self.lecturesSuggestionList.length) {
					self.selectedLectureIndex++;
				} else {
					return;
				}
				if(self.selectedLectureIndex > 0) {
					toggleClass(suggestionLectures[self.selectedLectureIndex-1], selectedClass);
				}
				toggleClass(suggestionLectures[self.selectedLectureIndex], selectedClass);
				//self.searchResultBox.scrollTop = self.searchResultBox.scrollHeight;
				return;
			case 38:
			case "ArrowUp":
				if(self.selectedLectureIndex > 0) {
					self.selectedLectureIndex--;
				} else {
					return;
				}
				if(self.selectedLectureIndex < self.lecturesSuggestionList.length) {
					toggleClass(suggestionLectures[self.selectedLectureIndex+1], selectedClass);
				}
				toggleClass(suggestionLectures[self.selectedLectureIndex], selectedClass);
				return;
			case 13:
			case "Enter":
				addLecture(self.lecturesSuggestionList[self.selectedLectureIndex]);
				searchResultBoxHide();
				self.overSearchResultBox = false;
				return;
		}
		self.selectedLectureIndex = -1;// if new key was press, reset for new search

		var fetch = self.searchBox.value;
		removeLecturesSuggestionList();
		if(fetch.length > 0) {
			database.fetchLectureOnDB(fetch);
		}
		self.lecturesSuggestionList = database.sliceObjectDB();
		if(self.lecturesSuggestionList.length > 0) {
			addLectures(self.lecturesSuggestionList);
		}
		searchResultBoxShow();
	}
}










//TODO fazer uma funcao que mexe o scroll de search-result-box
//TODO nao permitir incluir materias ja adicionadas
