import {
  getCommentFilterSettings,
  getDefaultFilterSettings,
  parseKeywordText,
  setCommentFilterSettings,
  stringifyKeywordList,
  type AttendanceSensitivity,
  type CommentFilterMode,
  type CommentFilterSettings,
} from '@/utils/comment-filter-settings';
import { consumeRuntimeLastError } from '@/utils/debug-logger';
import { createUpdateFilterSettingsMessage } from '@/utils/filter-settings-message';

const WEAK_MODE_INPUT_ID = 'mode-weak';
const STRONG_MODE_INPUT_ID = 'mode-strong';
const ATTENDANCE_SENSITIVITY_SELECT_ID = 'attendance-sensitivity';
const EXCLUSION_KEYWORDS_TEXTAREA_ID = 'exclusion-keywords';
const WHITELIST_KEYWORDS_TEXTAREA_ID = 'whitelist-keywords';
const APPLY_SETTINGS_BUTTON_ID = 'apply-settings';
const SAVE_STATUS_ELEMENT_ID = 'save-status';

function getInputElement(id: string): HTMLInputElement | null {
  const element = document.getElementById(id);

  if (!(element instanceof HTMLInputElement)) {
    return null;
  }

  return element;
}

function getSelectElement(id: string): HTMLSelectElement | null {
  const element = document.getElementById(id);

  if (!(element instanceof HTMLSelectElement)) {
    return null;
  }

  return element;
}

function getTextAreaElement(id: string): HTMLTextAreaElement | null {
  const element = document.getElementById(id);

  if (!(element instanceof HTMLTextAreaElement)) {
    return null;
  }

  return element;
}

function getStatusElement(): HTMLElement | null {
  const element = document.getElementById(SAVE_STATUS_ELEMENT_ID);

  if (!(element instanceof HTMLElement)) {
    return null;
  }

  return element;
}

function setStatusText(message: string): void {
  const statusElement = getStatusElement();
  if (statusElement === null) {
    return;
  }

  statusElement.textContent = message;
}

function setSelectedMode(mode: CommentFilterMode): void {
  const weakModeInput = getInputElement(WEAK_MODE_INPUT_ID);
  const strongModeInput = getInputElement(STRONG_MODE_INPUT_ID);

  if (weakModeInput !== null) {
    weakModeInput.checked = mode === 'weak';
  }

  if (strongModeInput !== null) {
    strongModeInput.checked = mode === 'strong';
  }
}

function getSelectedModeFromUi(): CommentFilterMode {
  const strongModeInput = getInputElement(STRONG_MODE_INPUT_ID);

  if (strongModeInput?.checked) {
    return 'strong';
  }

  return 'weak';
}

function setAttendanceSensitivityToUi(
  attendanceSensitivity: AttendanceSensitivity,
): void {
  const selectElement = getSelectElement(ATTENDANCE_SENSITIVITY_SELECT_ID);
  if (selectElement === null) {
    return;
  }

  selectElement.value = attendanceSensitivity;
}

function getAttendanceSensitivityFromUi(): AttendanceSensitivity {
  const selectElement = getSelectElement(ATTENDANCE_SENSITIVITY_SELECT_ID);
  if (selectElement === null) {
    return 'balanced';
  }

  if (selectElement.value === 'low') {
    return 'low';
  }

  if (selectElement.value === 'high') {
    return 'high';
  }

  return 'balanced';
}

function setKeywordListsToUi(settings: CommentFilterSettings): void {
  const exclusionTextArea = getTextAreaElement(EXCLUSION_KEYWORDS_TEXTAREA_ID);
  const whitelistTextArea = getTextAreaElement(WHITELIST_KEYWORDS_TEXTAREA_ID);

  if (exclusionTextArea !== null) {
    exclusionTextArea.value = stringifyKeywordList(settings.exclusionKeywords);
  }

  if (whitelistTextArea !== null) {
    whitelistTextArea.value = stringifyKeywordList(settings.whitelistKeywords);
  }
}

function readKeywordListsFromUi(): Pick<
  CommentFilterSettings,
  'exclusionKeywords' | 'whitelistKeywords'
