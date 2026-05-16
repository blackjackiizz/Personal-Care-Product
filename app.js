const API = "https://script.google.com/macros/s/AKfycbxQy7XkoVN-ywTo0ylfPy97eeM925IXgKQ9KKALbAOSRVxLPLKS6HTevJt2OMKYRtue";

// โหลด Dropdown
async function loadOptions() {
  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "getOptions",
      mode: document.getElementById("mode").value
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
document.getElementById("mode").onchange = loadOptions;

// Autofill ถ้าเลือกสินค้าที่เคยกรอก
document.getElementById("item").onchange = async () => {
  const item = document.getElementById("item").value;

  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "getLatestItem",
      mode: document.getElementById("mode").value,
      item
    })
  });

  const data = await res.json();
  if (!data.found) return;

  const d = data.data;

  document.getElementById("price").value = d[4];
  document.getElementById("volume").value = d[5];
  document.getElementById("quantity").value = d[6];
  document.getElementById("unitPrice").value = d[7];
  document.getElementById("note").value = d[8];
};

// คำนวณราคาต่อหน่วย
function calc() {
  const p = parseFloat(document.getElementById("price").value) || 0;
  const q = parseFloat(document.getElementById("quantity").value) || 1;
  document.getElementById("unitPrice").value = (p / q).toFixed(2);
}

document.getElementById("price").oninput = calc;
document.getElementById("quantity").oninput = calc;

// บันทึกข้อมูล
document.getElementById("saveBtn").onclick = async () => {
  const payload = {
    action: "add",
    mode: document.getElementById("mode").value,
    data: {
      date: document.getElementById("date").value,
      vendor: document.getElementById("vendor").value,
      item: document.getElementById("item").value,
      category: document.getElementById("category").value,
      price: document.getElementById("price").value,
      volume: document.getElementById("volume").value,
      quantity: document.getElementById("quantity").value,
      unitPrice: document.getElementById("unitPrice").value,
      note: document.getElementById("note").value,
    }
  };

  await fetch(API, { method: "POST", body: JSON.stringify(payload) });
  alert("บันทึกสำเร็จ");
};
