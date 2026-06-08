import "./styles.css";
import { runWorkbookGeneration } from "./app/orchestrator";
import { StatusView } from "./ui/statusView";
import type { RuntimeConfig } from "./types/config";
import type { AddInLifecycle, GeotabApi, GeotabState } from "./types/geotab";

const ADDIN_NAMESPACE = "gapReport";

const generateButton = mustGetElement<HTMLButtonElement>("generate-btn");
const statusElement = mustGetElement<HTMLDivElement>("status");
const validationElement = mustGetElement<HTMLDivElement>("validation");

const statusView = new StatusView({
  button: generateButton,
  status: statusElement,
  validation: validationElement
});

let apiRef: GeotabApi | null = null;
let stateRef: GeotabState | null = null;
let configCache: RuntimeConfig | null = null;
let activeRunToken = 0;

async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (configCache) {
    return configCache;
  }

  const runtimeConfigUrl = new URL("config/runtime-config.json", window.location.origin + import.meta.env.BASE_URL);
  const response = await fetch(runtimeConfigUrl.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Runtime config could not be loaded from ${runtimeConfigUrl.toString()}`);
  }

  configCache = (await response.json()) as RuntimeConfig;
  return configCache;
}

async function handleGenerateClick(): Promise<void> {
  if (!apiRef || !stateRef) {
    statusView.setError("Add-In API context is not ready yet. Refresh and try again.");
    return;
  }

  const currentRun = ++activeRunToken;

  try {
    const config = await loadRuntimeConfig();
    statusView.setRunning("Starting workbook generation...");

    const summary = await runWorkbookGeneration(apiRef, stateRef, config, (message) => {
      if (currentRun !== activeRunToken) {
        return;
      }
      statusView.setProgress(message);
    });

    if (currentRun !== activeRunToken) {
      return;
    }

    statusView.setSuccess(
      `Workbook downloaded for ${summary.label}. Data1 rows: ${summary.data1Count}. Data2 rows: ${summary.data2Count}.`
    );
  } catch (error) {
    if (currentRun !== activeRunToken) {
      return;
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    statusView.setError(message);
  }
}

function registerAddIn(): void {
  window.geotab = window.geotab ?? {};
  window.geotab.addin = window.geotab.addin ?? {};

  window.geotab.addin[ADDIN_NAMESPACE] = (): AddInLifecycle => ({
    initialize(api, state, callback): void {
      apiRef = api;
      stateRef = state;
      statusView.clear();
      generateButton.removeEventListener("click", onGenerateClick);
      generateButton.addEventListener("click", onGenerateClick);
      callback();
    },
    focus(api, state): void {
      apiRef = api;
      stateRef = state;
      statusView.setProgress("Ready. Select Generate Workbook to run yesterday export.");
    },
    blur(): void {
      activeRunToken += 1;
      generateButton.removeEventListener("click", onGenerateClick);
      statusView.clear();
    }
  });
}

function onGenerateClick(): void {
  void handleGenerateClick();
}

function mustGetElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }
  return element as T;
}

registerAddIn();
