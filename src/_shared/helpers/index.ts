import React from "react";
import type { MutableRefObject } from "react";

/* Shadows the global so the file type-checks without package: `@types/node`. */
declare const process: {
  env: {
    NODE_ENV?: string;
    [key: string]: string | undefined;
  };
};

/**
 * @typedef {Object} ReactAppContextOption
 * @property {Boolean} noStrictEnvCheck
 */

/**
 * isCreateReactApp_Context:
 *
 *
 * @param {ReactAppContextOption} 
 *
 * @returns {Boolean}
 */
const isCreateReactApp_Context = ({ noStrictEnvCheck = false }) => {
  const hasCRAEnvVarPrefix = (noStrictCheck = false) =>
    Boolean(
      noStrictCheck ||
        (!("env" in import.meta) &&
          Object.keys(process.env).filter((envKey) =>
            envKey.startsWith("REACT_APP_")
          ).length)
    );
  /* @NOTE: Create-React-App is deprecated and out-of-commision however, it may still be necessary to check envs for its' usage */
  /* @NOTE: Also, Create-React-App does support and recognize `import.meta` */
  /* @CHECK: https://www.reddit.com/r/reactjs/comments/1e0wye1/conditionally_use_processenv_or_importmetaenv/ */
  return (
    Boolean(import.meta) &&
    process &&
    "env" in process &&
    Boolean(process.env.NODE_ENV) &&
    hasCRAEnvVarPrefix(noStrictEnvCheck)
  );
};

/**
 * isViteApp_Context:
 *
 *
 *
 *
 * @returns {Boolean}
 */
const isViteApp_Context = () => {
  const hasViteEnvVarPrefix = () =>
    Boolean(
      Object.keys(import.meta.env).filter((envKey) =>
        envKey.startsWith("VITE_")
      ).length
    );
  /* @NOTE: Ensuring that Vite is properly setup with well-prefixed env vars */
  /* @CHECK: https://www.reddit.com/r/reactjs/comments/1e0wye1/conditionally_use_processenv_or_importmetaenv/ */
  return (
    Boolean(import.meta) &&
    "env" in import.meta &&
    Boolean(import.meta.env.MODE) &&
    hasViteEnvVarPrefix()
  );
};

/**
 * isJestEnv_Capable:
 *
 *
 * @param {ReactAppContextOption} 
 *
 * @returns {Boolean}
 */
const isJestEnv_Capable = ({ noStrictEnvCheck = true }) => {
  const hasJestGlobalDefined =
    "jest" in global &&
    typeof global["jest"] !== "undefined" &&
    global["jest"] !== null;
  const hasJestExpectDefined =
    "expect" in global &&
    typeof global["expect"] !== "undefined" &&
    global["expect"] !== null;

  return (
    isCreateReactApp_Context({ noStrictEnvCheck }) &&
    process.env.NODE_ENV === "test" &&
    hasJestExpectDefined &&
    hasJestGlobalDefined
  );
};

/**
 * isVitestEnv_Capable:
 *
 *
 *
 *
 * @returns {Boolean}
 */
const isVitestEnv_Capable = () => {
  return (
    (isViteApp_Context() || (process && "env" in process)) &&
    (process.env.VITEST || import.meta.env.VITEST)
  );
};

/**
 * isDOMElementOverflowing:
 *
 * @param {HTMLElement} element -
 *
 * @returns {Boolean}
 */
const isDOMElementOverflowing = (element: HTMLElement): boolean => {
  if (!element || !(element instanceof window.HTMLElement)) {
    throw new TypeError(
      `isDOMElementOverflowing(${element}): argument 1 is not a DOM element`
    );
  }
  
  const hasHorizontalOverflow = element.scrollWidth > element.clientWidth;
  const hasVerticalOverflow = element.scrollHeight > element.clientHeight;

  return hasHorizontalOverflow || hasVerticalOverflow;
};

/**
 * isElementOverflowingParent:
 *
 * @param {HTMLElement} element -
 *
 * @returns {Boolean}
 */
const isElementOverflowingParent = (element: HTMLElement) => {
  if (!element || !(element instanceof window.HTMLElement)) {
    throw new TypeError(`
      isElementOverflowingParent(${element}): argument 1 is not a DOM element`
    );
  }
  
  const parent = element.parentElement;
  if (!parent) return false;

  const childRect = element.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();

  /* @HINT: Checks if the child extends past any of the parent's four boundaries */
  return (
    childRect.left < parentRect.left ||
    childRect.right > parentRect.right ||
    childRect.top < parentRect.top ||
    childRect.bottom > parentRect.bottom
  );
};

