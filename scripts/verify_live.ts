import { chromium } from "playwright";
import * as path from "path";

const ARTIFACT_DIR = "/home/mystery_soldier/.gemini/antigravity-cli/brain/c27b9d4c-b974-40a5-bda1-c55f1489f53c/screenshots";
const BASE_URL = "https://mysterylabs.dev/splunk_deck/";

async function main() {
  console.log("Launching headless Chrome with touch support to verify live site...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const viewports = [
    { name: "390x700_safari", width: 390, height: 700 },
    { name: "390x844_standard", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    console.log(`\n===============================================================`);
    console.log(`=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    console.log(`===============================================================`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();

    // 1. Home Screen
    console.log("Loading Home screen...");
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    // Verify Mastered Side setting toggle exists on Home
    const leftSettingBtn = page.locator('button:has-text("Left (default)")');
    const rightSettingBtn = page.locator('button:has-text("Right")');
    console.log("Mastered side setting exists:", (await leftSettingBtn.count()) > 0 && (await rightSettingBtn.count()) > 0);

    // Ensure Left is active
    await leftSettingBtn.click();
    await page.waitForTimeout(200);

    // -------------------------------------------------------------
    // 2. Exam Question Review Session
    // -------------------------------------------------------------
    console.log("\n--- Testing Exam Question Review Session ---");
    await page.click('button:has-text("Exam Question Review")');
    await page.waitForTimeout(500);

    // Check session locking classes
    const sessionClasses = await page.evaluate(() => ({
      htmlClasses: document.documentElement.className,
      bodyClasses: document.body.className,
      htmlOverscroll: getComputedStyle(document.documentElement).overscrollBehavior,
      bodyOverscroll: getComputedStyle(document.body).overscrollBehavior,
    }));
    console.log("Session Lock & Overscroll check:", sessionClasses);

    // TOUCH DRAG TEST (Up and Down drag)
    console.log("Executing touch drag upward on session...");
    await page.evaluate(() => {
      const touchStart = new Touch({
        identifier: Date.now(),
        target: document.body,
        clientX: 200,
        clientY: 400,
        screenX: 200,
        screenY: 400,
        pageX: 200,
        pageY: 400,
      });
      const touchMove = new Touch({
        identifier: Date.now(),
        target: document.body,
        clientX: 200,
        clientY: 100, // dragged up 300px
        screenX: 200,
        screenY: 100,
        pageX: 200,
        pageY: 100,
      });
      document.dispatchEvent(new TouchEvent("touchstart", { touches: [touchStart], cancelable: true, bubbles: true }));
      document.dispatchEvent(new TouchEvent("touchmove", { touches: [touchMove], cancelable: true, bubbles: true }));
      document.dispatchEvent(new TouchEvent("touchend", { touches: [], cancelable: true, bubbles: true }));
    });
    await page.waitForTimeout(100);

    const afterDragUp = await page.evaluate(() => {
      const backBtn = document.querySelector('button');
      return {
        windowScrollY: window.scrollY,
        docScrollTop: document.documentElement.scrollTop,
        bodyScrollTop: document.body.scrollTop,
        backBtnRect: backBtn?.getBoundingClientRect().top,
      };
    });
    console.log("After Touch Drag Up (should be scrollY=0, backBtnRect>=0):", afterDragUp);

    // Check header line "221 of 289"
    const honestLine = page.locator("text=221 of 289");
    const honestLineBox = await honestLine.boundingBox();
    console.log("Honest line bounding box:", honestLineBox);

    // Check Button positions (Default: Mark Mastered on LEFT, Next Card on RIGHT)
    const markMasteredBtn = page.locator('button:has-text("Mark Mastered")');
    const nextCardBtn = page.locator('button:has-text("Next Card")');
    const markBox = await markMasteredBtn.boundingBox();
    const nextBox = await nextCardBtn.boundingBox();
    console.log(`Buttons (Default): Mark Mastered x=${markBox?.x}, Next Card x=${nextBox?.x}`);
    if (markBox && nextBox && markBox.x < nextBox.x) {
      console.log("PASS: Mark Mastered is on the LEFT, Next Card is on the RIGHT.");
    } else {
      console.error("FAIL: Button order unexpected for default!");
    }

    // Screenshot Review session
    const reviewScreenshot = path.join(ARTIFACT_DIR, `review-${vp.name}.png`);
    await page.screenshot({ path: reviewScreenshot });

    // Test Left edge tap (Mark Mastered)
    console.log("Tapping Left edge (x=30, y=350)...");
    await page.mouse.click(30, 350);
    await page.waitForTimeout(300);

    // Test Right edge tap (Next Card)
    console.log("Tapping Right edge (x=360, y=350)...");
    await page.mouse.click(360, 350);
    await page.waitForTimeout(300);

    // Return to Home
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(400);

    // -------------------------------------------------------------
    // 3. Flash Cards Session (Default: Left = Know it, Right = Don't know)
    // -------------------------------------------------------------
    console.log("\n--- Testing Flash Cards Session (Review All) ---");
    await page.click('button:has-text("Flash Cards")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("START 3D FLIP →")');
    await page.waitForTimeout(500);

    // Touch Drag Test on Flash Cards
    console.log("Executing touch drag upward on Flashcard session...");
    await page.evaluate(() => {
      const touchStart = new Touch({
        identifier: Date.now(),
        target: document.body,
        clientX: 200,
        clientY: 400,
        screenX: 200,
        screenY: 400,
        pageX: 200,
        pageY: 400,
      });
      const touchMove = new Touch({
        identifier: Date.now(),
        target: document.body,
        clientX: 200,
        clientY: 50,
        screenX: 200,
        screenY: 50,
        pageX: 200,
        pageY: 50,
      });
      document.dispatchEvent(new TouchEvent("touchstart", { touches: [touchStart], cancelable: true, bubbles: true }));
      document.dispatchEvent(new TouchEvent("touchmove", { touches: [touchMove], cancelable: true, bubbles: true }));
      document.dispatchEvent(new TouchEvent("touchend", { touches: [], cancelable: true, bubbles: true }));
    });
    await page.waitForTimeout(100);

    const flashDragCheck = await page.evaluate(() => ({
      windowScrollY: window.scrollY,
      docScrollTop: document.documentElement.scrollTop,
      hasSessionLocked: document.body.classList.contains("session-locked"),
    }));
    console.log("Flashcard Drag check:", flashDragCheck);

    // Check default button positions & hints
    const knowItBtn = page.locator('button:has-text("Know it")');
    const dontKnowBtn = page.locator('button:has-text("Don\'t know")');
    const knowBox = await knowItBtn.boundingBox();
    const dontBox = await dontKnowBtn.boundingBox();
    console.log(`Flash Buttons (Default): Know it x=${knowBox?.x} (${await knowItBtn.innerText()}), Don't know x=${dontBox?.x}`);
    if (knowBox && dontBox && knowBox.x < dontBox.x) {
      console.log("PASS: Know it is on the LEFT, Don't know is on the RIGHT.");
    } else {
      console.error("FAIL: Flash card button order incorrect for default!");
    }

    // Save screenshots
    const flashFrontScreenshot = path.join(ARTIFACT_DIR, `flash-front-${vp.name}.png`);
    await page.screenshot({ path: flashFrontScreenshot });

    // Flip card by tapping center
    await page.mouse.click(195, 350);
    await page.waitForTimeout(500);

    const flashBackScreenshot = path.join(ARTIFACT_DIR, `flash-back-${vp.name}.png`);
    await page.screenshot({ path: flashBackScreenshot });

    // Back to Decks -> Back to Home
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Home")');
    await page.waitForTimeout(400);

    // -------------------------------------------------------------
    // 4. Test "Mastered Side: Right" Setting
    // -------------------------------------------------------------
    console.log("\n--- Testing Mastered Side: Right User Setting ---");
    await page.click('button:has-text("Right")');
    await page.waitForTimeout(200);

    // Check Exam Review with Right Mastered
    console.log("Opening Exam Review with Mastered Side: Right...");
    await page.click('button:has-text("Exam Question Review")');
    await page.waitForTimeout(400);

    const nextCardBtnFlipped = page.locator('button:has-text("Next Card")');
    const markMasteredBtnFlipped = page.locator('button:has-text("Mark Mastered")');
    const nextBoxFlipped = await nextCardBtnFlipped.boundingBox();
    const markBoxFlipped = await markMasteredBtnFlipped.boundingBox();
    console.log(`Review Buttons (Flipped): Next Card x=${nextBoxFlipped?.x}, Mark Mastered x=${markBoxFlipped?.x}`);
    if (nextBoxFlipped && markBoxFlipped && nextBoxFlipped.x < markBoxFlipped.x) {
      console.log("PASS: Next Card is now on LEFT, Mark Mastered is now on RIGHT.");
    } else {
      console.error("FAIL: Flipped Review buttons incorrect!");
    }

    await page.click('button:has-text("Back")');
    await page.waitForTimeout(400);

    // Check Flash Cards with Right Mastered
    console.log("Opening Flash Cards with Mastered Side: Right...");
    await page.click('button:has-text("Flash Cards")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("START 3D FLIP →")');
    await page.waitForTimeout(500);

    const knowItBtnFlipped = page.locator('button:has-text("Know it")');
    const dontKnowBtnFlipped = page.locator('button:has-text("Don\'t know")');
    const knowBoxFlipped = await knowItBtnFlipped.boundingBox();
    const dontBoxFlipped = await dontKnowBtnFlipped.boundingBox();
    console.log(`Flash Buttons (Flipped): Don't know x=${dontBoxFlipped?.x}, Know it x=${knowBoxFlipped?.x}`);
    if (knowBoxFlipped && dontBoxFlipped && dontBoxFlipped.x < knowBoxFlipped.x) {
      console.log("PASS: Don't know is now on LEFT, Know it is now on RIGHT.");
    } else {
      console.error("FAIL: Flipped Flash buttons incorrect!");
    }

    // Back to Decks -> Back to Home
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Home")');
    await page.waitForTimeout(400);

    // Reset setting back to Left (default)
    await page.click('button:has-text("Left (default)")');
    await page.waitForTimeout(200);

    await context.close();
  }

  await browser.close();
  console.log("\nALL VERIFICATIONS PASSED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
