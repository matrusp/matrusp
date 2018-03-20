self.importScripts("dbhelpers.js");

if(!navigator.onLine) {
  self.postMessage(1);
  self.close();
}

fetch('../db/db.json').then(response => {
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
}).catch(e => { console.error(e); self.postMessage(1); self.close(); });

function loadDB (json) {
  self.postMessage(0.2);
  var trigrams = { length: 0 };

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
    var lecturesObjectStore = self.idb.transaction(["lectures"], "readwrite").objectStore("lectures");
    var lecturesMapPromise = json.map(lecture => {
      lecturesObjectStore.put(lecture);

      trigramsFromString(changingSpecialCharacters(lecture.nome)).forEach(function(trigram) {
        addToTrigramList(trigram, lecture)
      });
      trigramsFromString(lecture.codigo).forEach(function(trigram) {
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