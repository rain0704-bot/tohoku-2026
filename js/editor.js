(function () {
  const TYPE_LABELS = {
    attraction: "景點",
    restaurant: "餐廳",
    hotel: "住宿",
    rest: "休息站",
    shopping: "購物",
    transport: "移動",
    other: "其他"
  };

  const PRIORITY_LABELS = {
    must: "必去",
    optional: "順路可去",
    removable: "時間不夠可刪"
  };

  const PERIODS = ["上午", "午餐", "下午", "傍晚", "晚餐", "晚間", "住宿／溫泉"];
  const STATUSES = ["active", "standby", "hidden", "deleted"];
  const FIELD_NAMES = [
    "type",
    "period",
    "name",
    "japaneseName",
    "priority",
    "description",
    "note",
    "googleMapsUrl",
    "address",
    "phone",
    "mapCode",
    "parking",
    "walking",
    "stairs",
    "toilet",
    "seniorNote",
    "childNote",
    "openingHours",
    "price",
    "reservation"
  ];

  function makeId(dayNumber) {
    return "day" + dayNumber + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function cleanItem(raw, existing) {
    const item = existing ? Object.assign({}, existing) : {};
    FIELD_NAMES.forEach(function (field) {
      const value = raw[field];
      if (typeof value === "string" && value.trim()) item[field] = value.trim();
      else delete item[field];
    });
    item.id = existing && existing.id ? existing.id : makeId(Number(raw.day));
    item.status = existing && STATUSES.includes(existing.status) ? existing.status : "active";
    item.type = item.type || "other";
    item.priority = item.priority || "optional";
    item.period = item.period || "上午";
    item.name = item.name || "未命名行程";
    return item;
  }

  function findItem(data, itemId) {
    for (const day of data.days) {
      const index = day.items.findIndex(function (item) {
        return item.id === itemId;
      });
      if (index >= 0) return { day, index, item: day.items[index] };
    }
    return null;
  }

  function moveItem(data, itemId, direction) {
    const found = findItem(data, itemId);
    if (!found) return false;
    const nextIndex = found.index + direction;
    if (nextIndex < 0 || nextIndex >= found.day.items.length) return false;
    const items = found.day.items;
    const temp = items[found.index];
    items[found.index] = items[nextIndex];
    items[nextIndex] = temp;
    return true;
  }

  function setStatus(data, itemId, status) {
    const found = findItem(data, itemId);
    if (!found || !STATUSES.includes(status)) return false;
    found.item.status = status;
    return true;
  }

  function restoreItem(data, itemId) {
    const found = findItem(data, itemId);
    if (!found) return false;
    found.item.status = "active";
    found.day.items.splice(found.index, 1);
    found.day.items.push(found.item);
    return true;
  }

  function addOrUpdateItem(data, raw, itemId) {
    const targetDay = data.days.find(function (day) {
      return day.day === Number(raw.day);
    });
    if (!targetDay) throw new Error("找不到指定日期。");

    if (itemId) {
      const found = findItem(data, itemId);
      if (!found) throw new Error("找不到要編輯的行程。");
      const updated = cleanItem(raw, found.item);
      if (found.day.day !== targetDay.day) {
        found.day.items.splice(found.index, 1);
        targetDay.items.push(updated);
      } else {
        found.day.items[found.index] = updated;
      }
      return updated;
    }

    const created = cleanItem(raw);
    targetDay.items.push(created);
    return created;
  }

  window.ItineraryEditor = {
    TYPE_LABELS,
    PRIORITY_LABELS,
    PERIODS,
    findItem,
    moveItem,
    setStatus,
    restoreItem,
    addOrUpdateItem
  };
})();
