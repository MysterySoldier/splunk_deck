import { chromium } from "playwright";
import * as path from "path";

const ARTIFACT_DIR = "/home/mystery_soldier/.gemini/antigravity-cli/brain/c27b9d4c-b974-40a5-bda1-c55f1489f53c/screenshots";
const BASE_URL = "https://mysterylabs.dev/splunk_deck/";

async function main() {
  console.log("Launching headless browser to verify live site...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const viewports = [
    { name: "390x700_safari", width: 390, height: 700 },
    { name: "390x844_standard", width: 390, height: 844 },
    { name: "375x812_phone", width: 375, height: 812 },
  ];

  for (const vp of viewports) {
    console.log(`\n=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 1. Home Screen
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    // 2. Exam Question Review Session
    console.log("Navigating to Exam Question Review...");
    await page.click('button:has-text("Exam Question Review")');
    await page.waitForTimeout(600);

    // Check scroll and dimensions
    const reviewScroll = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      const main = document.querySelector("main");
      return {
        windowInnerHeight: window.innerHeight,
        docScrollHeight: el.scrollHeight,
        docClientHeight: el.clientHeight,
        mainScrollHeight: main?.scrollHeight,
        mainClientHeight: main?.clientHeight,
        hasPageScroll: el.scrollHeight > el.clientHeight,
      };
    });
    console.log("Review Session Scroll Check:", reviewScroll);

    // Check header line "221 of 289"
    const honestLine = page.locator("text=221 of 289");
    const honestLineBox = await honestLine.boundingBox();
    console.log("Honest line box:", honestLineBox);

    // Check Mark Mastered & Next Card buttons
    const markMasteredBtn = page.locator('button:has-text("Mark Mastered")');
    const markBox = await markMasteredBtn.boundingBox();
    console.log("Mark Mastered Button box:", markBox);

    const nextCardBtn = page.locator('button:has-text("Next Card")');
    const nextBox = await nextCardBtn.boundingBox();
    console.log("Next Card Button box:", nextBox);

    const reviewScreenshot = path.join(ARTIFACT_DIR, `review-${vp.name}.png`);
    await page.screenshot({ path: reviewScreenshot });
    console.log(`Saved screenshot: ${reviewScreenshot}`);

    // Back to Home
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(400);

    // 3. Flash Cards -> Review All
    console.log("Navigating to Flash Cards -> Review All...");
    await page.click('button:has-text("Flash Cards")');
    await page.waitForTimeout(400);

    // Click START 3D FLIP →
    await page.click('button:has-text("START 3D FLIP →")');
    await page.waitForTimeout(600);

    // Scroll check
    const flashScroll = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      const main = document.querySelector("main");
      return {
        docScrollHeight: el.scrollHeight,
        docClientHeight: el.clientHeight,
        mainScrollHeight: main?.scrollHeight,
        mainClientHeight: main?.clientHeight,
        hasPageScroll: el.scrollHeight > el.clientHeight,
      };
    });
    console.log("Flash Cards Session Scroll Check:", flashScroll);

    // Front screenshot
    const flashFrontScreenshot = path.join(ARTIFACT_DIR, `flash-front-${vp.name}.png`);
    await page.screenshot({ path: flashFrontScreenshot });
    console.log(`Saved screenshot: ${flashFrontScreenshot}`);

    // Check Question badge and text visibility
    const questionBadge = page.locator('text="QUESTION"').first();
    const qBadgeBox = await questionBadge.boundingBox();
    console.log("QUESTION badge box on front:", qBadgeBox);

    // Flip card by clicking center
    console.log("Flipping card...");
    const flipZone = page.locator('button[aria-label="Flip card"]');
    await flipZone.click();
    await page.waitForTimeout(600);

    // Back screenshot
    const flashBackScreenshot = path.join(ARTIFACT_DIR, `flash-back-${vp.name}.png`);
    await page.screenshot({ path: flashBackScreenshot });
    console.log(`Saved screenshot: ${flashBackScreenshot}`);

    // Check Answer badge visibility
    const answerBadge = page.locator('text="ANSWER"').first();
    const aBadgeBox = await answerBadge.boundingBox();
    console.log("ANSWER badge box on back:", aBadgeBox);

    // Check buttons
    const dontKnowBtn = page.locator('button:has-text("Don\'t know")');
    const dontKnowBox = await dontKnowBtn.boundingBox();
    const knowItBtn = page.locator('button:has-text("Know it")');
    const knowItBox = await knowItBtn.boundingBox();
    console.log("Don't know button box:", dontKnowBox);
    console.log("Know it button box:", knowItBox);

    // Back to Deck List
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(400);

    // 4. Topic Deck Session (Search & SPL)
    console.log("Testing specific Topic Deck session...");
    await page.click('button:has-text("Search & SPL")');
    await page.waitForTimeout(400);

    // Start 3D Flip Card mode
    await page.click('button:has-text("Flashcard Deck")');
    await page.waitForTimeout(600);

    const topicDeckScreenshot = path.join(ARTIFACT_DIR, `topic-deck-${vp.name}.png`);
    await page.screenshot({ path: topicDeckScreenshot });
    console.log(`Saved screenshot: ${topicDeckScreenshot}`);

    // Back to Deck list, then Home
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Home")');
    await page.waitForTimeout(400);

    // 5. Exam Study Session
    console.log("Navigating to Exam Study...");
    await page.click('button:has-text("Exam Study")');
    await page.waitForTimeout(400);

    // Open first study deck (Search & SPL)
    await page.click('button:has-text("Search & SPL")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Flashcard Deck")');
    await page.waitForTimeout(600);

    const studyFrontScreenshot = path.join(ARTIFACT_DIR, `study-front-${vp.name}.png`);
    await page.screenshot({ path: studyFrontScreenshot });
    console.log(`Saved screenshot: ${studyFrontScreenshot}`);

    // Flip study card
    await page.locator('button[aria-label="Flip card"]').click();
    await page.waitForTimeout(600);
    const studyBackScreenshot = path.join(ARTIFACT_DIR, `study-back-${vp.name}.png`);
    await page.screenshot({ path: studyBackScreenshot });
    console.log(`Saved screenshot: ${studyBackScreenshot}`);

    await context.close();
  }

  await browser.close();
  console.log("\nALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