export const IS_TEST_ENV = isCreateReactApp_Context({ noStrictEnvCheck: false }) 
  && (isJestEnv_Capable({ noStrictEnvCheck: false }) || isVitestEnv_Capable())
    ? process.env.NODE_ENV === "test"
    : import.meta.env.MODE === "test" || Boolean(import.meta.env.VITEST);
export const IS_DEV_ENV = isCreateReactApp_Context({ noStrictEnvCheck: false }) 
  ? process.env.NODE_ENV !== "production"
  : isViteApp_Context() 
    ? import.meta.env.DEV 
    : false;

/* 
  @INFO:
    
  Payload carried by the `curr:page-trigger` custom event. The listener is bound
  to the wrapper `<section>` DOM node, so `event.currentTarget` is always the
  `<section>` DOM node and can never expose the clicked link's dataset (if any).
  
  Therefore, the page number now travels in `detail` instead.
*/
export type CurrentPageTriggerDetail = { page: number };

export type PaginatorTriggerCallbacks = {
  onPrevActionTriggered?: () => void;
  onNextActionTriggered?: () => void;
  onCurrActionTriggered?: (page: number) => void;
};

export type PaginatorEventHandlers = {
  onPrev: () => void;
  onNext: () => void;
  onPrevSpan: () => void;
  onNextSpan: () => void;
  onCurrentPage: (page: number) => void;
};

export type PaginatorRenderProps = {
  disablePrevButton: boolean;
  disableNextButton: boolean;
  showPrevPageSliceSpanButton: boolean;
  showNextPageSliceSpanButton: boolean;
  showFirstPageButton: boolean;
  showLastPageButton: boolean;
  currentPage: number;
  totalPageCount: number;
  pageNumbers: number[];
  canUseURLState: boolean;
  pageSearchParamName: string;
  searchParams: URLSearchParams;
  pageEventPrefix: string;
  ref: /* RefObject<HTMLElement | null> */ MutableRefObject<HTMLElement | null>;
};

export const PAGINATOR_EVENTS = {
  prev: "prev:page-trigger",
  next: "next:page-trigger",
  prevSpan: "prev_span_page-trigger",
  nextSpan: "next_span_page-trigger",
  current: "curr:page-trigger",
} as const;

/**
 * toClassNameTokens:
 *
 *
 *
 *
 *
 * @param {=String} className 
 * 
 * @returns {Array.<String>}
 */
const toClassNameTokens = (className?: string): string[] => {
  /* 
    @HINT:

    Splits a className string into unique tokens. `accordion_Open` is owned
    by the accordion itself, so a consumer can never add or remove it.
  */
  return Array.from(
    new Set(
      (className || "")
        .split(/\s+/)
        .filter((token) => token !== "" && token !== TOGGLE_CLASSNAME)
    )
  );
};

/**
 * composeClassesModule:
 *
 *
 *
 *
 *
 * @param {Array.<*>} styles
 *
 * @returns {String}
 */
 export const composeClassesModule = (...styles: Array<string | false | null | undefined>): string => {
  return Array.from(new Set(styles.filter(Boolean).join(" "))).join(" ");
};

/**
 * getPageSliceSpan:
 *
 *
 *
 *
 *
 * @param {Number} currentPage -
 * @param {Number} totalPage -
 * @param {=Number} pagesPerSlice -
 * @param {=Number} step -
 *
 * @returns {Array.<number>}
 */
const getPageSliceSpan = (
  currentPage: number,
  totalPage: number,
  pagesPerSlice = 10,
  step = 1
): { pageNumbers: number[] } => {
  if (totalPage <= 0) {
    return { pageNumbers: [] as number[] };
  }

  let minPageLimit =
    Math.floor(currentPage / pagesPerSlice) * pagesPerSlice + 1;
  if (currentPage % pagesPerSlice === 0) {
    minPageLimit -= pagesPerSlice;
  }
  minPageLimit = Math.max(minPageLimit, 1);

  const maxPageLimit = Math.min(minPageLimit + pagesPerSlice - 1, totalPage);
  const pageSliceSpan: number[] = [];

  for (let i = minPageLimit; i <= maxPageLimit && i * step <= totalPage; i++) {
    pageSliceSpan.push(i * step);
  }

  return {
    pageNumbers: pageSliceSpan,
  } as const;
};

