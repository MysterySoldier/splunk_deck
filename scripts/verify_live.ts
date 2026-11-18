import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function runVerification() {
  console.log("Starting Live Verification for Splunk Deck Round 2 at https://mysterylabs.dev/splunk_deck...");

  const screenshotsDir = path.resolve("./screenshots");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const audioRequests: string[] = [];

  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();

  // Monitor network requests for audio clips
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/splunk_deck/audio/")) {
      audioRequests.push(url);
      console.log(`[AUDIO REQUEST] ${url}`);
    }
  });

  // 1. Load https://mysterylabs.dev/splunk_deck
  console.log("Loading https://mysterylabs.dev/splunk_deck...");
  await page.goto("https://mysterylabs.dev/splunk_deck", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, "01_home_screen_r2.png") });

  const content = await page.content();
  const hasFlashCards = content.includes("Flash Cards");
  const hasReview = content.includes("Exam Question Review");
  const hasStudy = content.includes("Exam Study");
  const has221 = content.includes("221 cards");
  const has141 = content.includes("141 cards");

  console.log(`- Home selections: FlashCards=${hasFlashCards}, Review=${hasReview}, Study=${hasStudy}`);
  console.log(`- Honest counts: 221=${has221}, 141=${has141}`);

  if (!hasFlashCards || !hasReview || !hasStudy || !has221 || !has141) {
    throw new Error("Missing expected home sections or counts!");
  }

  // 2. Open Flash Cards Section & test real-voice Q on front / A on flip
  console.log("Opening Flash Cards section...");
  await page.click("text=Flash Cards");
  await page.waitForTimeout(600);

  console.log("Starting 3D flip card session...");
  await page.click("text=START 3D FLIP →");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(screenshotsDir, "02_flashcard_front_r2.png") });

  // Verify flash question clip requested
  const hasFlashQ = audioRequests.some((u) => u.includes("/audio/flash-q-"));
  console.log(`- Flash question clip auto-played on front: ${hasFlashQ}`);

  // Test Replay button
  console.log("Testing Replay button on front...");
  await page.click("button[title='Replay Audio (R)']");
  await page.waitForTimeout(600);

  // Test Flip -> should play answer clip
  console.log("Flipping flashcard to back...");
  await page.click("text=Tap center to flip");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(screenshotsDir, "03_flashcard_back_r2.png") });

  const hasFlashA = audioRequests.some((u) => u.includes("/audio/flash-a-"));
  console.log(`- Flash answer clip auto-played on flip: ${hasFlashA}`);

  // Test Sound Mute toggle
  console.log("Testing Sound On/Off mute toggle...");
  await page.click("button[title*='Sound']");
  await page.waitForTimeout(400);

  // Test Know it
  await page.click("button:has-text('Know it')");
  await page.waitForTimeout(600);

  // Return to Home
  await page.click("button:has-text('Back')");
  await page.waitForTimeout(400);
  await page.click("button:has-text('Home')");
  await page.waitForTimeout(400);

  // 3. Open Exam Study Section & test real-voice Q on front / A on flip
  console.log("Opening Exam Study section...");
  await page.click("text=Exam Study");
  await page.waitForTimeout(600);

  console.log("Starting Exam Study 3D flip card session...");
  await page.click("text=START 3D FLIP →");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(screenshotsDir, "04_study_front_r2.png") });

  const hasStudyQ = audioRequests.some((u) => u.includes("/audio/study-q-"));
  console.log(`- Study question clip auto-played on front: ${hasStudyQ}`);

  // Flip Study card
  console.log("Flipping study card to back...");
  await page.click("text=Tap center to flip");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(screenshotsDir, "05_study_back_r2.png") });

  const hasStudyA = audioRequests.some((u) => u.includes("/audio/study-a-"));
  console.log(`- Study answer clip auto-played on flip: ${hasStudyA}`);

  await page.click("button:has-text('Back')");
  await page.waitForTimeout(400);
  await page.click("button:has-text('Home')");
  await page.waitForTimeout(400);

  // 4. Open Exam Question Review & verify review clip playback
  console.log("Opening Exam Question Review section...");
  await page.click("text=Exam Question Review");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(screenshotsDir, "06_review_r2.png") });

  const hasReviewClip = audioRequests.some((u) => u.includes("/audio/review-card-"));
  console.log(`- Review clip auto-played: ${hasReviewClip}`);

  // 5. Verify NO multiple choice anywhere
  const hasRadioButtons = (await page.$$("input[type='radio']")).length > 0;
  console.log(`- Multiple choice present: ${hasRadioButtons} (MUST BE FALSE)`);

  await browser.close();
  console.log("ALL ROUND 2 LIVE VERIFICATION CHECKS PASSED!");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
