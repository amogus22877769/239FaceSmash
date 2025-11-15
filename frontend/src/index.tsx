// Include Telegram UI styles first to allow our code override the package CSS.
import "@telegram-apps/telegram-ui/dist/styles.css";

import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";

import { Root } from "@/components/Root.tsx";
import { init } from "@/init.ts";
import { migrateLocalStorage } from "@/utils/localStorageMigration.js";

import "./index.css";

// Mock the environment in case, we are outside Telegram.
import "./mockEnv.ts";

// Run localStorage migration before app initialization
migrateLocalStorage();

const root = ReactDOM.createRoot(document.getElementById("root")!);

try {
  // Wait a bit for mockEnv to initialize if needed
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const launchParams = retrieveLaunchParams();
  const { tgWebAppPlatform: platform } = launchParams;
  const debug =
    (launchParams.tgWebAppStartParam || "").includes("platformer_debug") ||
    import.meta.env.DEV;

  // Configure all application dependencies.
  await init({
    debug,
    eruda: debug && ["ios", "android"].includes(platform),
    mockForMacOS: platform === "macos",
  }).then(() => {
    root.render(
      <StrictMode>
        <Root />
      </StrictMode>,
    );
  });
} catch (e) {
  // Try to render the app anyway (for browser testing) - mockEnv should have set up the mock
  console.warn("Failed to retrieve launch params, but continuing anyway (mockEnv should handle it):", e);
  try {
    // Try retrieving again after mockEnv has had time to set up
    await new Promise(resolve => setTimeout(resolve, 200));
    const launchParams = retrieveLaunchParams();
    const { tgWebAppPlatform: platform } = launchParams;
    const debug =
      (launchParams.tgWebAppStartParam || "").includes("platformer_debug") ||
      import.meta.env.DEV;

    await init({
      debug,
      eruda: debug && ["ios", "android"].includes(platform),
      mockForMacOS: platform === "macos",
    }).then(() => {
      root.render(
        <StrictMode>
          <Root />
        </StrictMode>,
      );
    });
  } catch (e2) {
    // If still failing, try with default settings
    console.warn("Retry failed, using default settings:", e2);
    await init({
      debug: true,
      eruda: false,
      mockForMacOS: false,
    }).then(() => {
      root.render(
        <StrictMode>
          <Root />
        </StrictMode>,
      );
    });
  }
}
