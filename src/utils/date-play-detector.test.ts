import { describe, expect, test } from 'bun:test';

import {
  getDefaultFilterSettings,
  type AttendanceSensitivity,
  type CommentFilterMode,
  type CommentFilterSettings,
} from '@/utils/comment-filter-settings';
import { isDatePlayComment } from '@/utils/date-play-detector';

type ModeDetectionCase = {
  text: string;
  weak: boolean;
  strong: boolean;
};

function buildSettings(
  mode: CommentFilterMode,
  overrides?: Partial<CommentFilterSettings>,
): CommentFilterSettings {
  const defaults = getDefaultFilterSettings();

  return {
    mode,
    attendanceSensitivity: overrides?.attendanceSensitivity ?? defaults.attendanceSensitivity,
    exclusionKeywords: overrides?.exclusionKeywords ?? defaults.exclusionKeywords,
    whitelistKeywords: overrides?.whitelistKeywords ?? defaults.whitelistKeywords,
  };
}

function makeModeCaseName(modeCase: ModeDetectionCase): string {
  return `${modeCase.text} -> weak:${modeCase.weak} strong:${modeCase.strong}`;
}

function assertModeDetection(modeCase: ModeDetectionCase): void {
  expect(isDatePlayComment(modeCase.text, buildSettings('weak'))).toBe(modeCase.weak);
  expect(isDatePlayComment(modeCase.text, buildSettings('strong'))).toBe(modeCase.strong);
}

function runModeCase(modeCase: ModeDetectionCase): void {
  test(makeModeCaseName(modeCase), function runModeCaseTest() {
    assertModeDetection(modeCase);
  });
}

const MODE_DETECTION_CASES: ModeDetectionCase[] = [
  { text: '2026년에도 듣는 사람?', weak: true, strong: true },
  { text: '지금 2025년인데 듣는 사람', weak: true, strong: true },
  { text: '2025년 있나요?', weak: true, strong: true },
  { text: 'Anyone here in 2024?', weak: true, strong: true },
  { text: 'Still listening 2012', weak: true, strong: true },
  { text: '108년에도 듣는 사람?', weak: false, strong: true },
  { text: '3년에도 듣는 사람', weak: false, strong: true },
  { text: '2008년 발매곡 진짜 좋다', weak: false, strong: false },
  { text: '2011년 콘서트 라이브 버전 최고', weak: false, strong: false },
  { text: '3년 전 영상인데 아직도 좋다', weak: false, strong: false },
  { text: '2008년 발매인데 아직도 듣는 사람?', weak: false, strong: true },
  { text: 'release 2012 remaster quality is great', weak: false, strong: false },
  { text: '2026년 레전드', weak: false, strong: false },
  { text: '벌써 2026년이네', weak: false, strong: false },
  { text: '2026년 출석', weak: true, strong: true },
  { text: '2 years ago this was my favorite song', weak: false, strong: false },
  { text: '2026년도 듣는 사람?', weak: true, strong: true },
  { text: '2026 듣는 사람?', weak: true, strong: true },
  { text: 'in 2026 still watching?', weak: true, strong: true },
  { text: 'still watching in 2026?', weak: true, strong: true },
  { text: '2024년에 나온 곡인데 좋다', weak: false, strong: false },
  { text: '2019년 버전이 더 좋음', weak: false, strong: false },
  { text: '2024년 콘서트 영상 퀄리티 좋다', weak: false, strong: false },
  { text: '2003년에 데뷔한 팀', weak: false, strong: false },
  { text: 'release build 2026 is stable', weak: false, strong: false },
  { text: '벌써 2026년인데 난 아직 학생', weak: false, strong: false },
  { text: '지금은 2026년이고 이 노래는 2008년 발매다', weak: false, strong: false },
  { text: '2026년에도 보는 사람 손?', weak: true, strong: true },
  { text: '2026년에도 보고 있는 사람?', weak: true, strong: true },
  { text: '2026 anyone here', weak: true, strong: true },
  { text: 'anyone here 2026', weak: true, strong: true },
  { text: '이 곡은 2008년 발매, 난 아직도 듣는 사람', weak: false, strong: true },
  { text: '2008년 발매 / still listening in 2026', weak: true, strong: true },
  { text: '2026년 3월1일에도 보고있습니다', weak: true, strong: true },
  { text: '2026년 2월 24일에도 보고 있습니다.', weak: true, strong: true },
  { text: '2026년 3월 2일 입니다', weak: false, strong: true },
  { text: '2026년 2월 8일 ㅎㅎㅎ', weak: false, strong: true },
  { text: '2026년  2월  8일  ㅎㅎㅎ', weak: false, strong: true },
  { text: '2026년에도 보러오신 분들~~ 우리 모두 행복해요^^', weak: true, strong: true },
  { text: '25년도 듣고갑니다', weak: true, strong: true },
  { text: '2026년 설날에도 듣고있습니다😊', weak: true, strong: true },
  { text: '2026 1월달에도 보고 있습니다', weak: true, strong: true },
  { text: '23년에도 보러오신분들 행복하세요,, 그리고 사랑하세요 😊', weak: true, strong: true },
  { text: '2024년도 ✋️', weak: false, strong: true },
  { text: '26년도 들어줘야지~ 감사합니다.', weak: false, strong: true },
  { text: '24년 12월 14일에도 찾아왔어요❤', weak: true, strong: true },
  { text: '2024년도에도 소오름 끼치는 이승환 가창력과 가사 작곡❤❤', weak: false, strong: true },
  {
    text: '26년 2월 22일에 듣고 있어요 최애곡 입니다 이승환님 목소리와 절절함 무엇도 대체 안되요',
    weak: true,
    strong: true,
  },
  { text: '25년 5월 너무 감사합니다', weak: false, strong: true },
  { text: '2024년에도 보고있어요', weak: true, strong: true },
  { text: '3 years ago but still listening', weak: false, strong: false },
  { text: '2026?', weak: false, strong: false },
  { text: '2008년생인데 이 노래 안다', weak: false, strong: false },
];

