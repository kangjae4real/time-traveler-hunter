import type { CommentFilterSettings } from '@/utils/comment-filter-settings';
import { isDatePlayComment } from '@/utils/date-play-detector';

const COMMENT_TEXT_SELECTOR =
  '#content-text, yt-formatted-string#content-text, .comment-content, .comment-text';
const REPLACED_COMMENT_ATTR = 'data-time-traveler-replaced';
const REPLACED_TEXT_CLASS_NAME = 'time-traveler-hunter-replaced-text';
const STYLE_ELEMENT_ID = 'time-traveler-hunter-style';
const REPLACEMENT_TEXT = '확장프로그램에 의해 숨김처리됨.';

const originalCommentTextMap = new WeakMap<HTMLElement, string>();

export type YouTubeCommentCleanerController = {
  updateSettings: (settings: CommentFilterSettings) => void;
};

type ProcessSummary = {
  hiddenCount: number;
  totalCount: number;
};

function ensureHiddenCommentStyle(): void {
  if (document.getElementById(STYLE_ELEMENT_ID) !== null) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = STYLE_ELEMENT_ID;
  styleElement.textContent = `.${REPLACED_TEXT_CLASS_NAME}{opacity:0.75 !important;font-style:italic !important;}`;

  const parentElement = document.head ?? document.documentElement;
  parentElement.appendChild(styleElement);
}

function getSourceCommentText(commentTextElement: HTMLElement): string {
  const storedCommentText = originalCommentTextMap.get(commentTextElement);
  if (storedCommentText !== undefined) {
    return storedCommentText;
  }

  return commentTextElement.innerText;
}

function replaceCommentText(commentTextElement: HTMLElement): void {
  const sourceCommentText = getSourceCommentText(commentTextElement);

  if (!originalCommentTextMap.has(commentTextElement)) {
    originalCommentTextMap.set(commentTextElement, sourceCommentText);
  }

  if (commentTextElement.getAttribute(REPLACED_COMMENT_ATTR) !== 'true') {
    console.warn('[Time Traveler Hunter] hidden date-play comment:', sourceCommentText);
  }

  commentTextElement.innerText = REPLACEMENT_TEXT;
  commentTextElement.classList.add(REPLACED_TEXT_CLASS_NAME);
  commentTextElement.setAttribute(REPLACED_COMMENT_ATTR, 'true');
}

function restoreCommentTextIfNeeded(commentTextElement: HTMLElement): void {
  if (commentTextElement.getAttribute(REPLACED_COMMENT_ATTR) !== 'true') {
    return;
  }

  const sourceCommentText = originalCommentTextMap.get(commentTextElement);
  if (sourceCommentText !== undefined) {
    commentTextElement.innerText = sourceCommentText;
  }

  commentTextElement.classList.remove(REPLACED_TEXT_CLASS_NAME);
  commentTextElement.removeAttribute(REPLACED_COMMENT_ATTR);
}

function processCommentTextElement(
  commentTextElement: HTMLElement,
  settings: CommentFilterSettings,
): boolean {
  const commentText = getSourceCommentText(commentTextElement);
  const shouldHide = isDatePlayComment(commentText, settings);

  if (shouldHide) {
    replaceCommentText(commentTextElement);
    return true;
  }

  restoreCommentTextIfNeeded(commentTextElement);
  return false;
}

function processCommentTextList(
  commentTextList: HTMLElement[],
  settings: CommentFilterSettings,
): ProcessSummary {
  let hiddenCount = 0;

  for (const commentTextElement of commentTextList) {
    if (processCommentTextElement(commentTextElement, settings)) {
      hiddenCount += 1;
    }
  }

  return {
    hiddenCount,
    totalCount: commentTextList.length,
  };
}

function toCommentTextElementList(elementList: NodeListOf<Element>): HTMLElement[] {
  const commentTextElementList: HTMLElement[] = [];

  for (const element of elementList) {
    if (element instanceof HTMLElement) {
      commentTextElementList.push(element);
    }
  }

  return commentTextElementList;
}

function processAllCommentTexts(settings: CommentFilterSettings): ProcessSummary {
  const commentTextElementList = toCommentTextElementList(
    document.querySelectorAll(COMMENT_TEXT_SELECTOR),
  );

  return processCommentTextList(commentTextElementList, settings);
}

function collectCommentTextElementsFromNode(node: Node): HTMLElement[] {
  if (!(node instanceof Element)) {
    return [];
  }

  const commentTextElementList: HTMLElement[] = [];

  if (node.matches(COMMENT_TEXT_SELECTOR) && node instanceof HTMLElement) {
    commentTextElementList.push(node);
  }

  const nestedTextElements = toCommentTextElementList(
    node.querySelectorAll(COMMENT_TEXT_SELECTOR),
  );
  commentTextElementList.push(...nestedTextElements);

  return commentTextElementList;
}

function processAddedNode(
  node: Node,
  settings: CommentFilterSettings,
): ProcessSummary {
  const commentTextElementList = collectCommentTextElementsFromNode(node);

  return processCommentTextList(commentTextElementList, settings);
}

function handleMutations(
  mutations: MutationRecord[],
  settings: CommentFilterSettings,
): void {
  for (const mutation of mutations) {
    for (const addedNode of mutation.addedNodes) {
      processAddedNode(addedNode, settings);
    }
  }
}

function logScanSummary(context: string, summary: ProcessSummary): void {
  console.warn(
    `[Time Traveler Hunter] ${context} scanned=${summary.totalCount}, hidden=${summary.hiddenCount}`,
  );
}

export function startYouTubeCommentCleaner(
  initialSettings: CommentFilterSettings,
): YouTubeCommentCleanerController {
  let currentSettings: CommentFilterSettings = initialSettings;

  function getCurrentSettings(): CommentFilterSettings {
    return currentSettings;
  }

  function updateSettings(settings: CommentFilterSettings): void {
    currentSettings = settings;
    const summary = processAllCommentTexts(currentSettings);
    logScanSummary('settings-updated', summary);
  }

  function onMutations(mutations: MutationRecord[]): void {
    handleMutations(mutations, getCurrentSettings());
  }

  ensureHiddenCommentStyle();

  const initialSummary = processAllCommentTexts(currentSettings);
  logScanSummary('initial-scan', initialSummary);

  const observer = new MutationObserver(onMutations);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return {
    updateSettings,
  };
}
