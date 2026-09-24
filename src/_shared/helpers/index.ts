import React from "react";
import type { MutableRefObject } from "react";

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
