import { Builder, By, until, WebDriver, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { BizpalSelectors } from './bizpalSelectors';

export interface BizpalInput {
  location: string;
  businessType: string;
  permitKeywords: string;
}

export interface BizpalPermit {
  name: string;
  description: string;
  jurisdiction: string; // Provincial, Federal, Municipal
  activities: string[];
  relevance: 'High' | 'Medium' | 'Low';
  sourceUrl?: string;
  // Extended metadata
  contactInfo?: {
    municipality?: string;
    department?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      fullAddress?: string;
    };
  };
  lastVerified?: string;
  moreInfoUrl?: string;
}

// Helper to ensure logs flush immediately
const log = (...args: any[]) => {
  console.log(...args);
  // Force flush in Node.js
  if (typeof process !== 'undefined' && process.stdout) {
    process.stdout.write('');
  }
};

export async function scrapeBizpal(input: BizpalInput): Promise<BizpalPermit[]> {
  log('🚀 Starting BizPaL scraper...');
  log('📋 Input parameters:', JSON.stringify(input, null, 2));

  const options = new chrome.Options();
  
  // Check if we're in development mode - show browser if so
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  if (isDevelopment) {
    log('👁️  Development mode: Opening visible browser window...');
    options.addArguments('--window-size=1920,1080');
    // Don't add headless in dev mode so you can see it
  } else {
    log('🤖 Production mode: Running headless...');
    options.addArguments(
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080'
    );
  }

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    log('🌐 Navigating to BizPaL website...');
    await driver.get('https://beta.bizpal-perle.ca/en');
    log('✅ Page loaded successfully');

    // Wait for page to fully load
    log('\n⏳ Waiting for page to fully load...');
    await driver.sleep(3000);

    // 1️⃣ Location Input - FIRST FIELD (must be filled FIRST)
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('📍 STEP 1 of 3: FILLING LOCATION FIELD');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`   Value to enter: "${input.location}"`);
    
    const locationInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="located"]')),
      15000
    );
    log('   ✓ Found location input field');
    
    // Click on the field first to ensure it's focused
    await driver.executeScript('arguments[0].scrollIntoView(true);', locationInput);
    await driver.executeScript('arguments[0].click();', locationInput);
    await driver.sleep(500);
    log('   ✓ Clicked on location field');
    
    await locationInput.clear();
    await driver.sleep(200);
    log('   ✓ Cleared field');
    
    // Type character by character with delay to trigger autocomplete
    log(`   ⌨️  Typing character by character: "${input.location}"`);
    for (const char of input.location) {
      await locationInput.sendKeys(char);
      await driver.sleep(150); // Small delay between each character
    }
    log(`   ✓ Finished typing: "${input.location}"`);
    
    // Wait for autocomplete dropdown to appear
    log('   ⏳ Waiting for autocomplete dropdown to appear...');
    await driver.sleep(2000); // Wait for dropdown to appear
    
    // Press Enter to select first option from dropdown
    log('   ⌨️  Pressing Enter to select first option...');
    await locationInput.sendKeys(Key.RETURN);
    await driver.sleep(2000); // Wait for selection to be applied
    
    // Verify location field value is set
    const locationValue = await locationInput.getAttribute('value');
    log(`   ✓ Location field final value: "${locationValue}"`);
    log('   ✅ Location field COMPLETED!');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 2️⃣ Business Type Input - SECOND FIELD (must be filled SECOND)
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('🏢 STEP 2 of 3: FILLING BUSINESS TYPE FIELD');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`   Value to enter: "${input.businessType}"`);
    
    // Press Tab to move to the next field (business type)
    log('   ⌨️  Pressing TAB to navigate to business type field...');
    await locationInput.sendKeys(Key.TAB);
    await driver.sleep(1500); // Wait for focus to switch
    
    // Get the currently focused element (should be business type field now)
    const businessInput = await driver.switchTo().activeElement();
    log('   ✓ Tab pressed - focus moved to next field');
    await driver.sleep(500);
    
    // Verify we're on the correct field by checking placeholder
    const currentPlaceholder = await businessInput.getAttribute('placeholder');
    log(`   ✓ Current field placeholder: "${currentPlaceholder}"`);
    if (!currentPlaceholder?.toLowerCase().includes('business')) {
      log('   ⚠️  Warning: May not be on business type field, but continuing...');
    }
    
    await businessInput.clear();
    await driver.sleep(300);
    log('   ✓ Cleared field');
    
    // Type character by character with delay to trigger autocomplete
    log(`   ⌨️  Typing character by character: "${input.businessType}"`);
    for (const char of input.businessType) {
      await businessInput.sendKeys(char);
      await driver.sleep(150); // Small delay between each character
    }
    log(`   ✓ Finished typing: "${input.businessType}"`);
    
    // Wait for autocomplete dropdown to appear
    log('   ⏳ Waiting for autocomplete dropdown to appear...');
    await driver.sleep(2000); // Wait for dropdown to appear
    
    // Press Enter to select first option from dropdown
    log('   ⌨️  Pressing Enter to select first option...');
    await businessInput.sendKeys(Key.RETURN);
    await driver.sleep(2000); // Wait for selection to be applied
    
    // Verify business type field value is set
    const businessValue = await businessInput.getAttribute('value');
    log(`   ✓ Business type field final value: "${businessValue}"`);
    log('   ✅ Business type field COMPLETED!');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 3️⃣ Permit Keywords Input - THIRD FIELD (must be filled LAST) - Always use "everything"
    const permitKeywords = 'everything';
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('🔍 STEP 3 of 3: FILLING PERMIT KEYWORDS FIELD');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`   Value to enter: "${permitKeywords}" (hardcoded)`);
    
    // Press Tab to move to the next field (permit keywords)
    log('   ⌨️  Pressing TAB to navigate to permit keywords field...');
    await businessInput.sendKeys(Key.TAB);
    await driver.sleep(1500); // Wait for focus to switch
    
    // Get the currently focused element (should be permit keywords field now)
    const permitInput = await driver.switchTo().activeElement();
    log('   ✓ Tab pressed - focus moved to next field');
    await driver.sleep(500);
    
    // Verify we're on the correct field by checking placeholder
    const permitPlaceholder = await permitInput.getAttribute('placeholder');
    log(`   ✓ Current field placeholder: "${permitPlaceholder}"`);
    if (!permitPlaceholder?.toLowerCase().includes('permit')) {
      log('   ⚠️  Warning: May not be on permit keywords field, but continuing...');
    }
    
    await permitInput.clear();
    await driver.sleep(300);
    log('   ✓ Cleared field');
    
    // PASTE "everything" directly (not type character by character)
    log(`   📋 Pasting: "${permitKeywords}"`);
    await driver.executeScript(`
      const input = arguments[0];
      input.focus();
      input.value = '${permitKeywords}';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    `, permitInput);
    await driver.sleep(1000);
    log(`   ✓ Pasted: "${permitKeywords}"`);
    log('   ✅ Permit keywords field COMPLETED!');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 4️⃣ Click "Find Permits and Licences" button
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('🔘 STEP 4: CLICKING "FIND PERMITS AND LICENCES" BUTTON');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Wait a moment before clicking button
    await driver.sleep(1000);
    
    let searchButton;
    try {
      // Try finding button by text content first (most reliable)
      log('   🔍 Looking for button with text "Find Permits and Licences"...');
      searchButton = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Find Permits') or contains(text(), 'Find')]")),
        10000
      );
      log('   ✅ Found button using XPath text search');
    } catch (e) {
      try {
        // Try CSS selector for submit button
        log('   🔍 Trying submit button selector...');
        searchButton = await driver.wait(
          until.elementLocated(By.css('button[type="submit"]')),
          5000
        );
        log('   ✅ Found button using CSS submit selector');
      } catch (e2) {
        try {
          // Try finding by button containing "Find" text
          log('   🔍 Trying button with "Find" text...');
          const buttons = await driver.findElements(By.css('button'));
          for (const btn of buttons) {
            const text = await btn.getText();
            if (text.includes('Find') || text.includes('Permits')) {
              searchButton = btn;
              log(`   ✅ Found button with text: "${text}"`);
              break;
            }
          }
          if (!searchButton) throw new Error('Button not found');
        } catch (e3) {
          // Last resort: find any button with green/primary styling
          log('   🔍 Trying fallback selectors...');
          searchButton = await driver.findElement(By.css('button[class*="green"], button[class*="primary"], button[class*="teal"]'));
          log('   ✅ Found button using fallback selector');
        }
      }
    }
    
    // Scroll button into view and click
    log('   📍 Scrolling button into view...');
    await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', searchButton);
    await driver.sleep(500);
    
    log('   🖱️  Clicking button...');
    await driver.executeScript('arguments[0].click();', searchButton);
    await driver.sleep(500);
    log('   ✅ Button clicked!');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    log('⏳ Waiting for results page to load...');

    // Wait for results page to load (AG Grid structure)
    log('⏳ Waiting for results page to load...');
    await driver.wait(
      until.elementLocated(By.css('[role="rowgroup"], .ag-center-cols-container, [role="row"][row-index]')),
      30000
    );
    log('✅ Results page loaded (AG Grid detected)');

    // Give it a moment for dynamic content to load
    log('⏳ Waiting for dynamic content to render...');
    await driver.sleep(3000);

    log('📊 Extracting permits from results...');
    const permits = await extractPermits(driver);
    log(`✅ Successfully extracted ${permits.length} permits`);
    
    return permits;
  } catch (error) {
    log('❌ BizPaL scraping error:', error);
    throw error;
  } finally {
    log('🔒 Closing browser...');
    await driver.quit();
    log('✅ Browser closed');
  }
}

