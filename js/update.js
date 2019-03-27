if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('message', e => {
    if(e.data == "refresh")
        ui.showBanner("Uma atualização está disponível. <a href='' target='_blank'>Clique</a> para aplicar.");
  });
}