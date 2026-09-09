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
    must: "優先",
    optional: "順路",
    removable: "彈性"
  };

  const PERIODS = ["上午", "午餐", "下午", "傍晚", "晚餐", "晚間", "住宿", "住宿／溫泉"];
  const STATUSES = ["active", "standby", "hidden", "deleted"];
  const FIELD_NAMES = [
    "type",
    "period",
    "name",
    "japaneseName",
    "priority",
    "description",
    "note",
    "mapUrl",
    "googleMapsUrl",
    "mapLink",
    "maps",
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
    const mapUrl = raw.mapUrl || raw.googleMapsUrl || raw.mapLink || raw.maps;
    delete item.googleMapsUrl;
    delete item.mapLink;
    delete item.maps;
    if (typeof mapUrl === "string" && mapUrl.trim()) item.mapUrl = mapUrl.trim();
    else delete item.mapUrl;
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

  function periodIndex(period) {
    const index = PERIODS.indexOf(period);
    return index >= 0 ? index : PERIODS.length;
  }

  function emptyPeriodInsertIndex(items, targetPeriod) {
    const targetRank = periodIndex(targetPeriod);
    for (let index = 0; index < items.length; index += 1) {
      const entry = items[index];
      if (periodIndex(entry.period) > targetRank) return index;
    }
    return items.length;
  }

  function reorderItem(data, itemId, targetDayNumber, targetPeriod, targetItemId, placeAfter) {
    const source = findItem(data, itemId);
    const targetDay = data.days.find(function (day) {
      return day.day === Number(targetDayNumber);
    });
    if (!source || !targetDay || !targetPeriod) return false;

    const item = source.item;
    source.day.items.splice(source.index, 1);
    item.period = targetPeriod;

    const targetItems = targetDay.items;
    let insertIndex = targetItems.length;
    if (targetItemId && targetItemId !== itemId) {
      const targetIndex = targetItems.findIndex(function (entry) {
        return entry.id === targetItemId;
      });
      if (targetIndex >= 0) insertIndex = targetIndex + (placeAfter ? 1 : 0);
    } else {
      insertIndex = emptyPeriodInsertIndex(targetItems, targetPeriod);
      for (let index = targetItems.length - 1; index >= 0; index -= 1) {
        if (targetItems[index].period === targetPeriod) {
          insertIndex = index + 1;
          break;
        }
      }
    }

    targetItems.splice(insertIndex, 0, item);
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
    reorderItem,
    setStatus,
    restoreItem,
    addOrUpdateItem
  };
})();
