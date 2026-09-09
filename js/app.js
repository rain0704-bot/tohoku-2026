(function () {
  const state = {
    data: window.ItineraryStorage.loadItinerary(),
    activeDay: 1,
    activeView: "todayView",
    editMode: false,
    editingItemId: null,
    privateSettings: window.ItineraryStorage.loadPrivateSettings(),
    undoStack: [],
    redoStack: [],
    drag: {
      itemId: null,
      active: false,
      timer: null,
      startX: 0,
      startY: 0,
      pointerId: null,
      currentDrop: null
    }
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

  function safeHttpUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(String(value), window.location.href);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function mapUrlForItem(item) {
    return safeHttpUrl(item.mapUrl || item.googleMapsUrl || item.mapLink || item.maps);
  }

  function privateShortcutName(itemId) {
    const value = state.privateSettings.hotelShortcuts[itemId];
    return typeof value === "string" ? value.trim() : "";
  }

  function shortcutUrl(name) {
    return "shortcuts://run-shortcut?name=" + encodeURIComponent(name);
  }

  function savePrivateSettings(message) {
    window.ItineraryStorage.savePrivateSettings(state.privateSettings);
    renderHotels();
    if (message) showToast(message);
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

  function cloneData(data) {
    return window.ItineraryStorage.clone(data);
  }

  function applyHistoryState(data, message) {
    state.data = cloneData(data);
    window.ItineraryStorage.saveItinerary(state.data);
    render();
    if (message) showToast(message);
  }

  function commitMutation(mutator, message) {
    const before = cloneData(state.data);
    const changed = mutator();
    if (!changed) return false;
    state.undoStack.push(before);
    state.redoStack = [];
    saveAndRender(message);
    return true;
  }

  function undo() {
    if (!state.undoStack.length) return;
    const current = cloneData(state.data);
    const previous = state.undoStack.pop();
    state.redoStack.push(current);
    applyHistoryState(previous, "已復原上一步");
  }

  function redo() {
    if (!state.redoStack.length) return;
    const current = cloneData(state.data);
    const next = state.redoStack.pop();
    state.undoStack.push(current);
    applyHistoryState(next, "已重做下一步");
  }

  function clearHistory() {
    state.undoStack = [];
    state.redoStack = [];
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
      ["完整說明", item.description],
      ["備註", item.note],
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

  function concisePrice(price) {
    if (!price) return "";
    const yenMatch = price.match(/([^；。]*約\s*¥[\d,]+)/);
    if (yenMatch) return yenMatch[1].replace(/^目前紀錄：/, "");
    return price.length <= 24 ? price : "";
  }

  function inlineFacts(item) {
    const facts = [];
    const price = concisePrice(item.price);
    if (item.reservation && item.reservation.length <= 10) facts.push("已預約");
    if (item.openingHours && item.openingHours.length <= 22) facts.push(item.openingHours);
    if (price) facts.push(price);
    if (!facts.length) return "";
    return '<div class="inline-facts">' + facts.map(function (fact) {
      return "<span>" + esc(fact) + "</span>";
    }).join("") + "</div>";
  }

  function meaningful(value) {
    const text = typeof value === "string" ? value.trim() : "";
    return text && !["待確認", "未填寫", "無"].includes(text) ? text : "";
  }

  function hotelDateText(day, item) {
    const checkIn = meaningful(item.checkInDate || item.checkIn || item.startDate) || formatDate(day.date);
    const checkOut = meaningful(item.checkOutDate || item.checkOut || item.endDate);
    return checkOut ? "入住 " + checkIn + " / 退房 " + checkOut : "入住 " + checkIn;
  }

  function shortHotelFact(label, value) {
    const text = meaningful(value);
    if (!text) return "";
    const brief = text.length > 28 ? text.slice(0, 28) + "…" : text;
    return '<span><b>' + esc(label) + '</b>' + esc(brief) + "</span>";
  }

  function hotelDetailRows(item) {
    const rows = [
      ["地址", item.address],
      ["Check-in / Check-out", item.checkInOut || item.checkInTime || item.checkOutTime],
      ["Map Code", item.mapCode],
      ["房型", item.roomType || item.room],
      ["詳細停車說明", item.parkingDetail || item.parking],
      ["詳細早餐說明", item.breakfastDetail || item.breakfast],
      ["費用／付款備註", item.paymentNote || item.payment || item.price],
      ["預約", item.reservation],
      ["其他住宿備註", item.note || item.description]
    ];
    return rows.filter(function (row) {
      return meaningful(row[1]);
    });
  }

  function hotelActionLinks(item, privateLink) {
    const mapUrl = mapUrlForItem(item);
    const map = mapUrl ? '<a class="pill-action" href="' + esc(mapUrl) + '" target="_blank" rel="noreferrer">Google Maps</a>' : "";
    const phone = meaningful(item.phone) ? '<a class="pill-action" href="tel:' + esc(item.phone) + '">電話</a>' : "";
    const actions = map + phone + privateLink;
    return actions ? '<div class="hotel-action-row">' + actions + "</div>" : "";
  }

  function hotelCard(day, item) {
    const shortcutName = privateShortcutName(item.id);
    const privateLink = shortcutName && !state.editMode
      ? '<a class="pill-action private-booking-link" href="' + esc(shortcutUrl(shortcutName)) + '">🔒 訂房資料</a>'
      : "";
    const privateEditor = state.editMode
      ? '<div class="private-booking-editor"><label>私人訂房資料<span>捷徑名稱</span><input type="text" data-private-shortcut-input data-id="' + esc(item.id) + '" value="' + esc(shortcutName) + '" placeholder="例如：Dormy訂房"></label><div><button type="button" data-action="save-private-shortcut" data-id="' + esc(item.id) + '">儲存</button><button type="button" data-action="clear-private-shortcut" data-id="' + esc(item.id) + '">清除</button></div></div>'
      : "";
    const detailRows = hotelDetailRows(item)
      .map(function (row) {
        return '<p><span>' + esc(row[0]) + '</span>' + esc(row[1]) + "</p>";
      })
      .join("");
    const details = detailRows
      ? '<details class="item-details hotel-details"><summary>詳細資訊 ▾</summary><div class="detail-grid">' + detailRows + "</div></details>"
      : "";
    const summaryFacts = [
      shortHotelFact("停車", item.parkingSummary || item.parking),
      shortHotelFact("早餐", item.breakfastSummary || item.breakfast),
      shortHotelFact("付款", item.paymentStatus || item.payment)
    ].join("");
    const japaneseName = meaningful(item.japaneseName) ? '<p class="jp-name">' + esc(item.japaneseName) + "</p>" : "";
    const editButton = state.editMode ? '<button type="button" data-action="edit" data-id="' + esc(item.id) + '">修改</button>' : "";

    return (
      '<article class="simple-row hotel-row">' +
      '<div class="hotel-main">' +
      '<strong>Day ' + esc(day.day) + " · " + esc(item.name) + "</strong>" +
      japaneseName +
      '<p class="hotel-date">' + esc(hotelDateText(day, item)) + "</p>" +
      hotelActionLinks(item, privateLink) +
      (summaryFacts ? '<div class="hotel-facts">' + summaryFacts + "</div>" : "") +
      privateEditor +
      details +
      "</div>" +
      editButton +
      "</article>"
    );
  }

  function itemActions(item) {
    const editActions = state.editMode
      ? '<div class="edit-actions">' +
          '<button type="button" data-action="edit" data-id="' + esc(item.id) + '">編輯</button>' +
          '<button type="button" data-action="pause" data-id="' + esc(item.id) + '">暫停</button>' +
          '<button type="button" data-action="delete" data-id="' + esc(item.id) + '">刪除</button>' +
        "</div>"
      : "";

    const phone = item.phone ? '<a class="pill-action" href="tel:' + esc(item.phone) + '">撥號</a>' : "";
    const mapCode = item.mapCode
      ? '<button class="pill-action" type="button" data-action="copy-mapcode" data-code="' + esc(item.mapCode) + '">複製 Map Code</button>'
      : "";
    const quickActions = phone || mapCode ? '<div class="quick-actions">' + phone + mapCode + "</div>" : "";
    return quickActions + editActions;
  }

  function itemTemplate(item) {
    const rows = extraRows(item)
      .map(function (row) {
        return '<p><span>' + esc(row[0]) + '</span>' + esc(row[1]) + "</p>";
      })
      .join("");
    const detail = rows
      ? '<details class="item-details"><summary>詳細資訊 ▾</summary><div class="detail-grid">' + rows + "</div></details>"
      : "";
    const description = item.description ? '<p class="description">' + esc(item.description) + "</p>" : "";
    const japaneseName = item.japaneseName ? '<p class="jp-name">' + esc(item.japaneseName) + "</p>" : "";
    const dragHandle = state.editMode
      ? '<button class="drag-handle" type="button" data-drag-handle data-id="' + esc(item.id) + '" aria-label="拖曳排序">☰</button>'
      : "";
    const mapUrl = mapUrlForItem(item);
    const itemName = mapUrl
      ? '<a class="item-title-link" href="' + esc(mapUrl) + '" target="_blank" rel="noreferrer">' + esc(item.name) + ' <span aria-hidden="true">📍</span></a>'
      : esc(item.name);

    return (
      '<article class="timeline-item" data-id="' + esc(item.id) + '" data-period="' + esc(item.period) + '">' +
      '<div class="timeline-dot" aria-hidden="true"></div>' +
      '<div class="item-main">' +
      dragHandle +
      '<div class="item-kicker"><span>' + esc(labels.TYPE_LABELS[item.type] || "其他") + '</span><span class="priority ' + esc(item.priority) + '">' + esc(labels.PRIORITY_LABELS[item.priority] || "順路可去") + "</span></div>" +
      "<h3>" + itemName + "</h3>" +
      japaneseName +
      description +
      inlineFacts(item) +
      itemActions(item) +
      detail +
      "</div>" +
      "</article>"
    );
  }

  function dayTemplate(day, options) {
    const onlyPreview = options && options.preview;
    const periodList = periodListForDay(day, state.editMode && !onlyPreview);
    const showEmptyDropZones = state.editMode && !onlyPreview;
    const itemsByPeriod = periodList.reduce(function (html, period) {
      const items = activeItems(day).filter(function (item) {
        return item.period === period;
      });
      if (!items.length && !showEmptyDropZones) return html;
      return html + periodSectionTemplate(period, items, day.day, showEmptyDropZones);
    }, "");

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

  function periodListForDay(day, includeBasePeriods) {
    const periods = includeBasePeriods ? labels.PERIODS.slice() : [];
    day.items.forEach(function (item) {
      if (item.status === "active" && item.period && !periods.includes(item.period)) periods.push(item.period);
    });
    return periods;
  }

  function periodSectionTemplate(period, items, dayNumber, showEmptyDropZone) {
    const body = items.length
      ? items.map(itemTemplate).join("")
      : showEmptyDropZone ? '<div class="empty-drop-zone">拖曳到這裡</div>' : "";
    return '<section class="period-section" data-period="' + esc(period) + '" data-day="' + esc(dayNumber) + '"><h3>' + esc(period) + '</h3><div class="timeline drop-zone" data-period="' + esc(period) + '" data-day="' + esc(dayNumber) + '">' + body + "</div></section>";
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
    const hotels = [];
    state.data.days.forEach(function (day) {
      day.items.filter(function (item) {
        return item.type === "hotel" && item.status !== "deleted";
      }).forEach(function (item) {
        hotels.push(hotelCard(day, item));
      });
    });
    $("#hotelsContent").innerHTML = hotels.length ? hotels.join("") : '<p class="hint">目前沒有住宿資料。</p>';
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
    $("#editHistoryToolbar").hidden = !state.editMode;
    $("#undoButton").disabled = !state.undoStack.length;
    $("#redoButton").disabled = !state.redoStack.length;
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
      if (form.elements.mapUrl) form.elements.mapUrl.value = mapUrlForItem(found.item);
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
    if (action === "pause") {
      commitMutation(function () {
        return labels.setStatus(state.data, id, "hidden");
      }, "已暫停，保留在候選項目");
    }
    if (action === "delete") {
      commitMutation(function () {
        return labels.setStatus(state.data, id, "deleted");
      }, "已刪除，可從候選項目恢復");
    }
    if (action === "restore") {
      commitMutation(function () {
        return labels.restoreItem(state.data, id);
      }, "已恢復到正式行程");
    }
    if (action === "copy-mapcode") {
      navigator.clipboard.writeText(target.dataset.code).then(function () {
        showToast("Map Code 已複製");
      }).catch(function () {
        showToast("無法複製，請手動選取 Map Code");
      });
    }
    if (action === "save-private-shortcut") {
      const input = $('[data-private-shortcut-input][data-id="' + CSS.escape(id) + '"]');
      const value = input ? input.value.trim() : "";
      if (value) state.privateSettings.hotelShortcuts[id] = value;
      else delete state.privateSettings.hotelShortcuts[id];
      savePrivateSettings(value ? "私人訂房資料已儲存" : "私人訂房資料已清除");
    }
    if (action === "clear-private-shortcut") {
      delete state.privateSettings.hotelShortcuts[id];
      savePrivateSettings("私人訂房資料已清除");
    }
  }

  function clearDragTimer() {
    if (state.drag.timer) {
      window.clearTimeout(state.drag.timer);
      state.drag.timer = null;
    }
  }

  function startDrag(handle, event) {
    const item = handle.closest(".timeline-item");
    if (!item || !state.editMode) return;
    event.stopPropagation();
    state.drag.itemId = handle.dataset.id;
    state.drag.pointerId = event.pointerId;
    state.drag.startX = event.clientX;
    state.drag.startY = event.clientY;
    state.drag.active = false;
    state.drag.currentDrop = null;

    const activate = function () {
      state.drag.active = true;
      item.classList.add("dragging");
      item.setAttribute("aria-grabbed", "true");
      document.body.classList.add("is-dragging");
      highlightDropTarget(event.clientX, event.clientY);
      try {
        handle.setPointerCapture(event.pointerId);
      } catch (error) {
        // Some browsers do not keep capture after long-press context handling.
      }
    };

    clearDragTimer();
    if (event.pointerType === "mouse") activate();
    else state.drag.timer = window.setTimeout(activate, 260);
  }

  function updateDrag(event) {
    if (!state.drag.itemId) return;
    const moveX = Math.abs(event.clientX - state.drag.startX);
    const moveY = Math.abs(event.clientY - state.drag.startY);
    if (!state.drag.active && (moveX > 10 || moveY > 10)) clearDragTimer();
    if (!state.drag.active) return;
    event.preventDefault();
    highlightDropTarget(event.clientX, event.clientY);
  }

  function endDrag(event) {
    clearDragTimer();
    if (!state.drag.itemId) return;
    const itemId = state.drag.itemId;
    const wasActive = state.drag.active;
    const drop = state.drag.currentDrop || findDropTarget(event.clientX, event.clientY, itemId);
    cleanupDrag();
    if (!wasActive || !drop) return;
    commitMutation(function () {
      return labels.reorderItem(state.data, itemId, drop.day, drop.period, drop.targetItemId, drop.placeAfter);
    }, "排序已更新");
  }

  function cleanupDrag() {
    $$(".timeline-item.dragging").forEach(function (item) {
      item.classList.remove("dragging");
      item.removeAttribute("aria-grabbed");
    });
    $$(".drop-zone.drag-over").forEach(function (zone) {
      zone.classList.remove("drag-over");
    });
    removeDragPlaceholder();
    document.body.classList.remove("is-dragging");
    state.drag.itemId = null;
    state.drag.active = false;
    state.drag.pointerId = null;
    state.drag.currentDrop = null;
  }

  function highlightDropTarget(x, y) {
    $$(".drop-zone.drag-over").forEach(function (zone) {
      zone.classList.remove("drag-over");
    });
    const drop = findDropTarget(x, y, state.drag.itemId);
    state.drag.currentDrop = drop;
    if (drop && drop.zone) {
      drop.zone.classList.add("drag-over");
      moveDragPlaceholder(drop);
    } else {
      removeDragPlaceholder();
    }
  }

  function ensureDragPlaceholder() {
    let placeholder = $(".drag-placeholder");
    if (!placeholder) {
      placeholder = document.createElement("div");
      placeholder.className = "drag-placeholder";
      placeholder.textContent = "放在這裡";
    }
    return placeholder;
  }

  function removeDragPlaceholder() {
    const placeholder = $(".drag-placeholder");
    if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
  }

  function moveDragPlaceholder(drop) {
    if (!drop || !drop.zone) return;
    const placeholder = ensureDragPlaceholder();
    const target = drop.targetItemId ? $('.timeline-item[data-id="' + CSS.escape(drop.targetItemId) + '"]', drop.zone) : null;
    if (target) {
      drop.zone.insertBefore(placeholder, drop.placeAfter ? target.nextSibling : target);
    } else {
      drop.zone.appendChild(placeholder);
    }
  }

  function findDropTarget(x, y, draggedId) {
    const element = document.elementFromPoint(x, y);
    let targetItem = element ? element.closest(".timeline-item") : null;
    if (!targetItem || targetItem.dataset.id === draggedId) targetItem = nearestItemAtPoint(x, y, draggedId);
    let zone = targetItem ? targetItem.closest(".drop-zone") : element ? element.closest(".drop-zone") : null;
    if (!zone) {
      zone = $$(".drop-zone").find(function (candidate) {
        const rect = candidate.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      });
    }
    if (!zone) return null;
    let targetItemId = null;
    let placeAfter = false;
    if (targetItem && targetItem.dataset.id !== draggedId) {
      const rect = targetItem.getBoundingClientRect();
      targetItemId = targetItem.dataset.id;
      placeAfter = y > rect.top + rect.height / 2;
    }
    return {
      day: Number(zone.dataset.day),
      period: zone.dataset.period,
      targetItemId,
      placeAfter,
      zone
    };
  }

  function nearestItemAtPoint(x, y, draggedId) {
    const items = $$(".timeline-item").filter(function (item) {
      return item.dataset.id !== draggedId;
    });
    let best = null;
    items.forEach(function (item) {
      const rect = item.getBoundingClientRect();
      const zoneRect = item.closest(".drop-zone").getBoundingClientRect();
      if (x < zoneRect.left - 8 || x > zoneRect.right + 8) return;
      const verticalDistance = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
      if (verticalDistance > 18) return;
      if (!best || verticalDistance < best.distance) best = { item, distance: verticalDistance };
    });
    return best ? best.item : null;
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

    document.addEventListener("pointerdown", function (event) {
      const handle = event.target.closest("[data-drag-handle]");
      if (!handle) return;
      event.preventDefault();
      startDrag(handle, event);
    });

    document.addEventListener("pointermove", updateDrag, { passive: false });
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", function () {
      clearDragTimer();
      cleanupDrag();
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

    $("#undoButton").addEventListener("click", undo);
    $("#redoButton").addEventListener("click", redo);

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
      const raw = formToObject(event.currentTarget);
      const itemId = state.editingItemId;
      let item = null;
      commitMutation(function () {
        item = labels.addOrUpdateItem(state.data, raw, itemId);
        return Boolean(item);
      }, "");
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
          clearHistory();
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
      clearHistory();
      render();
      showToast("已恢復原始行程");
    });
  }

  bindEvents();
  switchView("todayView");
  render();
})();
