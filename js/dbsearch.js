self.importScripts("libs/dexie.min.js");
self.importScripts("dbhelpers.js");

self.onmessage = e => {
  if(!e.data || e.data.q === '') return;

  e.data.q = changingSpecialCharacters(e.data.q).trim();

  if(!self.search) {
    self.search = e.data;
    fetchLectureOnDB();
  }
  else self.search = e.data;
};

//These arrays will cache in RAM data fetched from the DB
self.lastQueries = []; //Last 5 queries: search and result
self.lastTrigrams = []; //Last 32 trigrams and their scores

//Method called to execute search
function fetchLectureOnDB() {
  var result = [];
  var search = self.search; //self.search might change during the execution (event called)

  //Search if any of the last queries have identical search string. If so, submit its result.
  for (var i = 0; i < self.lastQueries.length; i++) {
    if(self.lastQueries[i].search === search) {
      submitResult({search: search, result: lastQueries[i].result}, false);
      return;
    }
  }
  
  var scores = new Object();

  var trigramPromises = trigramsFromString(search.q,true).map(trigram => new Promise((resolve, reject) =>  {
    for(var i = 0, trigramCache; trigramCache = lastTrigrams[i]; i++) {
      if(trigramCache[0] == trigram) {
        return resolve(trigramCache[1]);
      }
    }
    return resolve(matruspDB.trigrams.get(trigram).then(result => {
      if(result) if (self.lastTrigrams.unshift([trigram, result]) > 32) self.lastTrigrams.length = 32;
      return result
    }));
  }).then(trigramScores => {
    for(var code in trigramScores) {
      if(!scores[code]) { 
        scores[code] = 0;
        result.push(code);
      }
      scores[code] += trigramScores[code];
    }
  }));

  Promise.all(trigramPromises).then(async all => {
    var lectures = [];
    var dbquery;
    
    if(search.options.unit) {
      if(search.options.department) {
        dbquery = matruspDB.lectures.where({'unidade': search.options.unit, 'departamento': search.options.department});
      }
      else {
        dbquery = matruspDB.lectures.where('[unidade+departamento]').between([search.options.unit,Dexie.minKey],[search.options.unit,Dexie.maxKey]);
      }
      if(search.options.timeframes && search.options.timeframes.length) {
        dbquery = dbquery.and(lecture => lecture.periodos.some(timeframe => search.options.timeframes.indexOf(timeframe) > -1));
      }
      dbquery = dbquery.and(lecture => scores[lecture.codigo]);
      lectures = await dbquery.toArray();
      quickselect(lectures,50,(a,b) => scores[b.codigo] - scores[a.codigo]);
      lectures = lectures.splice(0,50);
    }
    else if(search.options.timeframes && search.options.timeframes.length) {
     dbquery = matruspDB.lectures.where('periodos').anyOf(search.options.timeframes).distinct();
      if(search.options.campus)
        dbquery = dbquery.and(lecture => lecture.campus == search.options.campus);
      dbquery = dbquery.and(lecture => scores[lecture.codigo]);
      lectures = await dbquery.toArray();
      quickselect(lectures,50,(a,b) => scores[b.codigo] - scores[a.codigo]);
      lectures = lectures.splice(0,50);
    }
    else if(search.options.campus) {
      dbquery = matruspDB.lectures.where('campus').equals(search.options.campus);
      dbquery = dbquery.and(lecture => scores[lecture.codigo]);
      lectures = await dbquery.toArray();
      quickselect(lectures,50,(a,b) => scores[b.codigo] - scores[a.codigo]);
      lectures = lectures.splice(0,50);
    }
    else {
      quickselect(result,50,(a,b) => scores[b] - scores[a]);
      dbquery = matruspDB.lectures.where('codigo').anyOf(result.splice(0,50));
      lectures = await dbquery.toArray();
    }

    lectures.forEach(lecture => {
      scores[lecture.codigo] /= Math.log(3+lecture.nome.length);
    });

    lectures.sort((a, b) => 
      scores[b.codigo] - scores[a.codigo]);

    submitResult({search: search, result: lectures}, true);
  });
}

function submitResult(query, cache) {
  if(cache) 
    if(self.lastQueries.unshift(query) > 5)
      self.lastQueries.length = 5;

  self.postMessage(query.result);
  if(self.search && self.search != query.search) fetchLectureOnDB();
  else delete self.search;
}