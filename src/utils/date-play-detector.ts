import type {
  AttendanceSensitivity,
  CommentFilterMode,
  CommentFilterSettings,
} from '@/utils/comment-filter-settings';

const NORMALIZE_SPACE_REGEX = /\s+/g;
const YEAR_LIKE_TOKEN_REGEX = /(?:\b\d{3,4}\b|\d{1,4}\s*년(?:도)?)/;

const RELATIVE_TIME_EXCLUSION_REGEX = /(?:\b\d{1,2}\s*년\s*전\b|\b\d+\s*years?\s*ago\b)/;
const RELEASE_CONTEXT_EXCLUSION_REGEX =
  /(발매|출시|공개|개봉|발표|데뷔|결성|콘서트|공연|투어|앨범|음반|싱글|뮤비|뮤직비디오|리마스터|remaster|release|released|album|single|debut|concert|tour|live\s*version)/;

const BASE_DATE_PLAY_CALLOUT_REGEX =
  /(듣는\s*사람|보는\s*사람|있는\s*(?:사람|분)|있나요|있나|still\s*listening|anyone\s*here|who'?s\s*here|still\s*watching)/;
const BASE_YEAR_TO_CALLOUT_PROXIMITY_REGEX =
  /\b\d{1,4}\s*(?:년|년도)?\b.{0,24}(듣는\s*사람|보는\s*사람|있는\s*(?:사람|분)|있나요|있나|still\s*listening|anyone\s*here|who'?s\s*here|still\s*watching)/;
const BASE_CALLOUT_TO_YEAR_PROXIMITY_REGEX =
  /(듣는\s*사람|보는\s*사람|있는\s*(?:사람|분)|있나요|있나|still\s*listening|anyone\s*here|who'?s\s*here|still\s*watching).{0,24}\b\d{1,4}\s*(?:년|년도)?\b/;

const WEAK_BASE_PATTERNS: RegExp[] = [
  /\d{4}\s*(?:년|년도)?\s*(?:에도|인데|에)?\s*(?:듣는|보는|시청\s*중인|듣고\s*있는|보고\s*있는)\s*(?:사람|분|있나요|있나|\?)+/,
  /\d{2,4}\s*(?:년|년도)?\s*(?:에도|에)?\s*(?:보러\s*오(?:신|셨)?\s*분(?:들)?|보고\s*있(?:습니다|어요)?|듣고\s*있(?:습니다|어요)?|듣고\s*갑니다|찾아왔(?:어요|습니다)?)/,
  /\d{2,4}\s*(?:년|년도)?\s*(?:설날|추석|연말|연초)?\s*(?:에도|에|인데)?\s*(?:보고\s*있(?:습니다|어요)?|듣고\s*있(?:습니다|어요)?)/,
  /\d{4}\s*(?:년|년도)?\s*(?:에도|에|인데)?\s*(?:있나요|있는\s*(?:사람|분)|살아\s*있나요)/,
  /\d{2,4}\s*년\s*\d{1,2}\s*월(?:달)?(?:\s*\d{1,2}\s*일)?\s*(?:에도|인데|에)?\s*(?:보고\s*있(?:습니다|어요)?|듣고\s*있(?:습니다|어요)?|시청\s*중|찾아왔(?:어요|습니다)?)/,
  /\d{4}\s+\d{1,2}\s*월(?:달)?(?:\s*\d{1,2}\s*일)?\s*(?:에도|인데|에)?\s*(?:보고\s*있(?:습니다|어요)?|듣고\s*있(?:습니다|어요)?)/,
  /(?:지금|현재)\s*\d{4}\s*(?:년|년도)?\s*(?:인데|에도)?\s*(?:듣는|보는|사람|분)/,
  /\b\d{4}\b\s*(?:and\s*)?(?:still\s*listening|anyone\s*here|who'?s\s*here|still\s*watching)\b/,
  /(?:still\s*listening|anyone\s*here|who'?s\s*here|still\s*watching).{0,30}\b\d{4}\b/,
];

const STRONG_BASE_PATTERNS: RegExp[] = [
  ...WEAK_BASE_PATTERNS,
  /\d{1,4}\s*(?:년|년도)?\s*(?:에도|인데|때|도|에)?\s*(?:아직도\s*)?(?:듣는|보는|시청\s*중인|듣고\s*있는|보고\s*있는)\s*(?:사람|분|있나요|있나|\?)+/,
  /\d{2,4}\s*년\s*\d{1,2}\s*월(?:달)?(?:\s*\d{1,2}\s*일)?\s*(?:에도|인데|에)?\s*(?:보고\s*있(?:습니다|어요)?|듣고\s*있(?:습니다|어요)?|시청\s*중|찾아왔(?:어요|습니다)?|왔(?:다|어요|습니다)|입니다|이네요|임|너무\s*감사(?:합니다|해요)?|ㅎ{2,}|ㅋ{2,}|❤)/,
  /\d{2,4}\s*(?:년|년도)?\s*(?:에도|에)?\s*(?:보러\s*오(?:신|셨)?\s*분(?:들)?|행복하(?:세요|시길)|감사(?:합니다|해요)?|들어줘야지|듣고\s*갑니다|최애곡|가창력|소오름|소름)/,
  /\d{2,4}\s*(?:년|년도)?\s*(?:에도|에)?\s*(?:✋|✋️)/,
  /(?:지금|현재|벌써)\s*\d{1,4}\s*(?:년|년도)?\s*(?:인데|에도)?\s*(?:듣는|보는|사람|분)/,
  /\b\d{3,4}\b\s*(?:and\s*)?(?:still\s*listening|anyone\s*here|who'?s\s*here|still\s*watching)\b/,
  /(?:still\s*listening|anyone\s*here|who'?s\s*here|still\s*watching).{0,30}\b\d{3,4}\b/,
];

function normalizeText(text: string): string {
  return text.replace(NORMALIZE_SPACE_REGEX, ' ').trim().toLowerCase();
}

function hasYearLikeToken(text: string): boolean {
  return YEAR_LIKE_TOKEN_REGEX.test(text);
}

function hasBaseDatePlayCallout(text: string): boolean {
  return BASE_DATE_PLAY_CALLOUT_REGEX.test(text);
}

function hasBaseYearCalloutProximity(text: string): boolean {
  if (BASE_YEAR_TO_CALLOUT_PROXIMITY_REGEX.test(text)) {
    return true;
  }

  return BASE_CALLOUT_TO_YEAR_PROXIMITY_REGEX.test(text);
}

function matchesAnyPattern(text: string, patternList: RegExp[]): boolean {
  for (const pattern of patternList) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

function getBasePatternList(mode: CommentFilterMode): RegExp[] {
  if (mode === 'strong') {
    return STRONG_BASE_PATTERNS;
  }

  return WEAK_BASE_PATTERNS;
}

function containsAnyKeyword(text: string, keywordList: string[]): boolean {
  for (const keyword of keywordList) {
    if (text.includes(keyword)) {
      return true;
    }
  }

  return false;
}

function getAttendanceTokenPattern(sensitivity: AttendanceSensitivity): string | null {
  if (sensitivity === 'low') {
    return null;
  }

  if (sensitivity === 'balanced') {
    return '(출석|출첵|출석체크)';
  }

  return '(출석|출첵|출석체크|손\\s*\\?)';
}

function getYearRangePattern(mode: CommentFilterMode): string {
  if (mode === 'strong') {
    return '\\d{1,4}';
  }

  return '\\d{4}';
}

function matchesAttendancePattern(
  text: string,
  mode: CommentFilterMode,
  sensitivity: AttendanceSensitivity,
): boolean {
  const attendanceTokenPattern = getAttendanceTokenPattern(sensitivity);
  if (attendanceTokenPattern === null) {
    return false;
  }

  const yearRangePattern = getYearRangePattern(mode);

  const forwardPattern = new RegExp(
    `\\b${yearRangePattern}\\s*(?:년|년도)?\\b.{0,20}${attendanceTokenPattern}`,
  );
  if (forwardPattern.test(text)) {
    return true;
  }

  const backwardPattern = new RegExp(
    `${attendanceTokenPattern}.{0,20}\\b${yearRangePattern}\\s*(?:년|년도)?\\b`,
  );

  return backwardPattern.test(text);
}

function shouldExcludeByContext(text: string): boolean {
  if (RELATIVE_TIME_EXCLUSION_REGEX.test(text)) {
    return true;
  }

  if (RELEASE_CONTEXT_EXCLUSION_REGEX.test(text)) {
    return true;
  }

  return false;
}

export function isDatePlayComment(
  text: string,
  settings: CommentFilterSettings,
): boolean {
  const normalizedText = normalizeText(text);

  if (normalizedText.length === 0) {
    return false;
  }

  if (containsAnyKeyword(normalizedText, settings.whitelistKeywords)) {
    return false;
  }

  if (!hasYearLikeToken(normalizedText)) {
    return false;
  }

  if (containsAnyKeyword(normalizedText, settings.exclusionKeywords)) {
    return false;
  }

  const hasBaseCallout = hasBaseDatePlayCallout(normalizedText);

  if (shouldExcludeByContext(normalizedText) && !hasBaseCallout) {
    return false;
  }

  const basePatternList = getBasePatternList(settings.mode);
  if (matchesAnyPattern(normalizedText, basePatternList)) {
    return true;
  }

  if (
    matchesAttendancePattern(
      normalizedText,
      settings.mode,
      settings.attendanceSensitivity,
    )
  ) {
    return true;
  }

  if (settings.mode === 'strong') {
    return hasBaseCallout && hasBaseYearCalloutProximity(normalizedText);
  }

  return false;
}
