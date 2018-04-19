if(!('Worker' in window && 'indexedDB' in window)) {
  location.href = "https://bcc.ime.usp.br/matrusp_v1";
}

try { eval('() => {}'); }
catch(e) { location.href = "https://bcc.ime.usp.br/matrusp_v1"; }