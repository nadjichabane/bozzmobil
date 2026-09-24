import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('http://localhost:5173')

const pages = [
  ['Dashboard', ''],
  ['Sales', ''],
  ['Master Unit', 'button:has-text("Master Unit")'],
  ['Inventory', 'button:has-text("Inventory")'],
  ['Laporan', 'button:has-text("Laporan")'],
  ['AI Analytics', 'button:has-text("AI Analytics")'],
]

for (const [name, selector] of pages) {
  if (selector) await page.click(selector)
  await page.waitForTimeout(800)
  await page.screenshot({ path: `C:/Users/user/bozzmobil/${name.toLowerCase().replace(' ', '-')}.png`, fullPage: false })
  console.log(`${name} screenshot done`)
}

await browser.close()
