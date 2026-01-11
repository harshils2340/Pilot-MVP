// const { Builder, By, until, Key } = require('selenium-webdriver');
// const chrome = require('selenium-webdriver/chrome');

// const sleep = ms => new Promise(res => setTimeout(res, ms));

// async function typeLikeHuman(element, text = '', delay = 120) {
//   if (typeof text !== 'string') text = String(text ?? '');
//   await element.clear();
//   for (const char of text) {
//     await element.sendKeys(char);
//     await sleep(delay);
//   }
// }

// async function waitForAutocompleteAndEnter(driver, input) {
//   await driver.wait(async () => {
//     const expanded = await input.getAttribute('aria-expanded');
//     return expanded === 'true';
//   }, 15000);
//   await sleep(300);
//   await input.sendKeys(Key.ENTER);
//   await sleep(600);
// }

// async function runBizPalSearch({ location, businessType, permitKeywords = '' }) {
//   const options = new chrome.Options();
//   options.addArguments('--disable-gpu');
//   options.addArguments('--window-size=1920,1080');
//   options.addArguments('--no-sandbox');
//   options.addArguments('--disable-dev-shm-usage');

//   const driver = await new Builder()
//     .forBrowser('chrome')
//     .setChromeOptions(options)
//     .build();

//   try {
//     console.log('Opening BizPaL...');
//     await driver.get('https://beta.bizpal-perle.ca/en');

//     // --- INPUT 1: LOCATION ---
//     const locationInput = await driver.wait(
//       until.elementLocated(By.css('input[placeholder*="located"]')),
//       30000
//     );
//     await locationInput.click();
//     console.log(`Typing location: ${location}`);
//     await typeLikeHuman(locationInput, location);
//     await waitForAutocompleteAndEnter(driver, locationInput);

//     // TAB → INPUT 2
//     await locationInput.sendKeys(Key.TAB);
//     await sleep(500);
//     const businessInput = await driver.switchTo().activeElement();

//     // --- INPUT 2: BUSINESS TYPE ---
//     console.log(`Typing business type: ${businessType}`);
//     await typeLikeHuman(businessInput, businessType);
//     await waitForAutocompleteAndEnter(driver, businessInput);

//     // TAB → INPUT 3
//     await businessInput.sendKeys(Key.TAB);
//     await sleep(500);
//     const permitInput = await driver.switchTo().activeElement();

//     // CLICK to ensure focus (React requires click)
//     await permitInput.click();
//     console.log(`Typing permit keywords: ${permitKeywords}`);
//     await typeLikeHuman(permitInput, permitKeywords, 80);

//     // TAB → SEARCH BUTTON
//     await permitInput.sendKeys(Key.TAB);
//     await sleep(600);

//     const searchButton = await driver.switchTo().activeElement();
//     const btnText = await searchButton.getText();
//     if (!btnText.includes('Find Permits')) {
//       throw new Error('Search button not focused after TAB.');
//     }

//     console.log('Submitting search...');
//     await searchButton.sendKeys(Key.ENTER);

//     // --- WAIT FOR RESULTS ---
//     console.log('Waiting for results...');
//     await driver.wait(
//       until.elementLocated(By.css('.ag-center-cols-container')),
//       30000
//     );

//     let rows = [];
//     const timeoutAt = Date.now() + 60000;

//     while (Date.now() < timeoutAt) {
//       rows = await driver.findElements(By.css('.ag-center-cols-container .ag-row'));
//       if (rows.length > 0) break;
//       await sleep(500);
//     }

//     if (rows.length === 0) throw new Error('No permit rows found.');
//     console.log(`Rows loaded: ${rows.length}`);

//     // --- SCROLL GRID ---
//     let lastCount = 0;
//     let stable = 0;
//     while (stable < 15) {
//       rows = await driver.findElements(By.css('.ag-center-cols-container .ag-row'));
//       if (rows.length === lastCount) stable++;
//       else stable = 0;
//       lastCount = rows.length;
//       await driver.executeScript(
//         'arguments[0].scrollIntoView({ block: "end" })',
//         rows[rows.length - 1]
//       );
//       await sleep(800);
//     }

//     // --- EXTRACT ---
//     const permits = [];
//     for (const row of rows) {
//       let name = 'N/A';
//       let description = '';
//       try { name = await row.findElement(By.css('strong')).getText(); } catch {}
//       try { description = await row.findElement(By.css('p')).getText(); } catch {}
//       permits.push({ name, description });
//     }

//     console.log(`Extracted ${permits.length} permits.`);
//     return permits;

//   } finally {
//     await driver.quit();
//   }
// }

// module.exports = { runBizPalSearch };




























// const { Builder, By, until, Key } = require('selenium-webdriver');
// const chrome = require('selenium-webdriver/chrome');
// const fs = require('fs');

// const sleep = ms => new Promise(r => setTimeout(r, ms));

// async function copyToClipboard(text) {
//   const { default: clipboardy } = await import('clipboardy');
//   await clipboardy.write(text);
// }

