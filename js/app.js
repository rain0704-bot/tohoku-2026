(function () {
  const state = {
    data: window.ItineraryStorage.loadItinerary(),
    activeDay: 1,
    activeView: "todayView",
    editMode: false,
    editingItemId: null
  };

  const $ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  const $$ = function (selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  };

  const labels = window.ItineraryEditor;

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }

  function saveAndRender(message) {
    window.ItineraryStorage.saveItinerary(state.data);
    render();
    if (message) showToast(message);
  }

  function formatDate(dateValue) {
    const parts = dateValue.split("-");
    return parts[1] + "/" + parts[2];
  }

  function getTodayDay() {
    const today = new Date();
    const start = new Date("2026-10-15T00:00:00");
    const end = new Date("2026-10-20T23:59:59");
    if (today >= start && today <= end) {
      const diff = Math.floor((today - start) / 86400000);
      return state.data.days[diff] || state.data.days[0];
    }
    return null;
  }

  function activeItems(day) {
    return day.items.filter(function (item) {
      return item.status === "active";
    });
  }

  function extraRows(item) {
    const rows = [
      ["停留時間", item.stayTime],
      ["停車", item.parking],
      ["步行", item.walking],
      ["樓梯", item.stairs],
      ["廁所", item.toilet],
      ["營業時間", item.openingHours],
      ["Map Code", item.mapCode],
      ["電話", item.phone],
      ["地址", item.address],
      ["長輩提醒", item.seniorNote],
      ["小孩提醒", item.childNote],
      ["價格", item.price],
      ["預約", item.reservation]
    ];
    return rows.filter(function (row) {
      return row[1];
    });
  }

  function itemActions(item) {
    const editActions = state.editMode
      ? '<div class="edit-actions">' +
          '<button type="button" data-action="edit" data-id="' + esc(item.id) + '">編輯</button>' +
          '<button type="button" data-action="up" data-id="' + esc(item.id) + '">上移</button>' +
          '<button type="button" data-action="down" data-id="' + esc(item.id) + '">下移</button>' +
          '<button type="button" data-action="pause" data-id="' + esc(item.id) + '">暫停</button>' +
          '<button type="button" data-action="delete" data-id="' + esc(item.id) + '">刪除</button>' +
        "</div>"
      : "";

    const map = item.googleMapsUrl
      ? '<a class="pill-action" href="' + esc(item.googleMapsUrl) + '" target="_blank" rel="noreferrer">導航</a>'
      : "";
    const phone = item.phone ? '<a class="pill-action" href="tel:' + esc(item.phone) + '">撥號</a>' : "";
    const mapCode = item.mapCode
      ? '<button class="pill-action" type="button" data-action="copy-mapcode" data-code="' + esc(item.mapCode) + '">複製 Map Code</button>'
      : "";
    const quickActions = map || phone || mapCode ? '<div class="quick-actions">' + map + phone + mapCode + "</div>" : "";
    return quickActions + editActions;
  }

  function itemTemplate(item) {
    const rows = extraRows(item)
      .map(function (row) {
        return '<p><span>' + esc(row[0]) + '</span>' + esc(row[1]) + "</p>";
      })
      .join("");
    const detail = rows ? '<div class="item-details">' + rows + "</div>" : "";
    const note = item.note ? '<p class="note-line">註記：' + esc(item.note) + "</p>" : "";
    const description = item.description ? '<p class="description">' + esc(item.description) + "</p>" : "";
    const japaneseName = item.japaneseName ? '<p class="jp-name">' + esc(item.japaneseName) + "</p>" : "";

    return (
      '<article class="timeline-item" data-id="' + esc(item.id) + '">' +
      '<div class="timeline-dot" aria-hidden="true"></div>' +
      '<div class="item-main">' +
      '<div class="item-kicker"><span>' + esc(labels.TYPE_LABELS[item.type] || "其他") + '</span><span class="priority ' + esc(item.priority) + '">' + esc(labels.PRIORITY_LABELS[item.priority] || "順路可去") + "</span></div>" +
      "<h3>" + esc(item.name) + "</h3>" +
      japaneseName +
      description +
      note +
      detail +
      itemActions(item) +
      "</div>" +
      "</article>"
    );
  }

  function dayTemplate(day, options) {
    const onlyPreview = options && options.preview;
    const itemsByPeriod = labels.PERIODS.map(function (period) {
      const items = activeItems(day).filter(function (item) {
        return item.period === period;
      });
      const body = items.length
        ? items.map(itemTemplate).join("")
        : '<p class="empty-period">尚無正式行程</p>';
      return '<section class="period-section"><h3>' + esc(period) + '</h3><div class="timeline">' + body + "</div></section>";
    }).join("");

    const addButton = state.editMode && !onlyPreview
      ? '<div class="day-add-row"><button class="add-item-button" type="button" data-add-day="' + esc(day.day) + '">＋ 新增行程</button></div>'
      : "";
    const title = day.title ? '<p class="day-title">' + esc(day.title) + "</p>" : "";
    const driveTime = day.driveTime
      ? '<p class="drive-time">今日駕駛：約 ' + esc(day.driveTime) + "</p>"
      : "";

    return (
      '<article class="day-page">' +
      '<header class="day-header">' +
      '<div class="tape" aria-hidden="true"></div>' +
      '<p class="eyebrow">Day ' + esc(day.day) + "</p>" +
      "<h2>" + esc(formatDate(day.date) + " " + day.weekday) + "</h2>" +
      title +
      "<p>" + esc(day.route) + "</p>" +
      driveTime +
      "</header>" +
      itemsByPeriod +
      addButton +
      "</article>"
    );
  }

  function renderDayTabs() {
    $("#dayTabs").innerHTML = state.data.days
      .map(function (day) {
        const active = day.day === state.activeDay ? " active" : "";
        return '<button class="day-tab' + active + '" type="button" role="tab" data-day="' + esc(day.day) + '">Day ' + esc(day.day) + "</button>";
      })
      .join("");
  }

  function renderToday() {
    const tripDay = getTodayDay();
    if (tripDay) {
      $("#todayContent").innerHTML = dayTemplate(tripDay, { preview: true });
      return;
    }
    const now = new Date();
    const start = new Date("2026-10-15T00:00:00");
    const daysLeft = Math.ceil((start - now) / 86400000);
    const lead = daysLeft > 0
      ? '<div class="countdown"><span>' + daysLeft + '</span><p>天後出發</p></div>'
      : '<div class="countdown"><span>Day 1</span><p>旅行已結束，顯示 Day 1 預覽</p></div>';
    $("#todayContent").innerHTML = lead + dayTemplate(state.data.days[0], { preview: true });
  }

  function renderItinerary() {
    renderDayTabs();
    const day = state.data.days.find(function (entry) {
      return entry.day === state.activeDay;
    });
    $("#dayContent").innerHTML = dayTemplate(day);
  }

  function renderHotels() {
    const hotels = state.data.days.map(function (day) {
      const hotelItems = day.items.filter(function (item) {
        return item.type === "hotel" && item.status !== "deleted";
      });
      const body = hotelItems.length
        ? hotelItems.map(function (item) {
            return '<div class="simple-row"><div><strong>Day ' + esc(day.day) + " · " + esc(item.name) + '</strong><p>' + esc(item.note || item.reservation || "住宿資訊待補") + '</p></div><button type="button" data-action="edit" data-id="' + esc(item.id) + '">修改</button></div>';
          }).join("")
        : '<div class="simple-row muted"><div><strong>Day ' + esc(day.day) + '</strong><p>尚未填入住宿</p></div></div>';
      return body;
    }).join("");
    $("#hotelsContent").innerHTML = hotels;
  }

  function renderCandidates() {
    const rows = [];
    state.data.days.forEach(function (day) {
      day.items.forEach(function (item) {
        if (["standby", "hidden", "deleted"].includes(item.status)) {
          rows.push(
            '<div class="simple-row"><div><strong>Day ' + esc(day.day) + " · " + esc(item.name) + '</strong><p>' + esc(statusLabel(item.status)) + " · " + esc(labels.TYPE_LABELS[item.type] || "其他") + '</p></div><button type="button" data-action="restore" data-id="' + esc(item.id) + '">恢復</button></div>'
          );
        }
      });
    });
    $("#candidatesContent").innerHTML = rows.length ? rows.join("") : '<p class="hint">目前沒有候選或已移除項目。</p>';
  }

  function statusLabel(status) {
    return { standby: "候選", hidden: "暫停", deleted: "已刪除" }[status] || status;
  }

  function render() {
    document.body.classList.toggle("edit-mode", state.editMode);
    $("#editModeButton").setAttribute("aria-pressed", String(state.editMode));
    $("#editModeButton span:last-child").textContent = state.editMode ? "結束編輯" : "編輯行程";
    $("#toggleEditFromMore").textContent = state.editMode ? "結束編輯模式" : "編輯模式";
    renderToday();
    renderItinerary();
    renderHotels();
    renderCandidates();
  }

  function switchView(viewId) {
    state.activeView = viewId;
    $$(".view-panel").forEach(function (panel) {
      panel.classList.toggle("active", panel.id === viewId);
    });
    $$(".nav-button").forEach(function (button) {
      button.classList.toggle("active", button.dataset.view === viewId);
    });
  }

  function fillSelect(select, entries) {
    select.innerHTML = entries
      .map(function (entry) {
        return '<option value="' + entry.value + '">' + entry.label + "</option>";
      })
      .join("");
  }

  function setupFormOptions() {
    fillSelect($("#itemForm [name='day']"), state.data.days.map(function (day) {
      return { value: day.day, label: "Day " + day.day + " · " + formatDate(day.date) };
    }));
    fillSelect($("#itemForm [name='type']"), Object.keys(labels.TYPE_LABELS).map(function (key) {
      return { value: key, label: labels.TYPE_LABELS[key] };
    }));
    fillSelect($("#itemForm [name='period']"), labels.PERIODS.map(function (period) {
      return { value: period, label: period };
    }));
    fillSelect($("#itemForm [name='priority']"), Object.keys(labels.PRIORITY_LABELS).map(function (key) {
      return { value: key, label: labels.PRIORITY_LABELS[key] };
    }));
  }

  function openEditor(itemId) {
    setupFormOptions();
    const form = $("#itemForm");
    form.reset();
    state.editingItemId = itemId || null;
    $("#editorTitle").textContent = itemId ? "編輯行程" : "新增行程";
    $("#editorBackdrop").hidden = false;
    document.body.classList.add("sheet-open");

    if (itemId) {
      const found = labels.findItem(state.data, itemId);
      if (!found) return;
      form.elements.day.value = found.day.day;
      Object.keys(found.item).forEach(function (key) {
        if (form.elements[key]) form.elements[key].value = found.item[key] || "";
      });
    } else {
      form.elements.day.value = state.activeDay;
      form.elements.type.value = "attraction";
      form.elements.period.value = "上午";
      form.elements.priority.value = "optional";
    }
    setTimeout(function () {
      form.elements.name.focus();
    }, 50);
  }

  function closeEditor() {
    $("#editorBackdrop").hidden = true;
    document.body.classList.remove("sheet-open");
    state.editingItemId = null;
  }

  function formToObject(form) {
    const raw = {};
    new FormData(form).forEach(function (value, key) {
      raw[key] = String(value);
    });
    return raw;
  }

  function handleAction(target) {
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action) return;
    if (action === "edit") openEditor(id);
    if (action === "up" && labels.moveItem(state.data, id, -1)) saveAndRender("已上移");
    if (action === "down" && labels.moveItem(state.data, id, 1)) saveAndRender("已下移");
    if (action === "pause" && labels.setStatus(state.data, id, "hidden")) saveAndRender("已暫停，保留在候選項目");
    if (action === "delete" && labels.setStatus(state.data, id, "deleted")) saveAndRender("已刪除，可從候選項目恢復");
    if (action === "restore" && labels.restoreItem(state.data, id)) saveAndRender("已恢復到正式行程");
    if (action === "copy-mapcode") {
      navigator.clipboard.writeText(target.dataset.code).then(function () {
        showToast("Map Code 已複製");
      }).catch(function () {
        showToast("無法複製，請手動選取 Map Code");
      });
    }
  }

  function bindEvents() {
    document.addEventListener("click", function (event) {
      const actionTarget = event.target.closest("[data-action]");
      if (actionTarget) handleAction(actionTarget);

      const addButton = event.target.closest(".add-item-button");
      if (addButton) {
        if (addButton.dataset.addDay) state.activeDay = Number(addButton.dataset.addDay);
        openEditor();
      }
    });

    $("#dayTabs").addEventListener("click", function (event) {
      const button = event.target.closest("[data-day]");
      if (!button) return;
      state.activeDay = Number(button.dataset.day);
      renderItinerary();
    });

    $$(".nav-button").forEach(function (button) {
      button.addEventListener("click", function () {
        switchView(button.dataset.view);
      });
    });

    [$("#editModeButton"), $("#toggleEditFromMore")].forEach(function (button) {
      button.addEventListener("click", function () {
        state.editMode = !state.editMode;
        render();
        showToast(state.editMode ? "已進入編輯模式" : "已回到閱讀模式");
      });
    });

    $("#showCandidatesButton").addEventListener("click", function () {
      const panel = $("#candidatesPanel");
      panel.hidden = !panel.hidden;
      renderCandidates();
    });

    $("#closeEditorButton").addEventListener("click", closeEditor);
    $("#cancelEditorButton").addEventListener("click", closeEditor);
    $("#editorBackdrop").addEventListener("click", function (event) {
      if (event.target.id === "editorBackdrop") closeEditor();
    });

    $("#itemForm").addEventListener("submit", function (event) {
      event.preventDefault();
      const item = labels.addOrUpdateItem(state.data, formToObject(event.currentTarget), state.editingItemId);
      state.activeDay = Number(event.currentTarget.elements.day.value);
      closeEditor();
      saveAndRender(item.name + " 已儲存");
    });

    $("#exportButton").addEventListener("click", function () {
      window.ItineraryStorage.exportItinerary(state.data);
      showToast("已匯出 JSON 備份");
    });

    $("#importInput").addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (!file) return;
      window.ItineraryStorage.readImportFile(file)
        .then(function (imported) {
          state.data = imported;
          state.activeDay = 1;
          saveAndRender("匯入完成");
        })
        .catch(function (error) {
          showToast(error.message);
        })
        .finally(function () {
          event.target.value = "";
        });
    });

    $("#resetButton").addEventListener("click", function () {
      const confirmed = window.confirm("確定要恢復原始行程？目前手機上的修改版本會被清除。");
      if (!confirmed) return;
      window.ItineraryStorage.clearUserItinerary();
      state.data = window.ItineraryStorage.clone(window.ORIGINAL_ITINERARY);
      state.activeDay = 1;
      render();
      showToast("已恢復原始行程");
    });
  }

  bindEvents();
  switchView("todayView");
  render();
})();
