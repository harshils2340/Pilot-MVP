import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { BizpalSelectors } from './bizpalSelectors';

interface BizpalInput {
  location: string;
  businessType: string;
  permitKeywords: string;
}

export async function scrapeBizpal(input: BizpalInput) {
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--no-sandbox');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get('https://beta.bizpal.ca');

    // 1️⃣ Location
    const location = await driver.wait(
      until.elementLocated(By.css(BizpalSelectors.LOCATION_INPUT)),
      15000
    );
    await location.sendKeys(input.location);

    // 2️⃣ Business Type
    const business = await driver.findElement(
      By.css(BizpalSelectors.BUSINESS_INPUT)
    );
    await business.sendKeys(input.businessType);

    // 3️⃣ Permit Keywords
    const permit = await driver.findElement(
      By.css(BizpalSelectors.PERMIT_INPUT)
    );
    await permit.sendKeys(input.permitKeywords);

    // Submit
    await driver.findElement(
      By.css(BizpalSelectors.SEARCH_BUTTON)
    ).click();

    // Wait for results
    await driver.wait(
      until.elementLocated(By.css(BizpalSelectors.RESULTS_CONTAINER)),
      20000
    );

    return await extractPermits(driver);
  } finally {
    await driver.quit();
  }
}

async function extractPermits(driver: any) {
  const cards = await driver.findElements(
    By.css('[data-testid="permit-card"]')
  );

  const permits = [];

  for (const card of cards) {
    const name = await card.findElement(
      By.css('[data-testid="permit-title"]')
    ).getText();

    const authority = await card.findElement(
      By.css('[data-testid="permit-authority"]')
    ).getText();

    const description = await card.findElement(
      By.css('[data-testid="permit-description"]')
    ).getText();

    permits.push({
      name,
      authority,
      description,
    });
  }

  return permits;
}