/**
 * calculateRange:
 *
 *
 * 
 *
 * @param {Number} fromIndex -
 * @param {Number} toIndex -
 * @param {=Number} step -
 *
 */
const calculateRange = (
  fromIndex: number,
  toIndex: number,
  step: number = 1
): number[] => {
  const length = Math.max(toIndex - fromIndex + 1, 0);

  return Array.from({ length }, (_, i) => fromIndex + 1 + i * step);
};

/**
 * getPageSlingSpan:
 *
 *
 *
 *
 * @param {Number} pageCount -
 * @param {Number} currentPageIndex -
 * @param {=Number} step -
 *
 * @returns {Array.<number>}
 */
const getPageSlidingSpan = (
  pageCount: number,
  currentPageIndex: number,
  step = 1
): { pageNumbers: number[] } => {
  const safeStartIndex = Number.isFinite(currentPageIndex)
    ? Math.max(currentPageIndex, 0)
    : 0;
  const safeEndIndex = Number.isFinite(pageCount) ? pageCount - 1 : -1;

  return {
    pageNumbers: calculateRange(safeStartIndex, safeEndIndex, step),
  } as const;
};

/**
 * toPositiveInteger:
 *
 *
 *
 *
 * @param {*} value - 
 * @param {Number} fallback - 
 *
 * @returns {Number}
 */
export const toPositiveInteger = (value: unknown, fallback: number): number => {
  if (typeof fallback !== "number") {
    throw new TypeError(`toPositiveInteger(${value}): argument 2 is not a number`)
  }
  const asNumber = Number(value);
  return Number.isFinite(asNumber) && Math.trunc(asNumber) >= 1
    ? Math.trunc(asNumber)
    : fallback;
};

/**
 * toCountInteger:
 *
 *
 *
 *
 *
 * @returns {Number}
 */
export const toCountInteger = (value: unknown, fallback: number): number => {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) && Math.trunc(asNumber) >= 0
    ? Math.trunc(asNumber)
    : fallback;
};

/**
 * clampIndex:
 *
 *
 *
 *
 *
 * @returns {Number}
 */
export const clampIndex = (value: number, maxIndex: number): number =>
  Math.min(
    Math.max(Number.isFinite(value) ? Math.trunc(value) : 0, 0),
    Math.max(maxIndex, 0)
  );

/**
 * @typedef {Object} PageWindowConfig
 * @property {Number} currentPage -
 * @property {Number} totalPageCount -
 * @property {Number} pagesPerSlice -
 * @property {Boolean} pageSliceSpanActive
 */

/**
 * @typedef {Object} PageRange
 * @property {Array.<number>} pageNumbers - An array of page numbers.
 */

/**
 * getVisiblePageWindow:
 *
 * The single place either hook decides which page numbers are on screen.
 *
 * @param {PageWindowConfig} config
 *
 * @returns {PageRange}
 */
export const getVisiblePageWindow = ({
  currentPage,
  totalPageCount,
  pagesPerSlice,
  pageSliceSpanActive,
}: {
  currentPage: number;
  totalPageCount: number;
  pagesPerSlice: number;
  pageSliceSpanActive: boolean;
}): { pageNumbers: number[] } => {
  if (totalPageCount <= 0) {
    return { pageNumbers: [] as number[] } as const;
  }

  if (pageSliceSpanActive) {
    return getPageSliceSpan(currentPage, totalPageCount, pagesPerSlice);
  }

  let startPageForSlide = Math.max(
    currentPage - Math.floor(pagesPerSlice / 2),
    1
  );
  const endPageForSlide = Math.min(
    startPageForSlide + pagesPerSlice - 1,
    totalPageCount
  );
  startPageForSlide = Math.max(
    Math.min(startPageForSlide, endPageForSlide - pagesPerSlice + 1),
    1
  );

  return getPageSlidingSpan(endPageForSlide, startPageForSlide - 1);
};

/**
 * @typedef {Object} PageRenderContext
 * @property {Number} currentPage -
 * @property {Number} totalPageCount -
 * @property {Array.<number>} pageNumbers -
 * @property {Boolean} pageSliceSpanActive -
 * @property {Boolean} canUseURLState -
 * @property {String} pageSearchParamName -
 * @property {URLSearchParams} searchParams -
 * @property {React.MutableRefObject} ref -
 */

