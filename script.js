const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbykSS-6xzOsejovke5tto2wxoioFC2YrMgqGnhvdbmcFYjaMcSLscFlZ1MfiCicAVdMVA/exec";
let curField = "", curUser = "Admin", curMoveType = "INCOMING", moveRows = [{date:"", whom:"", office:""}];

function go(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (btn) { document.querySelectorAll('nav button').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
  window.scrollTo(0, 0);
  if (id == 'home') loadCountsOnly();
  if (id == 'incoming') loadMails();
  if (id == 'dailyPage') loadDaily();
}
function hideModals() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }
function api(a, p = "") {
  if (SCRIPT_URL.includes("YOUR_ID")) { alert("Set Apps Script URL in script.js line 1"); return Promise.reject(); }
  return fetch(`${SCRIPT_URL}?action=${a}&${p}`).then(r => r.json());
}
// POST - FOR CSV - NO URL LIMIT, NO CORS
function apiPost(action, payload) {
  return fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({ action: action }, payload))
  }).then(r => r.json());
}
function esc(s) { return String(s || "").replace(/&/g, "&amp;"); }
setInterval(() => { let d = new Date(); let el = document.getElementById('clock'); if (el) el.innerText = d.toLocaleString(); }, 1000);

// DASHBOARD - COUNT ONLY - NO DETAILS
function loadCountsOnly() { api("stats").then(j => { document.getElementById('sMail').innerText = j.mails; document.getElementById('sFile').innerText = j.files; document.getElementById('sMove').innerText = j.moves; document.getElementById('sDeep').innerText = j.deep; }); }
function loadAll() { loadCountsOnly(); }

