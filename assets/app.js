/*
  IUI program map + comparison.
  Reads data/programs.csv and data/states.csv (paths set in config.js)
  and builds the page. No libraries, no build step.
*/
(function () {
  "use strict";

  var CFG = window.IUI_CONFIG || {};
  var MAX_COMPARE = 3;

  var TYPES = [
    { k: "iou", label: "Investor-owned" },
    { k: "coop", label: "Co-op" },
    { k: "muni", label: "Municipal" },
    { k: "other", label: "Other" }
  ];
  var TYPE_LONG = { iou: "Investor-owned", coop: "Co-op", muni: "Municipal", other: "Statewide efficiency utility" };
  var STATUSES = [
    { k: "active", label: "Active" },
    { k: "ended", label: "Ended" },
    { k: "in_development", label: "In development" }
  ];
  var MODELS = [
    { k: "pays", label: "PAYS®-modeled" },
    { k: "modified", label: "Modified model" },
    { k: "under_review", label: "Under review" }
  ];
  var STATE_STATUS_LABEL = {
    approved: "approved by state energy regulators",
    adoption_proceedings: "formal adoption proceedings underway",
    formal_due_diligence: "formal due diligence underway",
    informal: "informal due diligence underway",
    none: "no activity"
  };
  var CHECKS = [
    { col: "check_utility_pays_upfront", label: "Utility pays upfront, no customer cost" },
    { col: "check_charge_tied_to_meter", label: "Charge tied to the meter, not a loan" },
    { col: "check_no_credit_check", label: "No credit check" },
    { col: "check_savings_exceed_charge", label: "Savings exceed the charge from day one" },
    { col: "check_transfers_with_meter", label: "Charge transfers to the next occupant" },
    { col: "check_open_to_renters", label: "Open to renters" }
  ];
  var CHECK_TEXT = { yes: "Yes", no: "No", partial: "Partly", unknown: "To confirm" };
  var DOCS = [
    { col: "doc_directive", label: "Directive (law or order)" },
    { col: "doc_regulatory_approval", label: "Regulatory approval" },
    { col: "doc_tariff", label: "Approved tariff" },
    { col: "doc_terms_conditions", label: "Terms & conditions" },
    { col: "doc_participant_agreement", label: "Participant agreement" },
    { col: "doc_notice", label: "Tenant / property-sale notice" },
    { col: "doc_evaluation", label: "Program evaluation" }
  ];
  var DOC_TEXT = {
    on_file: "On file", unavailable: "Unavailable", confidential: "Confidential",
    does_not_exist: "Does not exist", proposed: "Proposed only", "": "Not on file"
  };

  var programs = [];
  var states = {};
  var stateOrder = [];
  var ui = {
    state: "all",
    types: allOn(TYPES),
    statuses: allOn(STATUSES),
    models: allOn(MODELS),
    picked: []
  };

  function allOn(list) { var o = {}; list.forEach(function (x) { o[x.k] = true; }); return o; }
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "class") n.className = v;
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function labelOf(list, k) { var m = list.filter(function (x) { return x.k === k; })[0]; return m ? m.label : k; }

  /* ---------- CSV ---------- */
  function parseCSV(text) {
    var rows = [], row = [], field = "", i = 0, q = false;
    text = text.replace(/^﻿/, "");
    while (i < text.length) {
      var c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else q = false;
        } else field += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
      i++;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    rows = rows.filter(function (r) { return r.some(function (v) { return v.trim() !== ""; }); });
    var head = rows.shift().map(function (h) { return h.trim(); });
    return rows.map(function (r) {
      var o = {};
      head.forEach(function (h, j) { o[h] = (r[j] || "").trim(); });
      return o;
    });
  }
  function load(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Could not load " + url + " (" + r.status + ")");
      return r.text();
    }).then(parseCSV);
  }

  /* ---------- filtering ---------- */
  function matches(p, skip) {
    if (skip !== "state" && ui.state !== "all" && p.state !== ui.state) return false;
    if (skip !== "type" && !ui.types[p.utility_type]) return false;
    if (skip !== "status" && !ui.statuses[p.status]) return false;
    if (skip !== "model" && !ui.models[p.model]) return false;
    return true;
  }
  function years(p, long) {
    if (!p.year_started) return long ? "Not launched" : "No launch date";
    if (p.year_ended) return p.year_started + "–" + p.year_ended;
    if (p.status === "active") return long ? p.year_started + "–present" : "Since " + p.year_started;
    return long ? "Started " + p.year_started + ", end date not on file" : "Started " + p.year_started;
  }
  function modelPill(p) {
    var pill = el("span", { class: "pill pill-" + p.model }, [labelOf(MODELS, p.model)]);
    if (CFG.showProvisionalLabel && p.model_confirmed !== "yes" && p.model !== "under_review") {
      pill.appendChild(el("span", { class: "prov", text: " (provisional)" }));
    }
    return pill;
  }

  /* ---------- render: chips ---------- */
  function renderChips(boxId, list, key, field, skip) {
    var box = $(boxId);
    box.textContent = "";
    list.forEach(function (x) {
      var count = programs.filter(function (p) { return p[field] === x.k && matches(p, skip); }).length;
      box.appendChild(el("button", {
        type: "button", class: "chip", "aria-pressed": String(!!ui[key][x.k]),
        onclick: function () { ui[key][x.k] = !ui[key][x.k]; render(); }
      }, [x.label + " ", el("span", { class: "count", text: "(" + count + ")" })]));
    });
  }

  /* ---------- render: map ---------- */
  function renderMap() {
    var map = $("tile-map");
    map.textContent = "";
    map.classList.toggle("has-selection", ui.state !== "all");
    var visible = programs.filter(function (p) { return matches(p, "state"); });
    stateOrder.forEach(function (code) {
      var s = states[code];
      var here = visible.filter(function (p) { return p.state === code && p.status !== "in_development"; });
      var total = programs.filter(function (p) { return p.state === code; }).length;
      var markers = el("span", { class: "markers", "aria-hidden": "true" }, here.map(function (p) {
        var cls = p.status === "ended" ? "mk mk-ended" : (p.utility_type === "iou" ? "mk mk-iou" : "mk mk-coop");
        return el("span", { class: cls });
      }));
      var sel = ui.state === code;
      var btn = el("button", {
        type: "button",
        class: "tile st-" + s.status,
        style: "grid-row:" + s.grid_row + ";grid-column:" + s.grid_col,
        "aria-pressed": String(sel),
        "aria-label": s.name + ", " + (STATE_STATUS_LABEL[s.status] || s.status) + ", " + total + (total === 1 ? " program" : " programs") + " on file",
        onclick: function () { ui.state = sel ? "all" : code; render(); }
      }, [el("span", { class: "abbr", text: code }), markers]);
      map.appendChild(btn);
    });
  }

  /* ---------- render: list ---------- */
  function togglePick(id) {
    var i = ui.picked.indexOf(id);
    if (i >= 0) ui.picked.splice(i, 1);
    else if (ui.picked.length < MAX_COMPARE) ui.picked.push(id);
    writeHash();
    render();
  }
  function renderList(rows) {
    var list = $("program-list");
    list.textContent = "";
    var full = ui.picked.length >= MAX_COMPARE;
    if (!rows.length) {
      list.appendChild(el("li", { class: "empty" }, [
        el("strong", { text: "No programs match these filters" }),
        el("span", { class: "muted", text: "Some states on the map are in due diligence and have no program on file yet." })
      ]));
    }
    rows.forEach(function (p) {
      var picked = ui.picked.indexOf(p.id) >= 0;
      var disabled = !picked && full;
      list.appendChild(el("li", { class: "program" + (picked ? " is-picked" : "") }, [
        el("div", { class: "program-main" }, [
          el("span", { class: "program-name", text: p.program_name }),
          el("span", { class: "program-meta", text: p.utility + " · " + (states[p.state] ? states[p.state].name : p.state) + " · " + years(p) })
        ]),
        el("div", { class: "program-tags" }, [
          el("span", { class: "pill pill-type", text: TYPE_LONG[p.utility_type] || p.utility_type }),
          el("span", { class: "pill pill-" + p.status, text: labelOf(STATUSES, p.status) }),
          modelPill(p)
        ]),
        el("button", {
          type: "button", class: "compare-btn", "aria-pressed": String(picked), disabled: disabled,
          "aria-label": (picked ? "Remove " : "Compare ") + p.program_name + ", " + p.utility,
          onclick: function () { togglePick(p.id); }
        }, [picked ? "Added" : (disabled ? "Compare full" : "Compare")])
      ]));
    });
    $("result-line").textContent = "Showing " + rows.length + " of " + programs.length +
      (ui.state !== "all" && states[ui.state] ? " in " + states[ui.state].name : "");
  }

  /* ---------- render: compare ---------- */
  function renderCompare() {
    var picked = ui.picked.map(function (id) { return programs.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean);
    var head = $("compare-head");
    head.textContent = "";
    head.appendChild(el("th", { scope: "col", text: "Program" }));
    for (var i = 0; i < MAX_COMPARE; i++) {
      (function (p) {
        if (!p) { head.appendChild(el("th", { scope: "col" }, [el("div", { class: "slot-empty", text: "Add a program from the list above" })])); return; }
        head.appendChild(el("th", { scope: "col" }, [
          el("span", { class: "col-name", text: p.program_name }),
          el("span", { class: "col-util", text: p.utility }),
          el("button", { type: "button", class: "link-btn", "aria-label": "Remove " + p.program_name + ", " + p.utility + " from comparison", onclick: function () { togglePick(p.id); } }, ["Remove"])
        ]));
      })(picked[i]);
    }

    var body = $("compare-body");
    body.textContent = "";
    function group(label) {
      var tr = el("tr", { class: "group" }, [el("th", { scope: "colgroup", text: label })]);
      for (var i = 0; i < MAX_COMPARE; i++) tr.appendChild(el("td"));
      body.appendChild(tr);
    }
    function row(label, fn) {
      var tr = el("tr", null, [el("th", { scope: "row", text: label })]);
      for (var i = 0; i < MAX_COMPARE; i++) {
        var p = picked[i];
        if (!p) { tr.appendChild(el("td")); continue; }
        var out = fn(p);
        var td = el("td", { class: out.cls || "" });
        if (out.node) td.appendChild(out.node); else td.textContent = out.text;
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }

    group("Overview");
    row("State", function (p) { return { text: states[p.state] ? states[p.state].name : p.state }; });
    row("Utility type", function (p) { return { text: TYPE_LONG[p.utility_type] || p.utility_type }; });
    row("Status", function (p) { return { text: labelOf(STATUSES, p.status) }; });
    row("Years", function (p) { return { text: years(p, true) }; });
    row("Program model", function (p) {
      var t = labelOf(MODELS, p.model);
      if (CFG.showProvisionalLabel && p.model_confirmed !== "yes" && p.model !== "under_review") t += " (provisional)";
      return { text: t, cls: "v-model-" + p.model };
    });
    row("Docket or authority", function (p) { return p.docket_or_authority ? { text: p.docket_or_authority } : { text: "Not on file", cls: "v-muted" }; });
    if (picked.some(function (p) { return p.public_note; })) {
      row("Notes", function (p) { return p.public_note ? { text: p.public_note } : { text: "—", cls: "v-muted" }; });
    }

    group("PAYS® model checklist");
    CHECKS.forEach(function (c) {
      row(c.label, function (p) {
        var v = (p[c.col] || "unknown").toLowerCase();
        return { text: CHECK_TEXT[v] || v, cls: v === "yes" ? "v-yes" : v === "no" ? "v-no" : "v-muted" };
      });
    });

    group("Documentation on file");
    DOCS.forEach(function (d) {
      row(d.label, function (p) {
        var v = p[d.col] || "";
        if (/^https?:\/\//i.test(v)) {
          return { node: el("a", { href: v, target: "_blank", rel: "noopener" }, ["View document", el("span", { class: "sr-only", text: " (opens in a new tab)" })]) };
        }
        return { text: DOC_TEXT[v] || v, cls: v === "" ? "v-muted" : "" };
      });
    });

    $("compare-line").textContent = picked.length + " of " + MAX_COMPARE + " selected";
  }

  /* ---------- state select ---------- */
  function buildStateSelect() {
    var sel = $("state-select");
    stateOrder.slice()
      .filter(function (c) { return programs.some(function (p) { return p.state === c; }); })
      .sort(function (a, b) { return states[a].name.localeCompare(states[b].name); })
      .forEach(function (c) { sel.appendChild(el("option", { value: c, text: states[c].name })); });
    sel.addEventListener("change", function () { ui.state = sel.value; render(); });
  }

  /* ---------- shareable links: #compare=id1,id2 ---------- */
  function readHash() {
    var m = location.hash.match(/compare=([^&]+)/);
    if (!m) return null;
    return decodeURIComponent(m[1]).split(",").filter(function (id) {
      return programs.some(function (p) { return p.id === id; });
    }).slice(0, MAX_COMPARE);
  }
  function writeHash() {
    var h = ui.picked.length ? "#compare=" + ui.picked.join(",") : " ";
    if (history.replaceState) history.replaceState(null, "", h === " " ? location.pathname + location.search : h);
  }

  /* ---------- main render ---------- */
  function render() {
    $("state-select").value = ui.state;
    renderChips("chips-type", TYPES, "types", "utility_type", "type");
    renderChips("chips-status", STATUSES, "statuses", "status", "status");
    renderChips("chips-model", MODELS, "models", "model", "model");
    renderMap();
    var order = { active: 0, in_development: 1, ended: 2 };
    var rows = programs.filter(function (p) { return matches(p); }).sort(function (a, b) {
      var sa = states[a.state] ? states[a.state].name : a.state, sb = states[b.state] ? states[b.state].name : b.state;
      if (sa !== sb) return sa.localeCompare(sb);
      return (order[a.status] || 0) - (order[b.status] || 0);
    });
    renderList(rows);
    renderCompare();
  }

  function init() {
    $("map-updated").textContent = CFG.mapLastUpdated || "";
    Promise.all([load(CFG.programsCsv || "data/programs.csv"), load(CFG.statesCsv || "data/states.csv")])
      .then(function (res) {
        programs = res[0].filter(function (p) { return (p.publish || "").toLowerCase() === "yes" && p.id; });
        res[1].forEach(function (s) { if (s.code) { states[s.code] = s; stateOrder.push(s.code); } });

        $("stat-states").textContent = stateOrder.filter(function (c) { return states[c].status === "approved"; }).length;
        $("stat-active").textContent = programs.filter(function (p) { return p.status === "active"; }).length;
        $("stat-total").textContent = programs.length;

        var fromHash = readHash();
        ui.picked = (fromHash || CFG.defaultCompare || []).filter(function (id) {
          return programs.some(function (p) { return p.id === id; });
        }).slice(0, MAX_COMPARE);

        buildStateSelect();
        $("reset").addEventListener("click", function () {
          ui.state = "all"; ui.types = allOn(TYPES); ui.statuses = allOn(STATUSES); ui.models = allOn(MODELS);
          render();
        });
        render();
      })
      .catch(function (err) {
        var box = $("load-error");
        box.hidden = false;
        box.textContent = "The program data didn't load. " + err.message +
          ". If you opened index.html directly from your computer, use the GitHub Pages link instead (see README).";
      });
  }

  // Exposed for the data check script; harmless in the browser.
  window.IUI_parseCSV = parseCSV;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
