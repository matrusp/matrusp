var CACHE_NAME = "Matrusp";

self.recentFetches = [];

//Lista de diretórios que obedecem o padrão Cache-Update-Refresh.
//Endereços não presentes nessas listas serão buscados da rede sempre
self.CURDirs = [
  "/",
  "/matrusp.webmanifest",
  "/js/.+",
  "/styles/.+",
  "/images/.+"
  ].map(dir => new RegExp(`^${self.location.origin}.+${dir}$`));

//Lista de diretórios que seguem o modelo Network-Cache
self.NCDirs = [
  "/data/.+" //Identificadores baixados não mostrarão mensagem de atualização
].map(dir => new RegExp(`^${self.location.origin}.+${dir}$`));

self.addEventListener('install', e => {self.skipWaiting(); }) // Ativar o SW imediatamente

self.addEventListener('fetch', e => {
  // Responder a um fetch com uma resposta do cache(se o diretório estiver na lista)
  if(self.CURDirs.some(dir => dir.test(e.request.url))) {
    e.respondWith(cacheUpdateRefresh(e.request.clone())); //Envia mensagem de atualização ao cliente
  }
  else if(self.NCDirs.some(dir => dir.test(e.request.url))) {
    e.respondWith(networkCache(e.request.clone())); //Não envia mensagem de atualização
  }

  // Senão, responder com um pedido para a rede
  else e.respondWith(fetch(e.request.clone()));
});

function cacheUpdateRefresh(request) {
  return self.caches.open(CACHE_NAME).then(cache => cache.match(request).then(response => {
    if(!response) {
      // Se o pedido não for encontrado em cache, retornar da network e colocar o resultado em cache
      var fetchPromise = fetch(request);
      fetchPromise.then(async newresponse => {
        newresponse = newresponse.clone();
        cache = await self.caches.open(CACHE_NAME);
        cache.put(request,newresponse);
      });
      return fetchPromise;
    }

    // Se o pedido for encontrado em cache, fazer um pedido para a rede e colocar em cache, mas retornar a resposta do cache
    //  antes que ele seja concluido. Enviar o ETag da resposta salva para evitar baixar conteúdo repetido.
    var promise = fetch(request.url, {method: 'GET', headers: {'If-None-Match': response.headers.get("ETag").replace('-gzip','')}}).then(async newresponse => {
      if(newresponse.ok) {
        cache = await self.caches.open(CACHE_NAME);
        cache.put(request,newresponse);
        sendRefreshMessage();
      }
    }).catch(e => {});
    self.recentFetches.push(promise);
    return response;
  }));
}

function sendRefreshMessage() {
  //Esperar 1s para enviar a mensagem ao cliente, para evitar que seja enviada antes de a UI estar carregada
  //Verificar se após 1s ainda existe algum fetch pendente, e esperar
  if(self.refreshTimeout) clearTimeout(self.refreshTimeout);
  self.refreshTimeout = setTimeout(() => self.clients.matchAll().then(clients => {
    Promise.all(self.recentFetches).then(() => {
      clients.forEach(client => {
        client.postMessage('refresh');
      });
    });
    self.recentFetches = [];
  }),1000);
}

async function networkCache(request) {
  var cacheResponse = await self.caches.open(CACHE_NAME).then(cache => cache.match(request));

  //Tentar obter a resposta da rede, se não conseguir, retornar a do cache
  try {
    var netResponse = await fetch(request.url, {method: 'GET', headers: {'If-None-Match': cacheResponse ? cacheResponse.headers.get("ETag").replace('-gzip','') : ''}});
    if(netResponse.ok) {
      await self.caches.open(CACHE_NAME).then(cache => cache.put(request,netResponse.clone()));
      return netResponse;
    }
    else return cacheResponse;
  }

  //Caso ocorra algum erro, retornar a resposta do cache. Se não houver, propagar o erro
  catch(e) {
    if(cacheResponse)
      return cacheResponse;
    else throw e;
  }
}