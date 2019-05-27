/**
 * A singleton class representing the state.
 * 
 * @Constructor
 *
 * @example
 *  var stateExemple = {
 *    version: 7,
 *    lastColor: 0,
 *    activePlanIndex: 0,
 *    plans: [{@link Plan}]
 *  }
 *
 * @see Plan
 */
function State() {
  this.plans = [];
  this.removedPlans = [];

  this.html = {
    upload: document.getElementById('upload-input'),
    download: document.getElementById('download')
  }
  this.addEventListeners();

  // variable set on main.js
  this.version = matrusp_current_state_version;
}

State.prototype = {
  get activePlan () {
    return this._activePlan;
  },
  set activePlan(plan){
    if(plan == this._activePlan) return;
    
    if(this._activePlan)
      this._activePlan.hidePlan();
    this._activePlan = plan;

    if(plan)
      this._activePlan.showPlan();

    ui.scrollActivePlanTabToView();

    this.saveOnLocalStorage();
  },

  get activePlanIndex() {
    return this.plans.indexOf(this._activePlan);
  },
  set activePlanIndex(index) {
    if(index >= 0)
      this.activePlan = this.plans[index];
  },

  get identifier() {
    return this._identifier;
  },
  set identifier(identifier) {
    this._identifier = identifier;
    if(identifier) {
      document.title = `${identifier} - MatrUSP`;
      if(saveBox) saveBox.html.identifier.value = identifier;
    }
  }

}

State.prototype.clear = function() {
  this.plans.forEach(plan => plan.delete());
  this.identifier = undefined;
  this.plans = [];
}

/**
 * Load state data
 *
 * @param {baseState} BaseState State or json data to load
 */
State.prototype.load = function(baseState) {
  if (baseState) {
    if (baseState.version == 6) {
      var newState = {};
      newState.version = 7;
      newState.plans = [];
      newState.activePlanIndex = baseState.activePlanIndex;
      baseState.plans.forEach(plan => {
        if (!plan) return;
        var planData = {};
        planData.activeCombinationIndex = plan.activeCombinationIndex;
        planData.lectures = [];
        plan.lectures.forEach(lecture => {
          var lectureData = {};
          lectureData.code = lecture.code;
          lectureData.color = lecture.color;
          lectureData.selected = lecture.selected;
          lectureData.classrooms = [];

          lecture.classrooms.forEach(classroom => {
            if (classroom.selected)
              lectureData.classrooms.push('20181' + classroom.classroomCode);
          });

          planData.lectures.push(lectureData);
        });
        newState.plans.push(planData);
      });
      return this.load(newState);
    }
    if (isNaN(baseState.version) || baseState.version < matrusp_current_state_version) {
      // if the state being loaded is not updated, don't load.
      ui.showBanner('Este identificador não é mais válido.');
      return false;
    }

    this.clear();

    this.identifier = baseState.identifier;
    this.version = matrusp_current_state_version;

    if(baseState.plans.length) baseState.plans.forEach((basePlan, i) => this.plans.push(new Plan(basePlan, i == baseState.activePlanIndex)));
    else this.plans.push(new Plan());
    

    return true;
  }
  this.clear();
  this.plans.push(new Plan());
  this.activePlanIndex = 0;

  return true;
}

/**
 * Adds a lecture to the current active plan if no planIndex was given.
 *
 * @param {Lecture} lecture
 * @param {Number} [planIndex]
 */
State.prototype.addLecture = function(lecture, planIndex) {
  if (planIndex == null) {
    planIndex = this.activePlanIndex;
  }
  this.plans[planIndex].addLecture(lecture);
};

/**
 * Downloads the state as serialized JSON file.
 */
