const API = "https://script.google.com/macros/s/AKfycbw1Rp0cv5Es6lllwlWjej2g1nsxm63Is302LNsSZdwV7got2UPLdzu_kaQ4CNDeh-U/exec";

// Application Memory States
let mode = "buy";
let vendorList = [];
let typeList = [];
let allData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;
let priceChartInstance = null;

// --- 8) BOTTOM NAVIGATION SPA SWITCH ROUTER ---
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(nav => nav.classList.remove("active"));
    document.querySelectorAll(".page-view").forEach(view => view.classList.remove("active"));
    
    item.classList.add("active");
    const targetView = item.dataset.target;
    document.getElementById(targetView).classList.add("active");

    if (targetView === "recordsView") {
      loadRecords();
    }
  });
});

// --- 7) DYNAMIC TIME ZONE INTERPRETATION (+7 BANGKOK/JAKARTA) ---
function updateTimestamp() {
  const now = new Date();
  // Transform standard system clock string to absolute UTC+7 Target Offset
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const localTargetTime = new Date(utc + (3600000 * 7));
  
  const year = localTargetTime.getFullYear();
  const month = String(localTargetTime.getMonth() + 1).padStart(2, '0');
  const day = String(localTargetTime.getDate()).padStart(2, '0');
  const hours = String(localTargetTime.getHours()).padStart(2, '0');
  const minutes = String(localTargetTime.getMinutes()).padStart(2, '0');
  const seconds = String(localTargetTime.getSeconds()).padStart(2, '0');
  
  document.getElementById("timestamp").value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
updateTimestamp();
setInterval(updateTimestamp, 5000); // Maintain clock accuracy

// Mode selection toggle listeners
document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    mode = t.dataset.mode;
    loadOptions();
  });
});

// --- 3) DROPDOWN OPTIONS SYNC AND RECOVERY PIPELINE ---
async function loadOptions() {
  try {
   const res = await fetch(API, {
    method: "POST",
    redirect: "follow", // <-- ADD THIS
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // <-- ADD THIS
    body: JSON.stringify({ action: "getOptions", mode })
  });
    const data = await res.json();
    
    vendorList = data.vendors || [];
    typeList = data.categories || [];
    
    document.getElementById("vendor").innerHTML = vendorList.length 
      ? vendorList.map(v => `<option value="${v}">${v}</option>`).join("")
      : `<option value="">No vendors synced</option>`;
      
    document.getElementById("category").innerHTML = typeList.length
      ? typeList.map(v => `<option value="${v}">${v}</option>`).join("")
      : `<option value="">No categories synced</option>`;
  } catch (err) {
    console.error("Network sync missing: ", err);
  }
}
loadOptions();

// --- 4) ITEM AUTOCOMPLETE DATALIST GENERATOR ---
function populateAutocompleteSuggestions(records) {
  const uniqueItems = [...new Set(records.map(r => r.item))];
  const datalist = document.getElementById("itemSuggestions");
  datalist.innerHTML = uniqueItems.map(item => `<option value="${item}">`).join("");
}

// --- 6) CONDITIONAL QUANTITY TOGGLE SELECTOR ---
const qtySelect = document.getElementById("quantitySelect");
const customQtyWrapper = document.getElementById("customQuantityWrapper");
const hiddenQtyInput = document.getElementById("quantity");

qtySelect.addEventListener("change", () => {
  if (qtySelect.value === "custom") {
    customQtyWrapper.classList.remove("hidden");
    hiddenQtyInput.value = 6;
  } else {
    customQtyWrapper.classList.add("hidden");
    hiddenQtyInput.value = qtySelect.value;
  }
  calc();
});

function calc() {
  const p = Math.max(0, parseFloat(document.getElementById("price").value) || 0);
  const q = Math.max(1, parseFloat(hiddenQtyInput.value) || 1);
  
  document.getElementById("price").value = p ? p.toFixed(2) : "";
  hiddenQtyInput.value = q;
  document.getElementById("unitPrice").value = (p / q).toFixed(2);
}
document.getElementById("price").oninput = calc;
hiddenQtyInput.oninput = calc;

