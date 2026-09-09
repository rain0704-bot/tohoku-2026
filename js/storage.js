(function () {
  const STORAGE_KEY = "tohoku-2026-itinerary";
  const PRIVATE_STORAGE_KEY = "tohoku-2026-private-settings";
  const OFFICIAL_DAY2_UPDATED = "2026-09-09";
  const OFFICIAL_DAY3_UPDATED = "2026-09-09";
  const OFFICIAL_DAY4_UPDATED = "2026-09-09";
  const OFFICIAL_DAY5_UPDATED = "2026-09-09";
  const OFFICIAL_DAY6_UPDATED = "2026-09-09";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isValidItinerary(data) {
    return Boolean(
      data &&
        data.trip &&
        Array.isArray(data.days) &&
        data.days.length === 6 &&
        data.days.every(function (day) {
          return typeof day.day === "number" && Array.isArray(day.items);
        })
    );
  }

  function migrateDay1DisplayNames(data) {
    const day1 = data.days.find(function (day) {
      return day.day === 1;
    });
    if (!day1) return data;

    const dayUpdates = {
      route: "仙台機場 → 取車 → Dormy Inn → まるまつ中野店",
      versionStatus: "official",
      lastUpdated: "2026-09-08"
    };
    Object.keys(dayUpdates).forEach(function (key) {
      if (day1[key] !== dayUpdates[key]) day1[key] = dayUpdates[key];
    });
    delete day1.driveTime;

    const nameUpdates = {
      "day1-drive-to-dormy-inn": "【交通移動】仙台機場 → Dormy Inn",
      "day1-dormy-inn-checkin": "Dormy Inn 入住",
      "day1-marumatsu-nakano-dinner": "まるまつ中野店 晚餐",
      "day1-return-to-dormy-inn": "返回 Dormy Inn 休息"
    };

    day1.items.forEach(function (item) {
      if (nameUpdates[item.id]) item.name = nameUpdates[item.id];
    });
    return data;
  }

  function migrateDay2Official(data) {
    const sourceDay2 = window.ORIGINAL_ITINERARY.days.find(function (day) {
      return day.day === 2;
    });
    const day2Index = data.days.findIndex(function (day) {
      return day.day === 2;
    });
    if (!sourceDay2 || day2Index < 0) return data;
    if (data.days[day2Index].versionStatus === "official" && data.days[day2Index].lastUpdated === OFFICIAL_DAY2_UPDATED) return data;
    data.days[day2Index] = clone(sourceDay2);
    return data;
  }

  function migrateDay3Official(data) {
    const sourceDay3 = window.ORIGINAL_ITINERARY.days.find(function (day) {
      return day.day === 3;
    });
    const day3Index = data.days.findIndex(function (day) {
      return day.day === 3;
    });
    if (!sourceDay3 || day3Index < 0) return data;
    if (data.days[day3Index].versionStatus === "official" && data.days[day3Index].lastUpdated === OFFICIAL_DAY3_UPDATED) return data;
    data.days[day3Index] = clone(sourceDay3);
    return data;
  }

  function migrateDay4Official(data) {
    const sourceDay4 = window.ORIGINAL_ITINERARY.days.find(function (day) {
      return day.day === 4;
    });
    const day4Index = data.days.findIndex(function (day) {
      return day.day === 4;
    });
    if (!sourceDay4 || day4Index < 0) return data;
    if (data.days[day4Index].versionStatus === "official" && data.days[day4Index].lastUpdated === OFFICIAL_DAY4_UPDATED) return data;
    data.days[day4Index] = clone(sourceDay4);
    return data;
  }

  function isPlaceholderDay(day) {
    if (!day) return false;
    const title = typeof day.title === "string" ? day.title : "";
    const route = typeof day.route === "string" ? day.route : "";
    const driveTime = typeof day.driveTime === "string" ? day.driveTime : "";
    const items = Array.isArray(day.items) ? day.items : [];
    const placeholderItems = items.every(function (item) {
      const name = typeof item.name === "string" ? item.name : "";
      return item.status === "standby" || name.includes("待填入") || name.includes("Placeholder");
    });
    return title.includes("Placeholder") || route === "待填入" || (driveTime === "待確認" && items.length === 0) || (items.length > 0 && placeholderItems);
  }

  function migrateDay5Official(data) {
    const sourceDay5 = window.ORIGINAL_ITINERARY.days.find(function (day) {
      return day.day === 5;
    });
    const day5Index = data.days.findIndex(function (day) {
      return day.day === 5;
    });
    if (!sourceDay5 || day5Index < 0) return data;
    const currentDay5 = data.days[day5Index];
    if (currentDay5.versionStatus === "official" && currentDay5.lastUpdated === OFFICIAL_DAY5_UPDATED) return data;
    if (!isPlaceholderDay(currentDay5)) return data;
    data.days[day5Index] = clone(sourceDay5);
    return data;
  }

  function migrateDay6Official(data) {
    const sourceDay6 = window.ORIGINAL_ITINERARY.days.find(function (day) {
      return day.day === 6;
    });
    const day6Index = data.days.findIndex(function (day) {
      return day.day === 6;
    });
    if (!sourceDay6 || day6Index < 0) return data;
    const currentDay6 = data.days[day6Index];
    if (currentDay6.versionStatus === "official" && currentDay6.lastUpdated === OFFICIAL_DAY6_UPDATED) return data;
    if (!isPlaceholderDay(currentDay6)) return data;
    data.days[day6Index] = clone(sourceDay6);
    return data;
  }

  function loadItinerary() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isValidItinerary(parsed)) {
          const migrated = migrateDay6Official(migrateDay5Official(migrateDay4Official(migrateDay3Official(migrateDay2Official(migrateDay1DisplayNames(parsed))))));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      } catch (error) {
        console.warn("Saved itinerary is not valid JSON.", error);
      }
    }
    return clone(window.ORIGINAL_ITINERARY);
  }

  function saveItinerary(data) {
    if (!isValidItinerary(data)) {
      throw new Error("行程資料格式不正確，未儲存。");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function clearUserItinerary() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function loadPrivateSettings() {
    const saved = localStorage.getItem(PRIVATE_STORAGE_KEY);
    if (!saved) return { hotelShortcuts: {} };
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && parsed.hotelShortcuts && typeof parsed.hotelShortcuts === "object") {
        return { hotelShortcuts: parsed.hotelShortcuts };
      }
    } catch (error) {
      console.warn("Private settings are not valid JSON.", error);
    }
    return { hotelShortcuts: {} };
  }

  function savePrivateSettings(settings) {
    localStorage.setItem(PRIVATE_STORAGE_KEY, JSON.stringify({
      hotelShortcuts: settings && settings.hotelShortcuts ? settings.hotelShortcuts : {}
    }));
  }

  function exportItinerary(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tohoku-2026-backup.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function readImportFile(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (!isValidItinerary(parsed)) {
            reject(new Error("JSON 檔案不是有效的日本東北 2026 行程格式。"));
            return;
          }
          resolve(parsed);
        } catch (error) {
          reject(new Error("JSON 檔案無法讀取，請確認格式正確。"));
        }
      };
      reader.onerror = function () {
        reject(new Error("讀取檔案失敗。"));
      };
      reader.readAsText(file);
    });
  }

  window.ItineraryStorage = {
    STORAGE_KEY,
    PRIVATE_STORAGE_KEY,
    clone,
    isValidItinerary,
    loadItinerary,
    saveItinerary,
    loadPrivateSettings,
    savePrivateSettings,
    clearUserItinerary,
    exportItinerary,
    readImportFile
  };
})();
