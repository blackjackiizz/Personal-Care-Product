const API = "https://script.google.com/macros/s/AKfycbw1Rp0cv5Es6lllwlWjej2g1nsxm63Is302LNsSZdwV7got2UPLdzu_kaQ4CNDeh-U/exec";

let allData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;

// Load data from Google Sheets
async function loadRecords() {
  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "getAllRecords",
      mode: "buy"
    })
  });

  const json = await res.json();
  allData = json.records.map(r => ({
    date: r[0],
    vendor: r[1],
    item: r[2],
    type: r[3],
    price: r[4],
    volume: r[5],
    qty: r[6],
    unit: r[7],
    note: r[8]
  }));

  filteredData = allData;
  renderFilters();
  renderTable();
  renderCards();
}

loadRecords();

// Render dropdown filters
function renderFilters() {
  const p = [...new Set(allData.map(r => r.item))];
  const v = [...new Set(allData.map(r => r.vendor))];
  const t = [...new Set(allData.map(r => r.type))];

  document.getElementById("filterProduct").innerHTML =
    `<option value="">All Products</option>` +
    p.map(x => `<option>${x}</option>`).join("");

  document.getElementById("filterVendor").innerHTML =
    `<option value="">All Vendors</option>` +
    v.map(x => `<option>${x}</option>`).join("");

  document.getElementById("filterType").innerHTML =
    `<option value="">All Types</option>` +
    t.map(x => `<option>${x}</option>`).join("");
}

// Apply filters
document.getElementById("applyFilter").onclick = () => {
  const product = filterProduct.value;
  const vendor = filterVendor.value;
  const type = filterType.value;
  const start = filterStart.value;
  const end = filterEnd.value;
  const search = searchBox.value.toLowerCase();

  filteredData = allData.filter(r => {
    return (
      (!product || r.item === product) &&
      (!vendor || r.vendor === vendor) &&
      (!type || r.type === type) &&
      (!start || r.date >= start) &&
      (!end || r.date <= end) &&
      JSON.stringify(r).toLowerCase().includes(search)
    );
  });

  currentPage = 1;
  renderTable();
  renderCards();
};

// Clear filter
document.getElementById("clearFilter").onclick = () => {
  filterProduct.value = "";
  filterVendor.value = "";
  filterType.value = "";
  filterStart.value = "";
  filterEnd.value = "";
  searchBox.value = "";

  filteredData = allData;
  renderTable();
  renderCards();
};

// Table sorting
document.querySelectorAll("th[data-sort]").forEach(th => {
  th.onclick = () => {
    const key = th.dataset.sort;

    filteredData.sort((a, b) => {
      if (key === "price" || key === "unit") {
        return parseFloat(a[key]) - parseFloat(b[key]);
      }
      return a[key] > b[key] ? 1 : -1;
    });

    renderTable();
  };
});

// Render Table View
function renderTable() {
  const tbody = document.querySelector("#recordTable tbody");
  tbody.innerHTML = "";

  let start = (currentPage - 1) * rowsPerPage;
  let end = start + rowsPerPage;
  const pageData = filteredData.slice(start, end);

  pageData.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.item}</td>
        <td>${r.vendor}</td>
        <td>${r.price}</td>
        <td>${r.unit}</td>
        <td>${r.type}</td>
        <td>${r.note || ""}</td>
      </tr>
    `;
  });

  renderPagination();
}

// Pagination
function renderPagination() {
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const pag = document.getElementById("pagination");

  pag.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    pag.innerHTML += `<button class="page-btn" data-p="${i}">${i}</button>`;
  }

  document.querySelectorAll(".page-btn").forEach(btn => {
    btn.onclick = () => {
      currentPage = Number(btn.dataset.p);
      renderTable();
    };
  });
}

// Card view
function renderCards() {
  const cardArea = document.getElementById("cardArea");
  cardArea.innerHTML = "";

  filteredData.forEach(r => {
    cardArea.innerHTML += `
      <div class="card">
        <h3>${r.item}</h3>
        <p><b>Vendor:</b> ${r.vendor}</p>
        <p><b>Price:</b> ${r.price} (Unit: ${r.unit})</p>
        <p><b>Date:</b> ${r.date}</p>
        <p><b>Type:</b> ${r.type}</p>
        <p><b>Note:</b> ${r.note || ""}</p>
      </div>
    `;
  });
}

// View toggle
document.getElementById("viewTable").onclick = () => {
  tableArea.classList.remove("hidden");
  cardArea.classList.add("hidden");
};

document.getElementById("viewCard").onclick = () => {
  tableArea.classList.add("hidden");
  cardArea.classList.remove("hidden");
};