// async function typeLikeHuman(element, text = '', delay = 120) {
//   if (typeof text !== 'string') text = String(text ?? '');
//   await element.clear();
//   for (const char of text) {
//     await element.sendKeys(char);
//     await sleep(delay);
//   }
// }

// async function waitForAutocompleteAndEnter(driver, input) {
//   await driver.wait(async () => {
//     const expanded = await input.getAttribute('aria-expanded');
//     return expanded === 'true';
//   }, 20000);
//   await sleep(300);
//   await input.sendKeys(Key.ENTER);
//   await sleep(700);
// }

// async function runBizPalSearch() {
//   console.log('🚀 BizPaL worker started');

//   // 🔥 INPUTS FROM YOUR WEBSITE
//   const location = 'Brampton, ON';
//   const businessType = 'Manufacturing';
//   const permitKeywordsFromYourWebsite =
//     'Land use';

//   // ✅ COPY TO CLIPBOARD (FIXED)
//   await copyToClipboard(permitKeywordsFromYourWebsite);

//   const options = new chrome.Options();
//   options.addArguments('--window-size=1600,1000');
//   options.addArguments('--disable-gpu');
//   options.addArguments('--no-sandbox');

//   const driver = await new Builder()
//     .forBrowser('chrome')
//     .setChromeOptions(options)
//     .build();

//   try {
//     console.log('🌐 Opening BizPaL...');
//     await driver.get('https://beta.bizpal-perle.ca/en');
//     await sleep(5000);

//     // ========= INPUT 1: LOCATION =========
//     const locationInput = await driver.wait(
//       until.elementLocated(By.css('input[placeholder*="located"]')),
//       30000
//     );

//     await locationInput.click();
//     await typeLikeHuman(locationInput, location);
//     await waitForAutocompleteAndEnter(driver, locationInput);

//     // TAB → INPUT 2
//     await locationInput.sendKeys(Key.TAB);
//     await sleep(600);
//     const businessInput = await driver.switchTo().activeElement();

//     // ========= INPUT 2: BUSINESS =========
//     await businessInput.click();
//     await typeLikeHuman(businessInput, businessType);
//     await waitForAutocompleteAndEnter(driver, businessInput);

//     // TAB → INPUT 3
//     await businessInput.sendKeys(Key.TAB);
//     await sleep(600);
//     const permitInput = await driver.switchTo().activeElement();

//     // ========= INPUT 3: PERMIT KEYWORDS (PASTE) =========
//     await permitInput.click();
//     await sleep(300);

//     const modifier =
//       process.platform === 'darwin' ? Key.COMMAND : Key.CONTROL;

//     // Select all
//     await permitInput.sendKeys(modifier, 'a');
//     await sleep(200);

//     // Paste
//     await permitInput.sendKeys(modifier, 'v');
//     await sleep(500);

//     // TAB → SEARCH BUTTON
//     await permitInput.sendKeys(Key.TAB);
//     await sleep(600);

//     const searchButton = await driver.switchTo().activeElement();
//     const btnText = await searchButton.getText();

//     if (!btnText.includes('Find')) {
//       throw new Error('❌ Search button not focused');
//     }

//     console.log('🔍 Submitting search...');
//     await searchButton.sendKeys(Key.ENTER);

//     // ========= WAIT FOR RESULTS =========
//     console.log('⏳ Waiting for results...');
//     await driver.wait(
//       until.elementLocated(By.css('.ag-center-cols-container')),
//       30000
//     );

//     // ========= LOAD ALL AG-GRID ROWS =========
//     let lastCount = 0;
//     let stableCount = 0;

//     while (stableCount < 20) {
//       const rows = await driver.findElements(
//         By.css('.ag-center-cols-container .ag-row')
//       );

//       if (rows.length === lastCount) stableCount++;
//       else {
//         stableCount = 0;
//         lastCount = rows.length;
//       }

//       if (rows.length > 0) {
//         await driver.executeScript(
//           'arguments[0].scrollIntoView({ block: "end" })',
//           rows[rows.length - 1]
//         );
//       }

//       await sleep(800);
//     }

//     const rows = await driver.findElements(
//       By.css('.ag-center-cols-container .ag-row')
//     );

//     console.log(`📄 Extracting ${rows.length} permits`);

//     // ========= EXTRACT =========
//     const permits = [];

//     for (const row of rows) {
//       let name = '';
//       let description = '';

//       try { name = await row.findElement(By.css('strong')).getText(); } catch {}
//       try { description = await row.findElement(By.css('p')).getText(); } catch {}

//       if (name) permits.push({ name, description });
//     }

//     fs.writeFileSync(
//       'bizpal_permits.json',
//       JSON.stringify(permits, null, 2)
//     );

//     console.log(`✅ Saved ${permits.length} permits`);

//   } catch (err) {
//     console.error('❌ Worker failed:', err);
//   } finally {
//     await driver.quit();
//   }
// }

