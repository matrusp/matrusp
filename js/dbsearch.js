self.importScripts("dbhelpers.js");

self.onmessage = e => {
  if(!e.data || e.data === '') self.close();

  var dbrequest = self.indexedDB.open("MatruspDB");
  
  dbrequest.onsuccess = ev => {
    self.idb = ev.target.result;
    fetchLectureOnDB (e.data);
  };

  dbrequest.onerror = e => self.close(); //TODO: handle db opening error;
};


function fetchLectureOnDB (word) {
  var result = [];
  
  word = changingSpecialCharacters(word).trim();
  
  //Search for exact code in the lectures database. In case of a match, send message with the found lecture and kill the worker.
  if(word.length === 7) //Exact code match will only happen if search is 7 characters long
  {
    var request = self.idb.transaction("lectures").objectStore("lectures").get(word);
    request.onsuccess = e => {
      if(e.target.result) {
        self.postMessage([e.target.result]); //Send an array with the found lecture because the reciever will be expecting an array;
        self.close(); //End this worker's operation
      }
    }
  }
  var scores = new Object();
  var transaction = self.idb.transaction(["trigrams","lectures"]);

  trigramsFromString(word,true).forEach(trigram => {
    transaction.objectStore("trigrams").get(trigram).onsuccess = e => {
      for(var code in e.target.result)
      {
        if(!scores[code]) { 
          scores[code] = 0;
          transaction.objectStore("lectures").get(code).onsuccess = e => result.push(e.target.result);
        }
        scores[code] += e.target.result[code];
      }
    }
  });

  transaction.oncomplete = e => {
    result.sort(function(first, second) {
      return scores[second.code]/Math.log(3+second.name.length) - scores[first.code]/Math.log(3+first.name.length);
    });

    self.postMessage(result.slice(0,50));
    self.close();
  }
}