/**
 * @typedef {Object} PaginatorRenderProps
 * @property {Boolean} disablePrevButton -
 * @property {Boolean} disableNextButton -
 * @property {Boolean} showPrevPageSliceSpanButton -
 * @property {Boolean} showNextPageSliceSpanButton -
 * @property {Boolean} showFirstPageButton -
 * @property {Boolean} showLastPageButton -
 * @property {Number} currentPage -
 * @property {Number} totalPageCount -
 * @property {Array.<number>} pageNumbers -
 * @property {Boolean} canUseURLState -
 * @property {String} pageSearchParamName -
 * @property {URLSearchParams} searchParams -
 * @property {React.MutableRefObject} ref -
 */

/**
 * buildPaginatorRenderProps:
 *
 * Both hooks derive the same flags from the same inputs here, so
 * `<Paginator />` behaves identically whichever one feeds it.
 *
 * @param {PageRenderContext} context -
 *
 * @returns {PaginatorRenderProps}
 */
export const buildPaginatorRenderProps = ({
  currentPage,
  totalPageCount,
  pageNumbers,
  pageSliceSpanActive,
  canUseURLState,
  pageSearchParamName,
  pageEventPrefix,
  searchParams,
  ref,
}: {
  currentPage: number;
  totalPageCount: number;
  pageNumbers: number[];
  pageSliceSpanActive: boolean;
  canUseURLState: boolean;
  pageSearchParamName: string;
  pageEventPrefix: string;
  searchParams: URLSearchParams;
  ref: /* RefObject<HTMLElement | null> */ MutableRefObject<HTMLElement | null>;
}): PaginatorRenderProps => {
  const hasPages = pageNumbers.length > 0;
  const firstVisiblePage = hasPages ? pageNumbers[0]! : 0;
  const lastVisiblePage =
    hasPages && pageNumbers.length - 1 in pageNumbers
      ? pageNumbers[pageNumbers.length - 1]!
      : 0;

  return {
    disablePrevButton: totalPageCount === 0 || currentPage <= 1,
    disableNextButton: totalPageCount === 0 || currentPage >= totalPageCount,
    showPrevPageSliceSpanButton:
      pageSliceSpanActive && hasPages && firstVisiblePage > 1,
    showNextPageSliceSpanButton:
      pageSliceSpanActive && hasPages && lastVisiblePage < totalPageCount,
    showFirstPageButton: hasPages && firstVisiblePage > 1,
    showLastPageButton: hasPages && lastVisiblePage < totalPageCount,
    currentPage,
    totalPageCount,
    pageNumbers,
    canUseURLState,
    pageEventPrefix,
    pageSearchParamName: canUseURLState ? pageSearchParamName : "",
    /*
        @NOTE:
          
        Consumers in the `<Paginator />` component itself get a private copy 
        of `searchParams` rather than a reference to `searchParams` defined 
        here above.
  
        #[Defensive_Programming]
      */
    searchParams: new URLSearchParams(searchParams),
    ref,
  };
};

/**
 * sprintf:
 * 
 * Like `fmt.Sprintf` with Go-like error reporting.
 * 
 * @param {String} format -
 * @param {Array.<*>} args - 
 * 
 * @throws {TypeError}
 * @returns {String}
 */
export const sprintf = (format: string, ...args: unknown[]) => {
  let argIndex = 0;
  const usedArgs = new Array(args.length).fill(false);

  if (typeof format !== "string") {
    throw new TypeError("sprinf(...): argument 1 is not a string");
  }

  const result = format.replace(/%([%dsvx])/g, (match, verb) => {
    // Handle literal percent sign %%
    if (verb === '%') return '%';

    // Check for missing arguments
    if (argIndex >= args.length) {
      return `%!${verb}(MISSING)`;
    }

    const arg = args[argIndex];
    usedArgs[argIndex] = true;
    argIndex++;

    // Type checking for %d (signed decimal number)
    if (verb === 'd') {
      if (Number.isNaN(arg) || typeof arg !== 'number' || !Number.isInteger(arg)) {
        return `%!${verb}(${typeof arg}=${arg})`;
      }
      return arg.toString();
    }

    // Standard string/value formatting for %s or %v
    if (verb === 's' || verb === 'v') {
      return String(arg);
    }
    
    // Hexadecimal formatting for %x
    if (verb === 'x') {
      return typeof arg === 'number' ? arg.toString(16) : `%!${verb}(${typeof arg}=${arg})`;
    }

    return match; // Fallback for unsupported verbs
  });

  // Check for extra arguments not used by the format string
  let finalResult = result;

  args.forEach((arg, i) => {
    if (!usedArgs[i]) {
      finalResult += `%!(EXTRA ${typeof arg}=${arg})`;
    }
  });

  return finalResult;
};

