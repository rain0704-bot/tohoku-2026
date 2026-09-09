window.ORIGINAL_ITINERARY = {
  trip: {
    name: "日本東北 2026",
    startDate: "2026-10-15",
    endDate: "2026-10-20",
    travelers: "4 位大人 + 1 位 10 歲小孩",
    note: "第一階段測試資料，尚未填入正式行程。"
  },
  days: [
    {
      day: 1,
      date: "2026-10-15",
      weekday: "THU",
      title: "抵達仙台",
      route: "仙台機場 → 取車 → Dormy Inn → まるまつ中野店",
      position: "抵達日。完成入境、取車、入住及晚餐即可，不安排其他觀光景點。",
      versionStatus: "official",
      lastUpdated: "2026-09-08",
      flight: {
        route: "台北桃園國際機場 → 仙台機場",
        airline: "星宇航空",
        departure: "11:35",
        arrival: "16:00"
      },
      items: [
        {
          id: "day1-arrive-sendai-airport",
          type: "transport",
          period: "下午",
          name: "抵達仙台機場",
          japaneseName: "仙台空港",
          priority: "must",
          status: "active",
          description: "星宇航空抵達仙台。完成入境、領取行李後，準備前往租車公司。",
          stayTime: "依當天入境及行李領取狀況",
          toilet: "機場內有洗手間",
          seniorNote: "完成入境及領取行李後，可先讓長輩上洗手間、稍作休息，再前往租車公司。",
          childNote: "抵達後不趕行程。",
          note: "航班預計 16:00 抵達。第一天不安排觀光景點。"
        },
        {
          id: "day1-times-car-sendai-airport",
          type: "transport",
          period: "下午",
          name: "Times Car 仙台空港取車",
          japaneseName: "タイムズカー仙台空港",
          priority: "must",
          status: "active",
          reservation: "已預訂",
          description: "辦理租車手續、確認車輛、行李空間及導航後出發。",
          note: "預約取車時間 17:00。全程只有一位駕駛，第一天剛抵達日本，以熟悉右駕、車輛與導航為主，不增加其他景點。"
        },
        {
          id: "day1-drive-to-dormy-inn",
          type: "transport",
          period: "傍晚",
          name: "【交通移動】仙台機場 → Dormy Inn",
          priority: "must",
          status: "active",
          description: "完成取車後前往仙台市區住宿。",
          seniorNote: "抵達日不安排額外觀光，優先讓長輩入住休息。",
          note: "不設定精確抵達時間，依當天入境、行李及租車手續進度彈性調整。"
        },
        {
          id: "day1-dormy-inn-checkin",
          type: "hotel",
          period: "傍晚",
          name: "Dormy Inn 入住",
          priority: "must",
          status: "active",
          reservation: "已預訂",
          description: "仙台前段住宿，10/15～10/17 連住兩晚。",
          note: "抵達飯店後先辦理入住、放置行李及稍作休息，再前往晚餐。"
        },
        {
          id: "day1-marumatsu-nakano-dinner",
          type: "restaurant",
          period: "晚餐",
          name: "まるまつ中野店 晚餐",
          japaneseName: "まるまつ中野店",
          priority: "must",
          status: "active",
          description: "Day 1 已確定的晚餐。第一晚不特別追求高價牛舌名店，以價格較合理、家庭用餐方便及降低抵達日負擔為優先。",
          note: "目前行程紀錄中的目標餐點為「陣中監製牛舌燒定食」，紀錄價格約 ¥1,800。原本考慮的「湊／茂的小十郎」方案已取消，不要再加入 Day 1。",
          seniorNote: "第一天經過搭機、入境、取車及入住後，晚餐以容易抵達、家庭用餐方便為優先，不再安排額外觀光。",
          childNote: "家庭餐廳類型，除了牛舌之外可選擇其他餐點，對 10 歲小孩較容易選餐。",
          openingHours: "目前旅行規劃紀錄為 10:00～22:00；這不是出發日前最終確認資料，接近 2026/10/15 時需要重新確認最新營業時間。",
          price: "目前紀錄：陣中監製牛舌燒定食約 ¥1,800；接近出發日前重新確認最新菜單與價格。"
        },
        {
          id: "day1-return-to-dormy-inn",
          type: "transport",
          period: "晚間",
          name: "返回 Dormy Inn 休息",
          priority: "must",
          status: "active",
          description: "晚餐結束後返回飯店休息。",
          note: "Day 1 到此結束，不安排夜間景點。讓長輩、小孩及唯一駕駛充分休息，準備 Day 2。"
        }
      ]
    },
    {
      day: 2,
      date: "2026-10-16",
      weekday: "FRI",
      title: "松島・海鮮丼・水族館",
      route: "仙台 → 松島 → 塩釜 → 仙台海洋森林水族館 → 飯店",
      versionStatus: "official",
      lastUpdated: "2026-09-09",
      items: [
        {
          id: "day2-hotel-departure",
          type: "transport",
          period: "上午",
          name: "08:30｜飯店出發",
          priority: "must",
          status: "active",
          description: "前往松島，約 18 km，車程約 25～30 分鐘。"
        },
        {
          id: "day2-fukuura-bridge-island",
          type: "attraction",
          period: "上午",
          name: "09:00｜福浦橋・福浦島",
          japaneseName: "福浦橋・福浦島",
          priority: "must",
          status: "active",
          description: "走過 252m 紅色「相遇之橋」欣賞松島灣。不用環島，走到適合的觀景點後折返即可。",
          stayTime: "50～60 分鐘",
          openingHours: "8:30～17:00",
          price: "成人：¥300；中學生／高中生／小學生：¥100",
          walking: "中等",
          seniorNote: "同行有年長家人，不以完整環島為目標。",
          note: "島內為自然步道，不需要走完整座島。雨天方案：縮短停留，以福浦橋及入口附近景觀為主。"
        },
        {
          id: "day2-godaido-matsushima-bay",
          type: "attraction",
          period: "上午",
          name: "10:00｜五大堂・松島灣岸",
          japaneseName: "五大堂",
          priority: "optional",
          status: "active",
          description: "松島代表性景觀，簡單看看五大堂與松島灣即可。",
          stayTime: "20～30 分鐘",
          price: "參觀：免費",
          walking: "少～中",
          note: "前往五大堂會經過「透かし橋」，橋面有間隙，行走時注意腳下。無須安排長時間停留。"
        },
        {
          id: "day2-drive-to-shiogama-market",
          type: "transport",
          period: "上午",
          name: "10:25｜松島 → 塩釜水產物仲卸市場",
          priority: "must",
          status: "active",
          description: "車程約 20～25 分鐘。"
        },
        {
          id: "day2-shiogama-seafood-market",
          type: "restaurant",
          period: "午餐",
          name: "10:50｜塩釜水產物仲卸市場",
          japaneseName: "塩釜水産物仲卸市場",
          priority: "must",
          status: "active",
          description: "市場採買生魚片、鮪魚、魚卵等，搭配白飯自己做 DIY 海鮮丼。",
          stayTime: "約 60～70 分鐘",
          openingHours: "星期五市場營業：約 06:00～13:00；用餐區：約 06:30～12:00",
          parking: "市場周邊有大型停車空間。",
          note: "各攤位可能提早收攤，因此這站不要再往後延。DIY 海鮮丼：先在市場選購喜歡的生魚片、鮪魚、魚卵等，再購買白飯組合。刺身可多人分食，不需要每個人各買一盒。4 大 1 小很適合共享不同海鮮。10 月可留意「三陸塩竈ひがしもの」品牌目鉢鮪魚。"
        },
        {
          id: "day2-drive-to-sendai-aquarium",
          type: "transport",
          period: "下午",
          name: "12:00｜塩釜水產物仲卸市場 → 仙台海洋森林水族館",
          priority: "must",
          status: "active",
          description: "車程約 15～20 分鐘。"
        },
        {
          id: "day2-sendai-uminomori-aquarium",
          type: "attraction",
          period: "下午",
          name: "12:30｜仙台海洋森林水族館",
          japaneseName: "仙台うみの杜水族館",
          priority: "must",
          status: "active",
          description: "下午主要親子景點。慢慢看大水槽、海洋生物與館內展示，不需要趕行程。",
          stayTime: "約 3～3.5 小時",
          openingHours: "2026/10/16 目前查得營業時間：09:00～17:30；最後入館：17:00",
          price: "成人：¥2,400；65 歲以上：¥1,800；小學生：¥1,200",
          parking: "約 800 台，免費。官方提醒停車場不可右轉進場。",
          seniorNote: "館內適合慢慢逛，可依家人體力休息。",
          note: "可使用 Web 入館券 QR Code 入館。出發前再確認 2026/10/16 最新營業時間、表演時刻及票價。"
        },
        {
          id: "day2-return-to-hotel",
          type: "transport",
          period: "傍晚",
          name: "約 16:00｜仙台海洋森林水族館 → 飯店",
          priority: "must",
          status: "active",
          description: "約 15:45～16:15 視家人體力離開水族館，不需要硬性卡在 16:00。",
          note: "回程後：晚餐／泡湯／休息。不要因為有空檔自行新增其他景點。"
        }
      ]
    },
    {
      day: 3,
      date: "2026-10-17",
      weekday: "SAT",
      title: "Day 3 Placeholder",
      route: "待填入",
      driveTime: "待確認",
      items: [
        {
          id: "day3-placeholder",
          type: "other",
          period: "上午",
          name: "待填入行程",
          priority: "optional",
          status: "standby",
          note: "正式 Day 3 資料之後放在 data/itinerary.js。"
        }
      ]
    },
    {
      day: 4,
      date: "2026-10-18",
      weekday: "SUN",
      title: "Day 4 Placeholder",
      route: "待填入",
      driveTime: "待確認",
      items: []
    },
    {
      day: 5,
      date: "2026-10-19",
      weekday: "MON",
      title: "Day 5 Placeholder",
      route: "待填入",
      driveTime: "待確認",
      items: []
    },
    {
      day: 6,
      date: "2026-10-20",
      weekday: "TUE",
      title: "Day 6 Placeholder",
      route: "待填入",
      driveTime: "待確認",
      items: []
    }
  ]
};
