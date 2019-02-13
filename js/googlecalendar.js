var CLIENT_ID = '430560648406-l8kpb80sv6ujde9snivv6rp4o9r8v48a.apps.googleusercontent.com';
var SCOPES = ["https://www.googleapis.com/auth/calendar"];
var immediate = false;

function checkAuth() {
  gapi.auth.authorize(
    {
      'client_id': CLIENT_ID,
      'scope': SCOPES.join(' '),
      'immediate': true
    }, handleOnLoadAuthResult);
}

function handleOnLoadAuthResult(authResult) {
  if (authResult && !authResult.error) {
      immediate = true;
  } else {
      immediate = false;
  }
}

function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    immediate = true;
    loadCalendarApi();
  } else {
    immediate = false;
  }
}

function handleGAuthClick(event) {
  if (state.plans[state.activePlanIndex].activeCombination == null) {
    alert("Insira uma ou mais matérias antes exportar para o Google Calendar");
    return;
  }
  gapi.auth.authorize(
    {client_id: CLIENT_ID, scope: SCOPES, immediate: immediate},
    handleAuthResult);
  return false;
}

function loadCalendarApi() {
  gapi.client.load('calendar', 'v3', addGcalCalendar);
}

function addGcalCalendar() {
  var request = gapi.client.calendar.calendars.insert({
   'summary': `MatrUSP ${new Date().getFullYear()}`,
   });

  request.execute(cal => addGcalEvents(cal.id));
   
}

function addGcalEvents(calID) {
  state.activePlan.activeCombination.classroomGroups.map(group => group[0]).forEach(classroom => {
    classroom.schedules.forEach(schedule => {
      var event = {
        'summary': `Aula de ${classroom.parent.name} (${classroom.parent.code})`,
        'start': {
          'dateTime': schedule.dateBegin.clone().add({hours: schedule.timeBegin.getHours(), minutes: schedule.timeBegin.getMinutes()}).toISOString(),
          'timeZone': 'America/Sao_Paulo'
        },
        'end': {
          'dateTime': schedule.dateBegin.clone().add({hours: schedule.timeEnd.getHours(), minutes: schedule.timeEnd.getMinutes()}).toISOString(),
          'timeZone': 'America/Sao_Paulo'
        },
        'recurrence': [
          `RRULE:FREQ=WEEKLY;UNTIL=${classroom.dateEnd.clone().add({hours: schedule.timeEnd.getHours(), minutes: schedule.timeEnd.getMinutes()}).toIcalString()}`
        ]
      };
      var request = gapi.client.calendar.events.insert({
       'calendarId': calID || 'primary',
       'resource': event
       });

       request.execute();
    });
  });
  window.open('https://calendar.google.com/calendar', '_blank');
}