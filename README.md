# 英文積點樂園｜短文閱讀（手機 App 版）

**App 網址：https://heathcyh.github.io/eng-reading/**　科目：英文短文閱讀、數學練習；程度：小四～國三，共六級。

這個 App 可以安裝到 Android 和 iPhone 的主畫面，安裝後會全螢幕開啟，沒有網路也能使用。語音朗讀使用手機內建的英文發音。

## 資料夾內容

| 檔案 | 用途 |
|---|---|
| `index.html` | App 主程式 |
| `content.json` | **英文題庫**（文章、題目、單字翻譯） |
| `math.json` | **數學題庫**（單元、重點、題目、詳解） |
| `manifest.json`、`sw.js` | 讓 App 可以安裝到主畫面、離線使用 |
| `icons/` | App 圖示 |

---

## 一、放上網路（免費，只需要做一次）

App 需要放在一個 https 網址上，手機才能安裝。以下用 **GitHub Pages**，免費且不用寫程式。

1. 到 github.com 註冊帳號並登入。
2. 右上角按「＋」→「New repository」，名稱填 `eng-reading`，選 **Public**，按「Create repository」。
3. 在新建立的頁面點「uploading an existing file」，把這個資料夾**裡面的所有檔案和 icons 資料夾**拖進去，再按「Commit changes」。
4. 進入「Settings」→ 左側「Pages」→ Branch 選 `main`、資料夾選 `/ (root)`，按「Save」。
5. 等 1～2 分鐘，網址會是：`https://你的帳號.github.io/eng-reading/`

## 二、安裝到手機

- **Android**：用 **Chrome** 開啟上面的網址 →「⋮」→「加到主畫面」或「安裝應用程式」。
- **iPhone**：用 **Safari** 開啟網址 → 分享按鈕 →「加入主畫面」。

> 不要在 LINE、FB 或 Claude App 的內建瀏覽器裡使用，這些瀏覽器多半不支援語音朗讀。

---

## 三、更新題目（兩種方式）

### 方式 A：更新網路上的題庫（全部手機都會拿到）

1. 在 GitHub 的專案頁面點 `content.json` → 鉛筆圖示（Edit），或直接上傳新的 `content.json` 覆蓋舊檔。
2. **記得把最上面的 `"version"` 數字加 1**，例如 1 改成 2。
3. 按「Commit changes」。學生下次連網打開 App，就會自動拿到新題目。也可以按 ⚙️ →「檢查題庫更新」立即更新。新文章會標示 **NEW**。

### 方式 B：匯入題庫檔（單台手機，不用上網）

在 App 中按 ⚙️ →「匯入題庫檔（.json）」，選擇題目檔即可。匯入時會自動檢查格式；如果有錯，畫面會顯示錯在哪裡。

> 小技巧：可以直接請 Claude「依照這個格式，幫我出 3 篇國二的新文章，輸出成 JSON」，再用方式 A 或 B 加入。

---

## 四、題目格式

每篇文章是 `passages` 裡的一個物件：

```json
{
  "id": "g8-4",
  "level": 8,
  "title": "My Favorite Season",
  "zh": "我最喜歡的季節",
  "text": "I like {winter} best.\n第二段從這裡開始……",
  "cloze": [
    { "opts": ["winter", "winters", "cold", "snow"], "exp": "中文解析" }
  ],
  "qs": [
    { "q": "Which season does the writer like best?",
      "opts": ["Winter.", "Summer.", "Spring.", "Fall."],
      "exp": "中文解析" }
  ],
  "dict": { "season": "n. 季節" }
}
```

規則：

- `id`：每篇都要不一樣。用已有的 id 會**覆蓋**那一篇。
- `level`：4＝小四，5＝小五，6＝小六，7＝國一，8＝國二，9＝國三。
- `text`：段落之間用 `\n` 分隔。要挖空做克漏字的字用 `{ }` 包起來。
- `cloze`：照 `{ }` 出現的順序排列，數量必須和 `{ }` 一樣。**`opts` 的第一個選項就是正確答案**，App 顯示時會自動打亂順序。
- `qs`：文意理解題，同樣是**第一個選項為正確答案**。
- `dict`（可省略）：這篇用到、但總字典沒有的單字翻譯。沒有翻譯的字點下去仍然可以聽發音。總字典放在 `content.json` 最下面的 `"dict"`。

---

## 五、數學題目格式（math.json）

```json
{
  "version": 2,
  "units": [
    {
      "id": "m5-4",
      "level": 5,
      "title": "時間的計算",
      "key": ["1 小時 = 60 分鐘", "重點可用 [3/4] 顯示分數、x^2 顯示次方"],
      "qs": [
        { "t": "mc", "q": "選擇題題目", "opts": ["正確答案", "錯誤1", "錯誤2", "錯誤3"], "exp": "詳解" },
        { "t": "num", "q": "計算題題目", "ans": "2又1/3", "unit": "公分", "exp": "詳解" }
      ]
    }
  ]
}
```

- `t`：`mc`＝選擇題（第一個選項為正確答案），`num`＝填數字。
- `ans` 可以是整數、小數、分數 `7/12`、帶分數 `2又1/3`、負數 `-3`。學生填等值的答案也算對，例如 0.6 和 3/5；但分數要求約到最簡分數。
- 文字格式：`[a/b]` 顯示直式分數，`x^2` 或 `10^{−4}` 顯示次方，`√{25 × 2}` 顯示根號。
- 更新網路上的題庫後，記得把 `version` 加 1。也可以用 App 的「匯入題庫檔」匯入只含 `units` 的 JSON。
