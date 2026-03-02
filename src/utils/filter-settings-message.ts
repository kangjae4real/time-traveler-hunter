import type { CommentFilterSettings } from '@/utils/comment-filter-settings';
import { getDefaultFilterSettings } from '@/utils/comment-filter-settings';

export const UPDATE_FILTER_SETTINGS_MESSAGE_TYPE =
  'time-traveler-hunter/update-filter-settings';

export type UpdateFilterSettingsMessage = {
  type: typeof UPDATE_FILTER_SETTINGS_MESSAGE_TYPE;
  settings: CommentFilterSettings;
};

function isObjectValue(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasKeywordList(value: unknown): value is string[] {
  if (!Array.isArray(value)) {
    return false;
  }

  for (const item of value) {
    if (typeof item !== 'string') {
      return false;
    }
  }

  return true;
}

function isValidSettingsShape(value: unknown): value is CommentFilterSettings {
  if (!isObjectValue(value)) {
    return false;
  }

  if (value.mode !== 'weak' && value.mode !== 'strong') {
    return false;
  }

  if (
    value.attendanceSensitivity !== 'low' &&
    value.attendanceSensitivity !== 'balanced' &&
    value.attendanceSensitivity !== 'high'
  ) {
    return false;
  }

  if (!hasKeywordList(value.exclusionKeywords)) {
    return false;
  }

  if (!hasKeywordList(value.whitelistKeywords)) {
    return false;
  }

  return true;
}

export function createUpdateFilterSettingsMessage(
  settings: CommentFilterSettings,
): UpdateFilterSettingsMessage {
  return {
    type: UPDATE_FILTER_SETTINGS_MESSAGE_TYPE,
    settings,
  };
}

export function isUpdateFilterSettingsMessage(
  value: unknown,
): value is UpdateFilterSettingsMessage {
  if (!isObjectValue(value)) {
    return false;
  }

  if (value.type !== UPDATE_FILTER_SETTINGS_MESSAGE_TYPE) {
    return false;
  }

  return isValidSettingsShape(value.settings);
}

export function createDefaultUpdateFilterSettingsMessage(): UpdateFilterSettingsMessage {
  return createUpdateFilterSettingsMessage(getDefaultFilterSettings());
}
