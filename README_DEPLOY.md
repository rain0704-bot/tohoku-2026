# 日本東北 2026 GitHub Pages 部署說明

這個資料夾是純前端靜態網站，可以直接部署到 GitHub Pages。

## 上傳到 GitHub

1. 建立一個新的 GitHub repository，例如 `tohoku-2026`.
2. 把這個資料夾內的所有檔案上傳到 repository 根目錄：
   - `index.html`
   - `css/`
   - `js/`
   - `data/`
   - `images/`
   - `.nojekyll`
3. 到 repository 的 `Settings` → `Pages`.
4. `Build and deployment` 選擇 `Deploy from a branch`.
5. Branch 選 `main`，資料夾選 `/root`.
6. 儲存後等待 GitHub Pages 產生網址。

## 手機使用

GitHub Pages 網址產生後，用手機瀏覽器打開即可。行程修改會儲存在該手機瀏覽器的 LocalStorage。

換手機或換瀏覽器時，請先在舊裝置使用「更多 → 匯出行程」，再到新裝置使用「更多 → 匯入行程」。

## 正式行程資料位置

正式 Day 1～Day 6 原始資料放在：

`data/itinerary.js`

如果手機已經有舊版 LocalStorage，網站會優先顯示手機上保存的版本。需要重新套用原始資料時，請在網站中使用「更多 → 恢復原始行程」。