State.prototype.downloadFile = function() {
  var dataString = "data:text/json;charset=utf-8," + encodeURIComponent(this.toJSON());
  var element = document.createElement('a');
  element.setAttribute("href", dataString);
  element.style.display = 'none';
  if (document.getElementById('user-identifier').value) {
    element.setAttribute('download', document.getElementById('user-identifier').value + '.matrusp');
  } else {
    element.setAttribute('download', 'matrusp_' + (new Date).getFullYear() + '.matrusp');
  }
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

State.prototype.addEventListeners = function() {
};

/**
 * Saves the state on the server as a serialized JSON file.
 *
 * @param {identifier} Identifier The identifier that will point to this state on the server
 */
State.prototype.saveOnServer = function(identifier) {
  identifier = identifier || this.identifier;

  if (!identifier || identifier == '') {
    ui.showBanner('É necessário preencher o nome do identificador', 2000);
    return false;
  }

  var stateData = this.toJSON();
  this.saveOnLocalStorage(stateData);

  fetch(`./php/save.php?identifier=${encodeURIComponent(identifier)}`, {
    method: 'POST',
    body: `data=${encodeURIComponent(stateData)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    }
  }).then(response => {
    if (response.ok) {
      ui.showBanner(`Identificador "${identifier}" salvo com sucesso`, 2000);
      fetch(`./data/${identifier}.json`); //Fetch from server to save on cache
      this.identifier = identifier;
      return true;
    }
    else
      ui.showBanner('Algum erro ocorreu, salve o identificador novamente', 2000);
  }).catch(error => {
    ui.showBanner('Algum erro ocorreu, salve o identificador novamente', 2000);
    throw error;
  });
}

/**
 * Serialize state as a JSON string
 */
State.prototype.toJSON = function() {
  var stateData = {};
  stateData.version = this.version;
  stateData.lastColor = this.lastColor;
  stateData.identifier = this.identifier;
  stateData.plans = this.plans.map(plan => plan.serialize());
  stateData.activePlanIndex = this.activePlanIndex;
  return JSON.stringify(stateData);
}

/**
 * Loads the state from the server.
 *
 * @param {identifier} Identifier The identifier to fetch on the server
 */
State.prototype.loadFromServer = function(identifier) {  
  if (!identifier) {
    ui.showBanner('É necessário preencher o nome do identificador', 2000);
    return;
  }

  fetch(`data/${identifier.replace(/[^\w]/g, '')}.json`).then(response => {
    if (response.ok)
      response.json().then(json => {
        this.load(json);
        ui.showBanner(`Identificador "${identifier}" carregado com sucesso`, 2000);
        this.identifier = identifier;
      });
    else
    if (response.status === 404)
      ui.showBanner('Identificador não encontrado no servidor', 2000);
    else
      ui.showBanner('Não foi possível carregar o identificador. Tente novamente', 2000);
  }).catch(error => {
    ui.showBanner('Não foi possível carregar o identificador. Tente novamente', 2000);
    throw error
  });
}


State.prototype.saveOnLocalStorage = function(stateData) {
  stateData = stateData || this.toJSON();

  try {
    localStorage.setItem('state', stateData);
  }
  catch (ex) {
    ui.showBanner("Não foi possível salvar seu plano automaticamente pois ele excede o tamanho máximo permitido pelo navegador.\n Recomendamos que baixe o arquivo para mantê-lo");        
  }
}

State.prototype.addPlan = function(planData, asActivePlan) {
  var plan = new Plan(planData, asActivePlan);
  this.plans.push(plan);
  this.saveOnLocalStorage();
  return plan;
}

State.prototype.removePlan = function(plan) {
  if(plan.lectures.length)
    this.removedPlans.push(plan.serialize());
  
  var index = this.plans.indexOf(plan);
  if(index < 0) return;

  this.plans.splice(index,1);

  if(this.activePlan == plan) {
    this.activePlan = null;
    plan.delete();

    if(index <= this.plans.length - 1) {
      this.activePlanIndex = index;
    }
    else if(index > 0) {
      this.activePlanIndex = index - 1 
    }
    else {
      this.activePlan = this.addPlan();
    }
  }
  else {
    plan.delete();
    this.saveOnLocalStorage();
  }

  ui.refreshPlanPaddles();
}

State.prototype.copyPlan = function(plan) {
  return this.addPlan(plan.serialize());
}