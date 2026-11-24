"""把數學每個單元的題庫補到至少 TARGET 題（原本手寫題保留在前面，後面接程式出的變化題）。
變化題來自 app.js 的 MGEN 產生器，在無頭瀏覽器中執行，去除重複題目後寫回 math.json。
先執行 tools/build_math.py（會重建手寫題），再執行本檔：
  python3 -m http.server 8765 &   （在專案根目錄）
  python3 tools/gen_math_bank.py
"""
import json, os, asyncio, random
from playwright.async_api import async_playwright
TARGET = 120
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
M = os.path.join(ROOT, "math.json")

async def main():
    data = json.load(open(M, encoding="utf-8"))
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto("http://localhost:8765/jh/"); await pg.wait_for_timeout(1200)
        for u in data["units"]:
            have = [q for q in u["qs"] if not q.get("bank")]          # 手寫題
            need = TARGET - len(have)
            gen = await pg.evaluate("""([id,avoid,need])=>{const out=[], seen=new Set(avoid);
                for(let t=0;t<need*80&&out.length<need;t++){const q=mgen({id},[]); if(!q||seen.has(q.q)) continue; seen.add(q.q); q.bank=1; out.push(q);} return out;}""",
                [u["id"], [q["q"] for q in have], need])
            u["qs"] = have + gen
            print(u["id"], u["title"], "手寫", len(have), "＋變化題", len(gen), "=", len(u["qs"]))
        await b.close()
    data["version"] = data.get("version", 0) + 1
    json.dump(data, open(M, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
asyncio.run(main())
