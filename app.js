const API = "https://script.google.com/macros/s/AKfycbxQy7XkoVN-ywTo0ylfPy97eeM925IXgKQ9KKALbAOSRVxLPLKS6HTevJt2OMKYRtue/exec";

let mode = "buy";
let vendorList = [];
let typeList = [];

// Tab switching
document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    mode = t.dataset.mode;
    loadOptions();
  });
});

// Auto timestamp
function updateTimestamp() {
  document.getElementById("timestamp").value =
    new Date().toISOString().replace("T", " ").substring(0, 19);
}
updateTimestamp();

// Load dropdown options
async function loadOptions() {
  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "getOptions",
      mode
    })
  });

  const data = await res.json();

  vendorList = data.vendors;
  typeList = data.categories;

  document.getElementById("vendor").innerHTML =
    vendorList.map(v => `<option>${v}</option>`).join("");

  document.getElementById("category").innerHTML =
    typeList.map(v => `<option>${v}</option>`).join("");
}
loadOptions();

// Add vendor
document.getElementById("addVendorBtn").onclick = () =>
  document.getElementById("vendorModal").classList.remove("hidden");

document.getElementById("closeVendor").onclick = () =>
  document.getElementById("vendorModal").classList.add("hidden");

document.getElementById("saveVendor").onclick = () => {
  const v = document.getElementById("newVendor").value.trim();
  if (!v) return;
  vendorList.push(v);
  document.getElementById("vendor").innerHTML =
    vendorList.map(x => `<option>${x}</option>`).join("");
  document.getElementById("vendorModal").classList.add("hidden");
};

// Add type
document.getElementById("addTypeBtn").onclick = () =>
  document.getElementById("typeModal").classList.remove("hidden");

document.getElementById("closeType").onclick = () =>
  document.getElementById("typeModal").classList.add("hidden");

document.getElementById("saveType").onclick = () => {
  const t = document.getElementById("newType").value.trim();
  if (!t) return;
  typeList.push(t);
  document.getElementById("category").innerHTML =
    typeList.map(x => `<option>${x}</option>`).join("");
  document.getElementById("typeModal").classList.add("hidden");
};

// Auto-calc unit price (no negative)
function calc() {
  const p = Math.max(0, parseFloat(price.value) || 0);
  const q = Math.max(1, parseFloat(quantity.value) || 1);

  price.value = p;
  quantity.value = q;

  unitPrice.value = (p / q).toFixed(2);
}

price.oninput = calc;
quantity.oninput = calc;

// Save entry
document.getElementById("saveBtn").onclick = async () => {
  updateTimestamp();

  const payload = {
    action: "add",
    mode,
    data: {
      date: document.getElementById("timestamp").value,
      vendor: vendor.value,
      item: item.value,
      category: category.value,
      price: price.value,
      volume: volume.value,
      quantity: quantity.value,
      unitPrice: unitPrice.value,
      note: note.value
    }
  };

  await fetch(API, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  alert("Saved!");
};