/**
 * hasChildren:
 *
 *
 *
 *
 * 
 * @param {React.ReactNode} children -
 * @param {Number} count -
 * 
 * @returns {Boolean}
 */
export const hasChildren = (
  children: React.ReactNode | React.ReactNode[],
  count: number
): boolean => {
  if (!children && count === 0) {
    return true;
  }
  const childCount = React.Children.count(children);
  return childCount === count;
};

/**
 * hasRenderableChildren:
 *
 *
 *
 * 
 * @param {React.ReactNode} children - 
 * 
 * @returns {Boolean}
 */
export const hasRenderableChildren = (
  children: React.ReactNode | Function
): boolean => {
  if (typeof children === "function") {
    return true;
  }
  return React.Children.count(children as React.ReactNode) > 0;
};

/**
 * getChildrenOfType:
 *
 *
 *
 * @param {React.ReactNode} children -
 * @param {React.ComponentType} type -
 *
 * @returns {Array.<React.ReactNode>}
 */
const getChildrenOfType = <P>(
  children: React.ReactNode,
  type: React.ComponentType<P>
) => {
  /** @HINT: Keeps only the valid elements of a given component type, in order. */
  return React.Children.toArray(children).filter(
    (child): child is React.ReactElement<P> =>
      React.isValidElement(child) && child.type === type
  );
};

/**
 * isSubChild:
 *
 *
 *
 * 
 * @param {React.ReactNode} child -
 * @param {String} tag -
 * 
 * @returns {Boolean}
 */
 export const isSubChild = <C extends React.ReactNode>(
    child: C,
    tag: string
  ): child is C =>
    React.isValidElement<C>(child) &&
    (typeof child?.type === "function"
      ? child?.type?.name === tag
      : String(child?.type).includes(tag));


/**
 * @ignore
 * some key-codes definition and utils from closure-library
 * @author yiminghe@gmail.com
 */