> {
  const exclusionTextArea = getTextAreaElement(EXCLUSION_KEYWORDS_TEXTAREA_ID);
  const whitelistTextArea = getTextAreaElement(WHITELIST_KEYWORDS_TEXTAREA_ID);

  return {
    exclusionKeywords: parseKeywordText(exclusionTextArea?.value ?? ''),
    whitelistKeywords: parseKeywordText(whitelistTextArea?.value ?? ''),
  };
}

function setSettingsToUi(settings: CommentFilterSettings): void {
  setSelectedMode(settings.mode);
  setAttendanceSensitivityToUi(settings.attendanceSensitivity);
  setKeywordListsToUi(settings);
}

function readSettingsFromUi(): CommentFilterSettings {
  const keywordLists = readKeywordListsFromUi();

  return {
    mode: getSelectedModeFromUi(),
    attendanceSensitivity: getAttendanceSensitivityFromUi(),
    exclusionKeywords: keywordLists.exclusionKeywords,
    whitelistKeywords: keywordLists.whitelistKeywords,
  };
}

function sendSettingsToActiveTab(settings: CommentFilterSettings): Promise<void> {
  return new Promise(function notify(resolve) {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query || !chrome.tabs?.sendMessage) {
      resolve();
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function onTabsLoaded(tabs) {
      const activeTab = tabs[0];

      if (activeTab?.id === undefined) {
        resolve();
        return;
      }

      const message = createUpdateFilterSettingsMessage(settings);
      chrome.tabs.sendMessage(activeTab.id, message, function onMessageSent() {
        consumeRuntimeLastError('popup send message');
        resolve();
      });
    });
  });
}

async function persistAndApplySettings(settings: CommentFilterSettings): Promise<void> {
  await setCommentFilterSettings(settings);
  await sendSettingsToActiveTab(settings);
}

async function applySettingsFromUi(): Promise<void> {
  const settings = readSettingsFromUi();

  setStatusText('저장 중...');
  await persistAndApplySettings(settings);
  setStatusText('적용 완료');
}

function handleControlChanged(): void {
  void applySettingsFromUi();
}

function bindModeHandlers(): void {
  const weakModeInput = getInputElement(WEAK_MODE_INPUT_ID);
  const strongModeInput = getInputElement(STRONG_MODE_INPUT_ID);

  weakModeInput?.addEventListener('change', handleControlChanged);
  strongModeInput?.addEventListener('change', handleControlChanged);
}

function bindSensitivityHandler(): void {
  const selectElement = getSelectElement(ATTENDANCE_SENSITIVITY_SELECT_ID);
  selectElement?.addEventListener('change', handleControlChanged);
}

function bindKeywordHandlers(): void {
  const exclusionTextArea = getTextAreaElement(EXCLUSION_KEYWORDS_TEXTAREA_ID);
  const whitelistTextArea = getTextAreaElement(WHITELIST_KEYWORDS_TEXTAREA_ID);

  exclusionTextArea?.addEventListener('change', handleControlChanged);
  whitelistTextArea?.addEventListener('change', handleControlChanged);
}

function bindApplyButtonHandler(): void {
  const buttonElement = document.getElementById(APPLY_SETTINGS_BUTTON_ID);
  if (!(buttonElement instanceof HTMLButtonElement)) {
    return;
  }

  buttonElement.addEventListener('click', function onApplyClicked() {
    void applySettingsFromUi();
  });
}

async function syncUiFromStorage(): Promise<void> {
  const settings = await getCommentFilterSettings();
  setSettingsToUi(settings);
  setStatusText('저장된 설정 불러옴');
}

function initializePopup(): void {
  bindModeHandlers();
  bindSensitivityHandler();
  bindKeywordHandlers();
  bindApplyButtonHandler();

  setSettingsToUi(getDefaultFilterSettings());
  setStatusText('준비됨');

  void syncUiFromStorage();
}

function handlePopupDomReady(): void {
  initializePopup();
}

function bootstrapPopup(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handlePopupDomReady, {
      once: true,
    });

    return;
  }

  initializePopup();
}

bootstrapPopup();
