var stopwords_ptBR = [
"DE",
"DA",
"DO",
"DAS",
"DOS",
"A",
"EM",
"NO",
"NA",
"NOS",
"NAS",
"E",
"O",
"AO",
"AS",
"OS",
"AOS",
"PARA",
"POR"
];

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

function romanize(num) {
  var lookup = {
      M: 1000,
      CM: 900,
      D: 500,
      CD: 400,
      C: 100,
      XC: 90,
      L: 50,
      XL: 40,
      X: 10,
      IX: 9,
      V: 5,
      IV: 4,
      I: 1
    },
    roman = '';
  for (var i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
}

function quickselect(arr, k, compare) {
  if (arr.length <= k) return;
  quickselectStep(arr, k, 0, (arr.length - 1), compare || defaultCompare);
}

function quickselectStep(arr, k, left, right, compare) {
  function swap(arr, i, j) {
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  function defaultCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  }
 
  while (right > left) {
    if (right - left > 600) {
      var n = right - left + 1;
      var m = k - left + 1;
      var z = Math.log(n);
      var s = 0.5 * Math.exp(2 * z / 3);
      var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
      var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
      var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
      quickselectStep(arr, k, newLeft, newRight, compare);
    }

    var t = arr[k];
    var i = left;
    var j = right;

    swap(arr, left, k);
    if (compare(arr[right], t) > 0) swap(arr, left, right);

    while (i < j) {
      swap(arr, i, j);
      i++;
      j--;
      while (compare(arr[i], t) < 0) i++;
      while (compare(arr[j], t) > 0) j--;
    }

    if (compare(arr[left], t) === 0) swap(arr, left, j);
    else {
      j++;
      swap(arr, j, right);
    }

    if (j <= k) left = j + 1;
    if (k <= j) right = j - 1;
  }
}

function trigramsFromString(str,asAcronym) {
  var trigrams = new Array();

  str = str.replace(/(\b[IVXLCM]+)\s+(?=[IVXLCM])/g,"$1");

  var words = str.split(" ");

  if (words.length > 1 && !isNaN(words[words.length - 1]))
    words[words.length - 1] = romanize(parseInt(words[words.length - 1]));

  words = words.filter(function(word,i) { 
      return word !== "" && (i == 0 || stopwords_ptBR.indexOf(word) === -1);
  }.bind(this));

  for (var i = 0; i < words.length; i++) {
    var word = words[i];

    trigrams.push(word[0] + "#");
    if (i === 0 && word.length > 2) trigrams.push(word[0] + word[1] + word[2] + "!");
    trigrams.push(word + "$"); //exact word match

    for (var j = 0; j < word.length; j++) {
      if (j < word.length - 2)
        trigrams.push(word[j] + word[j + 1] + word[j + 2]);
      if (asAcronym && word.length < 5) { //small first words will be treated as acronyms e.g GA, SD
        if (j > 0) trigrams.push(word[j - 1] + word[j] + "%");
      }
    }

    if (i > 0)
      trigrams.push(words[i - 1][0] + words[i][0] + "%"); //sequential first letters
  }

  return trigrams;
}

var matruspDB = new Dexie("MatruspDB");

matruspDB.version(1).stores({
  lectures: "&codigo, campus, [unidade+departamento], *periodos",
  trigrams: "",
  metadata: "",
  units: "",
  campi: ""
});

matruspDB.version(2).stores({
  lectures: "&codigo, campus, [unidade+departamento], *periodos",
  trigrams: "",
  metadata: "",
  units: "",
  campi: "",
  courses: "&codigo, nome, unidade"
});