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

// Fetch implementation for cancellation checks (Node.js compatible)
// Use native fetch if available (Node.js 18+), otherwise use http/https
let fetch;
if (typeof globalThis.fetch === 'function') {
  // Node.js 18+ has native fetch
  fetch = globalThis.fetch;
} else {
  // Fallback: create a simple fetch using http/https
  fetch = async (url) => {
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    return new Promise((resolve, reject) => {
      const req = client.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            json: async () => JSON.parse(data),
            text: async () => data
          });
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  };
}
const path = require('path');

// Sleep function - will be enhanced with cancellation checking in the worker function
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

  async function runBizPalSearch({ location, businessType, permitKeywords, permitTypes, requestId }) {
  log('Worker started');
    
    // Validate and clean inputs
    // Support both permitKeywords and permitTypes (for backward compatibility with test file)
    location = String(location || '').trim();
    businessType = String(businessType || '').trim();
    permitKeywords = String(permitKeywords || permitTypes || '').trim(); // Accept either parameter name
    requestId = String(requestId || '').trim();
    
    if (!location || !businessType) {
      throw new Error(`Missing required inputs: location='${location}', businessType='${businessType}'`);
    }
    
    log(`[DEBUG] Inputs: location='${location}', businessType='${businessType}', permitKeywords='${permitKeywords || '(none)'}', requestId='${requestId || '(none)'}'`);
    
    // Function to check if operation is cancelled (with caching to reduce API calls)
    let lastCancelCheck = 0;
    let cachedCancelled = false;
    const CACHE_DURATION = 500; // Check every 500ms max
    
    const checkCancellation = async () => {
      if (!requestId) return false;
      
      // Use cached result if checked recently
      const now = Date.now();
      if (now - lastCancelCheck < CACHE_DURATION && cachedCancelled) {
        return true;
      }
      
      try {
        // Use the base URL from environment or default to localhost
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const cancelUrl = `${baseUrl}/api/bizpal/cancel?requestId=${encodeURIComponent(requestId)}`;
        const response = await fetch(cancelUrl);
        if (response.ok) {
          const data = await response.json();
          cachedCancelled = data.cancelled === true;
          lastCancelCheck = now;
          return cachedCancelled;
        }
      } catch (err) {
        // If check fails, assume not cancelled to avoid false positives
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) { // Log 1% of errors
          log(`   ⚠️  Error checking cancellation: ${err.message}`);
        }
      }
      return false;
    };
    
    // Helper function to throw cancellation error
    const throwCancellation = async () => {
      log(`\n🛑 CANCELLATION DETECTED - Stopping immediately`);
      log(`   ✅ ${permits.length} permits extracted so far will be saved`);
      // Close browser immediately
      try {
        if (driver) {
          await driver.quit();
          log('   ✅ Browser closed');
        }
      } catch (quitErr) {
        log(`   ⚠️  Error closing browser: ${quitErr.message}`);
      }
      // Return permits extracted so far
      return permits;
    };
    
    // Enhanced sleep wrapper that checks cancellation periodically during long waits
    const sleepWithCancellation = async (ms) => {
      if (!requestId || ms < 500) {
        // Short sleeps or no cancellation - just sleep normally
        return await sleep(ms);
      }
      
      // For longer sleeps, check cancellation periodically (every 500ms)
      const checkInterval = 500;
      const totalChecks = Math.ceil(ms / checkInterval);
      
      for (let i = 0; i < totalChecks; i++) {
        // Check cancellation
        if (await checkCancellation()) {
          throw new Error('CANCELLED');
        }
        
        // Sleep for the interval (or remainder)
        const sleepTime = i === totalChecks - 1 ? (ms % checkInterval || checkInterval) : checkInterval;
        await sleep(sleepTime);
      }
      
      // Final check
      if (await checkCancellation()) {
        throw new Error('CANCELLED');
      }
    };

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
        
        await sleepWithCancellation(3000); // Give more time for window to appear and come to front
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
      await sleepWithCancellation(5000); // Increased wait to see what's happening
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
      
      // Find the first input field (location) - be very specific for headlessui combobox
      let locInput;
      try {
        // Primary: Try to find by specific ID first (headlessui-combobox-input-v-190)
        locInput = await driver.wait(
          until.elementLocated(By.id('headlessui-combobox-input-v-190')), 
          5000
        );
        log('   ✅ Found location field by specific ID (headlessui-combobox-input-v-190)');
      } catch {
        try {
          // Secondary: Find by placeholder (most specific)
          locInput = await driver.wait(
            until.elementLocated(By.css('input[placeholder*="Where is your business located"], input[placeholder*="located"], input[placeholder*="Where"]')), 
            10000
          );
          log('   ✅ Found location field by placeholder');
        } catch {
          // Fallback: Find all combobox inputs and get the first one (location)
          try {
            const allComboboxInputs = await driver.findElements(By.css('input[role="combobox"][aria-autocomplete="list"]'));
            if (allComboboxInputs.length >= 1) {
              locInput = allComboboxInputs[0]; // First combobox is location
              const placeholder = await locInput.getAttribute('placeholder').catch(() => '');
              log(`   ✅ Found location field as first combobox input (placeholder: "${placeholder}")`);
            } else {
              // Final fallback: get all text inputs
              const allInputs = await driver.findElements(By.css('input[type="text"]'));
              if (allInputs.length > 0) {
                locInput = allInputs[0];
                log(`   ✅ Found location field as first text input (${allInputs.length} inputs found)`);
              } else {
                throw new Error('No input fields found');
              }
            }
          } catch (e) {
            throw new Error(`Could not find location input field: ${e.message}`);
          }
        }
      }
      
      // Store location input ID for later verification
      const locInputId = await locInput.getAttribute('id').catch(() => '');
      log(`   📌 Location input ID: "${locInputId}"`);
    
      // Scroll into view and click
      await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', locInput);
      await sleep(500);
      await locInput.click();
      await sleep(1000);
      
      // Clear any existing value
      await locInput.clear();
      await sleep(500);
      
      // Type the location
      log('   ⌨️  Typing location...');
      await typeLikeHuman(locInput, location, 150);
      await sleep(2000); // Wait for autocomplete dropdown
      
      // Press Enter to select from autocomplete
      log('   ⌨️  Pressing Enter...');
      await locInput.sendKeys(Key.ENTER);
      await sleep(1500);
      
      // Press Tab to move to next field
      log('   ⌨️  Pressing Tab...');
      await locInput.sendKeys(Key.TAB);
      await sleep(1200);
      
      // Verify the value was set
      try {
        const locValue = await locInput.getAttribute('value');
        log(`   ✅ Location field value: "${locValue}"`);
      } catch {}
      
    await screenshot(driver, '02-location-set');
      log('   ✅ Location field completed');

      // STEP 2: BUSINESS TYPE FIELD - Type input → Press Enter → Press Tab
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('🏢 STEP 2: BUSINESS TYPE FIELD');
      log('   Action: Type → Enter → Tab');
      log(`   Value: "${businessType}"`);
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Find the business type input field (2nd input) - be very specific for headlessui combobox
      let busInput;
      try {
        // Primary: Try to find by specific ID first (headlessui-combobox-input-v-193)
        busInput = await driver.wait(
          until.elementLocated(By.id('headlessui-combobox-input-v-193')), 
          5000
        );
        log('   ✅ Found business type field by specific ID (headlessui-combobox-input-v-193)');
      } catch {
        try {
          // Secondary: Find by placeholder (most specific for business type)
          busInput = await driver.wait(
            until.elementLocated(By.css('input[placeholder*="What type of business"], input[placeholder*="business type"], input[placeholder*="Ex: restaurant"]')), 
            10000
          );
          const placeholder = await busInput.getAttribute('placeholder').catch(() => '');
          log(`   ✅ Found business type field by placeholder: "${placeholder}"`);
        } catch {
          // Fallback: Get all combobox inputs and select the second one (index 1)
          try {
            const allComboboxInputs = await driver.findElements(By.css('input[role="combobox"][aria-autocomplete="list"]'));
            if (allComboboxInputs.length >= 2) {
              busInput = allComboboxInputs[1]; // Second combobox is business type
              const placeholder = await busInput.getAttribute('placeholder').catch(() => '');
              log(`   ✅ Found business type field as second combobox input (placeholder: "${placeholder}")`);
              
              // Verify it's not the location field
              if (placeholder.includes('located') || placeholder.includes('Where')) {
                throw new Error('Second combobox is location field, not business type');
              }
            } else if (allComboboxInputs.length === 1) {
              // Only one combobox found - check if it's location (we already filled it)
              const placeholder = await allComboboxInputs[0].getAttribute('placeholder').catch(() => '');
              if (placeholder.includes('located') || placeholder.includes('Where')) {
                // This is location field, wait a bit and try again or use active element
                await sleep(1000);
                busInput = await driver.switchTo().activeElement();
                log('   ✅ Using active element as business type field (after location)');
              } else {
                busInput = allComboboxInputs[0];
                log('   ✅ Using single combobox as business type field');
              }
            } else {
              // Final fallback: Get all text inputs and select the second one
              const allInputs = await driver.findElements(By.css('input[type="text"]'));
              if (allInputs.length >= 2) {
                busInput = allInputs[1]; // Second input is business type
                log(`   ✅ Found business type field as second text input (${allInputs.length} inputs found)`);
              } else {
                // Last resort: Get the currently focused element (should be business type field after TAB)
                busInput = await driver.switchTo().activeElement();
                log('   ✅ Using active element as business type field (final fallback)');
              }
            }
          } catch (e) {
            throw new Error(`Could not find business type input field: ${e.message}`);
          }
        }
      }
      
      // Store business input ID and placeholder for later verification
      let busInputId = await busInput.getAttribute('id').catch(() => '');
      let busInputPlaceholder = await busInput.getAttribute('placeholder').catch(() => '');
      log(`   📌 Business type input ID: "${busInputId}", placeholder: "${busInputPlaceholder}"`);
      
      // Verify we didn't get the location field by mistake
      if (busInputPlaceholder.includes('located') || busInputPlaceholder.includes('Where') || busInputId === 'headlessui-combobox-input-v-190') {
        log(`   ⚠️  WARNING: Selected field appears to be location field! Trying to find correct field...`);
        // Try to find by specific business type ID
        try {
          busInput = await driver.findElement(By.id('headlessui-combobox-input-v-193'));
          busInputId = 'headlessui-combobox-input-v-193';
          busInputPlaceholder = await busInput.getAttribute('placeholder').catch(() => '');
          log(`   ✅ Corrected to business type field by ID: "${busInputId}"`);
        } catch {
          // Fallback: find second combobox
          try {
            const allComboboxes = await driver.findElements(By.css('input[role="combobox"]'));
            if (allComboboxes.length >= 2) {
              busInput = allComboboxes[1];
              busInputPlaceholder = await busInput.getAttribute('placeholder').catch(() => '');
              const newId = await busInput.getAttribute('id').catch(() => '');
              if (newId) {
                busInputId = newId;
              }
              log(`   ✅ Corrected to second combobox (ID: "${newId}", placeholder: "${busInputPlaceholder}")`);
            }
          } catch {}
        }
      }
      
    await driver.wait(until.elementIsVisible(busInput), 5000);
      
      // Click to ensure focus
      await busInput.click();
      await sleep(1000);
      
      // Clear any existing value
      await busInput.clear();
      await sleep(500);
      
      // Type the business type
      log('   ⌨️  Typing business type...');
      await typeLikeHuman(busInput, businessType, 150);
      await sleepWithCancellation(3000); // Wait longer for autocomplete dropdown to appear
      
      // Re-verify we're still on business type field before selecting dropdown
      log(`   📌 Verifying business input ID: "${busInputId}", placeholder: "${busInputPlaceholder}"`);
      
      // Instead of pressing Enter (which might reset focus), click on the first dropdown option
      log('   🔽 Selecting first dropdown option...');
      let optionSelected = false;
      try {
        // Wait for dropdown to appear and click first option
        const firstOption = await driver.wait(
          until.elementLocated(By.css('ul[role="listbox"] li[role="option"]:first-child, ul[role="listbox"] li:first-child, [role="listbox"] [role="option"]:first-child')),
          5000
        );
        await sleep(500);
        await firstOption.click();
        optionSelected = true;
        log('   ✅ Clicked first dropdown option');
        await sleep(1500); // Wait for selection to process
      } catch {
        // Fallback: Try pressing Arrow Down then Enter
        try {
          log('   ⚠️  Could not find dropdown option, trying keyboard navigation...');
          await busInput.sendKeys(Key.ARROW_DOWN);
          await sleep(500);
          await busInput.sendKeys(Key.ENTER);
          await sleep(1500);
          optionSelected = true;
          log('   ✅ Used keyboard navigation to select (fallback)');
        } catch (e) {
          log(`   ⚠️  Could not select dropdown option: ${e.message}`);
          // Just continue - maybe the value is already set
        }
      }
      
        // After selecting, re-find the business type field to ensure we have the correct element
        await sleep(1000);
        try {
          // Re-find business type field using stored ID or placeholder to ensure we have the correct element
          let currentBusInput = busInput;
          try {
            if (busInputId) {
              // Find by ID (most reliable)
              currentBusInput = await driver.findElement(By.id(busInputId));
              log(`   ✅ Refound business type field by ID: "${busInputId}"`);
            } else if (busInputPlaceholder) {
              // Find by placeholder (specific to business type)
              currentBusInput = await driver.findElement(By.css(`input[placeholder*="What type of business"], input[placeholder*="business type"]`));
              log(`   ✅ Refound business type field by placeholder`);
            } else {
              // Find all comboboxes and get the second one
              const allComboboxes = await driver.findElements(By.css('input[role="combobox"][aria-autocomplete="list"]'));
              if (allComboboxes.length >= 2) {
                currentBusInput = allComboboxes[1]; // Second combobox is business type
                const placeholder = await currentBusInput.getAttribute('placeholder').catch(() => '');
                // Verify it's not location
                if (placeholder.includes('located') || placeholder.includes('Where')) {
                  throw new Error('Second combobox is location field');
                }
                log(`   ✅ Refound business type field as second combobox`);
              } else {
                throw new Error('Could not refind business type field');
              }
            }
          } catch (e) {
            log(`   ⚠️  Could not refind business type field: ${e.message}, using original reference`);
            // Use the original busInput
            currentBusInput = busInput;
          }
          
          // Click to ensure focus is on business type field (NOT location)
          await currentBusInput.click();
          await sleep(500);
          
          // Verify we're on business type field, not location
          const clickCheckActive = await driver.switchTo().activeElement();
          const clickCheckId = await clickCheckActive.getAttribute('id').catch(() => '');
          const clickCheckPlaceholder = await clickCheckActive.getAttribute('placeholder').catch(() => '');
          
          if (clickCheckPlaceholder.includes('located') || clickCheckPlaceholder.includes('Where')) {
            log(`   ⚠️  Click moved focus to location field! Clicking business type field again...`);
            await currentBusInput.click();
            await sleep(1000);
          }
        
        // Verify the business type value is still there
        const busValue = await currentBusInput.getAttribute('value');
        log(`   ✅ Business type field value after selection: "${busValue}"`);
        
        // Don't retype if value is already set - this causes duplicate typing
        // Only retype if value is completely missing or clearly wrong
        if (!busValue || busValue.trim().length === 0) {
          log(`   ⚠️  Business type value is empty, retyping...`);
          await currentBusInput.clear();
          await sleep(500);
          await typeLikeHuman(currentBusInput, businessType, 150);
          await sleep(2000);
          // Try selecting first option again
          try {
            await currentBusInput.sendKeys(Key.ARROW_DOWN);
            await sleep(500);
            await currentBusInput.sendKeys(Key.ENTER);
            await sleep(1500);
          } catch {}
        } else {
          log(`   ✅ Business type value is present, no need to retype`);
        }
        
        // Verify we're still on business type field, not location
        const activeElement = await driver.switchTo().activeElement();
        const activeId = await activeElement.getAttribute('id').catch(() => '');
        const activePlaceholder = await activeElement.getAttribute('placeholder').catch(() => '');
        const activeRole = await activeElement.getAttribute('role').catch(() => '');
        
        log(`   📍 Active element check: ID: "${activeId}", placeholder: "${activePlaceholder}", role: "${activeRole}"`);
        
        // If we're on location field, click business type field again
        if (activePlaceholder.includes('located') || activePlaceholder.includes('Where') || (!activeRole.includes('combobox') && activePlaceholder && !activePlaceholder.includes('business'))) {
          log('   ⚠️  Focus appears to be on wrong field! Refocusing business type field...');
          await currentBusInput.click();
          await sleep(1000);
          // Verify value again
          const recheckValue = await currentBusInput.getAttribute('value');
          log(`   ✅ Re-checked business type value: "${recheckValue}"`);
        }
        
        // Now press Tab to move to next field (permit keywords)
        log('   ⌨️  Pressing Tab to move to permit keywords field...');
        await currentBusInput.sendKeys(Key.TAB);
        await sleep(1200);
        
        // Verify we moved to permit keywords field, not back to location
        const nextActiveElement = await driver.switchTo().activeElement();
        const nextPlaceholder = await nextActiveElement.getAttribute('placeholder').catch(() => '');
        const nextRole = await nextActiveElement.getAttribute('role').catch(() => '');
        log(`   📍 Active element after Tab: placeholder: "${nextPlaceholder}", role: "${nextRole}"`);
        
        // If Tab moved back to location field, skip it by pressing Tab again
        if (nextPlaceholder.includes('located') || nextPlaceholder.includes('Where')) {
          log('   ⚠️  Tab moved back to location field! Skipping past it...');
          // Verify location field value wasn't corrupted
          const locValueCheck = await nextActiveElement.getAttribute('value').catch(() => '');
          if (locValueCheck && !locValueCheck.includes(location.substring(0, 5))) {
            log(`   ⚠️  Location field value corrupted: "${locValueCheck}" - restoring...`);
            await nextActiveElement.clear();
            await typeLikeHuman(nextActiveElement, location, 150);
            await sleepWithCancellation(2000);
            await nextActiveElement.sendKeys(Key.ENTER);
            await sleep(1500);
          }
          // Skip past location field
          await nextActiveElement.sendKeys(Key.TAB);
          await sleep(1200);
          // Verify we're now on the right field
          const afterSkip = await driver.switchTo().activeElement();
          const afterSkipPlaceholder = await afterSkip.getAttribute('placeholder').catch(() => '');
          log(`   📍 After skipping location: placeholder: "${afterSkipPlaceholder}"`);
          
          // If still on location, try one more Tab
          if (afterSkipPlaceholder.includes('located') || afterSkipPlaceholder.includes('Where')) {
            await afterSkip.sendKeys(Key.TAB);
            await sleep(1200);
          }
        }
        
        // Final verification: check that location field still has correct value
        try {
          const locInputFinal = await driver.findElement(By.css('input[placeholder*="located"], input[placeholder*="Where"]'));
          const locValueFinal = await locInputFinal.getAttribute('value');
          if (!locValueFinal || (!locValueFinal.includes(location.substring(0, 5)) && !locValueFinal.includes(location.split(',')[0]))) {
            log(`   ⚠️  WARNING: Location field value may have been corrupted: "${locValueFinal}"`);
            // Don't restore automatically - just log warning
          } else {
            log(`   ✅ Location field verified: "${locValueFinal}"`);
          }
        } catch (e) {
          log(`   ⚠️  Could not verify location field: ${e.message}`);
        }
      } catch (e) {
        log(`   ⚠️  Error in field verification: ${e.message}`);
        // Try to continue anyway
      }
      
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
      
      // Step 3.5: Press Tab to move to submit button
      log('   ⌨️  Pressing Tab to move to submit button...');
      await permitInput.sendKeys(Key.TAB);
      await sleep(1200);
      
      // Step 3.6: Submit the form
      log('   ⌨️  Submitting form...');
      let formSubmitted = false;
      
      // Try to find and click the submit button
      try {
        const submitButton = await driver.findElement(By.xpath('//button[contains(text(), "Find") or contains(text(), "Search") or contains(text(), "Submit")] | //button[@type="submit"]'));
        await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', submitButton);
        await sleep(500);
        await submitButton.click();
        formSubmitted = true;
        log('   ✅ Clicked submit button');
      } catch {
        // Fallback: Press Enter on focused element
        try {
          const focusedElement = await driver.switchTo().activeElement();
          const focusedTag = await focusedElement.getTagName();
          log(`   📍 Focused element: ${focusedTag}, pressing Enter...`);
          await focusedElement.sendKeys(Key.ENTER);
          formSubmitted = true;
          log('   ✅ Pressed Enter on focused element');
        } catch (e) {
          log(`   ⚠️  Could not submit form: ${e.message}`);
        }
      }
      
      await screenshot(driver, '03b-permit-keywords-submitted');
      log('   ✅ Permit keywords field completed: Pasted → Tab → Submit');
      } else {
        // No permit keywords, but still need to submit
        log('   ℹ️  No permit keywords provided, submitting form...');
        const activeElement = await driver.switchTo().activeElement();
        await activeElement.sendKeys(Key.TAB);
        await sleepWithCancellation(800);
        
        // Try to find and click submit button
        let submitted = false;
        try {
          const submitButton = await driver.findElement(By.xpath('//button[contains(text(), "Find") or contains(text(), "Search")] | //button[@type="submit"]'));
          await submitButton.click();
          submitted = true;
          log('   ✅ Clicked submit button');
        } catch {
          const focusedElement = await driver.switchTo().activeElement();
          await focusedElement.sendKeys(Key.ENTER);
          submitted = true;
          log('   ✅ Pressed Enter to submit');
        }
      }
      
      // Check before long wait
      if (requestId && await checkCancellation()) {
        return await throwCancellation();
      }
      
      await sleepWithCancellation(3000); // Wait for form submission and page navigation
      
      // Check after wait
      if (requestId && await checkCancellation()) {
        return await throwCancellation();
      }

      // STEP 4: WAIT FOR RESULTS AND ENSURE THEY ARE VISIBLE
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('📋 STEP 4: WAITING FOR RESULTS TABLE TO APPEAR');
      log('   Ensuring results are visible...');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Wait for results container to appear
      log('   ⏳ Waiting for results container...');
      
      // Check before long wait
      if (requestId && await checkCancellation()) {
        return await throwCancellation();
      }
      
      let resultsContainer;
      try {
        // Wait longer and try multiple selectors for AG Grid
        resultsContainer = await driver.wait(
          until.elementLocated(By.css('.ag-center-cols-container, .ag-row, .ag-row[role="row"], [role="rowgroup"], .results-list, [class*="result"], [id*="result"]')),
          45000 // Increased timeout to 45 seconds
        );
        
        // Check after wait
        if (requestId && await checkCancellation()) {
          return await throwCancellation();
        }
        log('   ✅ Results container found');
        
        // Additional wait for rows to appear
        await sleepWithCancellation(2000);
        const initialRows = await driver.findElements(By.css('.ag-center-cols-container .ag-row, .ag-row[role="row"]'));
        log(`   📊 Found ${initialRows.length} initial result rows`);
        
        if (initialRows.length === 0) {
          log('   ⏳ No rows yet, waiting longer...');
          
          // Check before long wait
          if (requestId && await checkCancellation()) {
            return await throwCancellation();
          }
    await sleepWithCancellation(3000); 
          const retryRows = await driver.findElements(By.css('.ag-center-cols-container .ag-row, .ag-row[role="row"]'));
          log(`   📊 After retry: ${retryRows.length} rows found`);
        }
      } catch (e) {
        log(`   ❌ Results container not found: ${e.message}`);
        
        // Try to get debugging info
        try {
          const currentUrl = await driver.getCurrentUrl();
          log(`   📍 Current URL: ${currentUrl}`);
          const pageTitle = await driver.getTitle();
          log(`   📄 Page title: ${pageTitle}`);
          const pageSource = await driver.getPageSource();
          if (pageSource.includes('error') || pageSource.includes('Error')) {
            log('   ⚠️  Page source contains error text');
          }
        } catch (debugErr) {
          log(`   ⚠️  Could not get debug info: ${debugErr.message}`);
        }
        
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
    await sleepWithCancellation(3000); 
      
      // Check if there are any result rows
      const initialRows = await driver.findElements(By.css('.ag-center-cols-container .ag-row, .results-list .result-item, [class*="result"] [class*="row"]'));
      log(`   📊 Initial result rows found: ${initialRows.length}`);
      
      if (initialRows.length === 0) {
        log('   ⚠️  WARNING: No result rows found initially, waiting longer...');
          await sleepWithCancellation(5000);
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
        // Check for cancellation in scrolling loop
        if (requestId && await checkCancellation()) {
          return await throwCancellation();
        }
        
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

        // Check before sleep
        if (requestId && await checkCancellation()) {
          return await throwCancellation();
        }
        
        await sleepWithCancellation(800);
      }

      // Check before final row collection
      if (requestId && await checkCancellation()) {
        return await throwCancellation();
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
    // Track extracted permit names to avoid duplicates
    const extractedPermitNames = new Set();
    
      for (let i = 0; i < rows.length; i++) {
        // Check for cancellation before each permit extraction
        if (requestId) {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
            const cancelUrl = `${baseUrl}/api/bizpal/cancel?requestId=${encodeURIComponent(requestId)}`;
            const response = await fetch(cancelUrl);
            if (response.ok) {
              const data = await response.json();
              if (data.cancelled === true) {
                log(`\n🛑 CANCELLATION DETECTED - Stopping extraction`);
                log(`   ✅ ${permits.length} permits extracted so far will be saved`);
                // Close browser and return permits extracted so far
                try {
                  await driver.quit();
                  log('   ✅ Browser closed');
                } catch (quitErr) {
                  log(`   ⚠️  Error closing browser: ${quitErr.message}`);
                }
                return permits; // Return permits extracted so far
              }
            }
          } catch (cancelCheckErr) {
            // If check fails, continue (don't stop on network errors)
            log(`   ⚠️  Could not check cancellation status: ${cancelCheckErr.message}`);
          }
        }
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
          
          // Check if this permit has already been extracted (by name) BEFORE expanding details
          const permitNameKey = name.trim().toLowerCase();
          if (extractedPermitNames.has(permitNameKey)) {
            log(`   ⏭️  Skipping duplicate permit: "${name}" (already extracted - skipping detail extraction)`);
            continue; // Skip this permit entirely, don't expand or extract details
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
          
          // Add to tracking set and push to permits array (duplicate check already done before expansion)
          // permitNameKey already defined earlier in this scope
          extractedPermitNames.add(permitNameKey);
          permits.push(permit);
          log(`   ✅ Extracted full details for: "${name}"`);
          
        } catch (err) {
          log(`   ❌ Error extracting permit ${i + 1}: ${err.message}`);
          // Continue with next permit
        }
      }

      log(`\n🎯 Extracted ${permits.length} permits with full details from first search`);
      
      // STEP 7: ITERATE THROUGH ALL DROPDOWN OPTIONS
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('🔄 STEP 7: ITERATING THROUGH ALL DROPDOWN OPTIONS');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Function to go back to input fields
      const goBackToInputFields = async () => {
        log('   🔙 Going back to input fields...');
        try {
          // Navigate back to home page
          await driver.get('https://beta.bizpal-perle.ca/en');
          await sleepWithCancellation(3000);
          await driver.wait(until.elementLocated(By.css('input')), 20000);
          log('   ✅ Navigated back to home page');
        } catch (e) {
          log(`   ⚠️  Error navigating back: ${e.message}`);
          throw e;
        }
      };
      
      // Function to get all dropdown options from business type field (headlessui combobox)
      const getAllDropdownOptions = async (businessTypeInput) => {
        log('   🔍 Getting all dropdown options from headlessui combobox...');
        const options = [];
        
        try {
          // Wait for dropdown to appear (check aria-expanded)
          await sleep(2000);
          
          // Check if dropdown is expanded
          const ariaExpanded = await businessTypeInput.getAttribute('aria-expanded');
          log(`   📊 aria-expanded: ${ariaExpanded}`);
          
          if (ariaExpanded !== 'true') {
            log('   ⚠️  Dropdown not expanded, trying to trigger it...');
            await businessTypeInput.click();
            await sleep(1000);
            await businessTypeInput.sendKeys(Key.ARROW_DOWN);
            await sleep(1000);
          }
          
          // Try multiple selectors for headlessui combobox dropdown
          const dropdownSelectors = [
            'ul[role="listbox"] li[role="option"]',
            'ul[role="listbox"] li',
            'div[role="listbox"] div[role="option"]',
            '[role="listbox"] [role="option"]',
            'ul[role="listbox"] > *',
            'div[role="listbox"] > *',
            '[class*="combobox"] [role="option"]',
            '[class*="combobox"] li'
          ];
          
          let optionElements = [];
          for (const selector of dropdownSelectors) {
            try {
              const elements = await driver.findElements(By.css(selector));
              if (elements.length > 0) {
                log(`   🔍 Found ${elements.length} elements with selector: ${selector}`);
                // Check if visible
                for (const elem of elements) {
                  try {
                    const isDisplayed = await elem.isDisplayed();
                    if (isDisplayed) {
                      optionElements.push(elem);
                    }
                  } catch {}
                }
                if (optionElements.length > 0) {
                  log(`   ✅ Found ${optionElements.length} visible dropdown options`);
                  break;
                }
              }
            } catch (e) {
              log(`   ⚠️  Selector ${selector} failed: ${e.message}`);
            }
          }
          
          // If no elements found, try JavaScript approach for headlessui
          if (optionElements.length === 0) {
            log('   ℹ️  Trying JavaScript to find headlessui combobox options...');
            const jsOptions = await driver.executeScript(`
              const input = arguments[0];
              let dropdown = null;
              
              // Find headlessui combobox dropdown
              let parent = input.closest('[class*="combobox"], [class*="Combobox"]');
              if (!parent) {
                parent = input.parentElement;
                for (let i = 0; i < 5 && parent; i++) {
                  dropdown = parent.querySelector('ul[role="listbox"], div[role="listbox"]');
                  if (dropdown) break;
                  parent = parent.parentElement;
                }
              } else {
                dropdown = parent.querySelector('ul[role="listbox"], div[role="listbox"]');
              }
              
              if (!dropdown) {
                // Search entire document for listbox
                dropdown = document.querySelector('ul[role="listbox"], div[role="listbox"]');
              }
              
              if (dropdown) {
                const items = dropdown.querySelectorAll('li[role="option"], [role="option"], li, div[role="option"]');
                return Array.from(items).map((item, idx) => {
                  const text = item.textContent.trim();
                  const visible = item.offsetParent !== null && window.getComputedStyle(item).display !== 'none';
                  return {
                    index: idx,
                    text: text,
                    visible: visible,
                    element: item
                  };
                }).filter(item => item.text.length > 0 && item.visible);
              }
              return [];
            `, businessTypeInput);
            
            if (jsOptions && jsOptions.length > 0) {
              log(`   📋 Found ${jsOptions.length} options via JavaScript`);
              // Find elements by text for clicking
              for (const opt of jsOptions) {
                try {
                  // Try to find by exact text match first
                  let elem = null;
                  try {
                    elem = await driver.findElement(By.xpath(`//li[role="option"][contains(., "${opt.text.substring(0, 50)}")] | //div[role="option"][contains(., "${opt.text.substring(0, 50)}")]`));
                  } catch {
                    try {
                      elem = await driver.findElement(By.xpath(`//li[contains(., "${opt.text.substring(0, 50)}")] | //div[contains(., "${opt.text.substring(0, 50)}")]`));
                    } catch {}
                  }
                  
                  if (elem) {
                    optionElements.push(elem);
                    options.push({
                      index: opt.index,
                      text: opt.text,
                      element: elem
                    });
                  } else {
                    options.push({
                      index: opt.index,
                      text: opt.text,
                      element: null
                    });
                  }
                } catch {
                  options.push({
                    index: opt.index,
                    text: opt.text,
                    element: null
                  });
                }
              }
            }
          } else {
            log(`   📋 Found ${optionElements.length} dropdown options`);
            for (let i = 0; i < optionElements.length; i++) {
              try {
                const optionText = await optionElements[i].getText();
                if (optionText && optionText.trim()) {
                  options.push({
                    index: i,
                    text: optionText.trim(),
                    element: optionElements[i]
                  });
                }
              } catch (e) {
                log(`   ⚠️  Could not get text for option ${i}: ${e.message}`);
              }
            }
          }
          
          log(`   ✅ Total options found: ${options.length}`);
        } catch (e) {
          log(`   ⚠️  Error getting dropdown options: ${e.message}`);
        }
        
        return options;
      };
      
      // Go back to input fields
      await goBackToInputFields();
      
      // Re-enter location
      log('   📍 Re-entering location...');
      let locInput2;
      try {
        locInput2 = await driver.wait(
          until.elementLocated(By.css('input[placeholder*="located"], input[placeholder*="Where"], input[placeholder*="location"]')), 
          15000
        );
      } catch {
        // Fallback: get first input
        const allInputs = await driver.findElements(By.css('input[type="text"]'));
        if (allInputs.length > 0) {
          locInput2 = allInputs[0];
        } else {
          throw new Error('Could not find location input field');
        }
      }
      await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', locInput2);
      await sleep(500);
      await locInput2.click();
      await sleep(1000);
      await locInput2.clear();
      await sleep(500);
      await typeLikeHuman(locInput2, location, 150);
      await sleep(2000);
      await locInput2.sendKeys(Key.ENTER);
      await sleep(1500);
      await locInput2.sendKeys(Key.TAB);
      await sleep(1200);
      
      // Verify location was set
      try {
        const locValue = await locInput2.getAttribute('value');
        log(`   ✅ Location re-entered: "${locValue}"`);
      } catch {}
      
      // Re-enter business type to trigger dropdown
      log('   🏢 Re-entering business type to get dropdown options...');
      let busInput2;
      try {
        // Use specific ID for business type field
        busInput2 = await driver.wait(
          until.elementLocated(By.id('headlessui-combobox-input-v-193')), 
          10000
        );
        log('   ✅ Found business type field by specific ID (headlessui-combobox-input-v-193)');
      } catch {
        try {
          // Fallback: Find by placeholder
          busInput2 = await driver.wait(
            until.elementLocated(By.css('input[placeholder*="What type of business"], input[placeholder*="business type"]')), 
            10000
          );
          log('   ✅ Found business type field by placeholder');
        } catch {
          // Final fallback: Get all comboboxes and select the second one
          const allComboboxes = await driver.findElements(By.css('input[role="combobox"][aria-autocomplete="list"]'));
          if (allComboboxes.length >= 2) {
            busInput2 = allComboboxes[1]; // Second combobox is business type
            log('   ✅ Found business type field as second combobox');
          } else {
            busInput2 = await driver.switchTo().activeElement();
            log('   ✅ Using active element as business type field (fallback)');
          }
        }
      }
      
      // Verify we're on business type field, not location
      const busPlaceholder = await busInput2.getAttribute('placeholder').catch(() => '');
      const busId = await busInput2.getAttribute('id').catch(() => '');
      if (busPlaceholder.includes('located') || busPlaceholder.includes('Where') || busId === 'headlessui-combobox-input-v-190') {
        log(`   ⚠️  WARNING: Selected field is location field! Finding correct business type field...`);
        try {
          busInput2 = await driver.findElement(By.id('headlessui-combobox-input-v-193'));
          log('   ✅ Corrected to business type field by ID');
        } catch {
          const allComboboxes = await driver.findElements(By.css('input[role="combobox"]'));
          if (allComboboxes.length >= 2) {
            busInput2 = allComboboxes[1];
            log('   ✅ Corrected to second combobox');
          }
        }
      }
      
      await busInput2.click();
      await sleep(1000);
      await busInput2.clear();
      await sleep(500);
      await typeLikeHuman(busInput2, businessType, 150);
      await sleepWithCancellation(3000); // Wait for dropdown to appear
      
      // Ensure dropdown is expanded
      try {
        const ariaExpanded = await busInput2.getAttribute('aria-expanded');
        if (ariaExpanded !== 'true') {
          log('   🔽 Triggering dropdown expansion...');
          await busInput2.sendKeys(Key.ARROW_DOWN);
          await sleep(1000);
        }
      } catch {}
      
      // Get all dropdown options
      const dropdownOptions = await getAllDropdownOptions(busInput2);
      log(`   📋 Found ${dropdownOptions.length} dropdown options total`);
      
      if (dropdownOptions.length <= 1) {
        log('   ℹ️  Only 1 or fewer dropdown options found, skipping iteration');
    return permits;
      }
      
      // Iterate through options starting from the 2nd one (index 1)
      let currentBusInput = busInput2; // Keep reference to current business input
      
      for (let optionIndex = 1; optionIndex < dropdownOptions.length; optionIndex++) {
        // Check for cancellation before processing each dropdown option
        if (requestId) {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
            const cancelUrl = `${baseUrl}/api/bizpal/cancel?requestId=${encodeURIComponent(requestId)}`;
            const response = await fetch(cancelUrl);
            if (response.ok) {
              const data = await response.json();
              if (data.cancelled === true) {
                log(`\n🛑 CANCELLATION DETECTED - Stopping dropdown option iteration`);
                log(`   ✅ ${permits.length} permits extracted so far will be saved`);
                // Close browser and return permits extracted so far
                try {
                  await driver.quit();
                  log('   ✅ Browser closed');
                } catch (quitErr) {
                  log(`   ⚠️  Error closing browser: ${quitErr.message}`);
                }
                return permits; // Return permits extracted so far
              }
            }
          } catch (cancelCheckErr) {
            // If check fails, continue (don't stop on network errors)
            log(`   ⚠️  Could not check cancellation status: ${cancelCheckErr.message}`);
          }
        }
        
        const option = dropdownOptions[optionIndex];
        log(`\n   🔄 Processing dropdown option ${optionIndex + 1}/${dropdownOptions.length}: "${option.text.substring(0, 60)}..."`);
        
        try {
        // Retry logic: if 0 permits found/extracted, retry this option
        const MAX_RETRIES = 3;
        let retryCount = 0;
        let permitsExtractedThisOption = 0;
        let shouldRetry = true;
        
        while (shouldRetry && retryCount < MAX_RETRIES) {
          if (retryCount > 0) {
            log(`   🔄 RETRY ${retryCount}/${MAX_RETRIES - 1}: Re-attempting option ${optionIndex + 1}...`);
            // Go back to input fields before retry
            await goBackToInputFields();
            
            // Re-enter location for retry
            log('   📍 Re-entering location for retry...');
            let locInputRetry;
            try {
              locInputRetry = await driver.wait(
                until.elementLocated(By.id('headlessui-combobox-input-v-190')), 
                10000
              );
            } catch {
              try {
                locInputRetry = await driver.wait(
                  until.elementLocated(By.css('input[placeholder*="located"], input[placeholder*="Where"]')), 
                  10000
                );
              } catch {
                const allInputs = await driver.findElements(By.css('input[type="text"]'));
                if (allInputs.length > 0) {
                  locInputRetry = allInputs[0];
                } else {
                  throw new Error('Could not find location input field for retry');
                }
              }
            }
            await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', locInputRetry);
            await sleep(500);
            await locInputRetry.click();
            await sleep(1000);
            await locInputRetry.clear();
            await sleep(500);
            await typeLikeHuman(locInputRetry, location, 150);
            await sleepWithCancellation(2000);
            await locInputRetry.sendKeys(Key.ENTER);
            await sleep(1500);
            await locInputRetry.sendKeys(Key.TAB);
            await sleep(1200);
            
            // Re-enter business type for retry
            log('   🏢 Re-entering business type for retry...');
            let busInputFound = false;
            let attempts = 0;
            const maxAttempts = 5;
            
            while (!busInputFound && attempts < maxAttempts) {
              attempts++;
              try {
                // Try specific ID first
                try {
                  currentBusInput = await driver.wait(
                    until.elementLocated(By.id('headlessui-combobox-input-v-193')), 
                    5000
                  );
                  const busId = await currentBusInput.getAttribute('id');
                  const busPlaceholder = await currentBusInput.getAttribute('placeholder').catch(() => '');
                  if (busId === 'headlessui-combobox-input-v-193' || busPlaceholder.includes('business')) {
                    busInputFound = true;
                    log(`   ✅ Found business type field by ID (attempt ${attempts})`);
                    break;
                  }
                } catch {}
                
                // Try placeholder
                try {
                  currentBusInput = await driver.wait(
                    until.elementLocated(By.css('input[placeholder*="What type of business"], input[placeholder*="business type"]')), 
                    5000
                  );
                  const busPlaceholder = await currentBusInput.getAttribute('placeholder').catch(() => '');
                  if (busPlaceholder.includes('business')) {
                    busInputFound = true;
                    log(`   ✅ Found business type field by placeholder (attempt ${attempts})`);
                    break;
                  }
                } catch {}
                
                // Try all comboboxes and find the second one
                const allComboboxes = await driver.findElements(By.css('input[role="combobox"], input[aria-autocomplete="list"]'));
                if (allComboboxes.length >= 2) {
                  // Verify it's the business type field
                  for (let i = 1; i < allComboboxes.length; i++) {
                    const placeholder = await allComboboxes[i].getAttribute('placeholder').catch(() => '');
                    const id = await allComboboxes[i].getAttribute('id').catch(() => '');
                    if (placeholder.includes('business') || id === 'headlessui-combobox-input-v-193') {
                      currentBusInput = allComboboxes[i];
                      busInputFound = true;
                      log(`   ✅ Found business type field as combobox ${i + 1} (attempt ${attempts})`);
                      break;
                    }
                  }
                  if (!busInputFound && allComboboxes.length >= 2) {
                    currentBusInput = allComboboxes[1];
                    busInputFound = true;
                    log(`   ✅ Using second combobox as business type field (attempt ${attempts})`);
                  }
                }
                
                if (!busInputFound) {
                  // Last resort: try active element
                  currentBusInput = await driver.switchTo().activeElement();
                  const tagName = await currentBusInput.getTagName();
                  if (tagName === 'input') {
                    busInputFound = true;
                    log(`   ✅ Using active element as business type field (attempt ${attempts})`);
                  }
                }
              } catch (e) {
                log(`   ⚠️  Attempt ${attempts} failed: ${e.message}`);
                if (attempts < maxAttempts) {
                  await sleep(1000);
                  // Try clicking somewhere else to reset focus
                  try {
                    await driver.executeScript('document.body.click();');
                    await sleep(500);
                  } catch {}
                }
              }
            }
            
            if (!busInputFound) {
              throw new Error('Could not find business type input field after multiple attempts');
            }
            
            // Verify we have the correct field
            const busPlaceholderCheck = await currentBusInput.getAttribute('placeholder').catch(() => '');
            const busIdCheck = await currentBusInput.getAttribute('id').catch(() => '');
            if (busPlaceholderCheck.includes('located') || busPlaceholderCheck.includes('Where') || busIdCheck === 'headlessui-combobox-input-v-190') {
              log(`   ⚠️  WARNING: Selected field appears to be location field! Finding correct business type field...`);
              // Try to find the correct one
              const allComboboxes = await driver.findElements(By.css('input[role="combobox"]'));
              for (const cb of allComboboxes) {
                const placeholder = await cb.getAttribute('placeholder').catch(() => '');
                const id = await cb.getAttribute('id').catch(() => '');
                if (placeholder.includes('business') || id === 'headlessui-combobox-input-v-193') {
                  currentBusInput = cb;
                  log(`   ✅ Corrected to business type field`);
                  break;
                }
              }
            }
            
            // Interact with the field
            await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', currentBusInput);
            await sleep(500);
            await currentBusInput.click();
            await sleep(1000);
            
            // Clear and verify it's cleared
            await currentBusInput.clear();
            await sleep(500);
            const currentValue = await currentBusInput.getAttribute('value');
            if (currentValue && currentValue.trim().length > 0) {
              log(`   ⚠️  Field not cleared, trying JavaScript clear...`);
              await driver.executeScript('arguments[0].value = "";', currentBusInput);
              await sleep(300);
            }
            
            // Type the business type
            await typeLikeHuman(currentBusInput, businessType, 150);
            await sleepWithCancellation(2000);
            
            // Verify the value was set
            const typedValue = await currentBusInput.getAttribute('value');
            if (!typedValue || !typedValue.includes(businessType.substring(0, 5))) {
              log(`   ⚠️  Value not set correctly, retrying...`);
              await currentBusInput.clear();
              await sleep(300);
              await typeLikeHuman(currentBusInput, businessType, 150);
              await sleepWithCancellation(2000);
            }
            
            log(`   ✅ Business type entered: "${typedValue || businessType}"`);
            
            // Refresh dropdown options for retry
            try {
              const ariaExpanded = await currentBusInput.getAttribute('aria-expanded');
              if (ariaExpanded !== 'true') {
                await currentBusInput.sendKeys(Key.ARROW_DOWN);
                await sleep(1000);
              }
            } catch {}
            const refreshedOptionsRetry = await getAllDropdownOptions(currentBusInput);
            if (refreshedOptionsRetry.length > optionIndex) {
              dropdownOptions[optionIndex] = refreshedOptionsRetry[optionIndex];
            }
          }
          
          // Track permits count before extraction
          const permitsBefore = permits.length;
          
        try {
          // Re-enter business type if needed (to refresh dropdown)
          // Note: optionIndex starts at 1 (second option), so we don't need to re-enter for the first iteration
          // We only re-enter if we're past the second option (optionIndex > 1 means we're on 3rd option or later)
          if (optionIndex > 1) {
            // Re-find business type field to ensure we have the correct element (use specific ID)
            let busInputFound = false;
            try {
              currentBusInput = await driver.findElement(By.id('headlessui-combobox-input-v-193'));
              const busId = await currentBusInput.getAttribute('id');
              if (busId === 'headlessui-combobox-input-v-193') {
                busInputFound = true;
              }
            } catch {}
            
            if (!busInputFound) {
              try {
                currentBusInput = await driver.findElement(By.css('input[placeholder*="What type of business"], input[placeholder*="business type"]'));
                const busPlaceholder = await currentBusInput.getAttribute('placeholder').catch(() => '');
                if (busPlaceholder.includes('business')) {
                  busInputFound = true;
                }
              } catch {}
            }
            
            if (!busInputFound) {
              const allComboboxes = await driver.findElements(By.css('input[role="combobox"], input[aria-autocomplete="list"]'));
              if (allComboboxes.length >= 2) {
                // Verify it's the business type field
                for (let i = 1; i < allComboboxes.length; i++) {
                  const placeholder = await allComboboxes[i].getAttribute('placeholder').catch(() => '');
                  const id = await allComboboxes[i].getAttribute('id').catch(() => '');
                  if (placeholder.includes('business') || id === 'headlessui-combobox-input-v-193') {
                    currentBusInput = allComboboxes[i];
                    busInputFound = true;
                    break;
                  }
                }
                if (!busInputFound) {
                  currentBusInput = allComboboxes[1];
                }
              }
            }
            
            // Verify we have the correct field
            const busPlaceholderCheck = await currentBusInput.getAttribute('placeholder').catch(() => '');
            const busIdCheck = await currentBusInput.getAttribute('id').catch(() => '');
            if (busPlaceholderCheck.includes('located') || busPlaceholderCheck.includes('Where') || busIdCheck === 'headlessui-combobox-input-v-190') {
              log(`   ⚠️  WARNING: Selected field appears to be location field! Finding correct business type field...`);
              const allComboboxes = await driver.findElements(By.css('input[role="combobox"]'));
              for (const cb of allComboboxes) {
                const placeholder = await cb.getAttribute('placeholder').catch(() => '');
                const id = await cb.getAttribute('id').catch(() => '');
                if (placeholder.includes('business') || id === 'headlessui-combobox-input-v-193') {
                  currentBusInput = cb;
                  log(`   ✅ Corrected to business type field`);
                  break;
                }
              }
            }
            
            await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', currentBusInput);
            await sleep(500);
            await currentBusInput.click();
            await sleep(1000);
            await currentBusInput.clear();
            await sleep(500);
            
            // Verify cleared
            const currentValue = await currentBusInput.getAttribute('value');
            if (currentValue && currentValue.trim().length > 0) {
              await driver.executeScript('arguments[0].value = "";', currentBusInput);
              await sleep(300);
            }
            
            await typeLikeHuman(currentBusInput, businessType, 150);
            await sleepWithCancellation(2000);
            
            // Verify value was set
            const typedValue = await currentBusInput.getAttribute('value');
            if (!typedValue || !typedValue.includes(businessType.substring(0, 5))) {
              log(`   ⚠️  Value not set correctly, retrying...`);
              await currentBusInput.clear();
              await sleep(300);
              await typeLikeHuman(currentBusInput, businessType, 150);
              await sleepWithCancellation(2000);
            }
            
            // Refresh dropdown options
            try {
              const ariaExpanded = await currentBusInput.getAttribute('aria-expanded');
              if (ariaExpanded !== 'true') {
                await currentBusInput.sendKeys(Key.ARROW_DOWN);
                await sleep(1000);
              }
            } catch {}
            const refreshedOptions = await getAllDropdownOptions(currentBusInput);
            if (refreshedOptions.length > optionIndex) {
              dropdownOptions[optionIndex] = refreshedOptions[optionIndex];
            }
          }
          
          // Click on the dropdown option (headlessui combobox)
          let optionSelected = false;
          
          if (option.element) {
            try {
              await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', option.element);
              await sleep(500);
              try {
                await option.element.click();
                optionSelected = true;
                log(`   ✅ Clicked option element directly`);
              } catch {
                await driver.executeScript('arguments[0].click();', option.element);
                optionSelected = true;
                log(`   ✅ Clicked option element via JavaScript`);
              }
            } catch (e) {
              log(`   ⚠️  Could not click option element: ${e.message}`);
            }
          }
          
          if (!optionSelected) {
            // Try finding by text
            try {
              const optionElement = await driver.findElement(By.xpath(`//li[role="option"][contains(., "${option.text.substring(0, 50)}")] | //div[role="option"][contains(., "${option.text.substring(0, 50)}")] | //li[contains(., "${option.text.substring(0, 50)}")]`));
              await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', optionElement);
              await sleep(500);
              await optionElement.click();
              optionSelected = true;
              log(`   ✅ Found and clicked option by text`);
            } catch (e) {
              log(`   ⚠️  Could not find option by text: ${e.message}, trying keyboard navigation...`);
              // Try arrow keys to navigate to the option
              try {
                // Ensure we're on business type field (use specific ID)
                try {
                  currentBusInput = await driver.findElement(By.id('headlessui-combobox-input-v-193'));
                } catch {
                  const allComboboxes = await driver.findElements(By.css('input[role="combobox"]'));
                  if (allComboboxes.length >= 2) {
                    currentBusInput = allComboboxes[1];
                  }
                }
                
                await currentBusInput.click();
                await sleep(300);
                
                // Only clear and retype if value is not already set (prevents duplicate typing)
                const currentValue = await currentBusInput.getAttribute('value');
                if (!currentValue || currentValue.trim().length === 0) {
                  await currentBusInput.clear();
                  await typeLikeHuman(currentBusInput, businessType, 100);
                  await sleepWithCancellation(2000);
                }
                
                // Navigate to the option using arrow keys
                // optionIndex is 1 for 2nd option, 2 for 3rd option, etc.
                // So we need to press arrow down (optionIndex) times to get to the right option
                for (let i = 0; i < optionIndex; i++) {
                  await currentBusInput.sendKeys(Key.ARROW_DOWN);
                  await sleep(200);
                }
                await currentBusInput.sendKeys(Key.ENTER);
                optionSelected = true;
                log(`   ✅ Selected option ${optionIndex + 1} using keyboard navigation`);
              } catch (keyboardError) {
                log(`   ❌ Keyboard navigation also failed: ${keyboardError.message}`);
              }
            }
          }
          
          // Check before sleep
          if (requestId && await checkCancellation()) {
            return await throwCancellation();
          }
          
          await sleep(2000);
          
          // Check after sleep
          if (requestId && await checkCancellation()) {
            return await throwCancellation();
          }
          
          if (optionSelected) {
            log(`   ✅ Selected dropdown option ${optionIndex + 1}: "${option.text.substring(0, 50)}..."`);
          } else {
            log(`   ⚠️  Failed to select dropdown option ${optionIndex + 1}, continuing anyway...`);
          }
          
          // Press Tab to move to next field
          await currentBusInput.sendKeys(Key.TAB);
          
          // Check before sleep
          if (requestId && await checkCancellation()) {
            return await throwCancellation();
          }
          
          await sleepWithCancellation(1200);
          
          // Handle permit keywords field if provided
          if (permitKeywords) {
            // Check before handling permit keywords
            if (requestId && await checkCancellation()) {
              return await throwCancellation();
            }
            
            const permitInput2 = await driver.switchTo().activeElement();
            await permitInput2.click();
            await sleepWithCancellation(1000);
            await permitInput2.clear();
            await sleep(500);
            
            // Copy and paste permit keywords
            const copied = await copyToClipboard(permitKeywords);
            if (copied) {
              const modifier = process.platform === 'darwin' ? Key.COMMAND : Key.CONTROL;
              await permitInput2.sendKeys(modifier, 'v');
              await sleepWithCancellation(1500);
            } else {
              await driver.executeScript(`
                arguments[0].value = arguments[1];
                arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
                arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
              `, permitInput2, permitKeywords);
              await sleep(300);
            }
            
            // Check before tab
            if (requestId && await checkCancellation()) {
              return await throwCancellation();
            }
            
            await permitInput2.sendKeys(Key.TAB);
            await sleepWithCancellation(1200);
          }
          
          // Submit the form
          log('   🔍 Submitting search...');
          let formSubmitted = false;
          try {
            const searchButton2 = await driver.findElement(By.xpath('//button[contains(text(), "Find") or contains(text(), "Search") or contains(text(), "Submit")] | //button[@type="submit"]'));
            await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', searchButton2);
            await sleep(500);
            await searchButton2.click();
            formSubmitted = true;
            log('   ✅ Clicked submit button');
          } catch {
            try {
              const focusedElement = await driver.switchTo().activeElement();
              await focusedElement.sendKeys(Key.ENTER);
              formSubmitted = true;
              log('   ✅ Pressed Enter on focused element');
            } catch (e) {
              log(`   ⚠️  Could not submit form: ${e.message}`);
            }
          }
          await sleepWithCancellation(3000);
          
          // Wait for results
          try {
            // Check before long wait
            if (requestId && await checkCancellation()) {
              return await throwCancellation();
            }
            
            await driver.wait(
              until.elementLocated(By.css('.ag-center-cols-container .ag-row, .ag-row[role="row"], [role="rowgroup"]')),
              45000 // Increased timeout
            );
            
            // Check after wait
            if (requestId && await checkCancellation()) {
              return await throwCancellation();
            }
            
            await sleepWithCancellation(3000);
            
            // Check after sleep
            if (requestId && await checkCancellation()) {
              return await throwCancellation();
            }
            
            log('   ✅ Results page loaded');
          } catch (e) {
            // If it's a cancellation error, re-throw it
            if (e.message === 'CANCELLED') {
              return await throwCancellation();
            }
            
            log(`   ⚠️  Results wait timeout: ${e.message}`);
            // Try to continue anyway - maybe results are there but selector is different
            await sleepWithCancellation(2000);
          }
          
          // Scroll to load all results
          let lastRowCount = 0;
          let stableCount = 0;
          let rows = [];
          for (let attempt = 0; attempt < 20; attempt++) {
            // Check for cancellation in scrolling loop
            if (requestId && await checkCancellation()) {
              return await throwCancellation();
            }
            
            rows = await driver.findElements(By.css('.ag-center-cols-container .ag-row'));
            if (rows.length === lastRowCount) {
              stableCount++;
              if (stableCount >= 2) break;
            } else {
              stableCount = 0;
              lastRowCount = rows.length;
            }
            if (rows.length > 0) {
              await driver.executeScript('arguments[0].scrollIntoView({ block: "end", behavior: "smooth" });', rows[rows.length - 1]);
            }
            
            // Check before sleep
            if (requestId && await checkCancellation()) {
              return await throwCancellation();
            }
            
            await sleep(800, requestId, checkCancellation);
          }
          
          // Extract permits from this search (use the same comprehensive extraction as first search)
          rows = await driver.findElements(By.css('.ag-center-cols-container .ag-row'));
          log(`   📊 Found ${rows.length} rows to extract`);
          
          // Track statistics for this extraction
          let duplicatesSkipped = 0;
          let permitsProcessed = 0;
          let permitsExtracted = 0;
          
          // Use the same extraction logic as the first search (lines 980-1614)
          for (let i = 0; i < rows.length; i++) {
            // Check for cancellation before each permit extraction
            if (requestId) {
              try {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
                const cancelUrl = `${baseUrl}/api/bizpal/cancel?requestId=${encodeURIComponent(requestId)}`;
                const response = await fetch(cancelUrl);
                if (response.ok) {
                  const data = await response.json();
                  if (data.cancelled === true) {
                    log(`\n🛑 CANCELLATION DETECTED - Stopping extraction`);
                    log(`   ✅ ${permits.length} permits extracted so far will be saved`);
                    // Close browser and return permits extracted so far
                    try {
                      await driver.quit();
                      log('   ✅ Browser closed');
                    } catch (quitErr) {
                      log(`   ⚠️  Error closing browser: ${quitErr.message}`);
                    }
                    return permits; // Return permits extracted so far
                  }
                }
              } catch (cancelCheckErr) {
                // If check fails, continue (don't stop on network errors)
                log(`   ⚠️  Could not check cancellation status: ${cancelCheckErr.message}`);
              }
            }
            
            const row = rows[i];
            log(`   📋 Extracting permit ${i + 1}/${rows.length} from option ${optionIndex + 1}...`);
            
            try {
              // Extract basic info from the row (same as first search)
              let name = '', description = '', jurisdiction = 'provincial', activities = [], relevance = 'Medium';
              
              // Extract name first to check for duplicates BEFORE expanding
              
              // Extract name and description from title column
              try {
                const titleCell = await row.findElement(By.css('[col-id="title"], [role="gridcell"]:first-child, .ag-cell:first-child'));
                const titleText = await titleCell.getText();
                const titleLines = titleText.split('\n').filter(line => line.trim());
                
                if (titleLines.length > 0) {
                  try {
                    const linkElement = await titleCell.findElement(By.css('a'));
                    name = (await linkElement.getText()).trim();
                  } catch {
                    name = titleLines[0]?.trim() || '';
                  }
                  if (titleLines.length > 1) {
                    description = titleLines.slice(1).join(' ').trim();
                  }
                }
              } catch (e) {
                try { name = await row.findElement(By.css('strong, h3')).getText(); } catch {}
                try { description = await row.findElement(By.css('p, .description')).getText(); } catch {}
              }
              
              // Extract jurisdiction
              try {
                const jurisdictionCell = await row.findElement(By.css('[col-id="jurisdiction"], [role="gridcell"][col-id*="jurisdiction"]'));
                const jurisdictionText = (await jurisdictionCell.getText()).trim().toLowerCase();
                if (jurisdictionText === 'municipal') jurisdiction = 'municipal';
                else if (jurisdictionText === 'federal') jurisdiction = 'federal';
                else if (jurisdictionText === 'provincial') jurisdiction = 'provincial';
              } catch (e) {
                jurisdiction = 'provincial';
              }
              
              // Extract activities
              try {
                const activitiesCell = await row.findElement(By.css('[col-id="activities"], [role="gridcell"][col-id*="activities"]'));
                const activitiesText = (await activitiesCell.getText()).trim();
                activities = activitiesText.split(',').map(a => a.trim()).filter(a => a.length > 0);
              } catch (e) {
                activities = [];
              }
              
              // Extract relevance
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
              
              permitsProcessed++;
              
              // Check if this permit has already been extracted (by name) BEFORE expanding details
              const permitNameKey = name.trim().toLowerCase();
              if (extractedPermitNames.has(permitNameKey)) {
                duplicatesSkipped++;
                log(`   ⏭️  Skipping duplicate permit: "${name}" (already extracted - skipping detail extraction)`);
                continue; // Skip this permit entirely, don't expand or extract details
              }
              
              // Extract expanded details (same comprehensive logic as first search)
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
              
              // Click expand button and extract all details (same as lines 1094-1585)
              try {
                await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', row);
                await sleep(500);
                
                let isExpanded = false;
                let expandButton = null;
                
                try {
                  expandButton = await row.findElement(By.css('span.ag-icon.ag-icon-tree-open'));
                } catch {
                  try {
                    const closedButton = await row.findElement(By.css('span.ag-icon.ag-icon-tree-closed'));
                    isExpanded = true;
                  } catch {}
                }
                
                if (!isExpanded && expandButton) {
                  await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', expandButton);
                  await sleep(300);
                  try {
                    await expandButton.click();
                  } catch {
                    await driver.executeScript('arguments[0].click();', expandButton);
                  }
                  await sleep(1500);
                  isExpanded = true;
                }
                
                await sleep(1500);
                
                // Extract all expanded details (same comprehensive extraction)
                try {
                  let expandedContent = null;
                  try {
                    expandedContent = await driver.findElement(By.css('.permit-detail'));
                  } catch {
                    try {
                      expandedContent = await row.findElement(By.css('.ag-row-detail'));
                    } catch {}
                  }
                  
                  if (expandedContent) {
                    try {
                      fullHtmlContent = await expandedContent.getAttribute('innerHTML');
                      allTextContent = await expandedContent.getText();
                    } catch {}
                    
                    // Extract prerequisites
                    try {
                      const prereqHeading = await expandedContent.findElement(By.xpath('.//h3[contains(text(), "Prerequisites")]'));
                      const prereqParent = await prereqHeading.findElement(By.xpath('./ancestor::div[1]'));
                      try {
                        const prereqParagraph = await prereqParent.findElement(By.css('p'));
                        prerequisites = (await prereqParagraph.getText()).trim();
                      } catch {
                        const prereqText = await prereqParent.getText();
                        const prereqMatch = prereqText.match(/Prerequisites[:\s]*(.+)/is);
                        if (prereqMatch) prerequisites = prereqMatch[1].trim();
                      }
                    } catch {}
                    
                    // Extract contact info
                    try {
                      const contactHeading = await expandedContent.findElement(By.xpath('.//h3[contains(text(), "Contact")]'));
                      const contactSection = await contactHeading.findElement(By.xpath('./following-sibling::div[1] | ./parent::div'));
                      const contactText = await contactSection.getText();
                      
                      try {
                        const municipalityLink = await contactSection.findElement(By.css('a[href*="toronto"], a[href*="municipal"], a b'));
                        contactInfo.municipality = (await municipalityLink.getText()).trim();
                        contactInfo.municipalityUrl = await municipalityLink.getAttribute('href');
                      } catch {}
                      
                      const emailMatch = contactText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                      if (emailMatch) contactInfo.email = emailMatch[1];
                      
                      const phoneMatch = contactText.match(/(?:Tel|Phone|Tel:)\s*:?\s*([0-9\-\(\)\s]+)/i);
                      if (phoneMatch) contactInfo.phone = phoneMatch[1].trim();
                      
                      const faxMatch = contactText.match(/(?:Fax|Fax:)\s*:?\s*([0-9\-\(\)\s]+)/i);
                      if (faxMatch) contactInfo.fax = faxMatch[1].trim();
                      
                      const addressLines = [];
                      const addressSpans = await contactSection.findElements(By.css('span'));
                      for (const span of addressSpans) {
                        try {
                          const spanText = (await span.getText()).trim();
                          if (spanText && !spanText.includes('@') && !spanText.match(/^Tel:|^Fax:/i) && spanText.length > 2) {
                            addressLines.push(spanText);
                          }
                        } catch {}
                      }
                      if (addressLines.length > 0) {
                        contactInfo.address = { fullAddress: addressLines.join(', '), lines: addressLines };
                      }
                    } catch {}
                    
                    // Extract last verified
                    try {
                      const verifiedElements = await expandedContent.findElements(By.xpath('.//*[contains(text(), "Last verified")]'));
                      if (verifiedElements.length > 0) {
                        const verifiedText = await verifiedElements[0].getText();
                        const dateMatch = verifiedText.match(/(\d{4}-\d{2}-\d{2})/);
                        if (dateMatch) lastVerified = dateMatch[1];
                      }
                    } catch {}
                    
                    // Extract all links
                    const allButtonLinks = [];
                    try {
                      const allLinks = await expandedContent.findElements(By.css('a[href], button a[href]'));
                      for (const link of allLinks) {
                        try {
                          const linkText = (await link.getText()).trim();
                          const linkHref = await link.getAttribute('href');
                          if (linkHref && linkHref.startsWith('http')) {
                            allButtonLinks.push({ text: linkText, url: linkHref, target: await link.getAttribute('target') || '_self' });
                            const linkTextLower = linkText.toLowerCase();
                            if (linkTextLower.includes('more information')) moreInfoUrl = linkHref;
                            else if (linkTextLower.includes('online application')) onlineApplicationUrl = linkHref;
                            else if (linkTextLower.includes('by-law')) bylawUrl = linkHref;
                          }
                        } catch {}
                      }
                    } catch {}
                    
                    // Extract images
                    const allImageLinks = [];
                    try {
                      const images = await expandedContent.findElements(By.css('img'));
                      for (const img of images) {
                        try {
                          const imgSrc = await img.getAttribute('src');
                          if (imgSrc) {
                            allImageLinks.push({
                              src: imgSrc,
                              alt: await img.getAttribute('alt') || '',
                              title: await img.getAttribute('title') || ''
                            });
                          }
                        } catch {}
                      }
                    } catch {}
                    
                    if (allButtonLinks.length > 0) expandedDetails.buttonLinks = allButtonLinks;
                    if (allImageLinks.length > 0) expandedDetails.images = allImageLinks;
                    if (fullHtmlContent) expandedDetails.fullHtml = fullHtmlContent;
                    if (allTextContent) expandedDetails.fullText = allTextContent;
                  }
                } catch {}
                
                // Collapse
                if (isExpanded) {
                  try {
                    const collapseButton = await row.findElement(By.css('span.ag-icon.ag-icon-tree-closed'));
                    await driver.executeScript('arguments[0].click();', collapseButton);
                    await sleep(500);
                  } catch {}
                }
              } catch {}
              
              const permit = {
                name: name.trim(),
                description: fullDescription || description.trim(),
                jurisdiction: jurisdiction,
                activities: activities,
                relevance: relevance,
                prerequisites: prerequisites || undefined,
                contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
                lastVerified: lastVerified || undefined,
                moreInfoUrl: moreInfoUrl || undefined,
                onlineApplicationUrl: onlineApplicationUrl || undefined,
                bylawUrl: bylawUrl || undefined,
                expandedDetails: Object.keys(expandedDetails).length > 0 ? expandedDetails : undefined,
                fullText: allTextContent || undefined,
                fullHtml: fullHtmlContent || undefined,
                permitTitle: permitTitle || undefined,
              };
              
              // Add to tracking set and push to permits array (duplicate check already done before expansion)
              // permitNameKey already defined earlier in this scope
              extractedPermitNames.add(permitNameKey);
              permits.push(permit);
              permitsExtracted++;
              log(`   ✅ Extracted: "${name}"`);
  } catch (err) {
              log(`   ❌ Error extracting permit ${i + 1}: ${err.message}`);
            }
          }
          
          // Calculate how many new permits were actually extracted (not skipped as duplicates)
          permitsExtractedThisOption = permits.length - permitsBefore;
          const rowsFound = rows.length;
          
          log(`   📊 Results: Found ${rowsFound} rows, processed ${permitsProcessed} permits, skipped ${duplicatesSkipped} duplicates, extracted ${permitsExtractedThisOption} new permits from option ${optionIndex + 1}`);
          
          // Check if we need to retry: 
          // - 0 rows found (no results at all) - retry
          // - 0 permits extracted BUT all were duplicates (permitsProcessed === duplicatesSkipped) - don't retry, move on
          // - 0 permits extracted AND not all duplicates (permitsProcessed > duplicatesSkipped) - retry
          if (rowsFound === 0) {
            // No rows found - retry
            retryCount++;
            if (retryCount < MAX_RETRIES) {
              log(`   ⚠️  WARNING: 0 rows found for option ${optionIndex + 1}. Will retry (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
              shouldRetry = true;
              continue; // Retry this option
            } else {
              log(`   ❌ FAILED: 0 rows found after ${MAX_RETRIES} attempts for option ${optionIndex + 1}. Moving to next option.`);
              shouldRetry = false;
            }
          } else if (permitsExtractedThisOption === 0 && permitsProcessed === duplicatesSkipped && permitsProcessed > 0) {
            // All permits were duplicates - don't retry, just move on
            log(`   ℹ️  All ${permitsProcessed} permit(s) from option ${optionIndex + 1} were duplicates (already extracted). Moving to next option.`);
            shouldRetry = false;
          } else if (permitsExtractedThisOption === 0) {
            // 0 permits extracted but not all were duplicates - retry
            retryCount++;
            if (retryCount < MAX_RETRIES) {
              log(`   ⚠️  WARNING: 0 permits extracted for option ${optionIndex + 1}. Will retry (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
              shouldRetry = true;
              continue; // Retry this option
            } else {
              log(`   ❌ FAILED: 0 permits extracted after ${MAX_RETRIES} attempts for option ${optionIndex + 1}. Moving to next option.`);
              shouldRetry = false;
            }
          } else {
            // Success - extracted at least 1 permit
            log(`   ✅ Successfully extracted ${permitsExtractedThisOption} permit(s) from option ${optionIndex + 1}`);
            shouldRetry = false;
          }
          
        } catch (err) {
          // Error during extraction - retry if we haven't exceeded max retries
          retryCount++;
          log(`   ❌ Error during extraction for option ${optionIndex + 1}: ${err.message}`);
          if (retryCount < MAX_RETRIES) {
            log(`   🔄 Will retry (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            shouldRetry = true;
          } else {
            log(`   ❌ FAILED after ${MAX_RETRIES} attempts for option ${optionIndex + 1}. Moving to next option.`);
            shouldRetry = false;
          }
        }
        
        } // End of retry while loop
        
        // Go back to input fields for next iteration (only if not retrying)
        if (!shouldRetry && optionIndex < dropdownOptions.length - 1) {
            await goBackToInputFields();
            
            // Re-enter location (use specific ID to avoid confusion)
            log('   📍 Re-entering location for next iteration...');
            let locInput3;
            try {
              locInput3 = await driver.wait(
                until.elementLocated(By.id('headlessui-combobox-input-v-190')), 
                10000
              );
              log('   ✅ Found location field by specific ID');
            } catch {
              try {
                locInput3 = await driver.wait(
                  until.elementLocated(By.css('input[placeholder*="Where is your business located"], input[placeholder*="located"], input[placeholder*="Where"]')), 
                  10000
                );
                log('   ✅ Found location field by placeholder');
              } catch {
                const allInputs = await driver.findElements(By.css('input[type="text"]'));
                if (allInputs.length > 0) {
                  locInput3 = allInputs[0];
                  log('   ✅ Found location field as first input');
                } else {
                  throw new Error('Could not find location input field');
                }
              }
            }
            
            // Verify it's the location field
            const locPlaceholder = await locInput3.getAttribute('placeholder').catch(() => '');
            const locId = await locInput3.getAttribute('id').catch(() => '');
            if (!locPlaceholder.includes('located') && !locPlaceholder.includes('Where') && locId !== 'headlessui-combobox-input-v-190') {
              log(`   ⚠️  WARNING: Selected field may not be location field! ID: "${locId}", placeholder: "${locPlaceholder}"`);
            }
            
            await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', locInput3);
            await sleep(500);
            await locInput3.click();
            await sleep(1000);
            await locInput3.clear();
            await sleep(500);
            await typeLikeHuman(locInput3, location, 150);
            await sleepWithCancellation(2000);
            await locInput3.sendKeys(Key.ENTER);
            await sleep(1500);
            await locInput3.sendKeys(Key.TAB);
            await sleep(1200);
            
            // Verify location value was set correctly
            const locValueCheck = await locInput3.getAttribute('value');
            log(`   ✅ Location re-entered: "${locValueCheck}"`);
            
            // Re-enter business type (use specific ID to avoid confusion)
            log('   🏢 Re-entering business type for next iteration...');
            try {
              // Use specific ID for business type field
              currentBusInput = await driver.wait(
                until.elementLocated(By.id('headlessui-combobox-input-v-193')), 
                10000
              );
              log('   ✅ Found business type field by specific ID (headlessui-combobox-input-v-193)');
            } catch {
              try {
                // Fallback: Find by placeholder
                currentBusInput = await driver.wait(
                  until.elementLocated(By.css('input[placeholder*="What type of business"], input[placeholder*="business type"]')), 
                  10000
                );
                log('   ✅ Found business type field by placeholder');
              } catch {
                // Final fallback: Get all comboboxes and select the second one
                const allComboboxes = await driver.findElements(By.css('input[role="combobox"][aria-autocomplete="list"]'));
                if (allComboboxes.length >= 2) {
                  currentBusInput = allComboboxes[1];
                  log('   ✅ Found business type field as second combobox');
                } else {
                  currentBusInput = await driver.switchTo().activeElement();
                  log('   ✅ Using active element as business type field (fallback)');
                }
              }
            }
            
            // Verify we're on business type field, not location
            const busPlaceholderCheck = await currentBusInput.getAttribute('placeholder').catch(() => '');
            const busIdCheck = await currentBusInput.getAttribute('id').catch(() => '');
            if (busPlaceholderCheck.includes('located') || busPlaceholderCheck.includes('Where') || busIdCheck === 'headlessui-combobox-input-v-190') {
              log(`   ⚠️  WARNING: Selected field is location field! ID: "${busIdCheck}", placeholder: "${busPlaceholderCheck}"`);
              log('   🔄 Finding correct business type field...');
              try {
                currentBusInput = await driver.findElement(By.id('headlessui-combobox-input-v-193'));
                log('   ✅ Corrected to business type field by ID');
              } catch {
                const allComboboxes = await driver.findElements(By.css('input[role="combobox"]'));
                if (allComboboxes.length >= 2) {
                  currentBusInput = allComboboxes[1];
                  log('   ✅ Corrected to second combobox');
                }
              }
            }
            
            await currentBusInput.click();
            await sleep(1000);
            await currentBusInput.clear();
            await sleep(500);
            await typeLikeHuman(currentBusInput, businessType, 150);
            await sleepWithCancellation(3000);
            
            // Verify business type value was set correctly
            const busValueCheck = await currentBusInput.getAttribute('value');
            log(`   ✅ Business type re-entered: "${busValueCheck}"`);
            
            // Ensure dropdown is expanded
            try {
              const ariaExpanded = await currentBusInput.getAttribute('aria-expanded');
              if (ariaExpanded !== 'true') {
                await currentBusInput.sendKeys(Key.ARROW_DOWN);
                await sleep(1000);
              }
            } catch {}
            
            // Update dropdown options reference
            const refreshedOptions = await getAllDropdownOptions(currentBusInput);
            if (refreshedOptions.length > optionIndex + 1) {
              dropdownOptions[optionIndex + 1] = refreshedOptions[optionIndex + 1];
            }
          }
        } catch (e) {
          log(`   ❌ Error processing option ${optionIndex + 1}: ${e.message}`);
          // Continue with next option
        }
      }
      
      log(`\n🎯 Total extracted ${permits.length} permits from all dropdown options`);
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
      // Check if cancelled - if so, close immediately without waiting
      let wasCancelled = false;
      if (requestId) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
          const cancelUrl = `${baseUrl}/api/bizpal/cancel?requestId=${encodeURIComponent(requestId)}`;
          const response = await fetch(cancelUrl);
          if (response.ok) {
            const data = await response.json();
            wasCancelled = data.cancelled === true;
          }
        } catch (err) {
          // Ignore errors checking cancellation
        }
      }
      
      if (!wasCancelled) {
        // Keep browser open for 10 seconds so you can see the final results (only if not cancelled)
        log('⏸️  Keeping browser open for 10 seconds so you can see the results...');
        await sleep(10000);
      } else {
        log('🛑 Operation was cancelled, closing browser immediately...');
      }
      
      await driver.quit();
      log('🧹 Driver closed');
    }
  }
}

module.exports = { runBizPalSearch };