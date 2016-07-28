
/**
 * Verify if a HTML Element have a class
 *
 * @param {Object} el
 * @param {String} className
 * @return {boolean} 
 */
function hasClass(el, className) {
  // test for IE 9
  if (el.classList) {
    return el.classList.contains(className);
  } else {
    var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
    return !!el.className.match(reg);
  }
}

/**
 * Include a class to a HTML Element if it doesn't have it yet
 *
 * @param {Object} el
 * @param {String} className
 */
function addClass(el, className) {
  // test for IE 9
  if (el.classList) {
    el.classList.add(className);
  } else if (!hasClass(el, className)) {
    el.className += " " + className;
  }
}

/**
 * Removes a class to a HTML Element if it exists
 *
 * @param {Object} el
 * @param {String} className
 */
function removeClass(el, className) {
  // test for IE 9
  if (el.classList) {
    el.classList.remove(className);
  } else if (hasClass(el, className)) {
    var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
    el.className = el.className.replace(reg, ' ');
  }
}

/**
 * Toggle the existence of a class to a HTML Element
 *
 * @param {Object} el
 * @param {String} className
 */
// opcao a partir do IE 10: {var menu = document.querySelector('.menu'); menu.classList.toggle('hidden-phone');}
function toggleClass(el, className) {
  if (hasClass(el, className)) {
    removeClass(el, className);
  } else {
    addClass(el, className);
  }
}

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
        addClass(element, attributes[attr]);
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