// --- 5) SUBMISSION OVERLAY MODAL INTERACTION ---
const saveBtn = document.getElementById("saveBtn").onclick = async () => {
  updateTimestamp();

  const payload = {
    action: "add",
    mode,
    data: {
      date: document.getElementById("timestamp").value,
      vendor: document.getElementById("vendor").value,
      item: document.getElementById("item").value.trim(),
      category: document.getElementById("category").value,
      price: document.getElementById("price").value,
      volume: document.getElementById("volume").value,
      quantity: document.getElementById("quantity").value,
      unitPrice: document.getElementById("unitPrice").value,
      note: document.getElementById("note").value
    }
  };

  try {
    // THIS IS THE UPDATED FETCH CALL
    const res = await fetch(API, {
      method: "POST",
      redirect: "follow", // <-- bypasses Google's redirect block
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // <-- bypasses CORS error
      },
      body: JSON.stringify(payload)
    });

    alert("Saved successfully!");
    
    // Clear forms after saving
    document.getElementById("item").value = "";
    document.getElementById("price").value = "";
    document.getElementById("volume").value = "";
    document.getElementById("note").value = "";
    document.getElementById("quantity").value = "1";
    document.getElementById("unitPrice").value = "";

  } catch (err) {
    console.error(err);
    alert("Error saving data. Please check Apps Script deployment.");
  }
};
const confirmModal = document.getElementById("confirmModal");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

saveBtn.onclick = () => {
  if (!document.getElementById("item").value.trim()) {
    alert("Please provide a product name entry first.");
    return;
  }
  confirmModal.classList.remove("hidden");
};

confirmNo.onclick = () => confirmModal.classList.add("hidden");

