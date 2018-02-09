self.importScripts("dbhelpers.js");

var dbrequest = self.indexedDB.open("MatruspDB");
  
dbrequest.onsuccess = ev => {
  self.idb = ev.target.result;

  self.onmessage = e => {
    if(!e.data || e.data === '') return;

    if(!self.search) {
      self.search = changingSpecialCharacters(e.data).trim();
      fetchLectureOnDB();
    }
    else self.search = changingSpecialCharacters(e.data).trim();
  };
};

dbrequest.onerror = e => self.close(); //TODO: handle db opening error;

dbrequest.onupgradeneeded = e => {
  var lectureStore = e.target.result.createObjectStore("lectures", { keyPath: 'code' });
  var trigramStore = e.target.result.createObjectStore("trigrams");
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
  var transaction = self.idb.transaction(["trigrams","lectures"]);

  var trigramPromises = trigramsFromString(search,true).map(trigram => new Promise((resolve, reject) =>  {
    for(var i = 0, trigramCache; trigramCache = lastTrigrams[i]; i++) {
      if(trigramCache[0] == trigram) {
        return resolve(trigramCache[1]);
      }
    }
    transaction.objectStore("trigrams").get(trigram).onsuccess = e => {
      if(e.target.result) if (self.lastTrigrams.unshift([trigram,e.target.result]) > 32) self.lastTrigrams.length = 32;
      return resolve(e.target.result);
    }
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
          if(lecture.code === lectureCode) return resolve(lecture);
      transaction.objectStore("lectures").get(lectureCode).onsuccess = e => resolve(e.target.result);
    }).then(lecture => {scores[lecture.code] /= Math.log(3+lecture.name.length); return lecture;}));
    
    Promise.all(resultPromises).then(result => {
      result.sort(function(first, second) {
        return scores[second.code] - scores[first.code];
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