function saveMail() {
  let ref = document.getElementById('mRef').value.trim(), name = document.getElementById('mName').value.trim(), ag = document.getElementById('mAgency').value.trim(), d = document.getElementById('mDate').value, t = document.getElementById('mTime').value;
  if (!ref || !name || !ag) return alert("Fill Reference, Mail Name, Agency");
  api("addMail", `refNo=${encodeURIComponent(ref)}&mailName=${encodeURIComponent(name)}&agency=${encodeURIComponent(ag)}&date=${d}&time=${t}`).then(() => { alert("SUCCESSFUL! Mail Saved"); ['mRef','mName','mAgency','mDate','mTime'].forEach(id => document.getElementById(id).value = ''); loadMails(); loadCountsOnly(); });
}
function loadMails() {
  let q = document.getElementById('mailSearch') ? document.getElementById('mailSearch').value : "";
  api("getMails", `q=${encodeURIComponent(q)}`).then(j => {
    let h = `<table><tr><th>REF NO</th><th>MAIL NAME</th><th>AGENCY</th><th>DATE / TIME</th></tr>`;
    j.data.forEach(x => h += `<tr><td><b>${esc(x[0])}</b></td><td>${esc(x[1])}</td><td>${esc(x[2])}</td><td>${esc(x[3])} ${esc(x[4])}</td></tr>`);
    h += `</table>`; if (!j.data.length) h = "No mails found";
    document.getElementById('mailList').innerHTML = h;
  });
}
function openFieldLogin(field) {
  curField = field;
  document.getElementById('loginTitle').innerText = field == "CREAT_FILE" ? "CREAT FILE - Login" : "FILE MOVEMENT - Login";
  document.getElementById('loginSub').innerText = "Enter your name + password. Default Admin: admin123.";
  document.getElementById('loginModal').style.display = 'flex';
}
function doFieldLogin() {
  let name = document.getElementById('loginName').value.trim(), pass = document.getElementById('loginPass').value.trim();
  if (!name || !pass) return alert("Enter Name and Password");
  api("checkFieldLogin", `field=${curField}&name=${encodeURIComponent(name)}&pass=${encodeURIComponent(pass)}`).then(j => {
    if (!j.valid) return alert("Invalid Password - Contact ADMIN");
    curUser = j.name; document.getElementById('topUser').innerText = "Welcome, " + curUser; hideModals();
    if (curField == "CREAT_FILE") { document.getElementById('welcomeCreate').innerText = "Welcome, " + curUser; go('createFile', document.querySelectorAll('nav button')[2]); loadFiles(); }
    else { document.getElementById('welcomeMove').innerText = "Welcome, " + curUser; go('movement', document.querySelectorAll('nav button')[3]); showMoveTab('INCOMING'); }
  });
}
function logoutField() { curUser = "Guest"; document.getElementById('topUser').innerText = "Guest"; go('home', document.querySelectorAll('nav button')[0]); }
function saveFile() {
  let no = document.getElementById('fNo').value.trim(), fn = document.getElementById('fName').value.trim(), mr = document.getElementById('fMailRef').value.trim(), mn = document.getElementById('fMailName').value.trim(), d = document.getElementById('fDate').value, off = document.getElementById('fOfficer').value.trim();
  if (!no || !fn || !mr) return alert("Fill File Number, File Name, Mail Ref");
  api("addFile", `fileNo=${encodeURIComponent(no)}&fileName=${encodeURIComponent(fn)}&mailRef=${encodeURIComponent(mr)}&mailName=${encodeURIComponent(mn)}&dateCreated=${d}&officer=${encodeURIComponent(off)}`).then(() => { alert("SUCCESSFUL! File Created"); ['fNo','fName','fMailRef','fMailName','fDate','fOfficer'].forEach(id => document.getElementById(id).value = ''); loadFiles(); loadCountsOnly(); });
}
function loadFiles() {
  api("getFiles").then(j => {
    let h = ""; j.data.forEach(x => h += `<div class="fileItem" onclick="viewFile('${esc(x[0])}')"><b>${esc(x[0])}</b> - ${esc(x[1])}<br><small>Mail: ${esc(x[2])} | ${esc(x[3])} | Officer: ${esc(x[5])} | ${esc(x[4])}</small><br><span style="color:#2563eb;font-size:12px">Click to view all mails on this file →</span></div>`);
    if (!j.data.length) h = "No files yet"; document.getElementById('fileList').innerHTML = h;
  });
}
function viewFile(no) {
  api("getFileMails", `fileNo=${encodeURIComponent(no)}`).then(j => {
    let h = `<div style="background:#FFFBEB;padding:12px;margin-top:10px"><h4>All Mails on File: ${esc(no)}</h4><table><tr><th>Mail Ref</th><th>Mail Name</th><th>Date</th><th>Officer</th></tr>`;
    j.data.forEach(x => h += `<tr><td>${esc(x[2])}</td><td>${esc(x[3])}</td><td>${esc(x[4])}</td><td>${esc(x[5])}</td></tr>`);
    h += `</table></div>`; document.getElementById('fileDetail').innerHTML = h;
  });
}
function showMoveTab(t) {
  curMoveType = t; moveRows = [{date:"", whom:"", office:""}];
  if (t == "DEEP") {
    document.getElementById('moveBox').innerHTML = `<div class="card"><h3>DEEP FILES</h3><input id="dNo" placeholder="FILE NUMBER *"><input id="dName" placeholder="FILE NAME *"><label>Date</label><input id="dDate" type="date"><button class="btnGold full" onclick="saveDeep()">SAVE DEEP FILE</button></div>`;
  } else {
    let label = t == "INCOMING" ? "WHOM FROM" : "WHOM TO";
    document.getElementById('moveBox').innerHTML = `<div class="card"><h3>${t} FILE</h3><input id="mvNo" placeholder="FILE NUMBER *"><input id="mvName" placeholder="FILE NAME *"><div id="moveRows"></div><button class="btnLight" onclick="addMoveRow()">+ ADD MOVEMENT</button> <button class="btnLight" onclick="delMoveRow()">- Delete MOVEMENT</button><button class="btnGold full" onclick="saveMovement('${t}')">SAVE MOVEMENT</button></div>`;
    renderMoveRows(label);
  }
  loadMoveList(t);
}
function renderMoveRows(label) {
  let h = ""; moveRows.forEach((r, i) => { h += `<div style="border:1px solid #EDEFF2;padding:10px;margin:6px 0"><b>Movement ${i+1}</b><label>Date</label><input type="date" class="mrDate" value="${r.date}"><input class="mrWhom" placeholder="${label} *" value="${r.whom}"><input class="mrOffice" placeholder="OFFICE *" value="${r.office}"></div>`; });
  document.getElementById('moveRows').innerHTML = h;
}
function addMoveRow() {
  let ds = document.querySelectorAll('.mrDate'), ws = document.querySelectorAll('.mrWhom'), os = document.querySelectorAll('.mrOffice');
  moveRows = []; ds.forEach((d, i) => moveRows.push({ date: d.value, whom: ws[i].value, office: os[i].value })); moveRows.push({ date:"", whom:"", office:"" });
  renderMoveRows(curMoveType == "INCOMING" ? "WHOM FROM" : "WHOM TO");
}
function delMoveRow() { if (moveRows.length > 1) moveRows.pop(); renderMoveRows(curMoveType == "INCOMING" ? "WHOM FROM" : "WHOM TO"); }
function saveMovement(type) {
  let no = document.getElementById('mvNo').value.trim(), fn = document.getElementById('mvName').value.trim();
  if (!no || !fn) return alert("Fill File Number and File Name");
  let ds = document.querySelectorAll('.mrDate'), ws = document.querySelectorAll('.mrWhom'), os = document.querySelectorAll('.mrOffice');
  let ps = []; ds.forEach((d, i) => { if (!ws[i].value) return; ps.push(api("addMovement", `type=${type}&fileNo=${encodeURIComponent(no)}&fileName=${encodeURIComponent(fn)}&date=${d.value}&whom=${encodeURIComponent(ws[i].value)}&office=${encodeURIComponent(os[i].value)}`)); });
  Promise.all(ps).then(() => { alert("SUCCESSFUL! Movement Saved"); loadMoveList(type); loadCountsOnly(); });
}
function saveDeep() {
  let no = document.getElementById('dNo').value.trim(), fn = document.getElementById('dName').value.trim(), d = document.getElementById('dDate').value;
  if (!no || !fn) return alert("Fill File Number and File Name");
  api("addDeep", `fileNo=${encodeURIComponent(no)}&fileName=${encodeURIComponent(fn)}&date=${d}`).then(() => { alert("SUCCESSFUL! Deep File Saved"); loadMoveList('DEEP'); loadCountsOnly(); });
}
function loadMoveList(t) {
  if (t == "DEEP") {
    api("getDeep").then(j => { let h = `<table><tr><th>FILE NO</th><th>FILE NAME</th><th>DATE</th></tr>`; j.data.forEach(x => h += `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td></tr>`); h += `</table>`; document.getElementById('moveList').innerHTML = j.data.length ? h : "No deep files yet"; });
  } else {
    api("getMovements", `type=${t}`).then(j => { let h = `<table><tr><th>FILE NO</th><th>FILE NAME</th><th>DATE</th><th>${t == "INCOMING" ? "WHOM FROM" : "WHOM TO"}</th><th>OFFICE</th></tr>`; j.data.forEach(x => h += `<tr><td>${esc(x[1])}</td><td>${esc(x[2])}</td><td>${esc(x[3])}</td><td>${esc(x[4])}</td><td>${esc(x[5])}</td></tr>`); h += `</table>`; document.getElementById('moveList').innerHTML = j.data.length ? h : "No movements yet"; });
  }
}
function doSearch() {
  let no = document.getElementById('sFileNo').value.trim(), type = document.getElementById('sFilter').value;
  if (!no) return alert("Enter FILE NUMBER");
  api("search", `fileNo=${encodeURIComponent(no)}&type=${encodeURIComponent(type)}`).then(j => {
    if (!j.data.length) return document.getElementById('searchResult').innerHTML = `<p style="margin-top:10px">No record found for ${esc(no)} - ${esc(type)}</p>`;
    let h = `<div style="background:#F0FDF4;padding:10px;margin-top:10px"><b>Result for ${esc(no)} - ${esc(type)} (Read Only)</b><table>`;
    if (type == "Deep Files") { h += `<tr><th>FILE NO</th><th>FILE NAME</th><th>DATE</th></tr>`; j.data.forEach(x => h += `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td></tr>`); }
    else { h += `<tr><th>FILE NO</th><th>FILE NAME</th><th>DATE</th><th>${type == "Incoming File" ? "WHOM FROM" : "WHOM TO"}</th><th>OFFICE</th></tr>`; j.data.forEach(x => h += `<tr><td>${esc(x[1])}</td><td>${esc(x[2])}</td><td>${esc(x[3])}</td><td>${esc(x[4])}</td><td>${esc(x[5])}</td></tr>`); }
    h += `</table></div>`; document.getElementById('searchResult').innerHTML = h;
  });
}
function saveDaily() {
  let p = `date=${document.getElementById('dDate').value}&fc=${document.getElementById('d1').value}&inb=${document.getElementById('d2').value}&outb=${document.getElementById('d3').value}&tpax=${document.getElementById('d4').value}&arr=${document.getElementById('d5').value}&dep=${document.getElementById('d6').value}&csltd=${document.getElementById('d7').value}&fsltd=${document.getElementById('d8').value}&cnom=${document.getElementById('d9').value}&fnom=${document.getElementById('d10').value}&shift=${document.getElementById('dShift').value}&officer=${encodeURIComponent(document.getElementById('dOfficer').value)}`;
  api("addDaily", p).then(() => { alert("SUCCESSFUL! Daily Report Saved"); loadDaily(); });
}
function loadDaily() {
  api("getDaily").then(j => {
    let h = `<table><tr><th>DATE</th><th>FLIGHT CLEARED</th><th>INBOUND</th><th>OUTBOUND</th><th>TOTAL PAX</th><th>ARR</th><th>DEP</th><th>CONF SLTD</th><th>FALSE SLTD</th><th>CONF NOM</th><th>FALSE NOM</th><th>SHIFT</th><th>OFFICER</th></tr>`;
    j.data.forEach(x => h += `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td><td>${esc(x[3])}</td><td>${esc(x[4])}</td><td>${esc(x[5])}</td><td>${esc(x[6])}</td><td>${esc(x[7])}</td><td>${esc(x[8])}</td><td>${esc(x[9])}</td><td>${esc(x[10])}</td><td>${esc(x[11])}</td><td>${esc(x[12])}</td></tr>`);
    h += `</table>`; document.getElementById('dailyList').innerHTML = j.data.length ? h : "No daily reports yet";
  });
}
function openAdminLogin() { document.getElementById('adminModal').style.display = 'flex'; }
function doAdminLogin() {
  let name = document.getElementById('adminName').value.trim(), pass = document.getElementById('adminPass').value.trim();
  if (!name || !pass) return alert("Enter Name and Password");
  api("checkAdmin", `pass=${encodeURIComponent(pass)}`).then(j => {
    if (!j.valid) return alert("Wrong Admin Password");
    curUser = name; document.getElementById('topUser').innerText = "Welcome, " + curUser; document.getElementById('welcomeAdmin').innerText = "Welcome, " + curUser; hideModals(); go('adminPage', document.querySelectorAll('nav button')[6]); showAdminTab('ISSUE');
  });
}
function showAdminTab(t) {
  if (t == "ISSUE") document.getElementById('adminBox').innerHTML = `<div class="card"><h3>ISSUE ACCESS</h3><input id="oName" placeholder="Officer Name *"><input id="oNis" placeholder="NIS Number *"><select id="oField"><option value="CREAT_FILE">CREAT FILE</option><option value="FILE_MOVEMENT">FILE MOVEMENT</option></select><input id="oPass" placeholder="Create Password *"><button class="btnGold full" onclick="issueAccess()">ACTIVATE</button></div>`;
  if (t == "SHOW") loadLogins();
  if (t == "RESET") document.getElementById('adminBox').innerHTML = `<div class="card"><h3>RESET PASSWORD - ADMIN</h3><input id="oldP" type="password" placeholder="OLD Password"><input id="newP" type="password" placeholder="NEW Password"><button class="btnGold full" onclick="doReset()">SAVE</button></div>`;
  if (t == "DAILY") document.getElementById('adminBox').innerHTML = `<div class="card"><h3>DAILY REPORT - ALL DATA</h3><div class="grid3"><select id="sumMode"><option>MONTHLY</option><option>YEARLY</option></select><input id="sumMonth" type="number" min="1" max="12" placeholder="Month 1-12"><input id="sumYear" type="number" placeholder="Year e.g. 2026" value="2026"></div><button class="btnGold full" onclick="doDailySummary()">SUMMARIZED → Show Total</button><button class="btnDark full" onclick="window.print()">PRINT</button><div id="dailySummary"></div><div id="adminDailyList"></div></div>`;
  if (t == "HIT") document.getElementById('adminBox').innerHTML = `
  <div class="card"><h3>HIT REPORT FORM</h3><div class="grid2">
  <div><label>DATE *</label><input id="hDate" type="date"></div><div><label>HIT OFFICER *</label><input id="hOfficer"></div>
  <div><label>HIT TYPE</label><select id="hType"><option>SLTD</option><option>NOMINAL</option></select></div><div><label>NOTICE</label><input id="hNotice" placeholder="Notice if Nominal"></div>
  <div><label>NATIONALITY</label><input id="hNat"></div><div><label>PASSPORT NUMBER</label><input id="hPass"></div>
  <div><label>ETA / ETD</label><input id="hEtaEtd" placeholder="e.g. 10:00 / 14:00"></div><div><label>POE / POD</label><input id="hPoePod" placeholder="e.g. ABUJA / LAGOS"></div>
  <div><label>NAME *</label><input id="hName"></div><div><label>GENDER</label><select id="hGender"><option>Male</option><option>Female</option></select></div>
  <div><label>CRIME</label><input id="hCrime"></div><div><label>ACTION</label><input id="hAction"></div>
  </div><button class="btnGold full" onclick="saveHit()">SAVE HIT REPORT</button></div>
  <div class="card"><h3>AUTOMATIC BATCH CSV UPLOAD FROM EXCEL</h3>
  <div class="csvBox"><p><b>Upload CSV / Excel Saved as CSV</b></p><small>Header must be exactly:<br>DATE,HIT OFFICER,HIT TYPE,NOTICE,NATIONALITY,PASSPORT NUMBER,ETA/ETD,POE/POD,NAME,GENDER,CRIME,ACTION<br><br>Do NOT upload .xlsx - Save Excel as .csv first</small><br><br>
  <input type="file" id="csvFile" accept=".csv,text/csv"><br>
  <button class="btnDark full" onclick="uploadHitCSV()"> SAVE TO DB</button>
  <div id="csvStatus" style="margin-top:10px;font-weight:700"></div></div>
  <button class="btnLight" onclick="downloadCSVTemplate()">DOWNLOAD CSV TEMPLATE</button> <button class="btnLight" onclick="testCSVConnection()">TEST CONNECTION</button></div>
  <div class="card"><h3>HIT SUMMARY</h3><div class="grid3"><select id="hSumMode"><option>MONTHLY</option><option>YEARLY</option></select><input id="hSumMonth" type="number" placeholder="Month"><input id="hSumYear" type="number" value="2026"></div><button class="btnDark full" onclick="doHitSummary()">SUMMARIZED</button><button class="btnGold full" onclick="window.print()">PRINT / DOWNLOAD AS PDF (Choose Save as PDF)</button><div id="hitSummary"></div><div id="hitListAdmin"></div></div>`;
  if (t == "SEARCHHIT") document.getElementById('adminBox').innerHTML = `<div class="card"><h3>SEARCH HIT - By Name Only</h3><p style="font-size:12px;color:#64748b">Only HIT REPORT data is shown here.</p><input id="hitSearch" placeholder="Search by NAME only"><button class="btnGold full" onclick="searchHit()">SEARCH HIT</button><div id="hitSearchResult"></div></div>`;
  if (t == "DAILY") loadDailyAdmin();
  if (t == "HIT") loadHitAdmin();
}
function issueAccess() {
  let n = document.getElementById('oName').value.trim(), nis = document.getElementById('oNis').value.trim(), f = document.getElementById('oField').value, p = document.getElementById('oPass').value.trim();
  if (!n || !nis || !p) return alert("Fill all fields");
  api("issueAccess", `name=${encodeURIComponent(n)}&nis=${encodeURIComponent(nis)}&field=${f}&pass=${encodeURIComponent(p)}`).then(() => { alert("SUCCESSFUL! Access Activated for " + n); showAdminTab('SHOW'); });
}
function loadLogins() {
  api("getLogins").then(j => {
    let h = `<div class="card"><h3>SHOW LOGINS</h3><table><tr><th>OFFICER</th><th>NIS</th><th>FIELD</th><th>PASSWORD</th><th>STATUS</th><th></th></tr>`;
    j.data.forEach(x => h += `<tr><td>${esc(x.name)}</td><td>${esc(x.nis)}</td><td><span class="badge2">${esc(x.field)}</span></td><td>${esc(x.pass)}</td><td><span class="badge">${esc(x.status)}</span></td><td><button class="btnLight" onclick="api('toggleLogin','nis=${esc(x.nis)}').then(()=>loadLogins())">Block / Unblock</button></td></tr>`);
    h += `</table></div>`; document.getElementById('adminBox').innerHTML = h;
  });
}
function doReset() { api("resetAdminPass", `oldPass=${encodeURIComponent(document.getElementById('oldP').value)}&newPass=${encodeURIComponent(document.getElementById('newP').value)}`).then(j => alert(j.status == "ok" ? "SUCCESSFUL! Password Changed" : "Wrong Old Password")); }
function loadDailyAdmin() {
  api("getDaily").then(j => {
    let h = `<table><tr><th>DATE</th><th>FLIGHT</th><th>IN</th><th>OUT</th><th>PAX</th><th>ARR</th><th>DEP</th><th>C-SLTD</th><th>F-SLTD</th><th>C-NOM</th><th>F-NOM</th><th>SHIFT</th><th>OFFICER</th></tr>`;
    j.data.forEach(x => h += `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td><td>${esc(x[3])}</td><td>${esc(x[4])}</td><td>${esc(x[5])}</td><td>${esc(x[6])}</td><td>${esc(x[7])}</td><td>${esc(x[8])}</td><td>${esc(x[9])}</td><td>${esc(x[10])}</td><td>${esc(x[11])}</td><td>${esc(x[12])}</td></tr>`);
    h += `</table>`; let el = document.getElementById('adminDailyList'); if (el) el.innerHTML = h;
  });
}
function doDailySummary() {
  let mode = document.getElementById('sumMode').value, mo = document.getElementById('sumMonth').value, y = document.getElementById('sumYear').value;
  api("summaryDaily", `mode=${mode}&month=${mo}&year=${y}`).then(j => {
    let s = j.summary;
    document.getElementById('dailySummary').innerHTML = `<div style="background:#FFFBEB;padding:14px;margin-top:10px;border:1px solid #B9975B"><h4>${mode} SUMMARY - ${mode == "MONTHLY" ? mo + "/" + y : y} - Total Entries: ${s.count}</h4><table><tr><th>FLIGHT CLEARED</th><th>INBOUND</th><th>OUTBOUND</th><th>TOTAL PAX</th><th>ARR</th><th>DEP</th><th>CONF SLTD</th><th>FALSE SLTD</th><th>CONF NOM</th><th>FALSE NOM</th></tr><tr><td><b>${s.fc}</b></td><td><b>${s.inb}</b></td><td><b>${s.outb}</b></td><td><b>${s.tpax}</b></td><td><b>${s.arr}</b></td><td><b>${s.dep}</b></td><td><b>${s.csltd}</b></td><td><b>${s.fsltd}</b></td><td><b>${s.cnom}</b></td><td><b>${s.fnom}</b></td></tr></table><button class="btnDark" onclick="window.print()">PRINT SUMMARY</button></div>`;
  });
}

