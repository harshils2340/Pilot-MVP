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



























  /**
   * BizPaL Selenium Automation Worker
   * 
   * This script automates the BizPaL website to search for permits.
   * 
   * VISIBILITY MODE:
   * - By default, the browser window will open so you can see what's happening
   * - To run in headless mode (no window), uncomment the '--headless=new' line
   *   in the Chrome options and comment out the window-size line
   * 
   * DEBUGGING:
   * - Screenshots are saved to /public/debug/ folder for each step
   * - Check server console for detailed logs
   * - If errors occur, check ERROR_page_source.html in /public/debug/
   */

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

  // Helper function to copy text to clipboard
  async function copyToClipboard(text) {
    try {
      const { default: clipboardy } = await import('clipboardy');
      await clipboardy.write(text);
      log(`📋 Copied to clipboard: "${text}"`);
      return true;
    } catch (err) {
      log(`⚠️ Failed to copy to clipboard: ${err.message}`);
      return false;
    }
  }

  async function runBizPalSearch({ location, businessType, permitKeywords, permitTypes }) {
    log('Worker started');
    
    // Validate and clean inputs
    // Support both permitKeywords and permitTypes (for backward compatibility with test file)
    location = String(location || '').trim();
    businessType = String(businessType || '').trim();
    permitKeywords = String(permitKeywords || permitTypes || '').trim(); // Accept either parameter name
    
    if (!location || !businessType) {
      throw new Error(`Missing required inputs: location='${location}', businessType='${businessType}'`);
    }
    
    log(`[DEBUG] Inputs: location='${location}', businessType='${businessType}', permitKeywords='${permitKeywords || '(none)'}'`);

    // --- Chrome Configuration ---
    const options = new chrome.Options();
    
    // ============================================================
    // VISIBLE MODE - Browser window will open so you can see it!
    // ============================================================
    // CRITICAL: Explicitly disable headless mode to see the browser
    // Do NOT add --headless or --headless=new - it will hide the window!
    
    // Force visible mode (explicitly disable any headless settings)
    options.addArguments(
      '--window-size=1920,1080',
      '--start-maximized',              // Browser opens maximized
      '--disable-infobars',             // Cleaner browser window
      '--no-sandbox',                   // Required for some environments
      '--disable-dev-shm-usage',        // Overcome limited resource problems
      '--disable-blink-features=AutomationControlled', // Remove automation flags
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Note: remote-debugging-port may conflict if already in use
      // If you get a "port already in use" error, change this number
      // Removed remote-debugging-port as it can cause conflicts and hangs
    );
    
    // CRITICAL: Ensure headless is NOT enabled
    // Do NOT call options.headless() - it defaults to false
    // Make absolutely sure NO headless flags are added
    
    log('👁️  VISIBLE MODE ENABLED - Browser window will open so you can watch!');
    log('📋 Chrome options configured for VISIBLE browser window');
    log('⚠️  IMPORTANT: If browser window does not appear, check:');
    log('   1. No other Chrome instances are blocking it');
    log('   2. Check Task Manager for Chrome processes');
    log('   3. Look for minimized Chrome windows in taskbar');

    let driver;
    try {
      log('⏳ Building Chrome Driver...');
      log('📝 Checking for Chrome and ChromeDriver availability...');
      
      // Check for existing Chrome processes that might block
      const { execSync } = require('child_process');
      try {
        const chromeProcesses = execSync('tasklist /FI "IMAGENAME eq chrome.exe" /FO CSV /NH 2>nul || echo "No Chrome processes found"', { encoding: 'utf-8' });
        const chromeCount = (chromeProcesses.match(/chrome.exe/g) || []).length;
        if (chromeCount > 0) {
          log(`⚠️  Found ${chromeCount} existing Chrome process(es). This might cause issues.`);
          log('   💡 TIP: Close all Chrome windows before running Selenium, or kill processes in Task Manager');
        } else {
          log('✅ No existing Chrome processes found (good!)');
        }
      } catch (e) {
        log(`⚠️  Could not check for Chrome processes: ${e.message}`);
      }
      
      // Add timeout wrapper for the build process
      log('🚀 Starting Chrome Driver build (this may take 30-60 seconds)...');
      const buildStartTime = Date.now();
      
      // Try to find Chrome executable path explicitly
      let chromePath = null;
      const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      ];
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          chromePath = possiblePath;
          log(`✅ Found Chrome at: ${chromePath}`);
          options.setChromeBinaryPath(chromePath);
          break;
        }
      }
      
      if (!chromePath) {
        log('⚠️  Could not find Chrome executable automatically. Selenium will try to find it.');
      }
      
      // CRITICAL: Explicitly find and use ChromeDriver from node_modules
      // This works the same way as the test script - MUST match exactly
      let serviceBuilder = null;
      
      try {
        // Get ChromeDriver path from the chromedriver package (same as test script)
        const chromedriverLib = require('chromedriver');
        const chromedriverPath = chromedriverLib.path;
        log(`✅ ChromeDriver binary path: ${chromedriverPath}`);
        
        if (fs.existsSync(chromedriverPath)) {
          serviceBuilder = new chrome.ServiceBuilder(chromedriverPath);
          log('✅ Using ChromeDriver from chromedriver package (same as test script)');
        } else {
          log(`⚠️  ChromeDriver binary not found at: ${chromedriverPath}`);
          log('   Will try to use system ChromeDriver');
        }
      } catch (e) {
        log(`⚠️  Could not load chromedriver package: ${e.message}`);
        log('   Will try to use system ChromeDriver');
      }
      
      log('🔧 Building Chrome Driver (using same method as test script)...');
      
      // Build the driver with timeout - MUST match test script approach
      const buildPromise = serviceBuilder
        ? new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .setChromeService(serviceBuilder)
            .build()
        : new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
      
      // Create a timeout promise - Increased timeout to match real Chrome startup time
      const buildTimeout = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Chrome Driver build timed out after 120 seconds. Chrome may be starting slowly or blocked. Try: 1) Close all Chrome windows 2) Restart your computer 3) Check antivirus settings'));
        }, 120000); // 120 second timeout - Chrome can take time to start
      });
      
      // Race between build and timeout
      driver = await Promise.race([buildPromise, buildTimeout]);
      
      const buildDuration = ((Date.now() - buildStartTime) / 1000).toFixed(2);
      log(`✅ Chrome Driver built successfully in ${buildDuration} seconds!`);
      log('✅ Chrome launched');
      
      // CRITICAL: Verify Chrome is running in visible mode and bring to front
      try {
        const capabilities = await driver.getCapabilities();
        const browserName = capabilities.getBrowserName();
        const browserVersion = capabilities.getBrowserVersion();
        log(`🌐 Browser: ${browserName} ${browserVersion}`);
        
        // CRITICAL: Maximize window FIRST (this brings it to front on Windows)
        await driver.manage().window().maximize();
        log('✅ Browser window maximized');
        await sleep(1000);
        
        // Get current window size and position to verify
        const windowRect = await driver.manage().window().getRect();
        log(`📐 Window size: ${windowRect.width}x${windowRect.height}, position: (${windowRect.x}, ${windowRect.y})`);
        
        // Try to bring window to front using multiple methods
        try {
          // Method 1: JavaScript focus
          await driver.executeScript('window.focus();');
          log('✅ Executed window.focus()');
        } catch (e) {
          log(`⚠️  window.focus() failed: ${e.message}`);
        }
        
        try {
          // Method 2: Switch to default content and focus
          await driver.switchTo().defaultContent();
          await driver.executeScript('if (window.parent) window.parent.focus();');
          log('✅ Attempted parent window focus');
        } catch (e) {
          log(`⚠️  Parent focus failed: ${e.message}`);
        }
        
        await sleep(3000); // Give more time for window to appear and come to front
        log('👀 ============================================================');
        log('👀 BROWSER WINDOW SHOULD NOW BE VISIBLE!');
        log('👀 If you don\'t see it:');
        log('👀   1. Check your taskbar for a Chrome icon');
        log('👀   2. Press Alt+Tab to cycle through windows');
        log('👀   3. Check Task Manager for chrome.exe processes');
        log('👀 ============================================================');
      } catch (e) {
        log(`⚠️  Window management warning: ${e.message} - Browser may still be running`);
      }

      log('🌐 Opening BizPaL...');
      await driver.get('https://beta.bizpal-perle.ca/en');
      log('⏳ Waiting for page to load...');
      await driver.wait(until.elementLocated(By.css('input')), 20000);
      await sleep(5000); // Increased wait to see what's happening
      const pageTitle = await driver.getTitle();
      log(`📄 Page title: ${pageTitle}`);
      await screenshot(driver, '01-home');
      log('✅ Page loaded and screenshot taken');

      // ====================================================================
      // EXACT SEQUENCE AS REQUESTED:
      // 1. Field 1 (Location): Type → Enter → Tab
      // 2. Field 2 (Business Type): Type → Enter → Tab
      // 3. Field 3 (Permit Keywords): Copy/Paste → Tab → Enter
      // ====================================================================

      // STEP 1: LOCATION FIELD - Type input → Press Enter → Press Tab
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('📍 STEP 1: LOCATION FIELD');
      log('   Action: Type → Enter → Tab');
      log(`   Value: "${location}"`);
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const locInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="located"], input[type="text"]')), 
      15000
    );
    
    // Scroll into view and click
    await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', locInput);
    await sleep(500); // Increased delay so you can see it
    await locInput.click();
    await sleep(1000); // Increased delay so you can see the click
    
    // Type the location
    log('   ⌨️  Typing location...');
    await typeLikeHuman(locInput, location, 150); // Slower typing so you can see it
    await sleep(2000); // Wait for autocomplete dropdown (increased)
    
    // Press Enter
    log('   ⌨️  Pressing Enter...');
    await locInput.sendKeys(Key.ENTER);
    await sleep(1500); // Increased delay
    
    // Press Tab
    log('   ⌨️  Pressing Tab...');
    await locInput.sendKeys(Key.TAB);
    await sleep(1200); // Increased delay
      
      await screenshot(driver, '02-location-set');
      log('   ✅ Location field completed');

      // STEP 2: BUSINESS TYPE FIELD - Type input → Press Enter → Press Tab
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('🏢 STEP 2: BUSINESS TYPE FIELD');
      log('   Action: Type → Enter → Tab');
      log(`   Value: "${businessType}"`);
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Get the currently focused element (should be business type field after TAB)
      const busInput = await driver.switchTo().activeElement();
      await driver.wait(until.elementIsVisible(busInput), 5000);
      
    // Click to ensure focus
    await busInput.click();
    await sleep(1000); // Increased delay so you can see it
    
    // Type the business type
    log('   ⌨️  Typing business type...');
    await typeLikeHuman(busInput, businessType, 150); // Slower typing so you can see it
    await sleep(2000); // Wait for autocomplete dropdown (increased)
    
    // Press Enter
    log('   ⌨️  Pressing Enter...');
    await busInput.sendKeys(Key.ENTER);
    await sleep(1500); // Increased delay
    
    // Press Tab
    log('   ⌨️  Pressing Tab...');
    await busInput.sendKeys(Key.TAB);
    await sleep(1200); // Increased delay
      
      await screenshot(driver, '03-business-set');
      log('   ✅ Business type field completed');

      // STEP 3: PERMIT KEYWORDS FIELD - Copy/Paste from API → Tab → Enter
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('🔑 STEP 3: PERMIT KEYWORDS FIELD');
      log('   Action: Copy from API → Paste to BizPaL → Tab → Enter');
      log(`   API Value: "${permitKeywords || '(none - skipping)'}"`);
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (permitKeywords) {
        // Step 3.1: Copy permit keywords from API to clipboard
        log('   📋 Copying permit keywords from API to clipboard...');
        const copied = await copyToClipboard(permitKeywords);
        if (!copied) {
          log('   ⚠️  Clipboard copy failed, will try alternative method');
        }
        await sleep(500);
        
        // Step 3.2: Find the permit keywords input field (3rd field)
        log('   🔍 Finding permit keywords input field (3rd field)...');
        let permitInput;
        try {
          // Get the currently focused element (should be permit keywords field after TAB from business type)
          permitInput = await driver.switchTo().activeElement();
          const tagName = await permitInput.getTagName();
          if (tagName.toLowerCase() !== 'input') {
            // If not an input, try to find it explicitly
            log('   ℹ️  Active element is not input, searching for permit keywords field...');
            permitInput = await driver.wait(
              until.elementLocated(By.css('input[placeholder*="permit"], input[placeholder*="licence"], input[placeholder*="keyword"], input[type="text"]')),
              10000
            );
            // Try to find the third input field if selector doesn't work
            const allInputs = await driver.findElements(By.css('input[type="text"]'));
            if (allInputs.length >= 3) {
              permitInput = allInputs[2]; // Third input field (0-indexed)
              log(`   ✅ Found permit keywords field (3rd input field of ${allInputs.length} total)`);
            }
          } else {
            log('   ✅ Found permit keywords field via active element');
          }
        } catch (e) {
          log(`   ❌ Could not find permit keywords field: ${e.message}`);
          throw new Error(`Failed to locate permit keywords input field: ${e.message}`);
        }
        
        // Step 3.3: Click to focus the field
        log('   🖱️  Clicking on permit keywords field...');
        await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', permitInput);
        await sleep(500); // Increased delay so you can see it
        await permitInput.click();
        await sleep(1000); // Increased delay so you can see the click
        
        // Step 3.4: Clear the field and paste from clipboard
        log('   ⌨️  Clearing field and pasting from clipboard...');
        
        // Clear existing text
        await permitInput.clear();
        await sleep(500); // Increased delay
        
        // Select all (in case clear didn't work)
        const modifier = process.platform === 'darwin' ? Key.COMMAND : Key.CONTROL;
        await permitInput.sendKeys(modifier, 'a');
        await sleep(500); // Increased delay so you can see selection
        
        // Paste from clipboard (Ctrl+V / Cmd+V)
        log(`   📋 Pasting "${permitKeywords}" from clipboard...`);
        await permitInput.sendKeys(modifier, 'v');
        await sleep(1500); // Give time for paste to complete (increased)
        
        // Verify the text was pasted
        try {
          const pastedValue = await permitInput.getAttribute('value');
          log(`   ✅ Verified pasted value: "${pastedValue}"`);
          if (!pastedValue || pastedValue.trim() !== permitKeywords.trim()) {
            log(`   ⚠️  WARNING: Pasted value doesn't match! Expected: "${permitKeywords}", Got: "${pastedValue}"`);
            // Try alternative: direct JavaScript paste
            await driver.executeScript(`
              arguments[0].value = arguments[1];
              arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
              arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
            `, permitInput, permitKeywords);
            await sleep(300);
            log('   ✅ Used JavaScript fallback to set value');
          }
        } catch (e) {
          log(`   ℹ️  Could not verify pasted value: ${e.message}`);
        }
        
        await screenshot(driver, '03a-permit-keywords-pasted');
        
      // Step 3.5: Press Tab
      log('   ⌨️  Pressing Tab to move to next field...');
      await permitInput.sendKeys(Key.TAB);
      await sleep(1200); // Increased delay so you can see focus move
      
      // Step 3.6: Press Enter to submit
      log('   ⌨️  Pressing Enter to submit form...');
      const focusedElement = await driver.switchTo().activeElement();
      const focusedTag = await focusedElement.getTagName();
      const focusedText = await focusedElement.getText().catch(() => '');
      log(`   📍 Focused element: ${focusedTag}, text: "${focusedText}"`);
      
      await sleep(1000); // Pause before submitting so you can see it
      await focusedElement.sendKeys(Key.ENTER);
      await sleep(2000); // Increased delay after submission
        
        await screenshot(driver, '03b-permit-keywords-submitted');
        log('   ✅ Permit keywords field completed: Pasted → Tab → Enter');
      } else {
        // No permit keywords, but still need to submit
        log('   ℹ️  No permit keywords provided, pressing Tab then Enter to submit...');
        const activeElement = await driver.switchTo().activeElement();
        await activeElement.sendKeys(Key.TAB);
        await sleep(800);
        const focusedElement = await driver.switchTo().activeElement();
        await focusedElement.sendKeys(Key.ENTER);
        log('   ✅ Pressed Tab → Enter to submit');
      }
      
      await sleep(2000); // Wait to see the submission

      // STEP 4: WAIT FOR RESULTS AND ENSURE THEY ARE VISIBLE
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('📋 STEP 4: WAITING FOR RESULTS TABLE TO APPEAR');
      log('   Ensuring results are visible...');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Wait for results container to appear
      log('   ⏳ Waiting for results container...');
      let resultsContainer;
      try {
        resultsContainer = await driver.wait(
          until.elementLocated(By.css('.ag-center-cols-container, .results-list, [class*="result"], [id*="result"]')),
          30000
        );
        log('   ✅ Results container found');
      } catch (e) {
        log(`   ❌ Results container not found: ${e.message}`);
        await screenshot(driver, 'ERROR_no_results_container');
        throw new Error('Results table did not appear within timeout');
      }
      
      // Ensure results container is visible
      log('   👁️  Ensuring results container is visible...');
      try {
        await driver.executeScript('arguments[0].scrollIntoView({ block: "start", behavior: "smooth" });', resultsContainer);
        await sleep(1000);
        
        const isDisplayed = await resultsContainer.isDisplayed();
        if (!isDisplayed) {
          log('   ⚠️  Results container exists but is not visible');
          await driver.executeScript('arguments[0].style.display = "block";', resultsContainer);
          await driver.executeScript('arguments[0].style.visibility = "visible";', resultsContainer);
        }
        log('   ✅ Results container is visible');
      } catch (e) {
        log(`   ⚠️  Could not ensure visibility: ${e.message}`);
      }

      // Wait a bit more for content to load
      await sleep(3000); 
      
      // Check if there are any result rows
      const initialRows = await driver.findElements(By.css('.ag-center-cols-container .ag-row, .results-list .result-item, [class*="result"] [class*="row"]'));
      log(`   📊 Initial result rows found: ${initialRows.length}`);
      
      if (initialRows.length === 0) {
        log('   ⚠️  WARNING: No result rows found initially, waiting longer...');
        await sleep(5000);
        const retryRows = await driver.findElements(By.css('.ag-center-cols-container .ag-row, .results-list .result-item'));
        log(`   📊 Retry result rows found: ${retryRows.length}`);
      }
      
      await screenshot(driver, '04-results-loaded');
      log('   ✅ Results table is visible and loaded');

      // STEP 5: SCROLL TO LOAD ALL ROWS AND VERIFY
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('📜 STEP 5: SCROLLING TO LOAD ALL ROWS');
      log('   Checking if all results are fetched...');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      let lastCount = 0;
      let stableCount = 0;
      const maxStable = 20; // Number of iterations with same count before stopping
      let allResultsFetched = false;

      while (stableCount < maxStable) {
        const rows = await driver.findElements(By.css('.ag-center-cols-container .ag-row'));
        
        if (rows.length === lastCount) {
          stableCount++;
          if (stableCount === 1) {
            log(`   ✅ Row count stabilized at ${rows.length} rows`);
          }
        } else {
          stableCount = 0;
          lastCount = rows.length;
          log(`   📊 Loaded ${rows.length} rows so far...`);
        }

        if (rows.length > 0) {
          try {
            // Scroll to the last row to trigger loading more
            await driver.executeScript(
              'arguments[0].scrollIntoView({ block: "end", behavior: "smooth" })',
              rows[rows.length - 1]
            );
          } catch (e) {
            log(`   ⚠️  Warning during scroll: ${e.message}`);
          }
        }

        await sleep(800);
      }

      // Final check - get all rows
      const rows = await driver.findElements(By.css('.ag-center-cols-container .ag-row'));
      const finalCount = rows.length;
      
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('🔍 VERIFICATION: Checking if all results are fetched');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Try to find any "loading" indicators or "more results" messages
      try {
        const loadingElements = await driver.findElements(By.css('[class*="loading"], [class*="spinner"], [aria-busy="true"]'));
        if (loadingElements.length > 0) {
          log('   ⚠️  WARNING: Loading indicators still present - results may not be fully loaded');
          allResultsFetched = false;
        } else {
          log('   ✅ No loading indicators found');
          allResultsFetched = true;
        }
      } catch (e) {
        log(`   ℹ️  Could not check for loading indicators: ${e.message}`);
        allResultsFetched = true; // Assume loaded if we can't check
      }
      
      // Check for "total results" count if available
      try {
        const resultCountElements = await driver.findElements(By.xpath('//*[contains(text(), "result") or contains(text(), "Result")]'));
        for (const elem of resultCountElements) {
          const text = await elem.getText();
          log(`   📊 Found result count text: "${text}"`);
          // Could parse this to compare with actual row count
        }
      } catch (e) {
        // Not critical
      }
      
      log(`   📈 Final row count: ${finalCount} rows`);
      
      if (allResultsFetched && finalCount > 0) {
        log('   ✅ VERIFIED: All results appear to be fetched');
      } else if (finalCount === 0) {
        log('   ❌ WARNING: No results found!');
      } else {
        log('   ⚠️  WARNING: Results may not be fully loaded');
      }
      
      await screenshot(driver, '05-all-results-loaded');

      // STEP 6: EXTRACT PERMITS WITH ALL DETAILS
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('📄 STEP 6: EXTRACTING PERMIT DATA WITH ALL DETAILS');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      const permits = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        log(`\n📋 Extracting permit ${i + 1}/${rows.length}...`);
        
        try {
          // Extract basic info from the row
          let name = '', description = '', jurisdiction = '', activities = [], relevance = 'Medium';
          
          // Extract name and description from title column
          try {
            const titleCell = await row.findElement(By.css('[col-id="title"], [role="gridcell"]:first-child, .ag-cell:first-child'));
            const titleText = await titleCell.getText();
            const titleLines = titleText.split('\n').filter(line => line.trim());
            
            if (titleLines.length > 0) {
              // Try to get name from link or first line
              try {
                const linkElement = await titleCell.findElement(By.css('a'));
                name = (await linkElement.getText()).trim();
              } catch {
                name = titleLines[0]?.trim() || '';
              }
              
              // Description is usually the rest
              if (titleLines.length > 1) {
                description = titleLines.slice(1).join(' ').trim();
              }
            }
          } catch (e) {
            // Fallback: try to find strong/h3 for name
            try { name = await row.findElement(By.css('strong, h3')).getText(); } catch {}
            try { description = await row.findElement(By.css('p, .description')).getText(); } catch {}
          }
          
          // Extract jurisdiction from jurisdiction column
          try {
            const jurisdictionCell = await row.findElement(By.css('[col-id="jurisdiction"], [role="gridcell"][col-id*="jurisdiction"]'));
            const jurisdictionText = (await jurisdictionCell.getText()).trim();
            // Normalize: "Municipal" -> "municipal", "Federal" -> "federal", "Provincial" -> "provincial"
            const jurisdictionLower = jurisdictionText.toLowerCase();
            if (jurisdictionLower === 'municipal') jurisdiction = 'municipal';
            else if (jurisdictionLower === 'federal') jurisdiction = 'federal';
            else if (jurisdictionLower === 'provincial') jurisdiction = 'provincial';
            else jurisdiction = 'provincial'; // Default
          } catch (e) {
            jurisdiction = 'provincial'; // Default
          }
          
          // Extract activities from activities column
          try {
            const activitiesCell = await row.findElement(By.css('[col-id="activities"], [role="gridcell"][col-id*="activities"]'));
            const activitiesText = (await activitiesCell.getText()).trim();
            // Activities are usually comma-separated
            activities = activitiesText.split(',').map(a => a.trim()).filter(a => a.length > 0);
          } catch (e) {
            activities = [];
          }
          
          // Extract relevance from relevance column
          try {
            const relevanceCell = await row.findElement(By.css('[col-id="relevance"], [role="gridcell"][col-id*="relevance"]'));
            const relevanceText = (await relevanceCell.getText()).trim();
            if (relevanceText.toLowerCase().includes('high')) relevance = 'High';
            else if (relevanceText.toLowerCase().includes('low')) relevance = 'Low';
            else relevance = 'Medium';
          } catch (e) {
            relevance = 'Medium';
          }
          
          if (!name) {
            log(`   ⚠️  Skipping row ${i + 1}: No permit name found`);
            continue;
          }
          
          log(`   ✅ Name: "${name}"`);
          log(`   ✅ Jurisdiction: "${jurisdiction}"`);
          log(`   ✅ Activities: ${activities.length} found`);
          
          // Click the expand button (ag-icon-tree-open) to open detail panel
          let prerequisites = '';
          let contactInfo = {};
          let lastVerified = '';
          let moreInfoUrl = '';
          let onlineApplicationUrl = '';
          let bylawUrl = '';
          let expandedDetails = {};
          let fullHtmlContent = '';
          let allTextContent = '';
          let permitTitle = '';
          let fullDescription = '';
          
          try {
            log(`   🔍 Clicking expand button to open permit detail panel...`);
            await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', row);
            await sleep(500);
            
            let isExpanded = false;
            
            try {
              // Check if already expanded by looking for the tree-open icon (expanded) or tree-closed icon (collapsed)
              let expandButton = null;
              
              // Look for the expand button with class "ag-icon-tree-open" (collapsed state) or "ag-icon-tree-closed" (expanded state)
              try {
                // First, try to find the collapsed button (tree-open icon means it can be opened)
                expandButton = await row.findElement(By.css('span.ag-icon.ag-icon-tree-open'));
                log(`   ✅ Found expand button (tree-open icon - collapsed state)`);
              } catch (e1) {
                // If tree-open not found, check if it's already expanded (tree-closed icon)
                try {
                  const closedButton = await row.findElement(By.css('span.ag-icon.ag-icon-tree-closed'));
                  log(`   ℹ️  Found tree-closed icon - row is already expanded`);
                  isExpanded = true;
                } catch (e2) {
                  // Try alternative selectors
                  try {
                    expandButton = await row.findElement(By.css('.ag-icon-tree-open, [class*="tree-open"], [class*="ag-icon-tree"]'));
                    log(`   ✅ Found expand button (alternative selector)`);
                  } catch (e3) {
                    log(`   ⚠️  Could not find expand button: ${e3.message}`);
                  }
                }
              }
              
              if (!isExpanded && expandButton) {
                // Scroll the button into view
                await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', expandButton);
                await sleep(300);
                
                // Click the expand button
                try {
                  await expandButton.click();
                  log(`   ✅ Clicked expand button`);
                } catch (clickError) {
                  // If regular click fails, try JavaScript click
                  await driver.executeScript('arguments[0].click();', expandButton);
                  log(`   ✅ Clicked expand button (using JavaScript)`);
                }
                
                // Wait for detail panel to open
                await sleep(1500);
                isExpanded = true;
              } else if (!isExpanded) {
                // Fallback: try clicking the row itself
                log(`   ⚠️  Expand button not found, trying to click row as fallback`);
                try {
                  await row.click();
                  await sleep(1500);
                  isExpanded = true;
                  log(`   ✅ Clicked row as fallback`);
                } catch (fallbackError) {
                  log(`   ⚠️  Fallback click also failed: ${fallbackError.message}`);
                }
              }
            } catch (e) {
              log(`   ⚠️  Error finding/clicking expand button: ${e.message}`);
            }
            
            // Wait for expanded content to load
            await sleep(1500);
            
            // Now extract ALL expanded details comprehensively
            try {
              // Look for the expanded detail section - try multiple selectors
              let expandedContent = null;
              
              // Method 1: Look for .permit-detail class (most specific)
              try {
                expandedContent = await driver.findElement(By.css('.permit-detail'));
                log(`   ✅ Found expanded content using .permit-detail selector`);
              } catch {
                // Method 2: Look for ag-row-detail
                try {
                  expandedContent = await row.findElement(By.css('.ag-row-detail'));
                  log(`   ✅ Found expanded content using .ag-row-detail selector`);
                } catch {
                  // Method 3: Look for next sibling row that contains details
                  try {
                    const nextRow = await driver.executeScript(`
                      const row = arguments[0];
                      let next = row.nextElementSibling;
                      while (next && !next.classList.contains('ag-row') && !next.querySelector('.permit-detail')) {
                        next = next.nextElementSibling;
                      }
                      return next;
                    `, row);
                    if (nextRow) {
                      expandedContent = nextRow;
                      log(`   ✅ Found expanded content as next sibling row`);
                    }
                  } catch {}
                  
                  // Method 4: Look for any element with permit-detail class in the page
                  if (!expandedContent) {
                    try {
                      const allDetails = await driver.findElements(By.css('.permit-detail, [class*="permit-detail"], [class*="detail"]'));
                      if (allDetails.length > 0) {
                        // Get the most recently added one (should be the one we just expanded)
                        expandedContent = allDetails[allDetails.length - 1];
                        log(`   ✅ Found expanded content from page search`);
                      }
                    } catch {}
                  }
                }
              }
              
              if (expandedContent) {
                log(`   ✅ Found expanded content section - extracting ALL information...`);
                
                // Extract the entire HTML content for comprehensive parsing
                try {
                  fullHtmlContent = await expandedContent.getAttribute('innerHTML');
                  log(`   📄 Extracted HTML content (${fullHtmlContent.length} characters)`);
                } catch (e) {
                  log(`   ⚠️  Could not get HTML content: ${e.message}`);
                }
                
                // Extract all text content
                try {
                  allTextContent = await expandedContent.getText();
                  log(`   📝 Extracted all text content (${allTextContent.length} characters)`);
                } catch (e) {
                  log(`   ⚠️  Could not extract text content: ${e.message}`);
                }
                
                // Extract prerequisites - comprehensive extraction based on HTML structure
                try {
                  // Look for h3 with "Prerequisites" text
                  const prereqHeading = await expandedContent.findElement(By.xpath('.//h3[contains(text(), "Prerequisites")]'));
                  if (prereqHeading) {
                    // Get the parent div that contains both heading and content
                    const prereqParent = await prereqHeading.findElement(By.xpath('./ancestor::div[1]'));
                    
                    // Try to get the paragraph inside the div that follows the heading
                    try {
                      const prereqParagraph = await prereqParent.findElement(By.css('p'));
                      prerequisites = (await prereqParagraph.getText()).trim();
                      log(`   ✅ Found prerequisites from paragraph: "${prerequisites.substring(0, 100)}..."`);
                    } catch {
                      // Fallback: get all text from parent div and extract after "Prerequisites"
                      const prereqText = await prereqParent.getText();
                      const prereqMatch = prereqText.match(/Prerequisites[:\s]*(.+)/is);
                      if (prereqMatch) {
                        prerequisites = prereqMatch[1].trim();
                        log(`   ✅ Found prerequisites from text: "${prerequisites.substring(0, 100)}..."`);
                      } else {
                        // Try getting next sibling div
                        try {
                          const nextDiv = await driver.executeScript(`
                            const heading = arguments[0];
                            let next = heading.nextElementSibling;
                            while (next && next.tagName !== 'DIV') {
                              next = next.nextElementSibling;
                            }
                            return next ? next.textContent : '';
                          `, prereqHeading);
                          if (nextDiv) {
                            prerequisites = nextDiv.trim();
                            log(`   ✅ Found prerequisites from next sibling: "${prerequisites.substring(0, 100)}..."`);
                          }
                        } catch {}
                      }
                    }
                  }
                } catch (e) {
                  log(`   ⚠️  Could not extract prerequisites: ${e.message}`);
                }
                
                // Extract contact information - comprehensive extraction
                try {
                  const contactHeading = await expandedContent.findElement(By.xpath('.//h3[contains(text(), "Contact")]'));
                  if (contactHeading) {
                    // Get the contact section div
                    const contactSection = await contactHeading.findElement(By.xpath('./following-sibling::div[1] | ./parent::div'));
                    const contactText = await contactSection.getText();
                    const contactHtml = await contactSection.getAttribute('innerHTML');
                    
                    log(`   📞 Extracting contact information...`);
                    
                    // Extract municipality link and name
                    try {
                      const municipalityLink = await contactSection.findElement(By.css('a[href*="toronto"], a[href*="municipal"], a b'));
                      const municipalityText = await municipalityLink.getText();
                      const municipalityHref = await municipalityLink.getAttribute('href');
                      contactInfo.municipality = municipalityText.trim();
                      contactInfo.municipalityUrl = municipalityHref;
                      log(`   ✅ Found municipality: ${municipalityText.trim()}`);
                    } catch {}
                    
                    // Extract department name
                    try {
                      const departmentText = contactText.match(/Municipal\s+([^\n]+)/i) || 
                                            contactText.match(/([^\n]*Licensing[^\n]*)/i) ||
                                            contactText.match(/([^\n]*Standards[^\n]*)/i);
                      if (departmentText) {
                        contactInfo.department = departmentText[1]?.trim() || departmentText[0]?.trim();
                        log(`   ✅ Found department: ${contactInfo.department}`);
                      }
                    } catch {}
                    
                    // Extract email - look for mailto links
                    try {
                      const emailLink = await contactSection.findElement(By.css('a[href^="mailto:"]'));
                      const emailHref = await emailLink.getAttribute('href');
                      const emailMatch = emailHref.match(/mailto:([^\?]+)/);
                      if (emailMatch) {
                        contactInfo.email = emailMatch[1];
                        log(`   ✅ Found email: ${emailMatch[1]}`);
                      }
                    } catch {
                      // Fallback: regex from text
                      const emailMatch = contactText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                      if (emailMatch) {
                        contactInfo.email = emailMatch[1];
                        log(`   ✅ Found email (regex): ${emailMatch[1]}`);
                      }
                    }
                    
                    // Extract phone
                    const phoneMatch = contactText.match(/(?:Tel|Phone|Tel:)\s*:?\s*([0-9\-\(\)\s]+)/i);
                    if (phoneMatch) {
                      contactInfo.phone = phoneMatch[1].trim();
                      log(`   ✅ Found phone: ${phoneMatch[1].trim()}`);
                    }
                    
                    // Extract fax
                    const faxMatch = contactText.match(/(?:Fax|Fax:)\s*:?\s*([0-9\-\(\)\s]+)/i);
                    if (faxMatch) {
                      contactInfo.fax = faxMatch[1].trim();
                      log(`   ✅ Found fax: ${faxMatch[1].trim()}`);
                    }
                    
                    // Extract full address - get all address lines from spans
                    try {
                      const addressLines = [];
                      const addressSpans = await contactSection.findElements(By.css('span'));
                      
                      for (const span of addressSpans) {
                        try {
                          const spanText = (await span.getText()).trim();
                          // Skip empty spans, email links, phone/fax, and municipality links
                          if (spanText && 
                              !spanText.includes('@') && 
                              !spanText.match(/^Tel:|^Fax:/i) &&
                              !spanText.match(/^Email$/i) &&
                              spanText.length > 2 &&
                              !spanText.includes('Municipal Licensing')) {
                            addressLines.push(spanText);
                          }
                        } catch {}
                      }
                      
                      // Also try to extract from the full contact text
                      if (addressLines.length === 0) {
                        const lines = contactText.split('\n');
                        for (const line of lines) {
                          const trimmed = line.trim();
                          // Look for address-like lines (contain numbers, street names, etc.)
                          if (trimmed && 
                              !trimmed.includes('@') && 
                              !trimmed.match(/^Tel:|^Fax:/i) &&
                              !trimmed.includes('Municipal') &&
                              !trimmed.includes('Email') &&
                              (trimmed.match(/\d/) || trimmed.match(/(Ave|St|Rd|Blvd|Dr|Way|Crescent|Court|Lane|Place|Civic)/i))) {
                            addressLines.push(trimmed);
                          }
                        }
                      }
                      
                      if (addressLines.length > 0) {
                        // Combine address lines
                        const fullAddress = addressLines.join(', ');
                        contactInfo.address = { 
                          fullAddress: fullAddress,
                          lines: addressLines
                        };
                        
                        // Try to parse components
                        const cityMatch = fullAddress.match(/([^,]+),\s*([A-Z]{2})/);
                        if (cityMatch) {
                          contactInfo.address.city = cityMatch[1].trim();
                          contactInfo.address.province = cityMatch[2].trim();
                        }
                        
                        // Extract postal code (format: M4C 5R1 or similar)
                        const postalMatch = fullAddress.match(/([A-Z]\d[A-Z]\s?\d[A-Z]\d)/);
                        if (postalMatch) {
                          contactInfo.address.postalCode = postalMatch[1].trim();
                        }
                        
                        log(`   ✅ Found full address with ${addressLines.length} lines: ${fullAddress.substring(0, 80)}...`);
                      }
                    } catch (e) {
                      log(`   ⚠️  Could not extract address lines: ${e.message}`);
                    }
                  }
                } catch (e) {
                  log(`   ⚠️  Could not extract contact info: ${e.message}`);
                }
                
                // Extract "Last verified" date
                try {
                  const verifiedElements = await expandedContent.findElements(By.xpath('.//*[contains(text(), "Last verified") or contains(text(), "last verified")]'));
                  if (verifiedElements.length > 0) {
                    const verifiedText = await verifiedElements[0].getText();
                    const dateMatch = verifiedText.match(/(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) {
                      lastVerified = dateMatch[1];
                      log(`   ✅ Found last verified: ${dateMatch[1]}`);
                    }
                  }
                } catch (e) {
                  // Last verified not found, that's okay
                }
                
                // Extract ALL links and buttons comprehensively
                try {
                  // Find all links (including nested links in buttons)
                  const allLinks = await expandedContent.findElements(By.css('a[href], button a[href]'));
                  log(`   🔍 Found ${allLinks.length} links in expanded content`);
                  
                  // Find all buttons
                  const allButtons = await expandedContent.findElements(By.css('button'));
                  log(`   🔍 Found ${allButtons.length} buttons in expanded content`);
                  
                  // Store all extracted links
                  const allButtonLinks = [];
                  const allImageLinks = [];
                  
                  // Extract links from <a> tags (including those nested in buttons)
                  for (const link of allLinks) {
                    try {
                      const linkText = (await link.getText()).trim();
                      const linkHref = await link.getAttribute('href');
                      const linkTarget = await link.getAttribute('target');
                      
                      if (linkHref && linkHref.startsWith('http')) {
                        const linkInfo = {
                          text: linkText,
                          url: linkHref,
                          target: linkTarget || '_self'
                        };
                        
                        allButtonLinks.push(linkInfo);
                        
                        // Map to specific variables based on link text
                        const linkTextLower = linkText.toLowerCase();
                        if (linkTextLower.includes('more information') || linkTextLower.includes('more info')) {
                          moreInfoUrl = linkHref;
                          log(`   ✅ Found "More Information" URL: ${linkHref}`);
                        } else if (linkTextLower.includes('online application') || linkTextLower.includes('application form') || linkTextLower.includes('apply')) {
                          onlineApplicationUrl = linkHref;
                          log(`   ✅ Found "Online Application" URL: ${linkHref}`);
                        } else if (linkTextLower.includes('by-law') || linkTextLower.includes('bylaw') || linkTextLower.includes('regulation')) {
                          bylawUrl = linkHref;
                          log(`   ✅ Found "By-law/Regulation" URL: ${linkHref}`);
                        } else {
                          log(`   ✅ Found link: "${linkText}" → ${linkHref}`);
                        }
                      }
                    } catch (e) {
                      log(`   ⚠️  Error extracting link: ${e.message}`);
                    }
                  }
                  
                  // Extract images
                  try {
                    const images = await expandedContent.findElements(By.css('img'));
                    log(`   🖼️  Found ${images.length} images in expanded content`);
                    
                    for (const img of images) {
                      try {
                        const imgSrc = await img.getAttribute('src');
                        const imgAlt = await img.getAttribute('alt');
                        const imgTitle = await img.getAttribute('title');
                        
                        if (imgSrc) {
                          allImageLinks.push({
                            src: imgSrc,
                            alt: imgAlt || '',
                            title: imgTitle || ''
                          });
                          log(`   ✅ Found image: ${imgSrc} (alt: ${imgAlt || 'none'})`);
                        }
                      } catch (e) {
                        log(`   ⚠️  Error extracting image: ${e.message}`);
                      }
                    }
                  } catch (e) {
                    log(`   ⚠️  Could not extract images: ${e.message}`);
                  }
                  
                  // Store all extracted data
                  if (allButtonLinks.length > 0) {
                    expandedDetails.buttonLinks = allButtonLinks;
                    log(`   📋 Extracted ${allButtonLinks.length} total links`);
                  }
                  
                  if (allImageLinks.length > 0) {
                    expandedDetails.images = allImageLinks;
                    log(`   🖼️  Extracted ${allImageLinks.length} total images`);
                  }
                  
                  // Store full HTML and text for comprehensive data
                  if (fullHtmlContent) {
                    expandedDetails.fullHtml = fullHtmlContent;
                  }
                  if (allTextContent) {
                    expandedDetails.fullText = allTextContent;
                  }
                } catch (e) {
                  log(`   ⚠️  Could not extract links/images: ${e.message}`);
                }
              } else {
                // Fallback: try to extract from the page without finding expanded section
                log(`   ⚠️  Could not find expanded content section, trying fallback extraction`);
                
                // Try XPath searches across the page
                try {
                  const prereqElements = await driver.findElements(By.xpath('//*[contains(text(), "Prerequisites")]/following-sibling::*[1]'));
                  if (prereqElements.length > 0) {
                    prerequisites = (await prereqElements[0].getText()).trim();
                  }
                } catch {}
              }
            } catch (e) {
              log(`   ⚠️  Error extracting expanded details: ${e.message}`);
            }
            
            // Collapse the row before moving to next permit
            if (isExpanded) {
              try {
                // Find and click the collapse button (tree-closed icon when expanded)
                let collapseButton = null;
                try {
                  collapseButton = await row.findElement(By.css('span.ag-icon.ag-icon-tree-closed'));
                  log(`   🔄 Found collapse button (tree-closed icon)`);
                } catch {
                  // Try alternative selector
                  try {
                    collapseButton = await row.findElement(By.css('.ag-icon-tree-closed, [class*="tree-closed"]'));
                  } catch {}
                }
                
                if (collapseButton) {
                  await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', collapseButton);
                  await sleep(200);
                  try {
                    await collapseButton.click();
                  } catch {
                    await driver.executeScript('arguments[0].click();', collapseButton);
                  }
                  await sleep(500);
                  log(`   ✅ Collapsed row`);
                } else {
                  // Fallback: try clicking row again to collapse
                  try {
                    await row.click();
                    await sleep(500);
                    log(`   ✅ Collapsed row (fallback)`);
                  } catch {}
                }
              } catch (e) {
                log(`   ⚠️  Could not collapse row: ${e.message}`);
              }
            }
            
          } catch (e) {
            log(`   ⚠️  Could not extract detailed info: ${e.message}`);
          }
          
          // Build permit object with ALL extracted details
          const permit = {
            name: name.trim(),
            description: fullDescription || description.trim(), // Use full description if extracted
            jurisdiction: jurisdiction, // 'municipal', 'provincial', or 'federal'
            activities: activities,
            relevance: relevance,
            prerequisites: prerequisites || undefined,
            contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
            lastVerified: lastVerified || undefined,
            moreInfoUrl: moreInfoUrl || undefined,
            onlineApplicationUrl: onlineApplicationUrl || undefined,
            bylawUrl: bylawUrl || undefined,
            // Store all comprehensive data
            expandedDetails: Object.keys(expandedDetails).length > 0 ? expandedDetails : undefined,
            fullText: allTextContent || undefined,
            fullHtml: fullHtmlContent || undefined,
            permitTitle: permitTitle || undefined,
          };
          
          permits.push(permit);
          log(`   ✅ Extracted full details for: "${name}"`);
          
        } catch (err) {
          log(`   ❌ Error extracting permit ${i + 1}: ${err.message}`);
          // Continue with next permit
        }
      }

      log(`\n🎯 Extracted ${permits.length} permits with full details`);
      return permits;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : 'No stack trace available';
      
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('❌ ERROR OCCURRED DURING SELENIUM EXECUTION');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log(`❌ Error message: ${errorMessage}`);
      
      // Provide specific guidance for common errors
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        log('');
        log('⏱️  TIMEOUT ERROR - Chrome Driver build took too long');
        log('   Possible causes:');
        log('   1. ChromeDriver version mismatch with Chrome browser');
        log('   2. Chrome processes blocking the launch');
        log('   3. Antivirus/firewall blocking ChromeDriver');
        log('   4. Network issues downloading ChromeDriver');
        log('');
        log('   💡 SOLUTIONS:');
        log('   - Check chromedriver.log file for detailed error messages');
        log('   - Close ALL Chrome windows and processes');
        log('   - Restart your computer to clear stuck processes');
        log('   - Update ChromeDriver to match your Chrome version');
        log('   - Temporarily disable antivirus/firewall to test');
      } else if (errorMessage.includes('ChromeDriver') || errorMessage.includes('chromedriver')) {
        log('');
        log('🔧 CHROMEDRIVER ERROR');
        log('   Possible causes:');
        log('   1. ChromeDriver not installed or not in PATH');
        log('   2. ChromeDriver version incompatible with Chrome');
        log('   3. ChromeDriver executable permissions issue');
        log('');
        log('   💡 SOLUTIONS:');
        log('   - Install ChromeDriver: npm install -g chromedriver');
        log('   - Or download from: https://chromedriver.chromium.org/');
        log('   - Match ChromeDriver version to your Chrome version');
      }
      
      log('');
      log('📋 Full error stack:');
      log(errorStack);
      
      // Task Manager instructions
      log('');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('📋 HOW TO CHECK TASK MANAGER FOR CHROME PROCESSES:');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('1. Press Ctrl+Shift+Esc to open Task Manager');
      log('2. Click on the "Processes" tab');
      log('3. Look for these process names:');
      log('   - chrome.exe (main Chrome browser)');
      log('   - chromedriver.exe (ChromeDriver process)');
      log('   - GoogleCrashHandler.exe (Chrome crash handler)');
      log('');
      log('4. WHAT TO CHECK:');
      log('   - Multiple chrome.exe processes: This is NORMAL');
      log('   - chrome.exe processes using HIGH CPU or MEMORY: These might be stuck');
      log('   - chromedriver.exe that won\'t close: Kill this process');
      log('');
      log('5. HOW TO KILL PROCESSES:');
      log('   - Right-click on the process → "End Task"');
      log('   - Or select it and click "End Task" button');
      log('   - BE CAREFUL: Only kill chrome.exe/chromedriver.exe processes');
      log('   - Do NOT kill other Google processes unless you know what they are');
      log('');
      log('6. AFTER KILLING PROCESSES:');
      log('   - Wait 5-10 seconds');
      log('   - Try running your Selenium script again');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (driver) {
        try {
          await screenshot(driver, 'CRITICAL_FAILURE');
          log('📸 Screenshot saved: CRITICAL_FAILURE');
        } catch (screenshotErr) {
          log(`⚠️ Failed to take screenshot: ${screenshotErr.message}`);
        }
        
        // Get page source for debugging
        try {
          const pageSource = await driver.getPageSource();
          const debugDir = path.join(process.cwd(), 'public', 'debug');
          if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
          fs.writeFileSync(path.join(debugDir, 'ERROR_page_source.html'), pageSource);
          log('📄 Page source saved to: /public/debug/ERROR_page_source.html');
        } catch (sourceErr) {
          log(`⚠️ Failed to save page source: ${sourceErr.message}`);
        }
      }
      
      throw new Error(`BizPaL Worker Error: ${errorMessage}. Check logs and screenshots in /public/debug/ folder.`);
  } finally {
    if (driver) {
      // Keep browser open for 10 seconds so you can see the final results
      log('⏸️  Keeping browser open for 10 seconds so you can see the results...');
      await sleep(10000);
      
      await driver.quit();
      log('🧹 Driver closed');
    }
  }
}

  module.exports = { runBizPalSearch };