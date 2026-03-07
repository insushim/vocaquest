const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("[1/5] Render 대시보드 접속...");
  await page.goto("https://dashboard.render.com", { waitUntil: "networkidle" });

  // 로그인이 필요할 수 있음 - 쿠키가 없으면 로그인 페이지로 리다이렉트됨
  const url = page.url();
  console.log("  현재 URL:", url);

  if (url.includes("login") || url.includes("signin")) {
    console.log("[!] 로그인 필요 - GitHub OAuth로 시도...");
    // GitHub 로그인 버튼 클릭
    const githubBtn = await page.$(
      'a[href*="github"], button:has-text("GitHub")',
    );
    if (githubBtn) {
      await githubBtn.click();
      await page.waitForLoadState("networkidle");
      console.log("  GitHub OAuth 페이지:", page.url());
    }
    // 이미 GitHub에 로그인되어 있다면 자동으로 돌아올 수 있음
    await page.waitForTimeout(3000);
    console.log("  리다이렉트 후 URL:", page.url());
  }

  console.log("[2/5] vocaquest-online 서비스 페이지로 이동...");
  await page.goto("https://dashboard.render.com", { waitUntil: "networkidle" });

  // vocaquest-online 링크 클릭
  const serviceLink = await page.waitForSelector(
    'a:has-text("vocaquest-online")',
    { timeout: 10000 },
  );
  if (serviceLink) {
    await serviceLink.click();
    await page.waitForLoadState("networkidle");
    console.log("  서비스 페이지:", page.url());
  } else {
    console.log("[!] vocaquest-online 서비스를 찾을 수 없음");
    await page.screenshot({ path: "C:\\vocaquest\\render-debug.png" });
    await browser.close();
    process.exit(1);
  }

  console.log("[3/5] Manual Deploy 버튼 찾기...");
  await page.waitForTimeout(2000);

  // Manual Deploy 버튼 클릭
  const deployBtn = await page.$('button:has-text("Manual Deploy")');
  if (deployBtn) {
    await deployBtn.click();
    await page.waitForTimeout(1000);

    console.log("[4/5] Deploy latest commit 클릭...");
    const latestCommitBtn = await page.$(
      'button:has-text("Deploy latest commit"), div:has-text("Deploy latest commit")',
    );
    if (latestCommitBtn) {
      await latestCommitBtn.click();
      await page.waitForTimeout(3000);
      console.log("[5/5] 배포 트리거 완료!");
    } else {
      console.log("[!] 'Deploy latest commit' 옵션 못 찾음");
      await page.screenshot({ path: "C:\\vocaquest\\render-debug.png" });
    }
  } else {
    console.log("[!] Manual Deploy 버튼 못 찾음");
    await page.screenshot({ path: "C:\\vocaquest\\render-debug.png" });
  }

  // 최종 스크린샷
  await page.screenshot({ path: "C:\\vocaquest\\render-result.png" });
  console.log("  스크린샷 저장: render-result.png");

  await browser.close();
})();
