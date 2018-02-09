/*
 * @constructor
 */

function SearchBox() {

	this.searchBox = document.getElementById('search');
	this.searchResultBox = document.getElementById('search-result-box');
	this.overSearchResultBox = false; 
	// needed because when mouse is over search-result-box container event listener 'blur' dosen't have act // TODO arrumar esse comentario
	this.selectedLectureIndex = -1;
	this.lecturesSuggestionList = new Array();
	this.heightSoFar = 0;
	this.addEventListeners();

	this.searchWorker = new Worker("js/dbsearch.js");
	this.searchWorker.onmessage = e => {
		this.lecturesSuggestionList = e.data;
		if(this.lecturesSuggestionList.length > 0) {
			this.removeLecturesSuggestionList();
			this.addLectures(this.lecturesSuggestionList);
			this.searchResultBox.style.visibility = 'visible';
		} else {
			this.searchResultBox.style.visibility = 'hidden';
			this.overSearchResultBox = false;
		}
	}
}


SearchBox.prototype.addLectures = function(lectures) {
	var suggestionLectures = this.searchResultBox.childNodes;
	var fragment = document.createDocumentFragment();
	for(var i = 0; i < lectures.length; i++) {

		var searchResultLectureInfo = createAndAppendChild(fragment, 'div', {
				'class' : ['search-result', 'lecture-info']
				});
		var lectureInfoCode = createAndAppendChild(searchResultLectureInfo, 'div', {
				'class' : 'lecture-info-code',
				'innerHTML' : lectures[i]['code']
				});
		var lectureInfoDescription = createAndAppendChild(searchResultLectureInfo, 'div', {
				'class' : 'lecture-info-description', 
				'innerHTML' : lectures[i]['name']
				});


		var addLectureCallback = function(iterator) {
			return function() {
				var activePlan = state.plans[state.activePlanIndex];
				this.add(lectures[iterator], activePlan);
			}
		}

		var selectLectureCallback = function(iterator, serachResultLectureInfo) {
			return function() {
				addClass(serachResultLectureInfo, 'search-result-selected');
				if(this.selectedLectureIndex != -1 && serachResultLectureInfo != suggestionLectures[this.selectedLectureIndex]) {
					removeClass(suggestionLectures[this.selectedLectureIndex], 'search-result-selected');
				}
				this.heightSoFar = 0;
				for(var i = 0; i <= iterator; i++) {
					this.heightSoFar += suggestionLectures[i].offsetHeight;
				}
				this.selectedLectureIndex = iterator;
			}
		}

		var deselectLectureCallback = function(serachResultLectureInfo) {
			return function() {
				removeClass(serachResultLectureInfo, 'search-result-selected');
			}
		}

		searchResultLectureInfo.addEventListener('click', addLectureCallback(i).bind(this));
		searchResultLectureInfo.addEventListener('mouseenter', selectLectureCallback(i, searchResultLectureInfo).bind(this));
		searchResultLectureInfo.addEventListener('mouseleave', deselectLectureCallback(searchResultLectureInfo).bind(this));
	}
	this.searchResultBox.appendChild(fragment);
}

SearchBox.prototype.searchResultBoxShow = function() {
	if(this.searchBox.value) {
		this.searchResultBox.style.visibility = 'visible';
	}
};

SearchBox.prototype.searchResultBoxHide = function() {
	if(!this.overSearchResultBox) {
		this.searchResultBox.style.visibility = 'hidden';
	}
};

SearchBox.prototype.mouseOverSearchResultBox = function() {
	this.overSearchResultBox = true;
};

SearchBox.prototype.mouseOutSearchResultBox = function() {
	this.overSearchResultBox = false;
};