// runBizPalSearch();



























const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

function log(msg) {
  console.log(`[BIZPAL] ${msg}`);
}

/**
 * Updated to use process.cwd() so screenshots save to your visible project folder,
 * not a hidden Next.js build directory.
 */
async function screenshot(driver, name) {
  try {
    const debugDir = path.join(process.cwd(), 'public', 'debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    
    const filePath = path.join(debugDir, `${name}.png`);
    const image = await driver.takeScreenshot();
    fs.writeFileSync(filePath, image, 'base64');
    log(`📸 Screenshot saved to: /public/debug/${name}.png`);
  } catch (err) {
    log(`⚠️ Failed to take screenshot ${name}: ${err.message}`);
  }
}

async function typeLikeHuman(element, text = '', delay = 100) {
  text = String(text ?? '').trim();
  await element.clear(); 
  for (const char of text) {
    await element.sendKeys(char);
    await sleep(delay); 
  }
}

async function handleAutocomplete(driver, inputElement, text, stepName) {
  log(`⌨️ Interaction: ${stepName} -> Typing "${text}"`);
  await typeLikeHuman(inputElement, text);
  await sleep(1500); // Increased wait for network-based suggestions

  try {
    await inputElement.sendKeys(Key.ARROW_DOWN);
    await sleep(500);

    const dropdownSelector = By.css('li, .pac-item, [role="option"], .suggestion-item'); 
    try {
        const option = await driver.wait(until.elementLocated(dropdownSelector), 4000);
        await option.click();
        log(`✅ Clicked suggestion for ${stepName}`);
    } catch (e) {
        log(`⚠️ No dropdown found for ${stepName}, using ENTER fallback.`);
        await inputElement.sendKeys(Key.ENTER);
    }
  } catch (err) {
    log(`❌ Error in autocomplete for ${stepName}: ${err.message}`);
    throw err;
  }
  await sleep(1000);
}

async function runBizPalSearch({ location, businessType, permitKeywords }) {
  log('Worker started');
  log(`[DEBUG] Inputs: location='${location}', businessType='${businessType}'`);

  // --- Chrome Configuration ---
  const options = new chrome.Options();
  options.addArguments(
    '--headless=new',                // Switch to '--none' if you want to see the browser window pop up
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--window-size=1920,1080',
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  let driver;
  try {
    log('⏳ Building Chrome Driver...');
    
    // Enabling verbose logging to a file to catch silent launch failures
    const serviceBuilder = new chrome.ServiceBuilder();
    serviceBuilder.loggingTo(path.join(process.cwd(), 'chromedriver.log'));

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(serviceBuilder)
      .build();
      
    log('✅ Chrome launched');

    log('🌐 Opening BizPaL...');
    await driver.get('https://beta.bizpal-perle.ca/');
    await driver.wait(until.elementLocated(By.css('input')), 20000);
    await screenshot(driver, '01-home');

    // STEP 1: LOCATION
    const locInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="located"], input[type="text"]')), 
      15000
    );
    await handleAutocomplete(driver, locInput, location, "Location");
    await screenshot(driver, '02-location-set');

    // STEP 2: BUSINESS TYPE
    log('⏳ Waiting for Business Type field...');
    const busInput = await driver.wait(
        until.elementLocated(By.css('input[placeholder*="business"], input[placeholder*="industry"]')),
        15000
    );
    await driver.wait(until.elementIsVisible(busInput), 5000);
    await handleAutocomplete(driver, busInput, businessType, "BusinessType");
    await screenshot(driver, '03-business-set');

    // STEP 3: SUBMIT
    try {
        const searchBtn = await driver.findElement(By.css('button[type="submit"], button.primary-btn'));
        await searchBtn.click();
        log('🖱️ Clicked Search Button');
    } catch (e) {
        log('ℹ️ Search button not found, relying on previous Enter keys.');
    }

    // STEP 4: RESULTS
    log('🔍 Waiting for results table...');
    await driver.wait(until.elementLocated(By.css('.ag-center-cols-container, .results-list')), 30000);
    await sleep(3000); 
    await screenshot(driver, '04-results-loaded');

    const rows = await driver.findElements(By.css('.ag-center-cols-container .ag-row'));
    const permits = [];
    
    for (const row of rows) {
      let name = '', description = '';
      try { name = await row.findElement(By.css('strong, h3')).getText(); } catch {}
      try { description = await row.findElement(By.css('p, .description')).getText(); } catch {}
      if (name) permits.push({ name, description });
    }

    log(`🎯 Extracted ${permits.length} permits`);
    return permits;

  } catch (err) {
    log(`❌ RUNTIME ERROR: ${err.message}`);
    if (driver) await screenshot(driver, 'CRITICAL_FAILURE');
    throw err;
  } finally {
    if (driver) {
      await driver.quit();
      log('🧹 Driver closed');
    }
  }
}

module.exports = { runBizPalSearch };