self.importScripts("dexie.min.js")
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

  Promise.all(trigramPromises).then(all => {
    result.sort(function(first, second) {
      return scores[second] - scores[first];
    });

    var resultPromises = result.slice(0,50).map(lectureCode => new Promise((resolve, reject) => {
      for(var i = 0, cachedQuery; cachedQuery = self.lastQueries[i]; i++)
        for(var j = 0, lecture; lecture = cachedQuery.result[j]; j++)
          if(lecture.codigo === lectureCode) return resolve(lecture);
      resolve(matruspDB.lectures.get(lectureCode))
    }).then(lecture => {scores[lecture.codigo] /= Math.log(3+lecture.nome.length); return lecture;}));
    
    Promise.all(resultPromises).then(result => {
      result = result.filter(lecture => {
        res = true;
        if(search.unidade) res &= lecture.unidade == search.unidade;
        if(search.departamento) res &= lecture.departamento == search.departamento;
        return res;
      })

      result.sort(function(first, second) {
        return scores[second.codigo] - scores[first.codigo];
      });

      submitResult({search: search, result: result}, true);
    });
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