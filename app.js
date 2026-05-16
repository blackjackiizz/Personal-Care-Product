const API = "https://script.google.com/macros/s/AKfycbxQy7XkoVN-ywTo0ylfPy97eeM925IXgKQ9KKALbAOSRVxLPLKS6HTevJt2OMKYRtue/exec";

const modeTabs = document.querySelectorAll(".tab");
let mode = "buy";

// Tab switching
modeTabs.forEach(t => {
  t.addEventListener("click", () => {
    modeTabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    mode = t.dataset.mode;
    loadOptions();
  });
});

// Load dropdown options
async function loadOptions() {
  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "getOptions",
      mode: mode
    })
  });

  const data = await res.json();

  document.getElementById("vendor").innerHTML =
    data.vendors.map(v => `<option>${v}</option>`).join("");

  document.getElementById("item").innerHTML =
    data.items.map(v => `<option>${v}</option>`).join("");

  document.getElementById("category").innerHTML =
    data.categories.map(v => `<option>${v}</option>`).join("");
}

loadOptions();

// Autofill on item change
document.getElementById("item").onchange = async () => {
  const item = document.getElementById("item").value;

  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "getLatestItem",
      mode,
      item
    })
  });

  const d = await res.json();
  if (!d.found) return;

  const r = d.data;

  document.getElementById("price").value = r[4];
  document.getElementById("volume").value = r[5];
  document.getElementById("quantity").value = r[6];
  document.getElementById("unitPrice").value = r[7];
  document.getElementById("note").value = r[8];
};

// Auto-calc unit price
function calc() {
  let p = parseFloat(price.value) || 0;
  let q = parseFloat(quantity.value) || 1;
  unitPrice.value = (p / q).toFixed(2);
}

price.oninput = calc;
quantity.oninput = calc;

// Save new entry
document.getElementById("saveBtn").onclick = async () => {
  const payload = {
    action: "add",
    mode,
    data: {
      date: document.getElementById("date").value,
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
