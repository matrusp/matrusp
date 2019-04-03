/**
 * Create a HTML Element with attributes (e.g. class, innerHTML, style, etc.)
 *
 * @param {String} tag
 * @param {Array} attributes
 */
function createElementWithAttributes(tag, attributes) {
  var element = document.createElement(tag);
  for (attr in attributes) {
    // test for IE8
    if (attributes.hasOwnProperty(attr)) {
      if (attr == 'class') {
      	if(attributes[attr] instanceof Array) attributes[attr] = attributes[attr].join(' ');
        element.className = attributes[attr];
      } else {
        element[attr] = attributes[attr];
      }
    }
  }
  return element;
}

/**
 * Create a HTML Element with attributes (e.g. class, innerHTML, style, etc.) and appends it to another element.
 *
 * @param {object} parent
 * @param {String} tag
 * @param {Array} attributes
 * @return {object} The child element just created
 */
function createAndAppendChild(parent, tag, attributes) {
  var child = createElementWithAttributes(tag, attributes);
  parent.appendChild(child);
  return child;
}

/**
 * Create a HTML Element Tree from a js object.
 *
 * @example param
 *  var lectureInfoTreeObj = {
 *    tag: 'div',
 *   class: 'lecture-info',
 *    children: [
 *      {
 *        tag: 'input',
 *        type: 'checkbox',
 *        id: 'lecture-info-' + labelCount,
 *        name: 'lecture-info'
 *      },
 *      {
 *        tag: 'div',
 *        class: 'lecture-info-header',
 *        children: [
 *          {
 *            tag: 'label',
 *            htmlFor: 'lecture-info-' + labelCount,
 *            children: [
 *              {
 *                tag: 'div',
 *                class: 'lecture-info-code',
 *                innerHTML: (lecture.code + ' -')
 *              }
 *            ]
 *          }
 *        ]
 *      }
 *    ]
 *  }
 *
 * @param rootObj
 * @param {String} rootObj.tag HTML tag
 * @param {String[]} rootObj.class CSS classes
 * @param [rootObj.children] Objects like rootObj
 * @return {HTML_Element} The root element
 */
function createHtmlElementTree(rootObj) {
  if (!rootObj.tag) {
    console.log('Error in createHtmlElementTree(', rootObj, ')');
    return;
  }

  var tag = rootObj.tag;
  delete rootObj.tag;
  var children = rootObj.children;
  delete rootObj.children;

  var rootElement = createElementWithAttributes(tag, rootObj);

  if (!children) {
    return rootElement;
  }

  for (var i = 0; i < children.length; i++) {
    var child = createHtmlElementTree(children[i]);
    rootElement.appendChild(child);
  }

  return rootElement;
}

/**
 * Translates 3-characters words in numbers.
 * <br>
 * 'seg' = 0, 'ter' = 1, ..., 'dom' = 6
 *
 * @param {String} day
 * @return {Number}
 */
function indexOfDay(day) {
  switch (day) {
    case 'seg': return 0;
    case 'ter': return 1;
    case 'qua': return 2;
    case 'qui': return 3;
    case 'sex': return 4;
    case 'sab': return 5;
    case 'dom': return 6;
  }
}

/**
 * Creates a new array with unique elements from the array given.
 *
 * @param {Array} array
 * @return {Array}
 */
function removeDuplicates(array) {
  var seenHash = new Object();
  var uniqueArray = new Array();
  var uniqueCounter = 0;
  for(var i = 0; i < array.length; i++) {
    var item = array[i];
    if(seenHash[item] != 1) {
      seenHash[item] = 1;
      uniqueArray[uniqueCounter++] = item;
    }
  }
  return uniqueArray;
}


// TODO deixar essas funcoes (timeInMinutes, schedulesConflict, classroomsConflict) em plan.js ?
//      a principio elas sao utilizadas **somente** la
/**
 *
 */
function timeInMinutes(timeString) {
  var hours = Number(timeString.substr(0,2));
  var minutes = Number(timeString.substr(3,2));
  return 60*hours + minutes;
}

/**
 *
 */
function schedulesConflict(schedule1, schedule2) {
  if ((schedule1 == schedule2) ||
      (schedule1.day != schedule2.day)) {
    return false;
  }
  var timeBegin1 = timeInMinutes(schedule1.timeBegin);
  var timeBegin2 = timeInMinutes(schedule2.timeBegin);
  var timeEnd1 = timeInMinutes(schedule1.timeEnd);
  var timeEnd2 = timeInMinutes(schedule2.timeEnd);

  return ((timeBegin1 == timeBegin2 && timeEnd1 == timeEnd2) ||
    (timeBegin1 < timeBegin2 && timeBegin2 < timeEnd1) ||
    (timeBegin1 < timeEnd2 && timeEnd2 < timeEnd1) ||
    (timeBegin2 < timeBegin1 && timeBegin1 < timeEnd2) ||
    (timeBegin2 < timeEnd1 && timeEnd1 < timeEnd2)
  );
}

/**
 * Check if all schedules can be set without conflict. If at least one
 * pair of schedules conflict, returns true.
 */
function classroomsConflict(classroom1, classroom2) {
  var schedules1 = classroom1.schedules;
  var schedules2 = classroom2.schedules;

  for (var i = 0; i < schedules1.length; i++) {
    for (var j = 0; j < schedules2.length; j++) {
      if (schedulesConflict(schedules1[i], schedules2[j])) {
        return true;
      }
    }
  }
  return false;
}

// to be used with file upload name.
function shortenString(string) {
  if (string.length < 25) return string;

  return  string.substring(0, 11) + "..." + string.substring(string.length-10); 
} 

if(typeof Date.prototype.toIcal === "undefined") {
	Date.prototype.toIcalString = function() {
		return this.clone().addMinutes(this.getTimezoneOffset()).toString("yyyyMMddTHHmmssZ");
	}
}