// SINGLE HIT
function saveHit() {
  let p = `date=${document.getElementById('hDate').value}&officer=${encodeURIComponent(document.getElementById('hOfficer').value)}&type=${document.getElementById('hType').value}&notice=${encodeURIComponent(document.getElementById('hNotice').value)}&nat=${encodeURIComponent(document.getElementById('hNat').value)}&passport=${encodeURIComponent(document.getElementById('hPass').value)}&etaEtd=${encodeURIComponent(document.getElementById('hEtaEtd').value)}&poePod=${encodeURIComponent(document.getElementById('hPoePod').value)}&name=${encodeURIComponent(document.getElementById('hName').value)}&gender=${document.getElementById('hGender').value}&crime=${encodeURIComponent(document.getElementById('hCrime').value)}&action=${encodeURIComponent(document.getElementById('hAction').value)}`;
  if (!document.getElementById('hName').value) return alert("Enter NAME");
  api("addHit", p).then(() => { alert("SUCCESSFUL! Hit Report Saved"); loadHitAdmin(); });
}

// TEST CONNECTION - USE THIS FIRST IF UPLOAD FAILS
function testCSVConnection() {
  document.getElementById('csvStatus').innerHTML = "Testing connection...";
  apiPost("ping", {}).then(j => {
    if (j.status == "ok") { alert("CONNECTION OK - POST is working. Now try upload again."); document.getElementById('csvStatus').innerHTML = "CONNECTION OK - POST is working"; }
    else alert("Connection failed - Redeploy code.gs as New Version");
  }).catch(() => { alert("Connection FAILED - You did NOT redeploy code.gs as New Version. Go to Apps Script > Deploy > New Version"); document.getElementById('csvStatus').innerHTML = "FAILED - Redeploy as New Version"; });
}

