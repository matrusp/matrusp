function SaveBox() {
    this.html = {
        saveBox: document.getElementById('save-controller'),
        save: document.getElementById('save-button'),
        load: document.getElementById('load-button'),
        identifier: document.getElementById('user-identifier'),
    }

    this.html.save.addEventListener('click', e => {
        if(state.saveOnServer(this.html.identifier.value));
            this.html.identifier.value = state.identifier;
    });

    this.html.load.addEventListener('click', e => {
        state.loadFromServer(this.html.identifier.value);
    });
}