function assertAttendanceSensitivity(
  text: string,
  mode: CommentFilterMode,
  sensitivity: AttendanceSensitivity,
  expected: boolean,
): void {
  const settings = buildSettings(mode, { attendanceSensitivity: sensitivity });
  expect(isDatePlayComment(text, settings)).toBe(expected);
}

function makeSensitivityCaseName(
  text: string,
  mode: CommentFilterMode,
  sensitivity: AttendanceSensitivity,
  expected: boolean,
): string {
  return `${text} | ${mode}/${sensitivity} -> ${expected}`;
}

function runSensitivityCase(
  text: string,
  mode: CommentFilterMode,
  sensitivity: AttendanceSensitivity,
  expected: boolean,
): void {
  test(
    makeSensitivityCaseName(text, mode, sensitivity, expected),
    function runSensitivityCaseTest() {
      assertAttendanceSensitivity(text, mode, sensitivity, expected);
    },
  );
}

function assertKeywordRule(
  text: string,
  overrides: Partial<CommentFilterSettings>,
  expected: boolean,
): void {
  const settings = buildSettings('strong', overrides);
  expect(isDatePlayComment(text, settings)).toBe(expected);
}

describe('isDatePlayComment mode cases', function modeCaseSuite() {
  for (const modeCase of MODE_DETECTION_CASES) {
    runModeCase(modeCase);
  }
});

describe('isDatePlayComment attendance sensitivity', function sensitivitySuite() {
  runSensitivityCase('2026년 출석', 'weak', 'low', false);
  runSensitivityCase('2026년 출석', 'weak', 'balanced', true);
  runSensitivityCase('2026년 출석', 'weak', 'high', true);

  runSensitivityCase('출첵 2026', 'weak', 'low', false);
  runSensitivityCase('출첵 2026', 'weak', 'balanced', true);

  runSensitivityCase('2026 손?', 'weak', 'balanced', false);
  runSensitivityCase('2026 손?', 'weak', 'high', true);

  runSensitivityCase('2026 손?', 'strong', 'balanced', false);
  runSensitivityCase('2026 손?', 'strong', 'high', true);
});

describe('isDatePlayComment keyword overrides', function keywordSuite() {
  test('exclusion keyword keeps matched comment', function exclusionKeywordTest() {
    assertKeywordRule(
      '2026년에도 듣는 사람 인생곡',
      { exclusionKeywords: ['인생곡'] },
      false,
    );
  });

  test('whitelist keyword always keeps comment', function whitelistKeywordTest() {
    assertKeywordRule(
      '2026년에도 듣는 사람 무조건표시',
      { whitelistKeywords: ['무조건표시'] },
      false,
    );
  });

  test('whitelist beats exclusion and base detector', function whitelistPriorityTest() {
    assertKeywordRule(
      '2026년에도 듣는 사람 커스텀보호',
      {
        exclusionKeywords: ['무관키워드'],
        whitelistKeywords: ['커스텀보호'],
      },
      false,
    );
  });
});
