self.importScripts("dexie.min.js");
self.importScripts("dbhelpers.js");


self.progress = 0;
self.addProgress = function(prog) {
  self.progress += prog;
  self.postMessage(self.progress);
}
self.setProgress = function(prog) {
  self.progress = prog;
  self.postMessage(self.progress);
}

if(!navigator.onLine) {
  self.setProgress(1);
  self.close();
}
var dbPromise = matruspDB.metadata.get('ETag').then(async (etag) => {
  // Fetch DB from the server. Send ETag to avoid downloading exactly the same DB again.
  var response = await fetch('../db/db.json', {method: 'GET', headers: {'If-None-Match': etag || ''}});
  if(!response.ok) {
    // End worker if server returns 304 not modified
    if(response.status == 304) {
      return;
    }
    else throw new Error(`Server returned code ${response.status} for DB request`); //Throw error for any unknown error
  }

  // Update the indexedDB and put new etag when done
  self.addProgress(0.1);
  await Promise.all([matruspDB.trigrams.clear(),matruspDB.lectures.clear()]);
  await loadLectures (await response.json()); 
  await matruspDB.metadata.put(response.headers.get("ETag"),"ETag");
});

var coursesPromise = matruspDB.metadata.get('ETag-courses').then(async (etag) => {
  var response = await fetch('../db/cursos.json', {method: 'GET', headers: {'If-None-Match': etag || ''}});
  if(!response.ok) {
    // End worker if server returns 304 not modified
    if(response.status == 304) {
      return;
    }
    else throw new Error(`Server returned code ${response.status} for courses DB request`); //Throw error for any unknown error
  }

  // Update the indexedDB and put new etag when done
  self.postMessage(0.1);
  await matruspDB.courses.clear();
  await matruspDB.courses.bulkPut(await response.json()); 
  await matruspDB.metadata.put(response.headers.get("ETag"),"ETag-courses");
});

var campiPromise = matruspDB.metadata.get('ETag-campi').then(async (etag) => {
  var response = await fetch('../db/campi.json', {method: 'GET', headers: {'If-None-Match': etag || ''}});
  if(!response.ok) {
    // End worker if server returns 304 not modified
    if(response.status == 304) {
      return;
    }
    else throw new Error(`Server returned code ${response.status} for campi DB request`); //Throw error for any unknown error
  }

  // Update the indexedDB and put new etag when done
  self.addProgress(0.1);
  await matruspDB.campi.clear();
  var campi = await response.json();
  await matruspDB.campi.bulkPut(Object.values(campi), Object.keys(campi)); 
  await matruspDB.metadata.put(response.headers.get("ETag"),"ETag-campi");
});

Promise.all([dbPromise,coursesPromise,campiPromise]).then(() => {
  self.postMessage(1);
  self.close();
}).catch(e => { 
  console.error(e); 
  self.postMessage(1); 
  self.close(); 
});

function loadLectures (lectures) {
  self.addProgress(0.1);
  var trigrams = { length: 0 }; // Trigram list with property length used in weighting

  // Adds a trigram from a lecture to the list
  function addToTrigramList(trigram, lecture) {
    if (!trigrams[trigram]) {
      trigrams[trigram] = {
        length: 0
      };
    }
    if (!trigrams[trigram][lecture.codigo]) {
      trigrams[trigram][lecture.codigo] = 0;
    }
    trigrams[trigram][lecture.codigo]++;
    trigrams[trigram].length++;
    trigrams.length++;
  }

  //Iterate each schedule of each lecture to obtain lecture's timeframes
  lectures.forEach(lecture => {
    var timeframes = new Set();
    if(!lecture.turmas) return;
    lecture.turmas.forEach(classroom => {
      if(!classroom || !classroom.horario) return;
      classroom.horario.forEach(schedule => {
        if(!schedule) return;
        hourInit = parseInt(schedule.inicio.slice(0,2));
        if(hourInit < 12)
          timeframes.add("matutino");
        else if(hourInit < 18)
          timeframes.add("vespertino");
        else
          timeframes.add("noturno");

        hourEnd = parseInt(schedule.fim.slice(0,2));
        if(hourEnd > 19) 
          timeframes.add("noturno");
        else if(hourEnd > 13)
          timeframes.add("vespertino");
        else
          timeframes.add("matutino");
      });
    });
    lecture.periodos = [...timeframes];
  });

  var lecturesPromise = matruspDB.lectures.bulkPut(lectures).then(() => self.addProgress(0.2)); // Put lectures in DB.

  var units = {};

  // Parse lectures to extract trigrams and units lists
  lectures.forEach(lecture => {
    trigramsFromString(changingSpecialCharacters(lecture.nome)).forEach(trigram => {
      addToTrigramList(trigram, lecture)
    });
    trigramsFromString(lecture.codigo).forEach(trigram => {
      addToTrigramList(trigram, lecture)
    });

    if(!units[lecture.unidade]) units[lecture.unidade] = new Set();
    units[lecture.unidade].add(lecture.departamento);
  });

  var unitsPromise = matruspDB.units.bulkPut(Object.values(units).map(set => [...set]), Object.keys(units));
  
  //Weight trigrams
  for(var trigram in trigrams) {
    if (trigram === 'length') continue;
    var weight = Math.sqrt(Math.log(trigrams.length / trigrams[trigram].length));
    delete trigrams[trigram].length;
    for (var code in trigrams[trigram]) {
      trigrams[trigram][code] = weight * Math.log(1 + trigrams[trigram][code]);
    }
  }
  self.addProgress(0.2);
  delete trigrams.length;
  var trigramsPromise = matruspDB.trigrams.bulkPut(Object.values(trigrams), Object.keys(trigrams)).then(() => self.addProgress(0.2));

  return Promise.all([lecturesPromise,trigramsPromise,unitsPromise]); //Await all indexedDB promises
}