export const KeyCode = {
  /**
   * MAC_ENTER
   */
  MAC_ENTER: 3,
  /**
   * BACKSPACE
   */
  BACKSPACE: 8,
  /**
   * TAB
   */
  TAB: 9,
  /**
   * NUMLOCK on FF/Safari Mac
   */
  NUM_CENTER: 12, // NUMLOCK on FF/Safari Mac
  /**
   * ENTER
   */
  ENTER: 13,
  /**
   * SHIFT
   */
  SHIFT: 16,
  /**
   * CTRL
   */
  CTRL: 17,
  /**
   * ALT
   */
  ALT: 18,
  /**
   * PAUSE
   */
  PAUSE: 19,
  /**
   * CAPS_LOCK
   */
  CAPS_LOCK: 20,
  /**
   * ESC
   */
  ESC: 27,
  /**
   * SPACE
   */
  SPACE: 32,
  /**
   * PAGE_UP
   */
  PAGE_UP: 33, // also NUM_NORTH_EAST
  /**
   * PAGE_DOWN
   */
  PAGE_DOWN: 34, // also NUM_SOUTH_EAST
  /**
   * END
   */
  END: 35, // also NUM_SOUTH_WEST
  /**
   * HOME
   */
  HOME: 36, // also NUM_NORTH_WEST
  /**
   * LEFT
   */
  LEFT: 37, // also NUM_WEST
  /**
   * UP
   */
  UP: 38, // also NUM_NORTH
  /**
   * RIGHT
   */
  RIGHT: 39, // also NUM_EAST
  /**
   * DOWN
   */
  DOWN: 40, // also NUM_SOUTH
  /**
   * PRINT_SCREEN
   */
  PRINT_SCREEN: 44,
  /**
   * INSERT
   */
  INSERT: 45, // also NUM_INSERT
  /**
   * DELETE
   */
  DELETE: 46, // also NUM_DELETE
  /**
   * ZERO
   */
  ZERO: 48,
  /**
   * ONE
   */
  ONE: 49,
  /**
   * TWO
   */
  TWO: 50,
  /**
   * THREE
   */
  THREE: 51,
  /**
   * FOUR
   */
  FOUR: 52,
  /**
   * FIVE
   */
  FIVE: 53,
  /**
   * SIX
   */
  SIX: 54,
  /**
   * SEVEN
   */
  SEVEN: 55,
  /**
   * EIGHT
   */
  EIGHT: 56,
  /**
   * NINE
   */
  NINE: 57,
  /**
   * QUESTION_MARK
   */
  QUESTION_MARK: 63, // needs localization
  /**
   * A
   */
  A: 65,
  /**
   * B
   */
  B: 66,
  /**
   * C
   */
  C: 67,
  /**
   * D
   */
  D: 68,
  /**
   * E
   */
  E: 69,
  /**
   * F
   */
  F: 70,
  /**
   * G
   */
  G: 71,
  /**
   * H
   */
  H: 72,
  /**
   * I
   */
  I: 73,
  /**
   * J
   */
  J: 74,
  /**
   * K
   */
  K: 75,
  /**
   * L
   */
  L: 76,
  /**
   * M
   */
  M: 77,
  /**
   * N
   */
  N: 78,
  /**
   * O
   */
  O: 79,
  /**
   * P
   */
  P: 80,
  /**
   * Q
   */
  Q: 81,
  /**
   * R
   */
  R: 82,
  /**
   * S
   */
  S: 83,
  /**
   * T
   */
  T: 84,
  /**
   * U
   */
  U: 85,
  /**
   * V
   */
  V: 86,
  /**
   * W
   */
  W: 87,
  /**
   * X
   */
  X: 88,
  /**
   * Y
   */
  Y: 89,
  /**
   * Z
   */
  Z: 90,
  /**
   * META
   */
  META: 91, // WIN_KEY_LEFT
  /**
   * WIN_KEY_RIGHT
   */
  WIN_KEY_RIGHT: 92,
  /**
   * CONTEXT_MENU
   */
  CONTEXT_MENU: 93,
  /**
   * NUM_ZERO
   */
  NUM_ZERO: 96,
  /**
   * NUM_ONE
   */
  NUM_ONE: 97,
  /**
   * NUM_TWO
   */
  NUM_TWO: 98,
  /**
   * NUM_THREE
   */
  NUM_THREE: 99,
  /**
   * NUM_FOUR
   */
  NUM_FOUR: 100,
  /**
   * NUM_FIVE
   */
  NUM_FIVE: 101,
  /**
   * NUM_SIX
   */
  NUM_SIX: 102,
  /**
   * NUM_SEVEN
   */
  NUM_SEVEN: 103,
  /**
   * NUM_EIGHT
   */
  NUM_EIGHT: 104,
  /**
   * NUM_NINE
   */
  NUM_NINE: 105,
  /**
   * NUM_MULTIPLY
   */
  NUM_MULTIPLY: 106,
  /**
   * NUM_PLUS
   */
  NUM_PLUS: 107,
  /**
   * NUM_MINUS
   */
  NUM_MINUS: 109,
  /**
   * NUM_PERIOD
   */
  NUM_PERIOD: 110,
  /**
   * NUM_DIVISION
   */
  NUM_DIVISION: 111,
  /**
   * F1
   */
  F1: 112,
  /**
   * F2
   */
  F2: 113,
  /**
   * F3
   */
  F3: 114,
  /**
   * F4
   */
  F4: 115,
  /**
   * F5
   */
  F5: 116,
  /**
   * F6
   */
  F6: 117,
  /**
   * F7
   */
  F7: 118,
  /**
   * F8
   */
  F8: 119,
  /**
   * F9
   */
  F9: 120,
  /**
   * F10
   */
  F10: 121,
  /**
   * F11
   */
  F11: 122,
  /**
   * F12
   */
  F12: 123,
  /**
   * NUMLOCK
   */
  NUMLOCK: 144,
  /**
   * SEMICOLON
   */
  SEMICOLON: 186, // needs localization
  /**
   * DASH
   */
  DASH: 189, // needs localization
  /**
   * EQUALS
   */
  EQUALS: 187, // needs localization
  /**
   * COMMA
   */
  COMMA: 188, // needs localization
  /**
   * PERIOD
   */
  PERIOD: 190, // needs localization
  /**
   * SLASH
   */
  SLASH: 191, // needs localization
  /**
   * APOSTROPHE
   */
  APOSTROPHE: 192, // needs localization
  /**
   * SINGLE_QUOTE
   */
  SINGLE_QUOTE: 222, // needs localization
  /**
   * OPEN_SQUARE_BRACKET
   */
  OPEN_SQUARE_BRACKET: 219, // needs localization
  /**
   * BACKSLASH
   */
  BACKSLASH: 220, // needs localization
  /**
   * CLOSE_SQUARE_BRACKET
   */
  CLOSE_SQUARE_BRACKET: 221, // needs localization
  /**
   * WIN_KEY
   */
  WIN_KEY: 224,
  /**
   * MAC_FF_META
   */
  MAC_FF_META: 224, // Firefox (Gecko) fires this for the meta key instead of 91
  /**
   * WIN_IME
   */
  WIN_IME: 229,

  // ======================== Function ========================
  /**
   * whether text and modified key is entered at the same time.
   */
  isTextModifyingKeyEvent: function isTextModifyingKeyEvent(e: KeyboardEvent) {
    const { keyCode } = e;
    if (
      (e.altKey && !e.ctrlKey) ||
      e.metaKey ||
      // Function keys don't generate text
      (keyCode >= KeyCode.F1 && keyCode <= KeyCode.F12)
    ) {
      return false;
    }

    // The following keys are quite harmless, even in combination with
    // CTRL, ALT or SHIFT.
    switch (keyCode) {
      case KeyCode.ALT:
      case KeyCode.CAPS_LOCK:
      case KeyCode.CONTEXT_MENU:
      case KeyCode.CTRL:
      case KeyCode.DOWN:
      case KeyCode.END:
      case KeyCode.ESC:
      case KeyCode.HOME:
      case KeyCode.INSERT:
      case KeyCode.LEFT:
      case KeyCode.MAC_FF_META:
      case KeyCode.META:
      case KeyCode.NUMLOCK:
      case KeyCode.NUM_CENTER:
      case KeyCode.PAGE_DOWN:
      case KeyCode.PAGE_UP:
      case KeyCode.PAUSE:
      case KeyCode.PRINT_SCREEN:
      case KeyCode.RIGHT:
      case KeyCode.SHIFT:
      case KeyCode.UP:
      case KeyCode.WIN_KEY:
      case KeyCode.WIN_KEY_RIGHT:
        return false;
      default:
        return true;
    }
  },

  /**
   * whether character is entered.
   */
  isCharacterKey: function isCharacterKey(keyCode: number) {
    if (keyCode >= KeyCode.ZERO && keyCode <= KeyCode.NINE) {
      return true;
    }

    if (keyCode >= KeyCode.NUM_ZERO && keyCode <= KeyCode.NUM_MULTIPLY) {
      return true;
    }

    if (keyCode >= KeyCode.A && keyCode <= KeyCode.Z) {
      return true;
    }

    // Safari sends zero key code for non-latin characters.
    if (window.navigator.userAgent.indexOf('WebKit') !== -1 && keyCode === 0) {
      return true;
    }

    switch (keyCode) {
      case KeyCode.SPACE:
      case KeyCode.QUESTION_MARK:
      case KeyCode.NUM_PLUS:
      case KeyCode.NUM_MINUS:
      case KeyCode.NUM_PERIOD:
      case KeyCode.NUM_DIVISION:
      case KeyCode.SEMICOLON:
      case KeyCode.DASH:
      case KeyCode.EQUALS:
      case KeyCode.COMMA:
      case KeyCode.PERIOD:
      case KeyCode.SLASH:
      case KeyCode.APOSTROPHE:
      case KeyCode.SINGLE_QUOTE:
      case KeyCode.OPEN_SQUARE_BRACKET:
      case KeyCode.BACKSLASH:
      case KeyCode.CLOSE_SQUARE_BRACKET:
        return true;
      default:
        return false;
    }
  },

  isEditableTarget: function isEditableTarget(e: KeyboardEvent) {
    const target = e.target;

    if (!(target instanceof HTMLElement)) {
      return false;
    }

    const tagName = target.tagName;
    if (
      tagName === 'INPUT' ||
      tagName === 'TEXTAREA' ||
      tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return true;
    }

    return false;
  },
};
