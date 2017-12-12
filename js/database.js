/*
 * @constructor
 */

function Database() {
  this.db = new Object();
  this.currDB = new Object(); //Needed because I don't have reference to semester inside of function fetchLectureOnDB

  this.stopwords_ptBR = [
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

  this.trigramsFromString = function(str) {
    var trigrams = new Array();
    
    var words = str.split(" ");

    if (words.length > 1 && !isNaN(words[words.length - 1]))
      words[words.length - 1] = romanize(parseInt(words[words.length - 1]));

    words = words.filter(function(word,i) { 
		return i == 0 || this.stopwords_ptBR.indexOf(word) === -1;
    }.bind(this));

    for (var i = 0; i < words.length; i++) {
      var word = words[i];

      trigrams.push(word[0] + "#");
      if (word.length > 2) trigrams.push(word[0] + word[1] + word[2] + "!");
      trigrams.push(word + "$"); //exact word match

      for (var j = 0; j < word.length; j++) {
        if (j < word.length - 2)
          trigrams.push(word[j] + word[j + 1] + word[j + 2]);
        if (i === 0 && word.length < 5) { //small first words will be treated as acronyms e.g GA, SD
          trigrams.push(word[j] + "#");
          if (j > 0) trigrams.push(word[j - 1] + word[j] + "%");
        }
      }

      if (i > 0)
        trigrams.push(words[i - 1][0] + words[i][0] + "%"); //sequential first letters
    }

    trigrams.push(str + "&"); //exact match

    return trigrams;
  }

  this.fetchLectureOnDB = function(word) {
    word = changingSpecialCharacters(word).trim();
    if (word === "") {
      this.result = [];
      return;
    }
    var self = this;
    for (var code in this.currDB) {
      if (code === word) {
        this.result = [self.currDB[code]];
        return;
      }
    }

    var scores = new Object();
    this.result = new Array();

    this.trigramsFromString(word).forEach(function(trigram) {
      if (self.currDB.trigrams[trigram]) {

        for (var code in self.currDB.trigrams[trigram]) {
          if (!scores[code]) {
            self.result.push(self.currDB[code]);
            scores[code] = 0;
          }
          scores[code] += self.currDB.trigrams[trigram][code];
        }
      }
    });

    this.result.sort(function(first, second) {
      return scores[second.code] / Math.log(second.name.length) - scores[first.code] / Math.log(first.name.length);
    });
  }


  this.loadDB = function(pathAndNameOfJSON, semester) {
    var self = this;
    ui.loadJSON(pathAndNameOfJSON, function(response) {
      var myJSON = JSON.parse(response);

      self.db[semester] = new Object();
      for (var campus in myJSON) {
        self.db[semester][campus] = new Object();
        var trigramList = self.db[semester][campus].trigrams = new Object();
        self.db[semester][campus].trigrams.length = 0;

        function addToTrigramList(trigram, lecture) {
          if (!trigramList[trigram]) {
            trigramList[trigram] = {
              length: 0
            };
          }
          if (!trigramList[trigram][lecture.code]) {
            trigramList[trigram][lecture.code] = 0;
          }
          trigramList[trigram][lecture.code]++;
          trigramList[trigram].length++;
          trigramList.length++;
        }

        myJSON[campus].forEach(function(description) {
          var lecture = new Object();
          lecture = {
            'code': description[0],
            'name': description[1],
            'selected': 1,
            'campus': 'TODOS',
            'classrooms': new Array()
          };
          description[2].forEach(function(specifications) {
            var specification = new Object();
            specification = {
              'classroomCode': new Array(),
              'data_inicio': specifications[1],
              'data_fim': specifications[2],
              'type': specifications[3],
              'selected': 1,
              'alunos_especiais': 0,
              'horas_aula': 0,
              'pedidos_sem_vaga': 0,
              'saldo_vagas': 0,
              'vagas_ocupadas': 0,
              'teachers': new Array(),
              'schedules': new Array()
            };
            specification.classroomCode.push(specifications[0].replace(/.{5}/, ''));
            if (specifications[4] != null) {
              specifications[4].forEach(function(schedules) { //TODO verificar se os parametros nao sao nulls
                var schedule = new Object();
                schedule = {
                  'day': schedules[0],
                  'timeBegin': schedules[1],
                  'timeEnd': schedules[2],
                };
                if (schedules[3] == "" || schedules == null) {
                  schedules[3] = 'Não disponibilizado pelo JupiterWeb';
                }
                specification.teachers.push(schedules[3]);
                specification.schedules.push(schedule);
              });
            } else {
              specification.teachers.push('Não disponibilizado pelo JupiterWeb');
            }
            //specification.numVacancies = specifications[5];
            // specifications[5] contains information about number
            // of vacancies
            lecture.classrooms.push(specification);
          });
          self.db[semester][campus][lecture.code] = lecture;

          self.trigramsFromString(changingSpecialCharacters(lecture.name)).forEach(function(trigram) {
            addToTrigramList(trigram, lecture)
          });
          self.trigramsFromString(lecture.code).forEach(function(trigram) {
            addToTrigramList(trigram, lecture)
          });
        });

        for (var trigram in trigramList) {
          var weight = Math.sqrt(Math.log(trigramList.length / trigramList[trigram].length));
          for (var code in trigramList[trigram]) {
            trigramList[trigram][code] = weight * Math.log(1 + trigramList[trigram][code]);
          }
        }
      }
      self.currDB = self.db[semester][campus];
    });
  }

  this.sliceObjectDB = function() {
    return this.result.slice(0, 100);
  }
}