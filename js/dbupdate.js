self.importScripts("dexie.min.js");
self.importScripts("dbhelpers.js");

if(!navigator.onLine) {
  self.postMessage(1);
  self.close();
}

matruspDB.metadata.get('ETag').then((etag) => {
  // Fetch DB from the server. Send ETag to avoid downloading exactly the same DB again.
  fetch('../db/db.json', {method: 'GET', headers: {'If-None-Match': etag || ''}}).then(async response => {
    if(!response.ok) {
      // End worker if server returns 304 not modified
      if(response.status == 304) {
        self.postMessage(1);
        self.close();
        return;
      }
      else throw new Error(`Server returned code ${response.status} for DB request`); //Throw error for any unknown error
    }

    // Update the indexedDB and put new etag when done
    self.postMessage(0.1);
    await loadDB (await response.json()); 
    await matruspDB.metadata.put(response.headers.get("ETag"),"ETag");
    self.postMessage(1);
    self.close();
  }).catch(e => { 
    console.error(e); 
    self.postMessage(1); 
    self.close(); 
  });
});

function loadDB (lectures) {
  self.postMessage(0.2);
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

  var lecturesPromise = matruspDB.lectures.bulkPut(lectures); // Put lectures in DB.

  var campi = {};
  var units = {};

  // Parse lectures to extract trigrams, units and campi lists
  lectures.forEach(lecture => {
    trigramsFromString(changingSpecialCharacters(lecture.nome)).forEach(trigram => {
      addToTrigramList(trigram, lecture)
    });
    trigramsFromString(lecture.codigo).forEach(trigram => {
      addToTrigramList(trigram, lecture)
    });

    if(!units[lecture.unidade]) units[lecture.unidade] = new Set();
    units[lecture.unidade].add(lecture.departamento);

    if(!campi[lecture.campus]) campi[lecture.campus] = new Set();
    campi[lecture.campus].add(lecture.unidade);
  });

  var unitsPromise = matruspDB.units.bulkPut(Object.values(units).map(set => [...set]), Object.keys(units));
  var campiPromise = matruspDB.campi.bulkPut(Object.values(campi).map(set => [...set]), Object.keys(campi));
  
  //Weight trigrams
  for(var trigram in trigrams) {
    if (trigram === 'length') continue;
    var weight = Math.sqrt(Math.log(trigrams.length / trigrams[trigram].length));
    delete trigrams[trigram].length;
    for (var code in trigrams[trigram]) {
      trigrams[trigram][code] = weight * Math.log(1 + trigrams[trigram][code]);
    }
  }
  self.postMessage(0.3);
  delete trigrams.length;
  var trigramsPromise = matruspDB.trigrams.bulkPut(Object.values(trigrams), Object.keys(trigrams));

  return Promise.all([lecturesPromise,trigramsPromise,unitsPromise,campiPromise]); //Await all indexedDB promises
}