var CACHE_NAME = "Matrusp";

self.cacheDirs = [
  "./",
  "matrusp.webmanifest",
  "js/classroom.js",
  "js/combination.js",
  "js/custom_lib.js",
  "js/fbhelper.js",
  "js/googlecalendar.js",
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
  "js/dexie.min.js",
  "js/dbhelpers.js",
  "js/dbsearch.js",
  "js/dbupdate.js",
  "styles/css/application.css",
  "images/matrusp16.png",
  "images/matrusp24.png",
  "images/matrusp32.png",
  "images/matrusp48.png",
  "images/matrusp64.png",
  "images/matrusp128.png",
  "images/matrusp192.png",
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
  ].map(dir => new URL(dir,self.location.href));

self.addEventListener('install', e => {
  e.waitUntil(Promise.all(self.cacheDirs.map(dir => fromCache(new Request(dir.href)))));
});

self.addEventListener('fetch', e => {
  if(self.cacheDirs.some(dir => dir == e.request.url)) {
    e.respondWith(fromCache(e.request.clone()));
  }

  else e.respondWith(fetch(e.request.clone()));
});

function fromCache(request) {
  return self.caches.open(CACHE_NAME).then(cache => cache.match(request).then(response => {
    if(!response) {
      var fetchPromise = fetch(request);
      fetchPromise.then(newresponse => self.caches.open(CACHE_NAME).then(cache => cache.add(request,newresponse)));
      return fetchPromise;
    }

    fetch(request.url, {method: 'GET', headers: {'If-None-Match': response.headers.get("ETag")}}).then(newresponse => newresponse.ok ? self.caches.open(CACHE_NAME).then(cache => {cache.add(request,newresponse); refresh()}) : false).catch(e => {});
    return response;
  }));
}

function refresh() {
  if(self.refreshTimeout) clearTimeout(self.refreshTimeout);
  self.refreshTimeout = setTimeout(() => self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage('refresh');
    });
  }),1000);
}