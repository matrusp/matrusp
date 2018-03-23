self.importScripts("dexie.min.js");
self.importScripts("dbhelpers.js");

if(!navigator.onLine) {
  self.postMessage(1);
  self.close();
}

fetch('../db/db.json').then(response => {
  if(!response.ok) throw new Error();
  
  self.postMessage(0.1);
  return response.json().then(json => loadDB (json));
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
    var lecturesPromise = matruspDB.lectures.bulkPut(json);
    json.forEach(lecture => {
      trigramsFromString(changingSpecialCharacters(lecture.nome)).forEach(trigram => {
        addToTrigramList(trigram, lecture)
      });
      trigramsFromString(lecture.codigo).forEach(trigram => {
        addToTrigramList(trigram, lecture)
      });
    });

    lecturesPromise.then(async () => {
      self.postMessage(0.5);
      for(var trigram in trigrams) {
        if (trigram === 'length') return;
        var weight = Math.sqrt(Math.log(trigrams.length / trigrams[trigram].length));
        delete trigrams[trigram].length;
        for (var code in trigrams[trigram]) {
          trigrams[trigram][code] = weight * Math.log(1 + trigrams[trigram][code]);
        }
        await matruspDB.trigrams.put(trigrams[trigram],trigram);
      }
      self.postMessage(0.7);
      delete trigrams.length;
      var trigramsPromise = matruspDB.trigrams.bulkPut(Object.values(trigrams), Object.keys(trigrams));
      trigramsPromise.then(() => {
        self.postMessage(1); 
        self.close();
      });
    });
}