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
  gapi.client.load('calendar', 'v3', addGcalEvents);
}

function get_class_begin_date_google(classroom, schedule) {
  var string_date = classroom.data_inicio.split("/");
  var begin_date = new Date();
  begin_date.setDate(parseInt(string_date[0]));
  begin_date.setMonth(parseInt(string_date[1]) - 1);
  begin_date.setFullYear(parseInt(string_date[2]));
  begin_date.setDate(begin_date.getDate() + (get_week_day_number(schedule) + ( 7 - begin_date.getDay())) % 7);
  var final_string_date = begin_date.getFullYear().toString() + "-";
  if (begin_date.getMonth() < 10) final_string_date = final_string_date + "0" + (begin_date.getMonth() + 1).toString() + "-";
  else final_string_date += (begin_date.getMonth() + 1).toString();
  if (begin_date.getDate() < 10) final_string_date = final_string_date + "0" + begin_date.getDate().toString();
  else final_string_date += begin_date.getDate().toString();
  return final_string_date;
}

function get_schedule_start_time_google(schedule) {
  return schedule.timeBegin + ":00";
}

function get_schedule_end_time_google(schedule) {
  return schedule.timeEnd + ":00";
}

function addGcalCalendar() {
  var request = gapi.client.calendar.calendars.insert({
   'summary': 'MatrUSP',
   });

   var cal = request.execute();
   addGcalEvents(cal.id);
}

function addGcalEvents(calID) {
  state.activePlan.activeCombination.classroomGroups.map(group => group[0]).forEach(classroom => {
    classroom.schedules.forEach(schedule => {
      var event = {
        'summary': 'Aula de ' + get_title(classroom),
        'start': {
          'dateTime': schedule.dateBegin.clone().add({hours: schedule.timeBegin.getHours(), minutes: schedule.timeBegin.getMinutes()}).toISOString,
          'timeZone': 'America/Sao_Paulo'
        },
        'end': {
          'dateTime': schedule.dateBegin.clone().add({hours: schedule.timeEnd.getHours(), minutes: schedule.timeEnd.getMinutes()}).toISOString(),
          'timeZone': 'America/Sao_Paulo'
        },
        'recurrence': [
          `RRULE:FREQ=WEEKLY;UNTIL=${classroom.dateEnd.clone().add({hours: schedule.timeEnd.getHours(), minutes: schedule.timeEnd.getMinutes()}).toISOString()};`
        ]
      };
      var request = gapi.client.calendar.events.insert({
       'calendarId': calID || 'primary',
       'resource': event
       });

       request.execute(function (event) {
       });
    });
  });
  window.open('https://calendar.google.com/calendar', '_blank');
}