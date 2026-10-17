// HEM Sync - popup.js
let scannedTables = [];
let currentRecords = [];

const modeEl = document.getElementById("mode");
const scanBtn = document.getElementById("scan");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const tableSelect = document.getElementById("table");
const dateWrap = document.getElementById("dateWrap");
const dateEl = document.getElementById("date");
const mappingEl = document.getElementById("mapping");
const allowOtherEl = document.getElementById("allowOther");
const previewBtn = document.getElementById("preview");
const previewBox = document.getElementById("previewBox");
const sendBtn = document.getElementById("send");
const msgEl = document.getElementById("msg");

// Default date to today
dateEl.value = new Date().toISOString().split("T")[0];

modeEl.addEventListener("change", () => {
  if (modeEl.value === "attendance") {
    dateWrap.classList.remove("hide");
  } else {
    dateWrap.classList.add("hide");
  }
});

function showMsg(text, type = "info") {
  msgEl.className = type;
  msgEl.textContent = text;
  msgEl.style.display = "block";
}

// 1. Scan tables on the active tab
scanBtn.addEventListener("click", async () => {
  showMsg("Sedang membaca jadual pada halaman...", "info");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return showMsg("Tiada tab aktif dijumpai.", "err");
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const tables = Array.from(document.querySelectorAll("table"));
        return tables.map((t, idx) => {
          const rows = Array.from(t.querySelectorAll("tr"));
          const data = rows.map(r => Array.from(r.querySelectorAll("th, td")).map(c => (c.innerText || "").trim()));
          return {
            index: idx,
            rowCount: rows.length,
            sample: data.slice(0, 10)
          };
        }).filter(t => t.rowCount > 1);
      }
    });

    scannedTables = results?.[0]?.result || [];
    if (!scannedTables.length) {
      return showMsg("Tiada jadual dikesan pada halaman ini. Pastikan anda berada pada halaman jadual idMe.", "err");
    }

    tableSelect.innerHTML = "";
    scannedTables.forEach((t, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `Jadual ${i + 1} (${t.rowCount} baris)`;
      tableSelect.appendChild(opt);
    });

    renderMapping(scannedTables[0]);
    step2.classList.remove("hide");
    showMsg(`Dijumpai ${scannedTables.length} jadual. Sila semak padanan lajur.`, "ok");
  } catch (err) {
    showMsg("Ralat membaca halaman: " + err.message, "err");
  }
});

tableSelect.addEventListener("change", () => {
  const selected = scannedTables[tableSelect.value];
  if (selected) renderMapping(selected);
});

function renderMapping(tableData) {
  const header = tableData.sample[0] || [];
  const options = header.map((h, i) => `<option value="${i}">${h || `Kolum ${i + 1}`}</option>`).join("");
  
  // Auto-detect columns
  const findIdx = (regex) => header.findIndex(h => regex.test(h.toLowerCase()));
  const nameIdx = findIdx(/nama|name|pelajar|murid/i);
  const icIdx = findIdx(/kp|ic|kad pengenalan|dokumen|identiti/i);
  const classIdx = findIdx(/kelas|class|tingkatan/i);
  const statusIdx = findIdx(/status|kehadiran|hadir/i);

  mappingEl.innerHTML = `
    <div style="margin-top:6px">
      <label>Kolum Nama Murid</label>
      <select id="colName">${options}</select>
    </div>
    <div style="margin-top:6px">
      <label>Kolum No. KP / Dokumen</label>
      <select id="colIC">${options}</select>
    </div>
    <div style="margin-top:6px">
      <label>Kolum Kelas</label>
      <select id="colClass">
        <option value="-1">-- Masukkan Nama Kelas Manual --</option>
        ${options}
      </select>
      <input type="text" id="manualClass" placeholder="cth: 1 Arif" style="margin-top:4px;display:${classIdx === -1 ? 'block' : 'none'}">
    </div>
    ${modeEl.value === "attendance" ? `
    <div style="margin-top:6px">
      <label>Kolum Status Kehadiran</label>
      <select id="colStatus">${options}</select>
    </div>
    ` : ""}
  `;

  if (nameIdx >= 0) document.getElementById("colName").value = nameIdx;
  if (icIdx >= 0) document.getElementById("colIC").value = icIdx;
  if (classIdx >= 0) {
    document.getElementById("colClass").value = classIdx;
  } else {
    document.getElementById("colClass").value = "-1";
  }

  const colClassEl = document.getElementById("colClass");
  const manualClassEl = document.getElementById("manualClass");
  colClassEl.addEventListener("change", () => {
    manualClassEl.style.display = colClassEl.value === "-1" ? "block" : "none";
  });
}