SearchBox.prototype.eventKey = function(e) {
	if(!e) {
		e = event;
	}
	keyPress = (e.key) ? e.key : e.keyCode;


	var suggestionLectures = this.searchResultBox.childNodes;
	var sizeOfSearchResultBox = this.searchResultBox.offsetHeight > 300 ? 300 : this.searchResultBox.offsetHeight; //300 is the max-height of div "search-result-box"

	switch(keyPress) {
		case 27:
		case "Escape":
			this.searchResultBox.style.visibility = 'hidden';
			return;
		case 40:
		case "ArrowDown":
			if(this.selectedLectureIndex < this.lecturesSuggestionList.length-1) {
				this.selectedLectureIndex++;
			} else {
				return;
			}
			if(this.selectedLectureIndex > 0) {
				removeClass(suggestionLectures[this.selectedLectureIndex-1], 'search-result-selected');
			}
			addClass(suggestionLectures[this.selectedLectureIndex], 'search-result-selected');

			if(this.heightSoFar < sizeOfSearchResultBox) {
				if(this.heightSoFar + suggestionLectures[this.selectedLectureIndex].offsetHeight < sizeOfSearchResultBox) {
					this.heightSoFar += suggestionLectures[this.selectedLectureIndex].offsetHeight;
				} else {
					this.heightSoFar += suggestionLectures[this.selectedLectureIndex].offsetHeight;
					this.searchResultBox.scrollTop += this.heightSoFar - sizeOfSearchResultBox;
					this.heightSoFar = sizeOfSearchResultBox;
				} 
			} else {
				this.searchResultBox.scrollTop += suggestionLectures[this.selectedLectureIndex].offsetHeight;
			}
			return;
		case 38:
		case "ArrowUp":
			if(this.selectedLectureIndex > 0) {
				this.selectedLectureIndex--;
			} else {
				return;
			}
			if(this.selectedLectureIndex < this.lecturesSuggestionList.length) {
				removeClass(suggestionLectures[this.selectedLectureIndex+1], 'search-result-selected');
			}
			addClass(suggestionLectures[this.selectedLectureIndex], 'search-result-selected');

			if(this.heightSoFar > 26) { //26 is the minimum height of a suggested lecture
				if(this.heightSoFar - suggestionLectures[this.selectedLectureIndex].offsetHeight > 26) {
					this.heightSoFar -= suggestionLectures[this.selectedLectureIndex].offsetHeight;
				} else {
					this.heightSoFar -= suggestionLectures[this.selectedLectureIndex].offsetHeight;
					this.searchResultBox.scrollTop -= suggestionLectures[this.selectedLectureIndex].offsetHeight - this.heightSoFar;
					this.heightSoFar = suggestionLectures[this.selectedLectureIndex].offsetHeight;
				} 
			} else {
				this.searchResultBox.scrollTop -= suggestionLectures[this.selectedLectureIndex].offsetHeight;
			}
			return;
		case 13:
		case "Enter":
			if (this.lecturesSuggestionList[this.selectedLectureIndex]) { // if no lecture was selected skip
				var lecture = this.lecturesSuggestionList[this.selectedLectureIndex];
				var activePlan = state.plans[state.activePlanIndex];
				this.add(lecture, activePlan);
			}
			return;
	}
	this.selectedLectureIndex = -1;// if new key was press, reset for new search
	this.heightSoFar = 0;
	var fetchValue = this.searchBox.value;
	if(fetchValue.length > 0) {
		this.searchWorker.postMessage(fetchValue);

	} else {
		this.searchResultBox.style.visibility = 'hidden';
		this.overSearchResultBox = false;
	}
}

SearchBox.prototype.hideSearchBox = function() {
	this.searchResultBox.style.visibility = 'hidden';
	this.overSearchResultBox = false;
	this.removeLecturesSuggestionList();
	this.searchBox.value = '';
}

SearchBox.prototype.compareID = function(lectureA, lectureB) {
	if (lectureA.classroomCode > lectureB.classroomCode) {
		return 1;
	}
	if (lectureA.classroomCode < lectureB.classroomCode) {
		return -1;
	}
	return 0;
}

SearchBox.prototype.testFunctionCompareID = function (lectureA, lectureB) {
	var actual = this.compareID (lectureA, lectureB);
	var expected;
	if (lectureA.classroomCode > lectureB.classroomCode) expected = 1;
	if (lectureA.classroomCode < lectureB.classroomCode) expected = -1;
	else expected = 0;
	
	if (actual != expected) return false;
	else return true;
}

SearchBox.prototype.aggregateBySchedule = function(classrooms) {
	for (var i = 0; i < classrooms.length; i++) {
		var schedule1 = classrooms[i].schedules;
		for (var k = i+1; k < classrooms.length; k++) {
			var schedule2 = classrooms[k].schedules;

			if (schedule1.length != schedule2.length) continue;

			var equal = 1;
			for (var j = 0; j < schedule1.length; j++) {
				if (schedule1[j].day != schedule2[j].day ||
						schedule1[j].timeBegin != schedule2[j].timeBegin ||
						schedule1[j].timeEnd != schedule2[j].timeEnd) {
					equal = 0;
					break
				}
			}

			if (equal) {
				classrooms[i].classroomCode.push(classrooms[k].classroomCode[0]);
				for (var j = 0; j < classrooms[k].teachers.length; j++) {
					classrooms[i].teachers.push(classrooms[k].teachers[j]);
				}
				var teste = classrooms.splice(k, 1);
				k--;
			}
		}
	}
}

SearchBox.prototype.aggregateAndSortLectures = function(lecture) {
		lecture.classrooms.sort(this.compareID);
		for (var i = 0; i < lecture.classrooms.length; i++) {
			lecture.classrooms[i].teachers.sort();
		}
		this.aggregateBySchedule (lecture.classrooms);
}

SearchBox.prototype.add = function(lecture, activePlan) {
	var numberOfLectures = activePlan.lectures.length;

	for (var i = 0; i < activePlan.lectures.length; i++) {
		if (lecture.code == activePlan.lectures[i].code) {
			this.hideSearchBox();
			return;
		}
	}

	state.lastColor = state.lastColor % state.colors.length || 0;
	
	lecture['color'] = 1 + state.lastColor++; //colors are 1-based
	state.addLecture(lecture);
	addClass(activePlan.lectures[numberOfLectures].htmlElement, 'lecture-info-plan-active');
	this.hideSearchBox();
}

SearchBox.prototype.removeLecturesSuggestionList = function() {
	while(this.searchResultBox.firstChild) {
		this.searchResultBox.removeChild(this.searchResultBox.firstChild);
	}
}

SearchBox.prototype.addEventListeners = function() {
	this.searchBox.addEventListener('focus', this.searchResultBoxShow.bind(this));
	this.searchBox.addEventListener('blur', this.searchResultBoxHide.bind(this));
	this.searchResultBox.addEventListener('mouseover', this.mouseOverSearchResultBox.bind(this));
	this.searchResultBox.addEventListener('mouseout', this.mouseOutSearchResultBox.bind(this));
	this.searchBox.addEventListener('keyup', this.eventKey.bind(this));
}