async function extractPermits(driver: WebDriver): Promise<BizpalPermit[]> {
  const permits: BizpalPermit[] = [];

  try {
    // Wait for the AG Grid results table to load
    log('🔍 Waiting for AG Grid permit results table to load...');
    await driver.wait(
      until.elementLocated(By.css('[role="rowgroup"], .ag-center-cols-container, [role="row"][row-index]')),
      30000
    );
    await driver.sleep(3000); // Give it time to fully render
    
    // Find all permit rows using AG Grid structure - exclude header rows
    log('🔍 Searching for permit rows in AG Grid...');
    const permitRows = await driver.findElements(
      By.css('[role="row"][row-index]:not([aria-rowindex="1"]), .ag-row:not(.ag-header-row)')
    );

    log(`📋 Found ${permitRows.length} permit rows to process`);

    // Process ALL permit rows (no limit)
    for (let i = 0; i < permitRows.length; i++) {
      try {
        log(`\n📄 Processing permit ${i + 1}/${permitRows.length}...`);
        const row = permitRows[i];
        
        // Scroll into view smoothly
        await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', row);
        await driver.sleep(300);

        // Try to expand the row to get full details (click on the expand icon or row itself)
        log('     🔍 Attempting to expand row for full details...');
        try {
          // Check if row is already expanded
          const isExpanded = await row.getAttribute('aria-expanded');
          if (isExpanded !== 'true') {
            // Try to find and click expand icon (usually a chevron)
            try {
              const expandIcon = await row.findElement(By.css('.ag-row-group-indent-0, [class*="chevron"], [class*="arrow"]'));
              await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', expandIcon);
              await driver.sleep(200);
              await driver.executeScript('arguments[0].click();', expandIcon);
              log('     ✓ Clicked expand icon');
            } catch (e) {
              // Try clicking on the row itself
              try {
                await driver.executeScript('arguments[0].click();', row);
                log('     ✓ Clicked on row to expand');
              } catch (e2) {
                log('     ⚠️  Could not expand row, will try to extract from collapsed view');
              }
            }
            await driver.sleep(1000); // Wait for expansion animation
          } else {
            log('     ✓ Row is already expanded');
          }
        } catch (e) {
          log('     ⚠️  Could not determine expansion state, continuing...');
        }

        // Extract permit name and description from title column (col-id="title")
        let name = '';
        let description = '';
        try {
          // Find the title cell (first gridcell with col-id="title")
          const titleCell = await row.findElement(By.css('[role="gridcell"][col-id="title"], [col-id="title"]'));
          
          // Get all text from the title cell
          const titleText = await titleCell.getText();
          const titleLines = titleText.split('\n').filter(line => line.trim());
          
          // First line is usually the permit name (could be in a link)
          if (titleLines.length > 0) {
            name = titleLines[0]?.trim() || '';
            
            // Try to get name from link if available (link text is usually more reliable)
            try {
              const linkElement = await titleCell.findElement(By.css('a'));
              const linkText = await linkElement.getText();
              if (linkText.trim()) {
                name = linkText.trim();
              }
            } catch (e2) {
              // No link, use first line
            }
            
            // Rest of the lines are the description
            if (titleLines.length > 1) {
              description = titleLines.slice(1).join(' ').trim();
            }
          }
          
          log(`     ✓ Name: "${name}"`);
          if (description) {
            log(`     ✓ Description: "${description.substring(0, 60)}${description.length > 60 ? '...' : ''}"`);
          }
        } catch (e) {
          log(`     ⚠️  Could not extract title: ${e}`);
          // Fallback: get first line from row
          const rowText = await row.getText();
          name = rowText.split('\n')[0]?.trim() || 'Unknown Permit';
        }
        
        if (!name || name === 'Unknown Permit') {
          log(`     ⚠️  Skipping row ${i + 1}: No permit name found`);
          continue;
        }

        // Extract jurisdiction from jurisdiction column
        let jurisdiction = 'Provincial';
        try {
          const jurisdictionCell = await row.findElement(
            By.css('[role="gridcell"][col-id*="jurisdiction"], [col-id*="jurisdiction"]')
          );
          jurisdiction = (await jurisdictionCell.getText()).trim();
          log(`     ✓ Jurisdiction: "${jurisdiction}"`);
        } catch (e) {
          // Try by position (usually 2nd column)
          try {
            const cells = await row.findElements(By.css('[role="gridcell"]'));
            if (cells.length >= 2) {
              jurisdiction = (await cells[1].getText()).trim() || 'Provincial';
              log(`     ✓ Jurisdiction (by position): "${jurisdiction}"`);
            }
          } catch (e2) {
            log(`     ⚠️  Could not extract jurisdiction, using default: Provincial`);
          }
        }

        // Extract activities from activities column
        let activities: string[] = [];
        try {
          const activitiesCell = await row.findElement(
            By.css('[role="gridcell"][col-id*="activit"], [col-id*="activit"], [role="gridcell"]:nth-child(3)')
          );
          const activitiesText = (await activitiesCell.getText()).trim();
          if (activitiesText) {
            activities = activitiesText.split(',').map(a => a.trim()).filter(a => a);
            log(`     ✓ Activities: ${activities.slice(0, 3).join(', ')}${activities.length > 3 ? '...' : ''}`);
          }
        } catch (e) {
          // Try by position (usually 3rd column)
          try {
            const cells = await row.findElements(By.css('[role="gridcell"]'));
            if (cells.length >= 3) {
              const activitiesText = (await cells[2].getText()).trim();
              activities = activitiesText.split(',').map(a => a.trim()).filter(a => a);
              log(`     ✓ Activities (by position): ${activities.slice(0, 3).join(', ')}${activities.length > 3 ? '...' : ''}`);
            }
          } catch (e2) {
            log(`     ⚠️  Could not extract activities`);
          }
        }

        // Extract relevance from relevance column
        let relevance: 'High' | 'Medium' | 'Low' = 'Medium';
        try {
          const relevanceCell = await row.findElement(
            By.css('[role="gridcell"][col-id*="relevance"], [col-id*="relevance"], [role="gridcell"]:nth-child(4)')
          );
          const relevanceText = (await relevanceCell.getText()).trim().toLowerCase();
          if (relevanceText.includes('high')) {
            relevance = 'High';
          } else if (relevanceText.includes('low')) {
            relevance = 'Low';
          }
          log(`     ✓ Relevance: "${relevance}"`);
        } catch (e) {
          // Try by position (usually 4th column)
          try {
            const cells = await row.findElements(By.css('[role="gridcell"]'));
            if (cells.length >= 4) {
              const relevanceText = (await cells[3].getText()).trim().toLowerCase();
              if (relevanceText.includes('high')) relevance = 'High';
              else if (relevanceText.includes('low')) relevance = 'Low';
              log(`     ✓ Relevance (by position): "${relevance}"`);
            }
          } catch (e2) {
            log(`     ⚠️  Could not extract relevance, using default: Medium`);
          }
        }

        // Get source URL - try to find a link in the title cell
        let sourceUrl = 'https://beta.bizpal-perle.ca/en';
        try {
          const titleCell = await row.findElement(By.css('[role="gridcell"][col-id="title"]'));
          const linkElement = await titleCell.findElement(By.css('a[href]'));
          sourceUrl = await linkElement.getAttribute('href') || sourceUrl;
          // Make sure URL is absolute
          if (sourceUrl && !sourceUrl.startsWith('http')) {
            sourceUrl = 'https://beta.bizpal-perle.ca' + sourceUrl;
          }
          log(`     ✓ Source URL: "${sourceUrl}"`);
        } catch (e) {
          // No link found, use default
        }

        // Extract extended metadata from expanded detail view
        log('     🔍 Extracting extended metadata...');
        let contactInfo: BizpalPermit['contactInfo'] = {};
        let lastVerified: string | undefined;
        let moreInfoUrl: string | undefined;

        try {
          // Look for the permit detail section (usually has class "permit-detail")
          const permitDetail = await row.findElement(By.css('.permit-detail, [class*="permit-detail"]'));
          
          // Extract contact information section
          try {
            const contactSection = await permitDetail.findElement(By.xpath('.//h3[contains(text(), "Contact Information")] | .//h3[contains(text(), "Contact")]'));
            log('     ✓ Found Contact Information section');
            
            // Get all text from contact section
            const contactText = await contactSection.getText();
            log(`     📋 Contact section text: "${contactText.substring(0, 100)}..."`);
            
            // Find municipality link
            try {
              const municipalityLink = await contactSection.findElement(By.xpath('./following-sibling::div//a[1] | ./following::a[1]'));
              contactInfo.municipality = (await municipalityLink.getText()).trim();
              log(`     ✓ Municipality: "${contactInfo.municipality}"`);
            } catch (e) {
              log('     ⚠️  Municipality not found');
            }
            
            // Find department name (usually after municipality link)
            try {
              const contactDiv = await contactSection.findElement(By.xpath('./following-sibling::div | ./parent::div/following-sibling::div[1]'));
              const contactDivText = await contactDiv.getText();
              const lines = contactDivText.split('\n').filter(l => l.trim());
              
              // Department is usually on its own line
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.includes('@') && !trimmed.includes('Tel:') && !trimmed.includes('http') && !trimmed.match(/^[A-Z0-9]{3}\s?[A-Z0-9]{3}$/)) {
                  if (contactInfo.department) {
                    contactInfo.department += ' ' + trimmed;
                  } else {
                    contactInfo.department = trimmed;
                  }
                }
              }
              if (contactInfo.department) {
                log(`     ✓ Department: "${contactInfo.department}"`);
              }
            } catch (e) {
              log('     ⚠️  Department not found');
            }
            
            // Find email
            try {
              const emailLink = await permitDetail.findElement(By.css('a[href^="mailto:"], a[href*="@"]'));
              const emailHref = await emailLink.getAttribute('href');
              if (emailHref) {
                contactInfo.email = emailHref.replace('mailto:', '').trim();
                log(`     ✓ Email: "${contactInfo.email}"`);
              }
            } catch (e) {
              log('     ⚠️  Email not found');
            }
            
            // Find phone number
            try {
              const phoneElement = await permitDetail.findElement(By.xpath('.//text()[contains(., "Tel:")] | .//span[contains(text(), "Tel:")]'));
              const phoneText = (await driver.executeScript('return arguments[0].textContent || arguments[0].innerText;', phoneElement)) as string;
              const phoneMatch = phoneText.match(/Tel:\s*([\d\s\-\(\)]+)/i);
              if (phoneMatch) {
                contactInfo.phone = phoneMatch[1].trim();
                log(`     ✓ Phone: "${contactInfo.phone}"`);
              }
            } catch (e) {
              // Try alternative method
              try {
                const contactDivText = await permitDetail.getText();
                const phoneMatch = contactDivText.match(/Tel:\s*([\d\s\-\(\)]+)/i);
                if (phoneMatch) {
                  contactInfo.phone = phoneMatch[1].trim();
                  log(`     ✓ Phone (alternative): "${contactInfo.phone}"`);
                }
              } catch (e2) {
                log('     ⚠️  Phone not found');
              }
            }
            
            // Extract address information
            try {
              const contactDiv = await contactSection.findElement(By.xpath('./following-sibling::div'));
              const addressText = await contactDiv.getText();
              const addressLines = addressText.split('\n').map(l => l.trim()).filter(l => l);
              
              // Try to parse address components
              for (const line of addressLines) {
                // Street address (contains numbers and street indicators)
                if (line.match(/\d+.*(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Way|Ln|Lane)/i)) {
                  contactInfo.address = contactInfo.address || {};
                  contactInfo.address.street = line;
                  log(`     ✓ Street: "${line}"`);
                }
                // City, Province, Postal Code pattern (e.g., "Toronto, ON M5H 2N2")
                else if (line.match(/^([A-Za-z\s]+),\s*([A-Z]{2})\s+([A-Z0-9]{3}\s?[A-Z0-9]{3})$/)) {
                  const match = line.match(/^([A-Za-z\s]+),\s*([A-Z]{2})\s+([A-Z0-9]{3}\s?[A-Z0-9]{3})$/);
                  if (match) {
                    contactInfo.address = contactInfo.address || {};
                    contactInfo.address.city = match[1].trim();
                    contactInfo.address.province = match[2].trim();
                    contactInfo.address.postalCode = match[3].trim();
                    log(`     ✓ City: "${contactInfo.address.city}"`);
                    log(`     ✓ Province: "${contactInfo.address.province}"`);
                    log(`     ✓ Postal Code: "${contactInfo.address.postalCode}"`);
                  }
                }
                // Just city and province (e.g., "Toronto, ON")
                else if (line.match(/^([A-Za-z\s]+),\s*([A-Z]{2})$/)) {
                  const match = line.match(/^([A-Za-z\s]+),\s*([A-Z]{2})$/);
                  if (match && !contactInfo.address?.city) {
                    contactInfo.address = contactInfo.address || {};
                    contactInfo.address.city = match[1].trim();
                    contactInfo.address.province = match[2].trim();
                    log(`     ✓ City/Province: "${contactInfo.address.city}, ${contactInfo.address.province}"`);
                  }
                }
              }
              
              // Store full address if we have components
              if (contactInfo.address) {
                const addrParts = [
                  contactInfo.address.street,
                  contactInfo.address.city,
                  contactInfo.address.province,
                  contactInfo.address.postalCode
                ].filter(Boolean);
                contactInfo.address.fullAddress = addrParts.join(', ');
                log(`     ✓ Full Address: "${contactInfo.address.fullAddress}"`);
              }
            } catch (e) {
              log('     ⚠️  Address extraction failed');
            }
          } catch (e) {
            log('     ⚠️  Contact Information section not found');
          }
          
          // Extract "Last verified" date
          try {
            const lastVerifiedElement = await permitDetail.findElement(By.xpath('.//text()[contains(., "Last verified")] | .//span[contains(text(), "Last verified")]'));
            const lastVerifiedText = (await driver.executeScript('return arguments[0].textContent || arguments[0].innerText;', lastVerifiedElement)) as string;
            const dateMatch = lastVerifiedText.match(/Last verified:\s*([\d\-]+)/i);
            if (dateMatch) {
              lastVerified = dateMatch[1].trim();
              log(`     ✓ Last Verified: "${lastVerified}"`);
            }
          } catch (e) {
            // Try alternative
            try {
              const detailText = await permitDetail.getText();
              const dateMatch = detailText.match(/Last verified:\s*([\d\-]+)/i);
              if (dateMatch) {
                lastVerified = dateMatch[1].trim();
                log(`     ✓ Last Verified (alternative): "${lastVerified}"`);
              }
            } catch (e2) {
              log('     ⚠️  Last verified date not found');
            }
          }
          
          // Extract "More Information" button URL
          try {
            const moreInfoButton = await permitDetail.findElement(By.xpath('.//button[contains(text(), "More Information")] | .//a[contains(text(), "More Information")]'));
            moreInfoUrl = await moreInfoButton.getAttribute('href') || undefined;
            if (moreInfoUrl && !moreInfoUrl.startsWith('http')) {
              moreInfoUrl = 'https://beta.bizpal-perle.ca' + moreInfoUrl;
            }
            log(`     ✓ More Info URL: "${moreInfoUrl}"`);
          } catch (e) {
            log('     ⚠️  More Information URL not found');
          }
          
        } catch (e) {
          log(`     ⚠️  Extended metadata extraction failed: ${e}`);
        }

        if (name && name.length > 0) {
          const permit: BizpalPermit = {
            name: name.trim(),
            description: description.trim() || name.trim(),
            jurisdiction: jurisdiction.trim(),
            activities: activities.length > 0 ? activities : [jurisdiction],
            relevance,
            sourceUrl,
          };
          
          // Add extended metadata if available
          if (Object.keys(contactInfo).length > 0 || lastVerified || moreInfoUrl) {
            permit.contactInfo = Object.keys(contactInfo).length > 0 ? contactInfo : undefined;
            permit.lastVerified = lastVerified;
            permit.moreInfoUrl = moreInfoUrl;
            
            log(`     📊 Extended Metadata Summary:`);
            if (contactInfo.municipality) log(`        - Municipality: ${contactInfo.municipality}`);
            if (contactInfo.department) log(`        - Department: ${contactInfo.department}`);
            if (contactInfo.email) log(`        - Email: ${contactInfo.email}`);
            if (contactInfo.phone) log(`        - Phone: ${contactInfo.phone}`);
            if (contactInfo.address?.fullAddress) log(`        - Address: ${contactInfo.address.fullAddress}`);
            if (lastVerified) log(`        - Last Verified: ${lastVerified}`);
            if (moreInfoUrl) log(`        - More Info URL: ${moreInfoUrl}`);
          }
          
          permits.push(permit);
          log(`  ✅ COMPLETE: ${permit.name}`);
          log(`     - Jurisdiction: ${permit.jurisdiction}`);
          log(`     - Relevance: ${permit.relevance}`);
          log(`     - Activities: ${permit.activities.slice(0, 2).join(', ')}${permit.activities.length > 2 ? '...' : ''}`);
          log(`     - Metadata: ${Object.keys(contactInfo).length > 0 || lastVerified || moreInfoUrl ? 'Yes' : 'No'}`);
        } else {
          log(`  ⚠️  Skipped row ${i + 1}: No permit name found`);
        }
      } catch (error) {
        log(`  ❌ Error extracting permit ${i + 1}:`, error);
        continue;
      }
    }

    log(`\n🎉 Extraction complete! Total permits extracted: ${permits.length}`);
    return permits;
  } catch (error) {
    log('❌ Error in extractPermits:', error);
  return permits;
  }
}
