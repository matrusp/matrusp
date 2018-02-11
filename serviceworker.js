var CACHE_NAME = "Matrusp";

var cacheDirs = [
  "./",
  "js/classroom.js",
  "js/combination.js",
  "js/custom_lib.js",
  "js/database.js",
  "js/fbhelper.js",
  "js/googlecalendar.js",
  "js/es6-promise.auto.min.js",
  "js/html2canvas.min.js",
  "js/icalendar.js",
  "js/image.js",
  "js/jspdf.min.js",
  "js/jspdf.plugin.autotable.js",
  "js/lecture.js",
  "js/main.js",
  "js/pdf.js",
  "js/plan.js",
  "js/polyfill.js",
  "js/schedule.js",
  "js/search_box.js",
  "js/state.js",
  "js/ui.js",
  "js/vfs_fonts.js",
  "js/file.js",
  "js/dbhelpers.js",
  "js/dbsearch.js",
  "js/dbupdate.js",
  "styles/css/application.css",
  "images/ic_add.png",
  "images/ic_arrow_down.png",
  "images/ic_arrow_up.png",
  "images/ic_calendar.png",
  "images/ic_close.png",
  "images/ic_delete.png",
  "images/ic_download.png",
  "images/ic_email.png",
  "images/ic_facebook.png",
  "images/ic_print.png",
  "images/ic_upload.png",
  "images/stripes.gif"
];

self.addEventListener('install', e => {
  cacheDirs = cacheDirs.map(dir => new URL(dir,self.location.href));
  e.waitUntil(Promise.all(cacheDirs.map(dir => fromCache(new Request(dir.href)))));
});

self.addEventListener('fetch', e => {
  if(cacheDirs.some(dir => dir == e.request.url)) {
    e.respondWith(fromCache(e.request.clone()));
  }

  else e.respondWith(fetch(e.request.clone()).catch(e => {}));
});

function fromCache(request) {
  return self.caches.open(CACHE_NAME).then(cache => cache.match(request)).then(response => {
    if(!response) {
      var fetchPromise = fetch(request);
      fetchPromise.then(newresponse => self.caches.open(CACHE_NAME).then(cache => cache.add(request,newresponse))).catch(e => {});
      return fetchPromise;
    }

    fetch(request.url, {method: 'GET', headers: {'If-None-Match': response.headers.get("ETag")}}).then(newresponse => newresponse.ok ? self.caches.open(CACHE_NAME).then(cache => cache.add(request,newresponse)) : false).catch(e => {});
    return response;
  });
}

function refresh(response) {
  return self.clients.matchAll().then(function (clients) {
    clients.forEach(function (client) {
    var message = {
        type: 'refresh',
        url: response.url,eTag: response.headers.get('ETag')
      };
    client.postMessage(JSON.stringify(message));
    });
  });
}