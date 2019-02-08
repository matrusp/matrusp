var header_statement = 'BEGIN:VCALENDAR\n' +
  'PRODID:-\n' +
  'VERSION:2.0\n';

//TODO: Decidir se a definição de timezones será utilizada
var time_zones_statement = 'BEGIN:VTIMEZONE\n' +
  'TZID:America/Sao_Paulo\n' +
  'X-LIC-LOCATION:America/Sao_Paulo\n' +
  'BEGIN:DAYLIGHT\n' +
  'TZOFFSETFROM:-0300\n' +
  'TZOFFSETTO:-0200\n' +
  'TZNAME:BRST\n' +
  'DTSTART:19701018T000000\n' +
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=3SU\n' +
  'END:DAYLIGHT\n' +
  'BEGIN:STANDARD\n' +
  'TZOFFSETFROM:-0300\n' +
  'TZOFFSETTO:-0300\n' +
  'TZNAME:BRT\n' +
  'DTSTART:19700215T000000\n' +
  'RRULE:FREQ=YEARLY;BYMONTH=2;BYDAY=3SU\n' +
  'END:STANDARD\n' +
  'END:VTIMEZONE\n';

var final_statement = 'END:VCALENDAR';

function get_week_day_string(schedule) {
  if (schedule.day == 'dom') return 'SU';
  if (schedule.day == 'seg') return 'MO';
  if (schedule.day == 'ter') return 'TU';
  if (schedule.day == 'qua') return 'WE';
  if (schedule.day == 'qui') return 'TH';
  if (schedule.day == 'sex') return 'FR';
  if (schedule.day == 'sab') return 'SA';
}

function get_week_day_number(schedule) {
  if (schedule.day == 'dom') return 0;
  if (schedule.day == 'seg') return 1;
  if (schedule.day == 'ter') return 2;
  if (schedule.day == 'qua') return 3;
  if (schedule.day == 'qui') return 4;
  if (schedule.day == 'sex') return 5;
  if (schedule.day == 'sab') return 6;
}

function get_utc_current_date_and_time() {
  return new Date().toISOString().replace(/-|:|\./g, "");
}

function generate_uid(schedule) {
  return schedule.parent.parent.code + "T" + schedule.parent.code.replace(/ /g, "") + "D" + get_week_day_string(schedule) + "@" + document.location.hostname;
}

function get_class_end_date(classroom) {
  var date = classroom.dateEnd.split("/");
  return date[2] + date[1] + date[0];
}

function get_class_begin_date(classroom, schedule) {
  var string_date = classroom.dateBegin.split("/");
  var begin_date = new Date();
  begin_date.setDate(parseInt(string_date[0]));
  begin_date.setMonth(parseInt(string_date[1]) - 1);
  begin_date.setFullYear(parseInt(string_date[2]));
  begin_date.setDate(begin_date.getDate() + (get_week_day_number(schedule) + ( 7 - begin_date.getDay())) % 7);
  var final_string_date = begin_date.getFullYear().toString();
  if (begin_date.getMonth() < 10) final_string_date = final_string_date + "0" + (begin_date.getMonth() + 1).toString();
  else final_string_date += (begin_date.getMonth() + 1).toString();
  if (begin_date.getDate() < 10) final_string_date = final_string_date + "0" + begin_date.getDate().toString();
  else final_string_date += begin_date.getDate().toString();
  return final_string_date;
}

function get_schedule_start_time(schedule) {
  return schedule.timeBegin.replace(/:/g, "") + "00";
}

function get_schedule_end_time(schedule) {
  return schedule.timeEnd.replace(/:/g, "") + "00";
}

function get_title(classroom) {
  return `${classroom.parent.name} (${classroom.parent.code})`;
}

function build_event() {
  var events_statement = "";
  state.activePlan.activeCombination.classroomGroups.map(group => group[0]).forEach(classroom => {
    classroom.schedules.forEach(schedule => {
      events_statement += "BEGIN:VEVENT\n";
      events_statement += `DTSTART:${schedule.dateBegin.clone().add({hours: schedule.timeBegin.getHours(), minutes: schedule.timeBegin.getMinutes()}).toISOString()}\n`;
      events_statement += `DTEND:${schedule.dateBegin.clone().add({hours: schedule.timeEnd.getHours(), minutes: schedule.timeEnd.getMinutes()}).toISOString()}\n`;
      events_statement += `RRULE:FREQ=WEEKLY;UNTIL=${classroom.dateEnd.clone().add({hours: schedule.timeEnd.getHours(), minutes: schedule.timeEnd.getMinutes()}).toISOString()};BYDAY=\n`;
      events_statement += `DTSTAMP:${Date.now()}\n`;
      events_statement += `UID:${generate_uid(schedule)}\n`;
      events_statement += "SEQUENCE:0\n";
      events_statement += "STATUS:CONFIRMED\n";
      events_statement += `SUMMARY: Aula de ${get_title(classroom)}\n`;
      events_statement += `DESCRIPTION:${classroom.obs? classroom.obs.replace(/\n/,' ') : ''}\n`;
      events_statement += "TRANSP:OPAQUE\n";
      events_statement += "END:VEVENT\n";
    });
  });
  return events_statement;
}

function download_icalendar() {
  if (state.activePlan.activeCombination == null) {
    ui.showBanner("Insira uma ou mais matérias antes exportar para um arquivo ics", 2000);
    return;
  }
  var element = document.createElement('a');
  element.style.display = 'none';
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(header_statement + build_event() + final_statement));
  element.setAttribute('download', 'calendario_matrusp.ics');
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}