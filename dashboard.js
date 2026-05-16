const API = "https://script.google.com/macros/s/AKfycbxQy7XkoVN-ywTo0ylfPy97eeM925IXgKQ9KKALbAOSRVxLPLKS6HTevJt2OMKYRtue/exec";

document.getElementById("loadData").onclick = loadPrice;

async function loadPrice() {
  const item = document.getElementById("productInput").value.trim();
  if (!item) return alert("Enter product name");

  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "getPriceHistory",
      mode: "buy",
      item
    })
  });

  const data = await res.json();
  const history = data.history;

  if (!history.length) {
    alert("No data found");
    return;
  }

  renderSummary(history);
  renderChart(history);
  renderTable(history);

  document.getElementById("summaryCard").style.display = "block";
  document.getElementById("chartCard").style.display = "block";
  document.getElementById("tableCard").style.display = "block";
}

function renderSummary(history) {
  const prices = history.map(r => r[4]);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = (prices.reduce((a,b) => a+b,0) / prices.length).toFixed(2);

  const minRow = history.find(r => r[4] === min);

  document.getElementById("summary").innerHTML = `
    <p>Lowest Price: <b>${min}</b> (${minRow[1]})</p>
    <p>Highest Price: <b>${max}</b></p>
    <p>Average Price: <b>${avg}</b></p>
    <p>Data Count: <b>${history.length}</b></p>
  `;
}

function renderChart(history) {
  const ctx = document.getElementById("priceChart").getContext("2d");

  const labels = history.map(r => r[0]);
  const prices = history.map(r => r[4]);

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Price",
        data: prices,
        borderColor: "#45BA85",
        backgroundColor: "rgba(69,186,133,0.3)",
        borderWidth: 2
      }]
    }
  });
}

function renderTable(history) {
  const tbody = document.querySelector("#historyTable tbody");
  tbody.innerHTML = "";

  history.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td>${r[0]}</td>
        <td>${r[1]}</td>
        <td>${r[4]}</td>
        <td>${r[7]}</td>
      </tr>
    `;
  });
}
