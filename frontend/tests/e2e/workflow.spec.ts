import { test, expect } from "@playwright/test";
import path from "node:path";
test("demo tracking, lock, exports, sessions, processing and responsive layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Launch Demo", exact: true }).click();
  await expect(
    page.getByText("DEMO / SIMULATION", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lock Face", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Lock Face", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unlock Face", exact: true }),
  ).toBeVisible();
  await page
    .locator(".controls-panel")
    .getByRole("button", { name: "Pause", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Data", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.csv$/);
  await page.screenshot({
    path: "../docs/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Session Analytics" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Image Processing", exact: true })
    .click();
  for (const name of [
    "Depth",
    "Thermal",
    "Blur",
    "Night Vision",
    "Grayscale",
    "Edges",
    "Segmentation",
    "Contrast",
    "Sharpen",
  ]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: "Save Session", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Load", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: "Load", exact: true }).click();
  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await expect(page.locator(".stat-card").first()).not.toHaveText("Samples0");
  await page
    .getByRole("button", { name: "Live Tracking", exact: true })
    .click();
  for (const width of [1920, 1600, 1440, 1366, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
  }
  await page.screenshot({
    path: "../docs/dashboard-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("actual local model detects landmarks in uploaded image", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByTestId("media-upload")
    .setInputFiles(path.resolve("../docs/reference-ui.png"));
  await expect(
    page.getByRole("button", { name: "Lock Face", exact: true }),
  ).toBeEnabled({ timeout: 80000 });
  await expect(page.locator(".info-panel")).toContainText("Face-01");
  expect(await page.locator(".error-banner").count()).toBe(0);
  await page.screenshot({ path: "../docs/real-inference.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("camera denial is actionable and does not crash", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () =>
        Promise.reject(
          new DOMException("Permission denied", "NotAllowedError"),
        ),
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Start Camera", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Camera unavailable");
  await expect(
    page.getByRole("button", { name: "Launch Demo", exact: true }),
  ).toBeVisible();
});
test("camera stream lifecycle with actual vision inference on a controlled source", async ({
  page,
}) => {
  const fs = await import("node:fs");
  const base64 = fs
    .readFileSync(path.resolve("../docs/reference-ui.png"))
    .toString("base64");
  await page.addInitScript(
    ({ base64 }) => {
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        value: async () => {
          const img = new window.Image();
          img.src = "data:image/png;base64," + base64;
          await img.decode();
          const c = document.createElement("canvas");
          c.width = 960;
          c.height = 640;
          const ctx = c.getContext("2d")!;
          let n = 0;
          ctx.drawImage(img, 0, 0, 960, 640);
          const timer = setInterval(() => {
            ctx.clearRect(0, 0, 960, 640);
            ctx.drawImage(img, Math.sin(n++ / 20) * 8, 0, 960, 640);
          }, 100);
          const stream = c.captureStream(10);
          Object.defineProperty(window, "testCameraStream", {
            value: stream,
            configurable: true,
          });
          stream
            .getVideoTracks()[0]
            .addEventListener("ended", () => clearInterval(timer));
          return stream;
        },
      });
    },
    { base64 },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Start Camera", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Lock Face", exact: true }),
  ).toBeEnabled({ timeout: 80000 });
  await expect(page.locator(".camera-state")).toContainText("Granted");
  await page.getByRole("button", { name: "Stop source", exact: true }).click();
  expect(
    await page.evaluate(() =>
      (window as unknown as { testCameraStream: MediaStream }).testCameraStream
        .getTracks()
        .every((t) => t.readyState === "ended"),
    ),
  ).toBeTruthy();
  await expect(
    page.getByRole("button", { name: "Launch Demo", exact: true }),
  ).toBeVisible();
});
test("uploaded video play, pause, speed, seek and frame step", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByTestId("media-upload")
    .setInputFiles(path.resolve("../tests/fixtures/reference-video.webm"));
  await expect(
    page.getByRole("button", { name: "Lock Face", exact: true }),
  ).toBeEnabled({ timeout: 80000 });
  await page
    .getByRole("button", { name: "Pause or resume source", exact: true })
    .click();
  await page.getByLabel("Playback speed").selectOption("0.5");
  await page.getByLabel("Video position").fill("1");
  await expect(
    page.getByRole("button", { name: "Lock Face", exact: true }),
  ).toBeEnabled({ timeout: 15000 });
  await page
    .getByRole("button", {
      name: "Step forward one thirtieth second",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Lock Face", exact: true }),
  ).toBeEnabled({ timeout: 15000 });
  expect(await page.locator(".error-banner").count()).toBe(0);
  await page.getByRole("button", { name: "Stop source", exact: true }).click();
});
