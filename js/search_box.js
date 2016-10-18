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

}


SearchBox.prototype.addLectures = function(lectures) {
	var suggestionLectures = this.searchResultBox.childNodes;
	for(var i = 0; i < lectures.length; i++) {

		var searchResultLectureInfo = createAndAppendChild(this.searchResultBox, 'div', {
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

SearchBox.prototype.toggleSearchResultBox = function() {
	this.overSearchResultBox = !this.overSearchResultBox;
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
	this.removeLecturesSuggestionList();
	if(fetchValue.length > 0) {
		database.fetchLectureOnDB(fetchValue);
		this.lecturesSuggestionList = database.sliceObjectDB();
		if(this.lecturesSuggestionList.length > 0) {
			this.addLectures(this.lecturesSuggestionList);
			this.searchResultBox.style.visibility = 'visible';
		} else {
			this.searchResultBox.style.visibility = 'hidden';
			this.overSearchResultBox = false;
		}
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

SearchBox.prototype.add = function(lecture, activePlan) {
	var numberOfLectures = activePlan.lectures.length;
	for (var i = 0; i < activePlan.lectures.length; i++) {
		if (lecture.code == activePlan.lectures[i].code) {
			this.hideSearchBox();
			return;
		}
	}

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
	this.searchResultBox.addEventListener('mouseover', this.toggleSearchResultBox.bind(this));
	this.searchResultBox.addEventListener('mouseout', this.toggleSearchResultBox.bind(this));
	this.searchBox.addEventListener('keyup', this.eventKey.bind(this));
}

//TODO refatorar if elses da funcao searchBox.onkeyup
//TODO refatorar funcoes
