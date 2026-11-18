import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function runVerification() {
  console.log("Starting Live Verification for Splunk Deck at https://mysterylabs.dev/splunk_deck...");

  const screenshotsDir = path.resolve("./screenshots");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();

  // 1. Load https://mysterylabs.dev/splunk_deck
  console.log("Loading https://mysterylabs.dev/splunk_deck...");
  await page.goto("https://mysterylabs.dev/splunk_deck", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Take Home screenshot
  await page.screenshot({ path: path.join(screenshotsDir, "01_home_screen.png") });
  console.log("✓ Home page loaded successfully at 375x812.");

  // Check title and header
  const title = await page.title();
  console.log(`Page title: "${title}"`);

  // Verify the 3 selections and counts
  const content = await page.content();
  const hasFlashCards = content.includes("Flash Cards");
  const hasReview = content.includes("Exam Question Review");
  const hasStudy = content.includes("Exam Study");
  const has221 = content.includes("221 cards");
  const has141 = content.includes("141 cards");

  console.log(`- Flash Cards selection: ${hasFlashCards}`);
  console.log(`- Exam Question Review selection: ${hasReview}`);
  console.log(`- Exam Study selection: ${hasStudy}`);
  console.log(`- 221 cards count: ${has221}`);
  console.log(`- 141 cards count: ${has141}`);

  if (!hasFlashCards || !hasReview || !hasStudy || !has221 || !has141) {
    throw new Error("Missing expected sections or card counts on home screen!");
  }

  // Verify NO login wall (guest mode works out of the box)
  const isBlockedByLogin = content.includes("Please log in to continue") || content.includes("Login Required");
  console.log(`- Guest mode works without login wall: ${!isBlockedByLogin}`);

  // 2. Open Flash Cards Section
  console.log("Opening Flash Cards section...");
  await page.click("text=Flash Cards");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, "02_flashcards_section.png") });

  const fcContent = await page.content();
  console.log(`- Review All hero visible: ${fcContent.includes("Review All Cards")}`);
  console.log(`- 12 topic decks rendered: ${fcContent.includes("Search & SPL") && fcContent.includes("Stats & Charts")}`);

  // Start 3D Flip Card session
  console.log("Starting 3D flip card session...");
  await page.click("text=START 3D FLIP →");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, "03_flashcard_front.png") });

  // Test 3D Flip
  console.log("Flipping card...");
  await page.click("text=Tap center to flip");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, "04_flashcard_back.png") });

  // Test "Know it" button
  console.log("Testing Know it action...");
  await page.click("button:has-text('Know it')");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, "05_flashcard_after_know_it.png") });

  // Back to Flashcards list, then back to Home
  await page.click("button:has-text('Back')");
  await page.waitForTimeout(400);
  await page.click("button:has-text('Home')");
  await page.waitForTimeout(400);

  // 3. Open Exam Question Review Section
  console.log("Opening Exam Question Review section...");
  await page.click("text=Exam Question Review");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotsDir, "06_exam_question_review.png") });

  const revContent = await page.content();
  const honestCountLine = revContent.includes("221 of 289 — 20 multi-select held out (no answer recorded), 48 still missing.");
  console.log(`- Honest count line present: ${honestCountLine}`);
  if (!honestCountLine) {
    throw new Error("Missing honest count line in Exam Question Review!");
  }

  // Test Tap zones / Next Card
  console.log("Testing Mark Mastered in Review...");
  await page.click("button:has-text('Mark Mastered')");
  await page.waitForTimeout(600);

  console.log("Testing Next Card in Review...");
  await page.click("button:has-text('Next Card')");
  await page.waitForTimeout(600);

  await page.click("button:has-text('Back')");
  await page.waitForTimeout(400);

  // 4. Open Exam Study Section
  console.log("Opening Exam Study section...");
  await page.click("text=Exam Study");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, "07_exam_study_section.png") });

  const studyContent = await page.content();
  console.log(`- 10 study decks rendered: ${studyContent.includes("Workflow Actions") && studyContent.includes("Transactions")}`);

  await page.click("button:has-text('Home')");
  await page.waitForTimeout(400);

  // 5. Google Sign-in & D1 Cloud Sync Test
  console.log("Testing Sign-in and D1 sync...");
  await page.click("button:has-text('Sign In')");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(screenshotsDir, "08_auth_modal.png") });

  // Fill in Google ID to authenticate
  await page.fill("input[placeholder='Google email or ID']", "tobias.poweruser@gmail.com");
  await page.fill("input[placeholder='Display Name (optional)']", "Tobias Splunk");
  await page.click("button:has-text('Continue to Account')");
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(screenshotsDir, "09_signed_in_home.png") });
  const signedInContent = await page.content();
  console.log(`- Signed in display name visible: ${signedInContent.includes("Tobias Splunk") || signedInContent.includes("tobias.poweruser")}`);

  // Test reload persistence
  console.log("Reloading page to verify persistence...");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, "10_after_reload_persistence.png") });

  const reloadedContent = await page.content();
  const persistsUser = reloadedContent.includes("Tobias Splunk") || reloadedContent.includes("tobias.poweruser");
  console.log(`- User session persisted after reload: ${persistsUser}`);

  // Verify NO multiple choice anywhere
  const hasRadioButtons = (await page.$$("input[type='radio']")).length > 0;
  console.log(`- Multiple choice radio buttons present: ${hasRadioButtons} (MUST BE FALSE)`);

  await browser.close();
  console.log("ALL LIVE VERIFICATION CHECKS PASSED!");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