// 2. Preview data
previewBtn.addEventListener("click", () => {
  const table = scannedTables[tableSelect.value];
  if (!table) return;

  const colName = parseInt(document.getElementById("colName")?.value || 0);
  const colIC = parseInt(document.getElementById("colIC")?.value || 0);
  const colClass = parseInt(document.getElementById("colClass")?.value || -1);
  const manualClass = document.getElementById("manualClass")?.value.trim() || "";
  const colStatus = document.getElementById("colStatus") ? parseInt(document.getElementById("colStatus").value) : -1;
  const allowOther = allowOtherEl.checked;

  const records = [];
  const rows = table.sample.slice(1); // skip header

  for (const row of rows) {
    const rawName = (row[colName] || "").trim();
    const rawIC = (row[colIC] || "").trim();
    if (!rawName) continue;

    const digits = rawIC.replace(/[^0-9]/g, "");
    let idKey = "";
    let jenisId = "lain";

    if (digits.length === 12) {
      idKey = digits;
      jenisId = "ic";
    } else if (allowOther && rawIC.length >= 5) {
      idKey = "P_" + rawIC.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      jenisId = "lain";
    } else {
      continue; // Skip invalid ID
    }

    const kelas = colClass >= 0 ? (row[colClass] || "").trim() : manualClass;
    let status = "hadir";
    let statusAsal = "";
    if (colStatus >= 0) {
      statusAsal = (row[colStatus] || "").trim();
      const s = statusAsal.toLowerCase();
      if (s.includes("tidak") || s.includes("ponteng") || s.includes("absent") || s.includes("0")) {
        status = "tidak_hadir";
      } else if (s.includes("sakit") || s.includes("mc")) {
        status = "sakit";
      } else {
        status = "hadir";
      }
    }

    records.push({
      idKey,
      nokp: digits.length === 12 ? `${digits.slice(0,6)}-${digits.slice(6,8)}-${digits.slice(8,12)}` : rawIC,
      jenisId,
      nama: rawName.toUpperCase(),
      kelas: kelas || "1 Arif",
      status,
      statusAsal
    });
  }

  currentRecords = records;
  if (!records.length) {
    return showMsg("Tiada rekod sah berjaya diekstrak. Semak padanan kolum atau aktifkan 'Terima ID bukan IC'.", "err");
  }

  previewBox.innerHTML = `
    <table>
      <thead>
        <tr><th>Nama</th><th>ID/KP</th><th>Kelas</th>${modeEl.value === "attendance" ? "<th>Status</th>" : ""}</tr>
      </thead>
      <tbody>
        ${records.slice(0, 15).map(r => `
          <tr>
            <td>${r.nama}</td>
            <td>${r.idKey}</td>
            <td>${r.kelas}</td>
            ${modeEl.value === "attendance" ? `<td>${r.status}</td>` : ""}
          </tr>
        `).join("")}
      </tbody>
    </table>
    ${records.length > 15 ? `<p style="font-size:10px;color:#6b7280;margin:4px 0 0">...dan ${records.length - 15} rekod lagi.</p>` : ""}
  `;

  step3.classList.remove("hide");
  showMsg(`Berjaya ekstrak ${records.length} rekod murid. Klik butang di bawah untuk menghantar.`, "ok");
});

// 3. Send to Dashboard via window.postMessage
sendBtn.addEventListener("click", async () => {
  if (!currentRecords.length) return showMsg("Tiada rekod untuk dihantar.", "err");
  sendBtn.disabled = true;
  showMsg("Sedang menghantar ke HEM Digital...", "info");

  const mode = modeEl.value;
  const date = dateEl.value;
  const reqId = "sync_" + Date.now();

  try {
    // Find HEM Digital tab
    const tabs = await chrome.tabs.query({});
    const hemTab = tabs.find(t => 
      t.url?.includes("run.app") || 
      t.url?.includes("vercel.app") || 
      t.url?.includes("localhost") || 
      t.title?.includes("HEM Digital")
    );

    if (!hemTab?.id) {
      sendBtn.disabled = false;
      return showMsg("Tab HEM Digital tidak dijumpai. Sila pastikan tab Dashboard HEM Digital dibuka dalam tetingkap Chrome.", "err");
    }

    // Execute script in HEM Digital tab in the MAIN world to postMessage
    const res = await chrome.scripting.executeScript({
      target: { tabId: hemTab.id },
      world: "MAIN",
      func: (payloadData) => {
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve({ ok: false, message: "Masa tamat menunggu jawapan daripada Dashboard HEM Digital." });
          }, 15000);

          const listener = (event) => {
            if (event.source !== window) return;
            const resData = event.data;
            if (resData && resData.source === "hem-dashboard" && resData.type === "HEM_SYNC_RESULT" && resData.id === payloadData.id) {
              clearTimeout(timeout);
              window.removeEventListener("message", listener);
              resolve(resData);
            }
          };

          window.addEventListener("message", listener);

          window.postMessage({
            source: "hem-extension",
            type: "HEM_SYNC",
            id: payloadData.id,
            payload: payloadData.payload
          }, window.location.origin);
        });
      },
      args: [{
        id: reqId,
        payload: {
          mode,
          date,
          records: currentRecords
        }
      }]
    });

    const response = res?.[0]?.result;
    if (response?.ok) {
      showMsg(response.message || "Berjaya diselaraskan!", "ok");
    } else {
      showMsg("Ralat: " + (response?.message || "Gagal menyelaraskan rekod."), "err");
    }
  } catch (err) {
    showMsg("Ralat sambungan: " + err.message, "err");
  } finally {
    sendBtn.disabled = false;
  }
});
