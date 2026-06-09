import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

(async () => {
  console.log('Starting accessibility audit...');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error('Failed to launch Playwright Chromium. Ensure browsers are installed via "npx playwright install chromium".', err);
    process.exit(1);
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  const targetPages = [
    { name: 'Home', url: 'http://localhost:3000/' },
    { name: 'Watchlist', url: 'http://localhost:3000/watchlist' }
  ];

  let totalViolations = 0;

  for (const target of targetPages) {
    console.log(`Auditing ${target.name} page at ${target.url}...`);
    try {
      await page.goto(target.url, { waitUntil: 'networkidle' });
      // Give the page a moment to render any dynamic elements
      await page.waitForTimeout(1000);
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa'])
        .analyze();
        
      const criticalOrSerious = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      
      if (criticalOrSerious.length > 0) {
        console.error(`❌ Found ${criticalOrSerious.length} critical/serious violations on ${target.name}:`);
        criticalOrSerious.forEach(violation => {
          console.error(`  - [${violation.id}] ${violation.help}`);
          console.error(`    Help URL: ${violation.helpUrl}`);
          violation.nodes.forEach(node => {
            console.error(`    Selector: ${node.target.join(', ')}`);
            console.error(`    HTML: ${node.html}`);
          });
        });
        totalViolations += criticalOrSerious.length;
      } else {
        console.log(`✅ ${target.name} page has no critical/serious violations.`);
      }
    } catch (err) {
      console.error(`Failed to audit ${target.name} page:`, err);
      totalViolations += 1;
    }
  }

  await browser.close();

  if (totalViolations > 0) {
    console.error(`Accessibility audit failed with ${totalViolations} violations.`);
    process.exit(1);
  } else {
    console.log('Accessibility audit passed successfully!');
    process.exit(0);
  }
})();
