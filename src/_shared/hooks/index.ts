import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { useEffectCallback } from "react-busser";

import type { MutableRefObject } from "react";
import type { CurrentPageTriggerDetail } from "./helpers";

/* Shadows the global so the file type-checks without `@types/node`. */
declare const process: { env: { NODE_ENV?: string } };

const IS_TEST_ENV = process.env.NODE_ENV === "test";
const IS_DEV_ENV = process.env.NODE_ENV !== "production";

/**
 * @typedef {Object} PaginatorEventHandlers
 * @property {Function} onPrev -
 * @property {Function} onNext -
 * @property {Function} onPrevSpan -
 * @property {Function} onNextSpan -
 * @property {(page:Number) => void} onCurrentPage -
 */

/**
 * usePaginatorEventBridge:
 *
 * Subscribes the wrapper node to the paginator's custom events.
 * Every handler must be referentially stable — pass callbacks created with
 * `useEffectCallback(..., { immutableRef: true })`.
 *
 * @param {React.MutableRefObject} domRef -
 * @param {PaginatorEventHandlers} handlers -
 * @param {String} eventNamePrefix -
 *
 * @returns {void}
 */
export const usePaginatorEventBridge = (
  domRef: /*RefObject<HTMLElement | null>*/ MutableRefObject<HTMLElement | null>,
  handlers: PaginatorEventHandlers,
  eventNamePrefix: string
) => {
  const { onPrev, onNext, onPrevSpan, onNextSpan, onCurrentPage } = handlers;

  React.useEffect(() => {
    const node = domRef.current;

    if (node === null) {
      return;
    }

    const handlePrev = () => onPrev();
    const handleNext = () => onNext();
    const handlePrevSpan = () => onPrevSpan();
    const handleNextSpan = () => onNextSpan();
    const handleCurrent = (event: Event) => {
      const { detail } = event as CustomEvent<CurrentPageTriggerDetail>;
      onCurrentPage(Number(detail.page));
    };

    node.addEventListener(
      eventNamePrefix + PAGINATOR_EVENTS.prev,
      handlePrev,
      false
    );
    node.addEventListener(
      eventNamePrefix + PAGINATOR_EVENTS.next,
      handleNext,
      false
    );
    node.addEventListener(
      eventNamePrefix + PAGINATOR_EVENTS.prevSpan,
      handlePrevSpan,
      false
    );
    node.addEventListener(
      eventNamePrefix + PAGINATOR_EVENTS.nextSpan,
      handleNextSpan,
      false
    );
    node.addEventListener(
      eventNamePrefix + PAGINATOR_EVENTS.current,
      handleCurrent,
      false
    );

    return () => {
      node.removeEventListener(
        eventNamePrefix + PAGINATOR_EVENTS.prev,
        handlePrev,
        false
      );
      node.removeEventListener(
        eventNamePrefix + PAGINATOR_EVENTS.next,
        handleNext,
        false
      );
      node.removeEventListener(
        eventNamePrefix + PAGINATOR_EVENTS.prevSpan,
        handlePrevSpan,
        false
      );
      node.removeEventListener(
        eventNamePrefix + PAGINATOR_EVENTS.nextSpan,
        handleNextSpan,
        false
      );
      node.removeEventListener(
        eventNamePrefix + PAGINATOR_EVENTS.current,
        handleCurrent,
        false
      );
    };
  }, [onPrev, onNext, onPrevSpan, onNextSpan, onCurrentPage]);
};

/**
 * usePageSearchParam:
 *
 * Reads and writes the current page through React Router.
 *
 * @param {String} pageSearchParamName -
 * @param {Number} initialCurrentPage -
 *
 * @returns {Object}
 */
export const usePageSearchParam = (
  pageSearchParamName: string,
  initialCurrentPage: number
) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const canUseURLState =
    typeof pageSearchParamName === "string" && pageSearchParamName.length > 0;

  const rawURLPage = canUseURLState
    ? Number(searchParams.get(pageSearchParamName))
    : Number.NaN;
  /* 
    @INFO:
    
    Search params like `?page=abc` can produce `NaN` and poison every derived value.
    Therefore, keep track of a guard flag for when URL params might be unusable.
  */
  const urlPageIsUsable = Number.isInteger(rawURLPage) && rawURLPage >= 1;
  /*
    @INFO:
    
    When URL state is on the URL, then that becomes the source of truth,
    which is what makes browser back/forward move the paginator.
    
    Local state is the fallback and will be initialized via `initialCurrentPage`.
  */
  const rawPageIndex =
    canUseURLState && urlPageIsUsable ? rawURLPage - 1 : initialCurrentPage;

  const writePageIndexToURL = useEffectCallback(
    (pageIndex: number) => {
      if (!canUseURLState) {
        return;
      }
      /* @HINT: clone — never mutate the router's own URLSearchParams. */
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set(pageSearchParamName, String(pageIndex + 1));
      setSearchParams(nextParams);
    },
    { immutableRef: true }
  );

  return {
    searchParams,
    canUseURLState,
    rawPageIndex,
    writePageIndexToURL,
  } as const;
};

function getUseId() {
  /*
    @HINT:
    
    We need fully clone React function here to avoid webpack warning
    for React v17 do not export `useId`
  */
  const fullClone = {
    ...React,
  };

  return fullClone.useId;
}

let uuid = 0;

/** @private Note only worked in develop env. Not work in production. */
export function resetUuid() {
  if (IS_DEV_ENV) {
    uuid = 0;
  }
}

/**
 * Generate a valid HTML id from prefix and key.
 * Sanitizes the key by replacing invalid characters with hyphens.
 *
 * @param {String} prefix - The prefix for the id
 * @param {React.Key} key - The key from React element, may contain spaces or invalid characters
 *
 * @returns {String} A valid HTML id string
 */
export function getId(prefix: string, key: React.Key): string {
  // React.Key can be string | number, convert to string first
  const keyStr = String(key);

  // Valid id characters: letters, digits, hyphen, underscore, colon, period
  // Replace all invalid characters (including spaces) with hyphens to preserve length
  const sanitizedKey = keyStr.replace(/[^a-zA-Z0-9_.:-]/g, "-");

  return `${prefix}-${sanitizedKey}`;
}

const useOriginId = getUseId();

/**
 * useGenericId:
 *
 * Returns a serially generated id in any environment
 * that remains the same across renders an is SSR-safe
 *
 * @param {=String} id
 *
 * @returns {String}
 */
export const useGenericId = useOriginId
  ? // @HINT: Use React `useId`
    function (id?: string) {
      const reactId = useOriginId();

      if (id) {
        // @HINT: `id` passed in is used as single source of truth
        return id;
      }

      if (IS_TEST_ENV) {
        // @HINT: `test` env always return mock id
        return "test-id";
      }

      return reactId;
    }
  : // @HINT: Use compatible of `useId`
    function (id?: string) {
      // `innerId` for accessibility usage. Only work in client side
      const [innerId, setInnerId] = React.useState<string>("ssr-id");

      React.useEffect(() => {
        if (innerId === "ssr-id") {
          const nextId = uuid;
          uuid += 1;

          const randomBase = ((Math.random() / 0.95 + 1) * new Date().getTime())
            .toString(32)
            .replace(/([.\d])+/g, "");

          setInnerId(`rc_unique_${nextId}${randomBase}`);
        }
      }, []);

      if (id) {
        // @HINT: `id` passed in is used as single source of truth
        return id;
      }

      if (IS_TEST_ENV) {
        // @HINT: `test` env always return mock id
        return "test-id";
      }

      return innerId;
    };
