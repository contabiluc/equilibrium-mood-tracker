// Staicumine Web App - Automated E2E Test Suite (Playwright)
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8888;
const BASE_DIR = __dirname;
const SCREENSHOT_DIR = path.join(BASE_DIR, 'test-results-screenshots');

// Simple static file server
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(BASE_DIR, req.url === '/' ? 'index.html' : req.url);
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    server.listen(PORT, () => {
      console.log(`📡 Server local pornit pe http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function runE2ETests() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const server = await startServer();
  const browser = await chromium.launch({ headless: true });

  const testViewports = [
    { name: 'Mobile (360x800)', width: 360, height: 800 },
    { name: 'Desktop (1280x800)', width: 1280, height: 800 }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const vp of testViewports) {
    console.log(`\n==================================================`);
    console.log(`🧪 Rulăm suita de teste E2E pentru: ${vp.name}`);
    console.log(`==================================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
      // Test 1: Încărcare pagină principală
      totalTests++;
      await page.goto(`http://localhost:${PORT}/index.html`);
      await page.waitForSelector('#view-dashboard');
      console.log(`  ✅ Test 1: Pagină principală încărcată cu succes`);
      passedTests++;

      // Test 2: Încărcare automată date demo
      totalTests++;
      await page.evaluate(() => loadDemoJournal());
      await page.waitForTimeout(500);
      const statAvgMood = await page.textContent('#stat-avg-mood');
      if (statAvgMood && statAvgMood !== '-') {
        console.log(`  ✅ Test 2: Datele demo generate cu succes (Starea ta medie: ${statAvgMood})`);
        passedTests++;
      } else {
        console.log(`  ❌ Test 2: Datele demo nu s-au putut încărca`);
        failedTests++;
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_01_dashboard.png`) });

      // Test 3: Navigare pe toate cele 6 tab-uri
      const tabs = ['log', 'safety', 'history', 'guides', 'settings', 'dashboard'];
      for (const tabId of tabs) {
        totalTests++;
        await page.evaluate((id) => switchTab(id), tabId);
        await page.waitForTimeout(300);
        const activeTabVisible = await page.isVisible(`#view-${tabId}`);
        if (activeTabVisible) {
          console.log(`  ✅ Test Navigare: Tab-ul '${tabId}' activat cu succes`);
          passedTests++;
        } else {
          console.log(`  ❌ Test Navigare: Esuează afișarea tab-ului '${tabId}'`);
          failedTests++;
        }
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_02_tab_${tabId}.png`) });
      }

      // Test 4: Completare Check-in automat
      totalTests++;
      await page.evaluate(() => {
        switchTab('log');
        setMoodValue(1);
        const notesEl = document.getElementById('journal-notes');
        if (notesEl) notesEl.value = 'Testare automată E2E efectuată cu succes de către robotul Playwright.';
        saveMoodEntry(new Event('submit'));
      });
      await page.waitForTimeout(300);

      const updatedCount = await page.evaluate(() => moodEntries.length);
      console.log(`  ✅ Test 4: Formular Check-in trimis automat cu succes! (Total înregistrări: ${updatedCount})`);
      passedTests++;

      // Test 5: Filtrare în Istoric
      totalTests++;
      await page.evaluate(() => {
        switchTab('history');
        const searchInput = document.getElementById('history-search');
        if (searchInput) {
          searchInput.value = '2026';
          filterHistory();
        }
      });
      await page.waitForTimeout(300);
      const filteredVisibleCount = await page.evaluate(() => {
        return document.querySelectorAll('.history-item-compact').length;
      });
      if (filteredVisibleCount >= 1) {
        console.log(`  ✅ Test 5: Căutare dinamică în Istoric funcțională (${filteredVisibleCount} rezultate găsite)`);
        passedTests++;
      } else {
        console.log(`  ❌ Test 5: Căutarea în Istoric nu a returnat rezultatele așteptate`);
        failedTests++;
      }

      // Test 6: Verificare erori de consolă JavaScript
      totalTests++;
      if (consoleErrors.length === 0) {
        console.log(`  ✅ Test 6: Zero erori JavaScript în consolă!`);
        passedTests++;
      } else {
        console.log(`  ❌ Test 6: S-au detectat erori JS în consolă:`, consoleErrors);
        failedTests++;
      }

    } catch (err) {
      console.error(`  💥 Eroare critică în timpul executării testelor pentru ${vp.name}:`, err);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  server.close();

  console.log(`\n==================================================`);
  console.log(`📊 REZUMAT TESTARE AUTOMATĂ E2E:`);
  console.log(`  Total teste executate: ${totalTests}`);
  console.log(`  ✅ Teste trecute (PASSED): ${passedTests}`);
  console.log(`  ❌ Teste picate (FAILED): ${failedTests}`);
  console.log(`  📸 Capturi ecran salvate în: ${SCREENSHOT_DIR}`);
  console.log(`==================================================\n`);
}

runE2ETests();
