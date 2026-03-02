export type CommentFilterMode = 'weak' | 'strong';
export type AttendanceSensitivity = 'low' | 'balanced' | 'high';

export type CommentFilterSettings = {
  mode: CommentFilterMode;
  attendanceSensitivity: AttendanceSensitivity;
  exclusionKeywords: string[];
  whitelistKeywords: string[];
};

const LEGACY_FILTER_MODE_STORAGE_KEY = 'commentFilterMode';
const FILTER_SETTINGS_STORAGE_KEY = 'commentFilterSettings';

const DEFAULT_FILTER_SETTINGS: CommentFilterSettings = {
  mode: 'strong',
  attendanceSensitivity: 'balanced',
  exclusionKeywords: [],
  whitelistKeywords: [],
};

function isObjectValue(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isCommentFilterMode(value: unknown): value is CommentFilterMode {
  return value === 'weak' || value === 'strong';
}

export function isAttendanceSensitivity(value: unknown): value is AttendanceSensitivity {
  return value === 'low' || value === 'balanced' || value === 'high';
}

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

function sanitizeKeywordList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueKeywords = new Set<string>();

  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const normalizedKeyword = normalizeKeyword(item);
    if (normalizedKeyword.length === 0) {
      continue;
    }

    uniqueKeywords.add(normalizedKeyword);
  }

  return Array.from(uniqueKeywords);
}

function sanitizeCommentFilterSettings(value: unknown): CommentFilterSettings {
  if (!isObjectValue(value)) {
    return { ...DEFAULT_FILTER_SETTINGS };
  }

  const mode = isCommentFilterMode(value.mode)
    ? value.mode
    : DEFAULT_FILTER_SETTINGS.mode;

  const attendanceSensitivity = isAttendanceSensitivity(value.attendanceSensitivity)
    ? value.attendanceSensitivity
    : DEFAULT_FILTER_SETTINGS.attendanceSensitivity;

  return {
    mode,
    attendanceSensitivity,
    exclusionKeywords: sanitizeKeywordList(value.exclusionKeywords),
    whitelistKeywords: sanitizeKeywordList(value.whitelistKeywords),
  };
}

function hasStorageApi(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

export function getDefaultFilterSettings(): CommentFilterSettings {
  return { ...DEFAULT_FILTER_SETTINGS };
}

function mergeWithDefaultSettings(
  settings: CommentFilterSettings,
): CommentFilterSettings {
  return {
    ...DEFAULT_FILTER_SETTINGS,
    ...settings,
    exclusionKeywords: settings.exclusionKeywords,
    whitelistKeywords: settings.whitelistKeywords,
  };
}

function readLegacyMode(items: Record<string, unknown>): CommentFilterMode | null {
  const legacyMode = items[LEGACY_FILTER_MODE_STORAGE_KEY];

  if (!isCommentFilterMode(legacyMode)) {
    return null;
  }

  return legacyMode;
}

function persistMigratedSettings(settings: CommentFilterSettings): void {
  if (!hasStorageApi()) {
    return;
  }

  chrome.storage.local.set({ [FILTER_SETTINGS_STORAGE_KEY]: settings }, function onSaved() {
    return;
  });
}

export function getCommentFilterSettings(): Promise<CommentFilterSettings> {
  return new Promise(function loadCommentFilterSettings(resolve) {
    if (!hasStorageApi()) {
      resolve(getDefaultFilterSettings());
      return;
    }

    chrome.storage.local.get(
      [FILTER_SETTINGS_STORAGE_KEY, LEGACY_FILTER_MODE_STORAGE_KEY],
      function onSettingsLoaded(items) {
        const rawSettings = items[FILTER_SETTINGS_STORAGE_KEY];

        if (rawSettings !== undefined) {
          const sanitizedSettings = sanitizeCommentFilterSettings(rawSettings);
          resolve(mergeWithDefaultSettings(sanitizedSettings));
          return;
        }

        const legacyMode = readLegacyMode(items);
        if (legacyMode !== null) {
          const migratedSettings: CommentFilterSettings = {
            ...DEFAULT_FILTER_SETTINGS,
            mode: legacyMode,
          };

          persistMigratedSettings(migratedSettings);
          resolve(migratedSettings);
          return;
        }

        resolve(getDefaultFilterSettings());
      },
    );
  });
}

export function setCommentFilterSettings(settings: CommentFilterSettings): Promise<void> {
  return new Promise(function persistCommentFilterSettings(resolve) {
    if (!hasStorageApi()) {
      resolve();
      return;
    }

    const sanitizedSettings = mergeWithDefaultSettings(
      sanitizeCommentFilterSettings(settings),
    );

    chrome.storage.local.set(
      { [FILTER_SETTINGS_STORAGE_KEY]: sanitizedSettings },
      function onSettingsSaved() {
        resolve();
      },
    );
  });
}

export function parseKeywordText(text: string): string[] {
  return sanitizeKeywordList(text.split(/[,\n]/));
}

export function stringifyKeywordList(keywordList: string[]): string {
  return keywordList.join(', ');
}