function downloadCSVTemplate() {
  let csv = "DATE,HIT OFFICER,HIT TYPE,NOTICE,NATIONALITY,PASSPORT NUMBER,ETA/ETD,POE/POD,NAME,GENDER,CRIME,ACTION\n2026-01-05,John Doe,SLTD,,Nigeria,A123456,10:00 / 14:00,ABUJA / LAGOS,Ali Musa,Male,Theft,Arrested\n2026-01-05,Jane Doe,NOMINAL,Red Notice,Ghana,B789012,09:00 / 12:00,LAGOS / ABUJA,Ama Serwaa,Female,Fraud,Detained";
  let a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = "HIT_REPORT_TEMPLATE.csv"; a.click();
}

// ROBUST CSV PARSER - HANDLES QUOTES, COMMAS INSIDE NAMES, EXCEL ; AND ,
function parseCSV(text) {
  // Remove BOM from Excel
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  let rows = [], cur = [""], inQuote = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (c === '"') {
      if (inQuote && text[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; continue; }
      inQuote = !inQuote; continue;
    }
    // Excel in some countries uses ; instead of ,
    if ((c === "," || c === ";") && !inQuote) { cur.push(""); continue; }
    if ((c === "\n" || c === "\r") && !inQuote) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      if (cur.join("").trim() !== "") rows.push(cur);
      cur = [""]; continue;
    }
    cur[cur.length - 1] += c;
  }
  if (cur.join("").trim() !== "") rows.push(cur);
  return rows;
}