confirmYes.onclick = async () => {
  confirmModal.classList.add("hidden");
  saveBtn.disabled = true;
  saveBtn.innerText = "Transmitting to Sheets...";
  
  updateTimestamp();
  const payload = {
    action: "add",
    mode,
    data: {
      date: document.getElementById("timestamp").value,
      vendor: document.getElementById("vendor").value,
      item: document.getElementById("item").value.trim(),
      category: document.getElementById("category").value,
      price: document.getElementById("price").value,
      volume: document.getElementById("volume").value,
      quantity: hiddenQtyInput.value,
      unitPrice: document.getElementById("unitPrice").value,
      note: document.getElementById("note").value
    }
  };

  try {
    const res = await fetch(API, { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) {
      alert("Transaction saved to spreadsheet successfully!");
      document.getElementById("item").value = "";
      document.getElementById("price").value = "";
      document.getElementById("volume").value = "";
      document.getElementById("note").value = "";
      qtySelect.value = "1";
      customQtyWrapper.classList.add("hidden");
      hiddenQtyInput.value = "1";
      document.getElementById("unitPrice").value = "";
      loadRecords(); 
    }
  } catch (err) {
    alert("Failed to write record. Please verify Apps Script deployment criteria.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = "Submit Record";
  }
};

// Modal handlers for supplementary forms
setupModalControl("addVendorBtn", "vendorModal", "closeVendor");
setupModalControl("addTypeBtn", "typeModal", "closeType");

function setupModalControl(btnId, modalId, closeId) {
  document.getElementById(btnId).onclick = () => document.getElementById(modalId).classList.remove("hidden");
  document.getElementById(closeId).onclick = () => document.getElementById(modalId).classList.add("hidden");
}

document.getElementById("saveVendor").onclick = () => {
  const v = document.getElementById("newVendor").value.trim();
  if (!v) return;
  vendorList.push(v);
  document.getElementById("vendor").innerHTML = vendorList.map(x => `<option>${x}</option>`).join("");
  document.getElementById("vendorModal").classList.add("hidden");
  document.getElementById("newVendor").value = "";
};

document.getElementById("saveType").onclick = () => {
  const t = document.getElementById("newType").value.trim();
  if (!t) return;
  typeList.push(t);
  document.getElementById("category").innerHTML = typeList.map(x => `<option>${x}</option>`).join("");
  document.getElementById("typeModal").classList.add("hidden");
  document.getElementById("newType").value = "";
};

// --- READ VIEWS AND HISTORICAL ANALYSIS RECOVERY SYSTEM ---
async function loadRecords() {
  try {
    const res = await fetch(API, { 
      method: "POST", 
      redirect: "follow", // <-- ADD THIS
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // <-- ADD THIS
      body: JSON.stringify({ action: "getAllRecords", mode }) 
    });
    const json = await res.json();
    allData = json.records.map(r => ({
      date: r[0], vendor: r[1], item: r[2], type: r[3], price: r[4], volume: r[5], qty: r[6], unit: r[7], note: r[8]
    }));
    filteredData = allData;
    populateAutocompleteSuggestions(allData);
    renderFilters();
    renderTable();
    renderCards();
  } catch(e) { console.error("Error building historical collections: ", e); }
}

function renderFilters() {
  const p = [...new Set(allData.map(r => r.item))];
  const v = [...new Set(allData.map(r => r.vendor))];
  const t = [...new Set(allData.map(r => r.type))];
  document.getElementById("filterProduct").innerHTML = `<option value="">All Items</option>` + p.map(x => `<option>${x}</option>`).join("");
  document.getElementById("filterVendor").innerHTML = `<option value="">All Vendors</option>` + v.map(x => `<option>${x}</option>`).join("");
  document.getElementById("filterType").innerHTML = `<option value="">All Types</option>` + t.map(x => `<option>${x}</option>`).join("");
}

document.getElementById("applyFilter").onclick = () => {
  const product = filterProduct.value; const vendor = filterVendor.value; const type = filterType.value;
  const start = filterStart.value; const end = filterEnd.value; const search = searchBox.value.toLowerCase();
  filteredData = allData.filter(r => {
    return (!product || r.item === product) && (!vendor || r.vendor === vendor) && (!type || r.type === type) &&
           (!start || r.date >= start) && (!end || r.date <= end) && JSON.stringify(r).toLowerCase().includes(search);
  });
  currentPage = 1; renderTable(); renderCards();
};

document.getElementById("clearFilter").onclick = () => {
  filterProduct.value = ""; filterVendor.value = ""; filterType.value = ""; filterStart.value = ""; filterEnd.value = ""; searchBox.value = "";
  filteredData = allData; renderTable(); renderCards();
};

function renderTable() {
  const tbody = document.querySelector("#recordTable tbody"); tbody.innerHTML = "";
  let start = (currentPage - 1) * rowsPerPage; let end = start + rowsPerPage;
  filteredData.slice(start, end).forEach(r => {
    tbody.innerHTML += `<tr><td>${String(r.date).substring(5,10)}</td><td><b>${r.item}</b></td><td>${r.vendor}</td><td>${r.price}</td></tr>`;
  });
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const pag = document.getElementById("pagination"); pag.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    pag.innerHTML += `<button class="page-btn ${i===currentPage?'active':''}" data-p="${i}">${i}</button>`;
  }
  document.querySelectorAll(".page-btn").forEach(btn => {
    btn.onclick = () => { currentPage = Number(btn.dataset.p); renderTable(); };
  });
}

function renderCards() {
  const cardArea = document.getElementById("cardArea"); cardArea.innerHTML = "";
  filteredData.forEach(r => {
    cardArea.innerHTML += `<div class="card"><h3>${r.item}</h3><p><b>Vendor:</b> ${r.vendor}</p><p><b>Price:</b> ${r.price} (Unit: ${r.unit})</p><p><b>Date:</b> ${r.date}</p></div>`;
  });
}

document.getElementById("viewTable").onclick = () => { viewTable.classList.add("active"); viewCard.classList.remove("active"); tableArea.classList.remove("hidden"); cardArea.classList.add("hidden"); };
document.getElementById("viewCard").onclick = () => { viewCard.classList.add("active"); viewTable.classList.remove("active"); tableArea.classList.add("hidden"); cardArea.classList.remove("hidden"); };

// --- ANALYTICS LINE CHART ENGINE GENERATOR ---
document.getElementById("loadData").onclick = async () => {
  const item = document.getElementById("productInput").value.trim();
  if (!item) return alert("Please specify an item to query trend data.");
  
  const res = await fetch(API, { 
    method: "POST", 
    redirect: "follow", // <-- ADD THIS
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // <-- ADD THIS
    body: JSON.stringify({ action: "getPriceHistory", mode, item }) 
  });
  const data = await res.json(); const history = data.history || [];
  if (!history.length) return alert("No history metrics matching this product configuration.");
  
  document.getElementById("summaryCard").classList.remove("hidden");
  document.getElementById("chartCard").classList.remove("hidden");
  
  const prices = history.map(r => parseFloat(r[4]) || 0); 
  const min = Math.min(...prices); const max = Math.max(...prices);
  const avg = (prices.reduce((a,b) => a+b, 0) / prices.length).toFixed(2);
  document.getElementById("summary").innerHTML = `<p>Lowest Price: <b>฿${min}</b></p><p>Highest Price: <b>฿${max}</b></p><p>Average Run: <b>฿${avg}</b></p>`;
  
  if (priceChartInstance) priceChartInstance.destroy();
  const ctx = document.getElementById("priceChart").getContext("2d");
  priceChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map(r => String(r[0]).substring(5,10)),
      datasets: [{ label: "Price Line", data: prices, borderColor: "#45BA85", backgroundColor: "rgba(69,186,133,0.1)", fill: true, tension: 0.3 }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
};
