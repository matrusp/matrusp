var CACHE_NAME = "Matrusp";

//Lista de diretórios para serem mantidos no cache.
//Endereços não presentes nessa lista serão buscados da rede
self.alwaysDirs = [
  "./",
  "matrusp.webmanifest",
  "js/redirect.js",
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
  ].map(dir => new URL(dir,self.location.href).href);

self.onDemandDirs = [
  "data/" //Identificadores baixados serão salvos em cache
].map(dir => new URL(dir, self.location.href).href);

self.addEventListener('install', e => {
  // Verificar se todos os arquivos estão em cache quando o SW é instalado
  e.waitUntil(Promise.all(self.alwaysDirs.map(dir => fromCache(new Request(dir.href)))));
});

self.addEventListener('fetch', e => {
  // Responder a um fetch com uma resposta do cache(se o diretório estiver na lista)
  if(self.alwaysDirs.some(dir => e.request.url.indexOf(dir) > -1)) {
    e.respondWith(fromCache(e.request.clone(), true)); //Enviar mensagem de atualização ao cliente
  }
  else if(self.onDemandDirs.some(dir => e.request.url.indexOf(dir) > -1)) {
    e.respondWith(fromCache(e.request.clone(), false)); //Não enviar mensagem de atualização
  }

  // Senão, responder com um pedido para a rede
  else e.respondWith(fetch(e.request.clone()));
});

function fromCache(request, sendMessage) {
  return self.caches.open(CACHE_NAME).then(cache => cache.match(request).then(response => {
    if(!response) {
      // Se o pedido não for encontrado em cache, retornar da network e colocar o resultado em cache
      var fetchPromise = fetch(request);
      fetchPromise.then(async newresponse => {
        cache = await self.caches.open(CACHE_NAME);
        cache.add(request,newresponse);
      });
      return fetchPromise;
    }

    // Se o pedido for encontrado em cache, fazer um pedido para a rede e colocar em cache, mas retornar a resposta do cache
    //  antes que ele seja concluido. Enviar o ETag da resposta salva para evitar baixar conteúdo repetido.
    fetch(request.url, {method: 'GET', headers: {'If-None-Match': response.headers.get("ETag")}}).then(async newresponse => {
      if(newresponse.ok) {
        cache = await self.caches.open(CACHE_NAME);
        cache.add(request,newresponse);
        if(sendMessage) sendRefreshMessage();
      }
    }).catch(e => {});
    return response;
  }));
}

function sendRefreshMessage() {
  //Esperar 1s para enviar a mensagem ao cliente, para evitar que seja enviada antes de a UI estar carregada
  if(self.refreshTimeout) clearTimeout(self.refreshTimeout);
  self.refreshTimeout = setTimeout(() => self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage('refresh');
    });
  }),1000);
}