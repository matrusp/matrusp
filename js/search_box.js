/*
 * @constructor
 */

function SearchBox() {

	this.searchBox = document.getElementById('search');
	this.searchResultBox = document.getElementById('search-result-box');
	this.searchOptionsSummary = document.getElementById('search-options-summary');
	this.searchOptionsBox = document.getElementById('search-options');
	this.campusSelect = document.getElementById('search-campus')
	this.unitSelect = document.getElementById('search-unit');
	this.deptSelect = document.getElementById('search-department');
	this.clearButton = document.getElementById('search-options-clear');
	this.timeCheckboxes = [];
	for(var i = 0, checkbox; checkbox = this.searchOptionsBox.elements['timeframes[]'][i]; i++) {
		this.timeCheckboxes.push(checkbox);
	}
	this.overSearchResultBox = false; 
	// needed because when mouse is over search-result-box container event listener 'blur' dosen't have act // TODO arrumar esse comentario
	this.selectedLectureIndex = -1;
	this.lecturesSuggestionList = new Array();
	this.heightSoFar = 0;
	this.addEventListeners();

	this.options = JSON.parse(localStorage.getItem("search-options")) || {};
	this.populateOptions();

	this.searchWorker = new Worker("js/dbsearch.js");
	this.searchWorker.onmessage = e => {
		this.lecturesSuggestionList = e.data;
		if(this.lecturesSuggestionList.length > 0) {
			this.removeLecturesSuggestionList();
			this.addLectures(this.lecturesSuggestionList);
			this.searchResultBox.style.visibility = 'visible';
		} else {
			this.removeLecturesSuggestionList();
			this.addEmptySearchResult();
			this.searchResultBox.style.visibility = 'visible';
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
		createAndAppendChild(searchResultLectureInfo, 'div', {
				'class' : 'lecture-info-title',
				'innerHTML' : `${lectures[i].codigo} - ${lectures[i].nome}`
				});
		
		var searchResultLectureDescription = createAndAppendChild(searchResultLectureInfo, 'div', {
				'class': 'lecture-info-description'
				});
		createAndAppendChild(searchResultLectureDescription, 'div', {
				'class' : 'lecture-info-unit',
				'innerHTML': `${lectures[i].unidade}`
				});
		createAndAppendChild(searchResultLectureDescription, 'div', {
				'class' : 'lecture-info-department',
				'innerHTML': lectures[i].departamento
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

SearchBox.prototype.addEmptySearchResult = function() {
	createAndAppendChild(this.searchResultBox, 'div', {
		'class': ['search-result', 'empty-result'],
		'innerHTML': 'Nenhum resultado'
	});
}

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
		if(this.options)
			var searchArgs = {"q": fetchValue, "options": this.options};
		else
			var searchArgs = {"q": fetchValue};
		this.searchWorker.postMessage(searchArgs);
		this.searchOptionsBox.classList.remove('show');
		this.clearButton.classList.add('show-search');
	} else {
		this.searchResultBox.style.visibility = 'hidden';
		this.overSearchResultBox = false;
		this.clearButton.classList.remove('show-search');
	}
}

SearchBox.prototype.hideSearchBox = function() {
	this.searchResultBox.style.visibility = 'hidden';
	this.overSearchResultBox = false;
	this.removeLecturesSuggestionList();
	this.searchBox.value = '';
	this.clearButton.classList.remove('show-search');
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

	state.lastColor = state.lastColor % state.numColors || 0;
	
	lecture.color = 1 + state.lastColor++; //colors are 1-based
	lecture.selected = 1;
	state.addLecture(lecture);
	addClass(activePlan.lectures[numberOfLectures].htmlElement, 'lecture-info-plan-active');
	this.hideSearchBox();
}

SearchBox.prototype.removeLecturesSuggestionList = function() {
	while(this.searchResultBox.firstChild) {
		this.searchResultBox.removeChild(this.searchResultBox.firstChild);
	}
}

SearchBox.prototype.optionsChanged = function() {
	this.options = {"campus": this.campusSelect.value, 
					"unit": this.unitSelect.value,  
					"department": this.deptSelect.value,
					};

	if(Object.values(this.options).some(v => v))
		this.clearButton.classList.add('show-options');
	else
		this.clearButton.classList.remove('show-options');

	this.searchOptionsSummary.innerHTML = this.buildSummaryText();
	localStorage.setItem("search-options", JSON.stringify(this.options));
}

SearchBox.prototype.buildSummaryText = function() {
	var summaryText = 'Buscando';
	
	if(!this.options.campus && !this.options.unit)
		summaryText += ' em <span class="selected-option">todos os campi</span>';
	else if(this.options.unit) {
		if(this.options.department && this.options.department != this.options.unit) {
			var unitPrep = 'de';
			if(this.options.unit.search(/Escola|Faculdade|Licenciatura|Pró-Reitoria/) == 0) unitPrep = 'da';
			if(this.options.unit.search(/Instituto|Centro|Museu|Hospital/) == 0) unitPrep = 'do';
			
			if(this.options.department.search(/Interunidades/) > -1) {
				summaryText += ` <span class="selected-option">${this.options.department}</span>`;
			}
			else {
				if(this.options.unit.search(/Escola Politécnica/) > -1)
					var unitAcronym = "Poli";
				else
					var unitAcronym = this.options.unit.match(/\b[A-Z]/g).join('');
				
				var dept = this.options.department.replace(new RegExp(`${unitPrep} (${this.options.unit}|${unitAcronym})`),'').trim();

				if(dept == "Disciplinas") {
					summaryText += ` em <span class="selected-option">${this.options.unit}</span>`;
				}
				else {
					if(dept.search(/Interdepartamenta(l|is)/) > -1)
						summaryText += ` <span class="selected-option">disciplinas interdepartamentais</span>`
					else if(dept.search(/Departamento/) == 0)
						summaryText += ` no <span class="selected-option">${dept}</span>`;
					else
						summaryText += ` no departamento de <span class="selected-option">${dept}</span>`;

					summaryText += ` ${unitPrep} <span class="selected-option">${unitAcronym}</span>`;
				}
			}
		}
		else
			summaryText += ` em <span class="selected-option">${this.options.unit}</span>`;
	}
	else if(this.options.campus) {
		if(this.options.campus == 'Outro')
			summaryText += ` em <span class="selected-option">outros campi</span>`
		else
			summaryText += ` no campus de <span class="selected-option">${this.options.campus}</span>`
	}


	var timeframes = this.timeCheckboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
	if(timeframes.length && timeframes.length != this.timeCheckboxes.length) {
		this.options.timeframes = timeframes;
		summaryText += ` em período <span class="selected-option">${this.options.timeframes.join('</span> ou <span class="selected-option">')}</span>`
	}

	return summaryText;
}

SearchBox.prototype.campusSelectChanged = async function() {
	await this.populateUnitSelect(this.campusSelect.value);
	this.optionsChanged();
}

SearchBox.prototype.unitSelectChanged = async function() {
	await this.populateDeptSelect(this.unitSelect.value);
	this.optionsChanged();
}

SearchBox.prototype.populateCampusSelect = async function() {
	var fragment = document.createDocumentFragment();
	createAndAppendChild(fragment,'option',{
		'value': '',
		'innerHTML': 'Todos os campi'
	});
	
	var campi = await matruspDB.campi.toCollection().primaryKeys();
	campi.forEach(campus => createAndAppendChild(fragment,'option', {
		'innerHTML': campus
	}));

	this.campusSelect.innerHTML = '';
	this.campusSelect.appendChild(fragment);
}

SearchBox.prototype.populateUnitSelect = async function(campus) {
	selectedUnit = this.unitSelect.value;

	var fragment = document.createDocumentFragment();
	createAndAppendChild(fragment,'option',{
		'value': '',
		'innerHTML': 'Todas as unidades'
	});

	if(campus)
		var units = await matruspDB.campi.get(campus);
	else
		var units = await matruspDB.units.toCollection().primaryKeys();
	
	units.forEach(unit => createAndAppendChild(fragment,'option', {
		'value': unit,
		'innerHTML': unit,
		'selected': unit == selectedUnit
	}));

	this.unitSelect.innerHTML = '';
	this.unitSelect.appendChild(fragment);

	if(!this.unitSelect.value)
		this.populateDeptSelect();
}

SearchBox.prototype.populateDeptSelect = async function(unit) {
	var fragment = document.createDocumentFragment();
	createAndAppendChild(fragment,'option',{
		'value': '',
		'innerHTML': 'Todos os departamentos'
	});

	if(unit) {
		var depts = await matruspDB.units.get(unit);
		depts.forEach(dept => createAndAppendChild(fragment,'option', {
			'innerHTML': dept
		}));
		this.deptSelect.disabled = false;
	}
	else {
		this.deptSelect.disabled = true;
	}

	this.deptSelect.innerHTML = '';
	this.deptSelect.appendChild(fragment);
}

SearchBox.prototype.populateOptions = async function() {
	this.timeCheckboxes.forEach(checkbox => 
		checkbox.checked = !this.options.timeframes || this.options.timeframes.indexOf(checkbox.value) > -1
	);

	this.populateCampusSelect()
	if(this.options) {
		this.campusSelect.value = this.options.campus || '';
		await this.populateUnitSelect(this.options.campus);
		this.unitSelect.value = this.options.unit || '';
		await this.populateDeptSelect(this.options.unit);
		this.deptSelect.value = this.options.department || '';
		this.optionsChanged();
	}
	else {
		await this.populateUnitSelect();
	}

	try {IDBKeyRange.only([1])}
	catch(e) {
		this.deptSelect.disabled = this.unitSelect.disabled = true;
		this.timeCheckboxes.forEach(checkbox => checkbox.disabled = true);
		document.getElementById('search-options-browser-error').style.display = '';
	}
}

SearchBox.prototype.optionsSummaryClick = function() {
	this.searchOptionsBox.classList.toggle('show');
}

SearchBox.prototype.clearOptions = function() {
	this.searchBox.value = '';
	this.clearButton.classList.remove('show-search');

	this.options = {};
	this.populateOptions();
}

SearchBox.prototype.addEventListeners = function() {
	this.searchBox.addEventListener('focus', this.searchResultBoxShow.bind(this));
	this.searchBox.addEventListener('blur', this.searchResultBoxHide.bind(this));
	this.searchResultBox.addEventListener('mouseover', this.mouseOverSearchResultBox.bind(this));
	this.searchResultBox.addEventListener('mouseout', this.mouseOutSearchResultBox.bind(this));
	this.searchBox.addEventListener('keyup', this.eventKey.bind(this));
	this.campusSelect.addEventListener('change', this.campusSelectChanged.bind(this));
	this.unitSelect.addEventListener('change', this.unitSelectChanged.bind(this));
	this.deptSelect.addEventListener('change', this.optionsChanged.bind(this));
	this.searchOptionsSummary.addEventListener('click',this.optionsSummaryClick.bind(this));
	this.timeCheckboxes.forEach(checkbox => checkbox.addEventListener('change', this.optionsChanged.bind(this)));
	this.clearButton.addEventListener('click',this.clearOptions.bind(this));
}

