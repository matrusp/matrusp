self.importScripts("dbhelpers.js");

fetch('../db/db_usp.txt').then(response => {
  response.json().then(json => {
    var dbrequest = self.indexedDB.open("MatruspDB");
    
    dbrequest.onsuccess = e => {
      self.idb = e.target.result;
      loadDB(json);
    };

    dbrequest.onerror = e => self.close(); //TODO: handle db opening error;

    dbrequest.onupgradeneeded = e => {
      var lectureStore = e.target.result.createObjectStore("lectures", { keyPath: 'code' });
      var trigramStore = e.target.result.createObjectStore("trigrams");
    };
  });
});

function loadDB (json) {
  var campus = "TODOS"; // Hardcoded - Change when server-side parser changes
  var trigrams = { length: 0 };

  function addToTrigramList(trigram, lecture) {
    if (!trigrams[trigram]) {
      trigrams[trigram] = {
        length: 0
      };
    }
    if (!trigrams[trigram][lecture.code]) {
      trigrams[trigram][lecture.code] = 0;
    }
    trigrams[trigram][lecture.code]++;
    trigrams[trigram].length++;
    trigrams.length++;
  }
    var transaction = self.idb.transaction(["lectures","trigrams"], "readwrite");
    var lecturesObjectStore = transaction.objectStore("lectures");
    var lecturesMapPromise = json[campus].map(function(description) {
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
      lecturesObjectStore.add(lecture);

      trigramsFromString(changingSpecialCharacters(lecture.name)).forEach(function(trigram) {
        addToTrigramList(trigram, lecture)
      });
      trigramsFromString(lecture.code).forEach(function(trigram) {
        addToTrigramList(trigram, lecture)
      });
    });

    var trigramsObjectStore = transaction.objectStore("trigrams");
    Promise.all(lecturesMapPromise).then(function() {
      for (var trigram in trigrams) {
        if (trigram === 'length') continue;
        var weight = Math.sqrt(Math.log(trigrams.length / trigrams[trigram].length));
        delete trigrams[trigram].length;
        for (var code in trigrams[trigram]) {
          trigrams[trigram][code] = weight * Math.log(1 + trigrams[trigram][code]);
        }
      trigramsObjectStore.add(trigrams[trigram],trigram);
      }
      delete trigrams.length;
      transaction.oncomplete = e => self.close();
    });
}