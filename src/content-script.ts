import {
  getCommentFilterSettings,
  type CommentFilterSettings,
} from '@/utils/comment-filter-settings';
import { isUpdateFilterSettingsMessage } from '@/utils/filter-settings-message';
import {
  startYouTubeCommentCleaner,
  type YouTubeCommentCleanerController,
} from '@/utils/youtube-comment-cleaner';

let cleanerController: YouTubeCommentCleanerController | null = null;
let pendingSettings: CommentFilterSettings | null = null;

function applySettings(settings: CommentFilterSettings): void {
  pendingSettings = settings;

  if (cleanerController === null) {
    return;
  }

  cleanerController.updateSettings(settings);
}

function startCleanerIfNeeded(settings: CommentFilterSettings): void {
  if (cleanerController === null) {
    cleanerController = startYouTubeCommentCleaner(settings);
    return;
  }

  cleanerController.updateSettings(settings);
}

async function runCleanerWithConfiguredSettings(): Promise<void> {
  const storedSettings = await getCommentFilterSettings();
  const settingsToApply = pendingSettings ?? storedSettings;

  console.warn('[Time Traveler Hunter] loaded settings:', settingsToApply);
  startCleanerIfNeeded(settingsToApply);
  pendingSettings = null;
}

function handleRuntimeMessage(message: unknown): void {
  if (!isUpdateFilterSettingsMessage(message)) {
    return;
  }

  applySettings(message.settings);
}

function registerRuntimeMessageListener(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) {
    return;
  }

  chrome.runtime.onMessage.addListener(handleRuntimeMessage);
}

function handleDomContentLoaded(): void {
  void runCleanerWithConfiguredSettings();
}

function bootstrapCommentCleaner(): void {
  console.warn('[Time Traveler Hunter] content script started:', window.location.href);
  registerRuntimeMessageListener();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleDomContentLoaded, {
      once: true,
    });

    return;
  }

  void runCleanerWithConfiguredSettings();
}

bootstrapCommentCleaner();
