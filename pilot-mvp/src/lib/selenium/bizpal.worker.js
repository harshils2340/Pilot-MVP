const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function runBizPalSearch({ location, businessType, permitTypes, headless = true }) {
  // 1️⃣ Configure Chrome options
  const options = new chrome.Options();
  options.addArguments(`--headless=${headless ? 'new' : 'false'}`); // set false for debugging
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1920,1080');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-blink-features=AutomationControlled'); // avoid automation detection
  options.addArguments(
    'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  );

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // 2️⃣ Open BizPaL
    await driver.get('https://beta.bizpal-perle.ca/en');

    // 3️⃣ Wait for input fields
    const locationInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="located"]')),
      30000
    );
    const businessInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="business"]')),
      30000
    );
    const permitInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="permits"]')),
      30000
    );

    // 4️⃣ Fill inputs
    await locationInput.sendKeys(location);
    await businessInput.sendKeys(businessType);
    await permitInput.sendKeys(permitTypes);

    // 5️⃣ Click "Find Permits and Licences"
    const findBtn = await driver.wait(
      until.elementLocated(
        By.xpath("//button[contains(text(), 'Find Permits and Licences')]")
      ),
      30000
    );
    await driver.wait(until.elementIsEnabled(findBtn), 10000);
    await driver.sleep(500); // small delay before click
    await findBtn.click();

    // 6️⃣ Wait for the first row of AG Grid
    await driver.sleep(2000); // give grid time to render
    let rows = await driver.wait(
      until.elementsLocated(By.css('[role="row"][row-id]:not(.ag-row-group)')),
      60000 // increase timeout for slow networks
    );

    // 7️⃣ Scroll incrementally to load all rows
    let lastCount = 0;
    let retries = 0;
    while (retries < 25) {
      rows = await driver.findElements(
        By.css('[role="row"][row-id]:not(.ag-row-group)')
      );

      if (rows.length === lastCount) retries++;
      else retries = 0;

      lastCount = rows.length;

      if (rows.length > 0) {
        await driver.executeScript(
          'arguments[0].scrollIntoView({behavior:"auto", block:"end"})',
          rows[rows.length - 1]
        );
      }

      await driver.sleep(1000); // wait for lazy-load
    }

    // 8️⃣ Extract permit data safely
    const permits = [];
    for (const row of rows) {
      let name = 'N/A';
      let description = '';

      try {
        name = await row.findElement(By.css('strong')).getText();
      } catch {}
      try {
        description = await row.findElement(By.css('p')).getText();
      } catch {}

      permits.push({ name, description });
    }

    return permits;
  } finally {
    await driver.quit();
  }
}

module.exports = { runBizPalSearch };
