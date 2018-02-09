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