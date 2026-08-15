const { chromium } = require('playwright');

(async () => {
  const base = process.env.TEST_BASE || 'http://localhost:5174'
  const browser = await chromium.launch({ chromiumSandbox: false })
  const page = await browser.newPage()
  try {
    await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', 'admin@gmail.com')
    await page.fill('input[type="password"]', 'demo@123')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }),
      page.click('button[type="submit"]'),
    ])

    const token = await page.evaluate(() => localStorage.getItem('auth:token'))
    const user = await page.evaluate(() => localStorage.getItem('auth:user'))
    console.log('token-present:', !!token)
    console.log('user-present:', !!user)
    console.log('user-value:', user)
    console.log('final-url:', page.url())
    await browser.close()
    process.exit(token ? 0 : 2)
  } catch (err) {
    console.error('Test error:', err)
    await browser.close()
    process.exit(1)
  }
})()