// CSV UPLOAD - FIXED - POST + CHUNKS OF 50 - SHOWS PROGRESS
async function uploadHitCSV() {
  let input = document.getElementById('csvFile');
  let file = input.files[0];
  if (!file) return alert("Select CSV file first. In Excel: File > Save As > CSV (Comma delimited)");
  if (!file.name.toLowerCase().endsWith(".csv")) {
    if (!confirm("This is NOT a .csv file - it is " + file.name + ". Continue anyway? Excel .xlsx will NOT work. Click OK to try, or Cancel and Save As CSV first.")) return;
  }
  let statusEl = document.getElementById('csvStatus');
  statusEl.innerHTML = "Reading file...";
  let text = await file.text();
  let allRows = parseCSV(text);
  if (allRows.length < 2) return alert("CSV is empty. Click DOWNLOAD CSV TEMPLATE and fill it.");
  // Detect header - skip first row if it contains DATE and NAME
  let startIdx = 0;
  let header = allRows[0].join(" ").toLowerCase();
  if (header.includes("date") && header.includes("name")) startIdx = 1;
  let rows = [];
  for (let i = startIdx; i < allRows.length; i++) {
    let c = allRows[i];
    if (c.length < 9) continue;
    // Pad to 12
    while (c.length < 12) c.push("");
    let name = (c[8] || "").trim();
    if (!name) continue;
    rows.push({
      date: (c[0] || "").trim(),
      officer: (c[1] || "").trim(),
      type: ((c[2] || "SLTD").trim().toUpperCase() == "NOMINAL" ? "NOMINAL" : "SLTD"),
      notice: (c[3] || "").trim(),
      nat: (c[4] || "").trim(),
      passport: (c[5] || "").trim(),
      etaEtd: (c[6] || "").trim(),
      poePod: (c[7] || "").trim(),
      name: name,
      gender: (c[9] || "").trim(),
      crime: (c[10] || "").trim(),
      action: (c[11] || "").trim()
    });
  }
  if (!rows.length) return alert("No valid rows found. Check template:\nDATE,HIT OFFICER,HIT TYPE,NOTICE,NATIONALITY,PASSPORT NUMBER,ETA/ETD,POE/POD,NAME,GENDER,CRIME,ACTION\nMake sure NAME column (9th) is filled.");
  statusEl.innerHTML = "Found " + rows.length + " hits. Uploading... 0%";
  // UPLOAD IN CHUNKS OF 50 - PREVENTS TIMEOUT
  let uploaded = 0;
  try {
    for (let i = 0; i < rows.length; i += 50) {
      let chunk = rows.slice(i, i + 50);
      let j = await apiPost("addHitBatch", { rows: chunk });
      if (j.status !== "ok") throw new Error(j.message || "Upload failed at chunk " + (i / 50 + 1));
      uploaded += j.count;
      let pct = Math.round((uploaded / rows.length) * 100);
      statusEl.innerHTML = "Uploading... " + uploaded + " / " + rows.length + " (" + pct + "%)";
    }
    alert("SUCCESSFUL! " + uploaded + " Hits Uploaded from CSV");
    statusEl.innerHTML = "SUCCESSFUL - " + uploaded + " hits saved to Google Sheet";
    input.value = "";
    loadHitAdmin();
  } catch (err) {
    alert("Upload FAILED: " + err.message + "\n\n1. Did you redeploy code.gs as NEW VERSION?\n2. Did you copy NEW URL to script.js?\n3. Click TEST CONNECTION first.");
    statusEl.innerHTML = "FAILED - " + err.message + " - Click TEST CONNECTION";
  }
}

