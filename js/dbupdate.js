self.importScripts("dbhelpers.js");

if(!navigator.onLine) {
  self.postMessage(1);
  self.close();
}

fetch('../db/db_usp.txt').then(response => {
  if(!response.ok) throw new Error();
  
  self.postMessage(0.1);
  return openIDB().then(idb => self.idb = idb).then(idb => {
    var clearPromises = [];
    var transaction = idb.transaction(["lectures","trigrams"],"readwrite");
    clearPromises.push(new Promise((resolve, reject) => transaction.objectStore("lectures").clear().onsuccess = e => resolve("lectures")));
    clearPromises.push(new Promise((resolve, reject) => transaction.objectStore("trigrams").clear().onsuccess = e => resolve("trigrams")));
    return Promise.all(clearPromises).then(storePromises => idb);
  }).then(idb => {
    return response.json().then(json => loadDB (json));
  });
}).catch(e => { self.postMessage(1); self.close(); });

function loadDB (json) {
  self.postMessage(0.2);
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
    var lecturesObjectStore = self.idb.transaction(["lectures"], "readwrite").objectStore("lectures");
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
      lecturesObjectStore.put(lecture);

      trigramsFromString(changingSpecialCharacters(lecture.name)).forEach(function(trigram) {
        addToTrigramList(trigram, lecture)
      });
      trigramsFromString(lecture.code).forEach(function(trigram) {
        addToTrigramList(trigram, lecture)
      });
    });

    Promise.all(lecturesMapPromise).then(function() {
      self.postMessage(0.5);
      var trigramsObjectStore = self.idb.transaction(["trigrams"], "readwrite").objectStore("trigrams");
      for (var trigram in trigrams) {
        if (trigram === 'length') continue;
        var weight = Math.sqrt(Math.log(trigrams.length / trigrams[trigram].length));
        delete trigrams[trigram].length;
        for (var code in trigrams[trigram]) {
          trigrams[trigram][code] = weight * Math.log(1 + trigrams[trigram][code]);
        }
      trigramsObjectStore.put(trigrams[trigram],trigram);
      }
      delete trigrams.length;
      trigramsObjectStore.transaction.oncomplete = e => {self.postMessage(1); self.close()};
    });
}