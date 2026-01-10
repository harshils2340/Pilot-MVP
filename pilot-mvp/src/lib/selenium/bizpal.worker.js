const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function typeLikeHuman(element, text = '', delay = 120) {
  if (typeof text !== 'string') text = String(text ?? '');
  await element.clear();
  for (const char of text) {
    await element.sendKeys(char);
    await sleep(delay);
  }
}

async function waitForAutocompleteAndEnter(driver, input) {
  await driver.wait(async () => {
    const expanded = await input.getAttribute('aria-expanded');
    return expanded === 'true';
  }, 15000);
  await sleep(300);
  await input.sendKeys(Key.ENTER);
  await sleep(600);
}

async function runBizPalSearch({ location, businessType, permitKeywords = '' }) {
  const options = new chrome.Options();
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1920,1080');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    console.log('Opening BizPaL...');
    await driver.get('https://beta.bizpal-perle.ca/en');

    // --- INPUT 1: LOCATION ---
    const locationInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="located"]')),
      30000
    );
    await locationInput.click();
    console.log(`Typing location: ${location}`);
    await typeLikeHuman(locationInput, location);
    await waitForAutocompleteAndEnter(driver, locationInput);

    // TAB → INPUT 2
    await locationInput.sendKeys(Key.TAB);
    await sleep(500);
    const businessInput = await driver.switchTo().activeElement();

    // --- INPUT 2: BUSINESS TYPE ---
    console.log(`Typing business type: ${businessType}`);
    await typeLikeHuman(businessInput, businessType);
    await waitForAutocompleteAndEnter(driver, businessInput);

    // TAB → INPUT 3
    await businessInput.sendKeys(Key.TAB);
    await sleep(500);
    const permitInput = await driver.switchTo().activeElement();

    // CLICK to ensure focus (React requires click)
    await permitInput.click();
    console.log(`Typing permit keywords: ${permitKeywords}`);
    await typeLikeHuman(permitInput, permitKeywords, 80);

    // TAB → SEARCH BUTTON
    await permitInput.sendKeys(Key.TAB);
    await sleep(600);

    const searchButton = await driver.switchTo().activeElement();
    const btnText = await searchButton.getText();
    if (!btnText.includes('Find Permits')) {
      throw new Error('Search button not focused after TAB.');
    }

    console.log('Submitting search...');
    await searchButton.sendKeys(Key.ENTER);

    // --- WAIT FOR RESULTS ---
    console.log('Waiting for results...');
    await driver.wait(
      until.elementLocated(By.css('.ag-center-cols-container')),
      30000
    );

    let rows = [];
    const timeoutAt = Date.now() + 60000;

    while (Date.now() < timeoutAt) {
      rows = await driver.findElements(By.css('.ag-center-cols-container .ag-row'));
      if (rows.length > 0) break;
      await sleep(500);
    }

    if (rows.length === 0) throw new Error('No permit rows found.');
    console.log(`Rows loaded: ${rows.length}`);

    // --- SCROLL GRID ---
    let lastCount = 0;
    let stable = 0;
    while (stable < 15) {
      rows = await driver.findElements(By.css('.ag-center-cols-container .ag-row'));
      if (rows.length === lastCount) stable++;
      else stable = 0;
      lastCount = rows.length;
      await driver.executeScript(
        'arguments[0].scrollIntoView({ block: "end" })',
        rows[rows.length - 1]
      );
      await sleep(800);
    }

    // --- EXTRACT ---
    const permits = [];
    for (const row of rows) {
      let name = 'N/A';
      let description = '';
      try { name = await row.findElement(By.css('strong')).getText(); } catch {}
      try { description = await row.findElement(By.css('p')).getText(); } catch {}
      permits.push({ name, description });
    }

    console.log(`Extracted ${permits.length} permits.`);
    return permits;

  } finally {
    await driver.quit();
  }
}

module.exports = { runBizPalSearch };
