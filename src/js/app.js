(function () {
  var engine = window.MeridianEngine;
  var holdingsBody = document.getElementById("holdingsBody");
  var riskProfile = document.getElementById("riskProfile");
  var horizon = document.getElementById("horizon");
  var resultsEmpty = document.getElementById("resultsEmpty");
  var resultsBody = document.getElementById("resultsBody");
  var scoreStrip = document.getElementById("scoreStrip");
  var metricsList = document.getElementById("metricsList");
  var allocList = document.getElementById("allocList");
  var recsList = document.getElementById("recsList");

  var holdings = [
    { name: "", assetClass: "us_equity", amount: "", expenseRatio: "0.03" },
    { name: "", assetClass: "bonds", amount: "", expenseRatio: "0.05" },
    { name: "", assetClass: "cash", amount: "", expenseRatio: "0" },
  ];

  function assetOptions(selected) {
    return Object.keys(engine.ASSET_CLASSES)
      .map(function (key) {
        var label = engine.ASSET_CLASSES[key].label;
        return (
          '<option value="' +
          key +
          '"' +
          (key === selected ? " selected" : "") +
          ">" +
          label +
          "</option>"
        );
      })
      .join("");
  }

  function renderHoldings() {
    holdingsBody.innerHTML = holdings
      .map(function (h, index) {
        return (
          "<tr>" +
          '<td data-label="Name"><input type="text" data-field="name" data-index="' +
          index +
          '" value="' +
          escapeAttr(h.name) +
          '" placeholder="e.g. VTI" /></td>' +
          '<td data-label="Asset class"><select data-field="assetClass" data-index="' +
          index +
          '">' +
          assetOptions(h.assetClass) +
          "</select></td>" +
          '<td class="amount-cell" data-label="Amount (USD)"><input type="number" min="0" step="100" data-field="amount" data-index="' +
          index +
          '" value="' +
          escapeAttr(h.amount) +
          '" placeholder="10000" /></td>' +
          '<td class="fee-cell" data-label="Fee %"><input type="number" min="0" step="0.01" data-field="expenseRatio" data-index="' +
          index +
          '" value="' +
          escapeAttr(h.expenseRatio) +
          '" placeholder="0.03" /></td>' +
          '<td data-label=""><button class="icon-btn" type="button" data-remove="' +
          index +
          '" aria-label="Remove holding">×</button></td>' +
          "</tr>"
        );
      })
      .join("");
  }

  function escapeAttr(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function syncFromDom() {
    var inputs = holdingsBody.querySelectorAll("[data-field]");
    inputs.forEach(function (el) {
      var index = Number(el.getAttribute("data-index"));
      var field = el.getAttribute("data-field");
      if (!holdings[index]) return;
      holdings[index][field] = el.value;
    });
  }

  function effectiveProfile() {
    var profile = riskProfile.value;
    // Longer horizons nudge one step toward growth for recommendation targeting
    if (horizon.value === "long" && profile === "conservative") return "moderate";
    if (horizon.value === "long" && profile === "moderate") return "growth";
    if (horizon.value === "short" && profile === "growth") return "moderate";
    return profile;
  }

  function runAnalysis() {
    syncFromDom();
    var result = engine.analyze(holdings, effectiveProfile());

    if (result.empty) {
      resultsEmpty.hidden = false;
      resultsBody.hidden = true;
      resultsEmpty.textContent =
        "Add at least one holding with an amount greater than zero to get recommendations.";
      return;
    }

    resultsEmpty.hidden = true;
    resultsBody.hidden = false;

    scoreStrip.innerHTML =
      scoreCard(result.scores.overall, "Overall fit") +
      scoreCard(result.scores.diversification, "Diversification") +
      scoreCard(result.scores.efficiency, "Return efficiency");

    var lift = result.metrics.projectedAnnualLift;
    metricsList.innerHTML =
      metric("Portfolio value", engine.money(result.total)) +
      metric(
        "Expected return (net of fees)",
        engine.pct(result.metrics.expectedReturn, 1)
      ) +
      metric("Model target return", engine.pct(result.metrics.targetReturn, 1)) +
      metric(
        "Return gap to close",
        engine.pct(Math.max(0, result.metrics.returnGap), 1),
        result.metrics.returnGap > 0.005
      ) +
      metric("Fee drag", engine.pct(result.metrics.feeDrag, 2)) +
      metric(
        "Est. annual lift if aligned",
        engine.money(lift),
        lift > 0
      ) +
      metric("Risk stance model", result.targetLabel);

    allocList.innerHTML = result.allocationRows
      .map(function (row) {
        var currentPct = Math.round(row.current * 1000) / 10;
        var targetPct = Math.round(row.target * 1000) / 10;
        return (
          '<div class="alloc-row">' +
          '<div class="alloc-top"><span>' +
          row.label +
          "</span><span>" +
          currentPct +
          "% now · " +
          targetPct +
          "% target</span></div>" +
          '<div class="alloc-bar"><i style="width:' +
          Math.min(100, currentPct) +
          "%;background:" +
          row.color +
          '"></i><span class="alloc-target" style="left:' +
          Math.min(100, targetPct) +
          '%"></span></div>' +
          "</div>"
        );
      })
      .join("");

    recsList.innerHTML = result.recommendations
      .map(function (rec, i) {
        return (
          '<article class="rec" data-priority="' +
          rec.priority +
          '" style="animation-delay:' +
          i * 0.08 +
          's">' +
          '<div class="rec-top"><h4>' +
          escapeHtml(rec.title) +
          '</h4><span class="impact">' +
          escapeHtml(rec.impact) +
          "</span></div>" +
          "<p>" +
          escapeHtml(rec.detail) +
          "</p>" +
          "</article>"
        );
      })
      .join("");

    resultsPanelPulse();
  }

  function scoreCard(value, label) {
    return (
      '<div class="score"><strong>' +
      value +
      "</strong><span>" +
      label +
      "</span></div>"
    );
  }

  function metric(label, value, up) {
    return (
      '<div class="metric"><span>' +
      label +
      "</span><b" +
      (up ? ' class="up"' : "") +
      ">" +
      value +
      "</b></div>"
    );
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function resultsPanelPulse() {
    var panel = document.getElementById("resultsPanel");
    panel.style.transform = "translateY(4px)";
    requestAnimationFrame(function () {
      panel.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      panel.style.transform = "translateY(0)";
    });
  }

  function loadDemo() {
    holdings = engine.DEMO_HOLDINGS.map(function (h) {
      return {
        name: h.name,
        assetClass: h.assetClass,
        amount: String(h.amount),
        expenseRatio: String(h.expenseRatio),
      };
    });
    riskProfile.value = "moderate";
    horizon.value = "medium";
    renderHoldings();
    runAnalysis();
    document.getElementById("advisor").scrollIntoView({ behavior: "smooth" });
  }

  holdingsBody.addEventListener("input", function (event) {
    var t = event.target;
    if (!t.getAttribute("data-field")) return;
    var index = Number(t.getAttribute("data-index"));
    var field = t.getAttribute("data-field");
    if (holdings[index]) holdings[index][field] = t.value;
  });

  holdingsBody.addEventListener("change", function (event) {
    var t = event.target;
    if (!t.getAttribute("data-field")) return;
    var index = Number(t.getAttribute("data-index"));
    var field = t.getAttribute("data-field");
    if (holdings[index]) holdings[index][field] = t.value;
  });

  holdingsBody.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-remove]");
    if (!btn) return;
    syncFromDom();
    var index = Number(btn.getAttribute("data-remove"));
    holdings.splice(index, 1);
    if (!holdings.length) {
      holdings.push({
        name: "",
        assetClass: "us_equity",
        amount: "",
        expenseRatio: "0",
      });
    }
    renderHoldings();
  });

  document.getElementById("addHolding").addEventListener("click", function () {
    syncFromDom();
    holdings.push({
      name: "",
      assetClass: "us_equity",
      amount: "",
      expenseRatio: "0.03",
    });
    renderHoldings();
  });

  document.getElementById("loadDemo").addEventListener("click", loadDemo);
  document.getElementById("loadDemoHero").addEventListener("click", loadDemo);
  document.getElementById("analyzeBtn").addEventListener("click", runAnalysis);
  riskProfile.addEventListener("change", function () {
    if (!resultsBody.hidden) runAnalysis();
  });
  horizon.addEventListener("change", function () {
    if (!resultsBody.hidden) runAnalysis();
  });

  renderHoldings();
})();