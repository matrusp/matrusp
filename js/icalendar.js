var header_statement = 'BEGIN:VCALENDAR\r\n' +
  'PRODID:-\r\n' +
  'VERSION:2.0\r\n';

// '\r\n' instead of '\n' for compliance with RFC 5545

//TODO: Decidir se a definição de timezones será utilizada
var time_zones_statement = 'BEGIN:VTIMEZONE\r\n' +
  'TZID:America/Sao_Paulo\r\n' +
  'X-LIC-LOCATION:America/Sao_Paulo\r\n' +
  'BEGIN:DAYLIGHT\r\n' +
  'TZOFFSETFROM:-0300\r\n' +
  'TZOFFSETTO:-0200\r\n' +
  'TZNAME:BRST\r\n' +
  'DTSTART:19701018T000000\r\n' +
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=3SU\r\n' +
  'END:DAYLIGHT\r\n' +
  'BEGIN:STANDARD\r\n' +
  'TZOFFSETFROM:-0300\r\n' +
  'TZOFFSETTO:-0300\r\n' +
  'TZNAME:BRT\r\n' +
  'DTSTART:19700215T000000\r\n' +
  'RRULE:FREQ=YEARLY;BYMONTH=2;BYDAY=3SU\r\n' +
  'END:STANDARD\r\n' +
  'END:VTIMEZONE\r\n';

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
  // ISO: YYYY-MM-DDTHH:mm:ss.sssZ
  // returned: YYYYMMDDTHHmmssZ
  return new Date().toISOString().replace(/-|:|\./g, "").slice(0, -4) + "Z";
}

function generate_uid(schedule) {
  return schedule.parent.parent.code + "T" + schedule.parent.code.replace(/ /g, "") + "D" + get_week_day_string(schedule) + "@" + document.location.hostname;
}

function build_event() {
  var events_statement = "";
  state.activePlan.activeCombination.classroomGroups.map(group => group[0]).forEach(classroom => {
    classroom.schedules.forEach(schedule => {
      events_statement += "BEGIN:VEVENT\r\n";
      events_statement += `DTSTART:${schedule.dateBegin.clone().add({hours: schedule.timeBegin.getHours(), minutes: schedule.timeBegin.getMinutes()}).toIcalString()}\r\n`;
      events_statement += `DTEND:${schedule.dateBegin.clone().add({hours: schedule.timeEnd.getHours(), minutes: schedule.timeEnd.getMinutes()}).toIcalString()}\r\n`;
      events_statement += `RRULE:FREQ=WEEKLY;UNTIL=${classroom.dateEnd.clone().add({hours: schedule.timeEnd.getHours(), minutes: schedule.timeEnd.getMinutes()}).toIcalString()}\r\n`;
      events_statement += `DTSTAMP:${get_utc_current_date_and_time()}\r\n`;
      events_statement += `UID:${generate_uid(schedule)}\r\n`;
      events_statement += "SEQUENCE:0\r\n";
      events_statement += "STATUS:CONFIRMED\r\n";
      events_statement += `SUMMARY: Aula de ${classroom.parent.name} (${classroom.parent.code})\r\n`;
      events_statement += `DESCRIPTION:${classroom.obs? classroom.obs.replace(/\r\n/,' ') : ''}\r\n`;
      events_statement += "TRANSP:OPAQUE\r\n";
      events_statement += "END:VEVENT\r\n";
    });
  });
  return events_statement;
}

function download_icalendar() {
  if (state.activePlan.activeCombination == null) {
    ui.showBanner("Insira uma ou mais matérias antes de exportar para um arquivo ics", 2000);
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