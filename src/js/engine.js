/**
 * Meridian portfolio analysis & recommendation engine.
 * Educational guidance only — not personalized financial advice.
 */
(function (global) {
  const ASSET_CLASSES = {
    us_equity: {
      id: "us_equity",
      label: "US Equity",
      expectedReturn: 0.09,
      volatility: 0.16,
      color: "#1F6F5B",
    },
    intl_equity: {
      id: "intl_equity",
      label: "Intl Equity",
      expectedReturn: 0.08,
      volatility: 0.17,
      color: "#2F8F78",
    },
    bonds: {
      id: "bonds",
      label: "Bonds",
      expectedReturn: 0.04,
      volatility: 0.06,
      color: "#8B6B3E",
    },
    real_estate: {
      id: "real_estate",
      label: "Real Estate",
      expectedReturn: 0.07,
      volatility: 0.14,
      color: "#4A6FA5",
    },
    crypto: {
      id: "crypto",
      label: "Crypto",
      expectedReturn: 0.12,
      volatility: 0.55,
      color: "#C45C26",
    },
    cash: {
      id: "cash",
      label: "Cash",
      expectedReturn: 0.045,
      volatility: 0.01,
      color: "#6B7280",
    },
    other: {
      id: "other",
      label: "Other",
      expectedReturn: 0.05,
      volatility: 0.12,
      color: "#7C6A9A",
    },
  };

  const TARGETS = {
    conservative: {
      label: "Conservative",
      us_equity: 0.25,
      intl_equity: 0.1,
      bonds: 0.45,
      real_estate: 0.05,
      crypto: 0,
      cash: 0.15,
      other: 0,
      expectedReturn: 0.05,
    },
    moderate: {
      label: "Moderate",
      us_equity: 0.4,
      intl_equity: 0.2,
      bonds: 0.25,
      real_estate: 0.08,
      crypto: 0.02,
      cash: 0.05,
      other: 0,
      expectedReturn: 0.07,
    },
    growth: {
      label: "Growth",
      us_equity: 0.5,
      intl_equity: 0.25,
      bonds: 0.1,
      real_estate: 0.08,
      crypto: 0.05,
      cash: 0.02,
      other: 0,
      expectedReturn: 0.085,
    },
  };

  const DEMO_HOLDINGS = [
    { name: "VTI", assetClass: "us_equity", amount: 42000, expenseRatio: 0.03 },
    { name: "AAPL", assetClass: "us_equity", amount: 18000, expenseRatio: 0 },
    { name: "VXUS", assetClass: "intl_equity", amount: 8000, expenseRatio: 0.07 },
    { name: "BND", assetClass: "bonds", amount: 12000, expenseRatio: 0.03 },
    { name: "High-yield savings", assetClass: "cash", amount: 15000, expenseRatio: 0 },
    { name: "BTC", assetClass: "crypto", amount: 5000, expenseRatio: 0 },
  ];

  function money(n) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function pct(n, digits) {
    const d = digits == null ? 1 : digits;
    return (n * 100).toFixed(d) + "%";
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function analyze(holdings, riskProfile) {
    const target = TARGETS[riskProfile] || TARGETS.moderate;
    const cleaned = holdings
      .map(function (h) {
        return {
          name: String(h.name || "").trim() || "Holding",
          assetClass: ASSET_CLASSES[h.assetClass] ? h.assetClass : "other",
          amount: Math.max(0, Number(h.amount) || 0),
          expenseRatio: Math.max(0, Number(h.expenseRatio) || 0),
        };
      })
      .filter(function (h) {
        return h.amount > 0;
      });

    const total = cleaned.reduce(function (sum, h) {
      return sum + h.amount;
    }, 0);

    if (total <= 0) {
      return { empty: true, total: 0, holdings: [], recommendations: [] };
    }

    const allocation = {};
    Object.keys(ASSET_CLASSES).forEach(function (key) {
      allocation[key] = 0;
    });

    cleaned.forEach(function (h) {
      allocation[h.assetClass] += h.amount;
    });

    const weights = {};
    Object.keys(allocation).forEach(function (key) {
      weights[key] = allocation[key] / total;
    });

    let weightedReturn = 0;
    let weightedVol = 0;
    let feeDrag = 0;

    cleaned.forEach(function (h) {
      const meta = ASSET_CLASSES[h.assetClass];
      const w = h.amount / total;
      weightedReturn += w * meta.expectedReturn;
      weightedVol += w * meta.volatility;
      feeDrag += w * (h.expenseRatio / 100);
    });

    // Soft diversification: Herfindahl on asset classes + single-name concentration
    const classHhi = Object.keys(weights).reduce(function (sum, key) {
      return sum + weights[key] * weights[key];
    }, 0);
    const largestHolding = cleaned.slice().sort(function (a, b) {
      return b.amount - a.amount;
    })[0];
    const largestShare = largestHolding.amount / total;
    const equityShare = weights.us_equity + weights.intl_equity;
    const cashShare = weights.cash;
    const cryptoShare = weights.crypto;
    const bondShare = weights.bonds;

    const diversificationScore = clamp(
      Math.round(
        100 -
          classHhi * 55 -
          Math.max(0, largestShare - 0.2) * 120 -
          Math.max(0, cashShare - 0.2) * 40 -
          Math.max(0, cryptoShare - 0.1) * 80
      ),
      0,
      100
    );

    const returnGap = target.expectedReturn - (weightedReturn - feeDrag);
    const efficiencyScore = clamp(
      Math.round(100 - Math.abs(returnGap) * 450 - feeDrag * 800),
      0,
      100
    );

    const allocationRows = Object.keys(ASSET_CLASSES)
      .map(function (key) {
        return {
          id: key,
          label: ASSET_CLASSES[key].label,
          color: ASSET_CLASSES[key].color,
          current: weights[key],
          target: target[key] || 0,
          currentAmount: allocation[key],
          delta: (target[key] || 0) - weights[key],
          deltaAmount: ((target[key] || 0) - weights[key]) * total,
        };
      })
      .filter(function (row) {
        return row.current > 0.001 || row.target > 0.001;
      })
      .sort(function (a, b) {
        return b.current - a.current;
      });

    const recommendations = buildRecommendations({
      total: total,
      weights: weights,
      target: target,
      feeDrag: feeDrag,
      largestHolding: largestHolding,
      largestShare: largestShare,
      equityShare: equityShare,
      cashShare: cashShare,
      cryptoShare: cryptoShare,
      bondShare: bondShare,
      weightedReturn: weightedReturn,
      cleaned: cleaned,
      riskProfile: riskProfile,
      allocationRows: allocationRows,
    });

    // Estimate annual upside from return-positive fixes (cash, fees, equity raise)
    const actionableLiftRate = recommendations.reduce(function (sum, rec) {
      if (/cash|fee|equity exposure|surplus bonds/i.test(rec.title)) {
        const match = String(rec.impact).match(/([0-9.]+)%/);
        if (match) return sum + Number(match[1]) / 100;
        if (rec.actionAmount && /fee/i.test(rec.title)) {
          return sum + rec.actionAmount / total;
        }
      }
      return sum;
    }, 0);
    const projectedGain =
      total * clamp(Math.max(returnGap, actionableLiftRate), 0, 0.08);

    return {
      empty: false,
      total: total,
      holdings: cleaned,
      allocationRows: allocationRows,
      scores: {
        diversification: diversificationScore,
        efficiency: efficiencyScore,
        overall: Math.round((diversificationScore + efficiencyScore) / 2),
      },
      metrics: {
        expectedReturn: weightedReturn - feeDrag,
        targetReturn: target.expectedReturn,
        returnGap: returnGap,
        feeDrag: feeDrag,
        volatility: weightedVol,
        projectedAnnualLift: projectedGain,
        largestHolding: largestHolding,
        largestShare: largestShare,
      },
      recommendations: recommendations,
      targetLabel: target.label,
    };
  }

  function buildRecommendations(ctx) {
    const recs = [];
    const {
      total,
      weights,
      target,
      feeDrag,
      largestHolding,
      largestShare,
      equityShare,
      cashShare,
      cryptoShare,
      bondShare,
      cleaned,
      riskProfile,
      allocationRows,
    } = ctx;

    // Cash drag
    if (cashShare > (target.cash || 0) + 0.05) {
      const excess = (cashShare - target.cash) * total;
      const putInto =
        riskProfile === "conservative"
          ? "short-term bonds or a balanced ETF"
          : "a broad equity index fund";
      recs.push({
        priority: "high",
        title: "Put idle cash to work",
        impact: "+" + pct(Math.min(0.035, cashShare - target.cash) * 0.7, 1) + " est. return",
        detail:
          "About " +
          money(excess) +
          " sits above a " +
          target.label.toLowerCase() +
          " cash cushion. Deploy the excess into " +
          putInto +
          " to reduce cash drag while keeping an emergency reserve.",
        actionAmount: excess,
      });
    }

    // Concentration
    if (largestShare > 0.25 && largestHolding) {
      const trim = (largestShare - 0.2) * total;
      recs.push({
        priority: "high",
        title: "Trim concentrated position in " + largestHolding.name,
        impact: "Lower single-name risk",
        detail:
          largestHolding.name +
          " is " +
          pct(largestShare, 0) +
          " of the portfolio. Trimming roughly " +
          money(trim) +
          " into diversified funds can improve resilience without abandoning the theme.",
        actionAmount: trim,
      });
    }

    // Underweight international
    if (weights.intl_equity + 0.05 < (target.intl_equity || 0)) {
      const need = ((target.intl_equity || 0) - weights.intl_equity) * total;
      recs.push({
        priority: "medium",
        title: "Add international diversification",
        impact: "Broader growth exposure",
        detail:
          "Intl equity is " +
          pct(weights.intl_equity, 0) +
          " vs a " +
          pct(target.intl_equity || 0, 0) +
          " target. Consider adding about " +
          money(need) +
          " via a low-cost developed/emerging markets ETF (e.g. VXUS or IXUS).",
        actionAmount: need,
      });
    }

    // Bonds vs risk
    if (bondShare + 0.08 < (target.bonds || 0) && riskProfile !== "growth") {
      const need = ((target.bonds || 0) - bondShare) * total;
      recs.push({
        priority: "medium",
        title: "Strengthen the ballast with bonds",
        impact: "Smoother path to goal",
        detail:
          "Bond allocation is light for a " +
          target.label.toLowerCase() +
          " profile. Adding about " +
          money(need) +
          " in intermediate Treasuries or a total bond market fund can stabilize returns.",
        actionAmount: need,
      });
    }

    if (bondShare > (target.bonds || 0) + 0.1 && riskProfile === "growth") {
      const excess = (bondShare - target.bonds) * total;
      recs.push({
        priority: "medium",
        title: "Reallocate surplus bonds toward growth",
        impact: "+" + pct(0.02, 1) + "–" + pct(0.04, 1) + " potential return",
        detail:
          "Bonds are overweight for a growth mandate. Shifting about " +
          money(excess) +
          " into global equities can raise long-run expected return if you can tolerate drawdowns.",
        actionAmount: excess,
      });
    }

    // Crypto overload
    if (cryptoShare > 0.1) {
      const trim = (cryptoShare - 0.05) * total;
      recs.push({
        priority: "high",
        title: "Cap crypto to a satellite sleeve",
        impact: "Cut tail-risk volatility",
        detail:
          "Crypto is " +
          pct(cryptoShare, 0) +
          " of assets. Keeping it near 2–5% (trim ~" +
          money(trim) +
          ") preserves upside while protecting the core portfolio from extreme swings.",
        actionAmount: trim,
      });
    }

    // Fee drag
    if (feeDrag > 0.005) {
      recs.push({
        priority: "medium",
        title: "Cut expense ratio drag",
        impact: "Save ~" + money(total * feeDrag) + "/yr",
        detail:
          "Weighted fees are about " +
          pct(feeDrag, 2) +
          ". Swapping high-cost funds for broad index ETFs under 0.10% can compound into meaningful extra return over a decade.",
        actionAmount: total * feeDrag,
      });
    }

    // Equity underweight for growth
    if (equityShare + 0.08 < (target.us_equity || 0) + (target.intl_equity || 0)) {
      const need =
        ((target.us_equity || 0) + (target.intl_equity || 0) - equityShare) * total;
      recs.push({
        priority: "high",
        title: "Raise equity exposure toward target",
        impact: "Closer to " + pct(target.expectedReturn, 1) + " expected return",
        detail:
          "Equities are " +
          pct(equityShare, 0) +
          " versus roughly " +
          pct((target.us_equity || 0) + (target.intl_equity || 0), 0) +
          " for your profile. Adding about " +
          money(need) +
          " in low-cost stock index funds is the highest-leverage path to higher long-term returns.",
        actionAmount: need,
      });
    }

    // Rebalance top deltas
    const buys = allocationRows
      .filter(function (r) {
        return r.deltaAmount > total * 0.04;
      })
      .slice(0, 2);
    const sells = allocationRows
      .filter(function (r) {
        return r.deltaAmount < -total * 0.04;
      })
      .slice(0, 2);

    if (buys.length && sells.length && recs.length < 6) {
      recs.push({
        priority: "low",
        title: "Rebalance toward the model mix",
        impact: "Align risk with goal",
        detail:
          "Shift from overweight " +
          sells
            .map(function (s) {
              return s.label;
            })
            .join(" / ") +
          " into " +
          buys
            .map(function (b) {
              return b.label + " (~" + money(b.deltaAmount) + ")";
            })
            .join(" and ") +
          ". Prefer tax-aware moves: new contributions first, then tax-advantaged accounts.",
        actionAmount: buys[0].deltaAmount,
      });
    }

    // Contribution habit
    if (cleaned.length > 0) {
      const monthly = Math.max(250, Math.round(total * 0.01));
      recs.push({
        priority: "low",
        title: "Automate a monthly contribution",
        impact: "Steady compounding",
        detail:
          "A recurring " +
          money(monthly) +
          " deposit into underweight asset classes keeps you buying on schedule and reduces timing risk versus lump-sum guesses.",
        actionAmount: monthly,
      });
    }

    const order = { high: 0, medium: 1, low: 2 };
    recs.sort(function (a, b) {
      return order[a.priority] - order[b.priority];
    });

    return recs.slice(0, 6);
  }

  global.MeridianEngine = {
    ASSET_CLASSES: ASSET_CLASSES,
    TARGETS: TARGETS,
    DEMO_HOLDINGS: DEMO_HOLDINGS,
    analyze: analyze,
    money: money,
    pct: pct,
  };
})(typeof window !== "undefined" ? window : global);