function loadHitAdmin() {
  api("getHits").then(j => {
    let h = `<table><tr><th>DATE</th><th>HIT OFFICER</th><th>TYPE</th><th>NOTICE</th><th>NATIONALITY</th><th>PASSPORT</th><th>ETA/ETD</th><th>POE/POD</th><th>NAME</th><th>GENDER</th><th>CRIME</th><th>ACTION</th></tr>`;
    j.data.forEach(x => h += `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td><span class="badgeHit">${esc(x[2])}</span></td><td>${esc(x[3])}</td><td>${esc(x[4])}</td><td>${esc(x[5])}</td><td>${esc(x[6])}</td><td>${esc(x[7])}</td><td><b>${esc(x[8])}</b></td><td>${esc(x[9])}</td><td>${esc(x[10])}</td><td>${esc(x[11])}</td></tr>`);
    h += `</table>`; let el = document.getElementById('hitListAdmin'); if (el) el.innerHTML = h;
  });
}
function doHitSummary() {
  let mode = document.getElementById('hSumMode').value, mo = document.getElementById('hSumMonth').value, y = document.getElementById('hSumYear').value;
  api("summaryHit", `mode=${mode}&month=${mo}&year=${y}`).then(j => {
    document.getElementById('hitSummary').innerHTML = `<div style="background:#FEF2F2;padding:14px;margin-top:10px;border:1px solid #FCA5A5"><h4>${mode} HIT SUMMARY - ${mode == "MONTHLY" ? mo + "/" + y : y}</h4><p>Total Hits: <b>${j.total}</b> | SLTD: <b>${j.sltd}</b> | NOMINAL: <b>${j.nom}</b></p><button class="btnDark" onclick="window.print()">PRINT / DOWNLOAD AS PDF</button></div>`;
  });
}
function searchHit() {
  let q = document.getElementById('hitSearch').value;
  api("getHits", `q=${encodeURIComponent(q)}`).then(j => {
    let h = `<table><tr><th>DATE</th><th>HIT OFFICER</th><th>TYPE</th><th>NOTICE</th><th>NATIONALITY</th><th>PASSPORT</th><th>ETA/ETD</th><th>POE/POD</th><th>NAME</th><th>GENDER</th><th>CRIME</th><th>ACTION</th></tr>`;
    j.data.forEach(x => h += `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td><td>${esc(x[3])}</td><td>${esc(x[4])}</td><td>${esc(x[5])}</td><td>${esc(x[6])}</td><td>${esc(x[7])}</td><td><b>${esc(x[8])}</b></td><td>${esc(x[9])}</td><td>${esc(x[10])}</td><td>${esc(x[11])}</td></tr>`);
    h += `</table>`; document.getElementById('hitSearchResult').innerHTML = j.data.length ? h : "No Hit Found for that Name";
  });
}
if (!SCRIPT_URL.includes("YOUR_ID")) loadCountsOnly();