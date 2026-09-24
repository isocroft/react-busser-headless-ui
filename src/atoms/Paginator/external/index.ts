import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useEffectCallback } from "react-busser";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type { /*RefObject,*/ MutableRefObject } from "react";
import type { ColumnDef, PaginationState, Table } from "@tanstack/react-table";
import type { 
  CurrentPageTriggerDetail,
  PaginatorEventHandlers, 
  PaginatorRenderProps, 
  PaginatorTriggerCallbacks
} from "../../_shared/helpers";

import {
  buildPaginatorRenderProps,
  toPositiveInteger,
  clampIndex,
  getVisiblePageWindow,
  PAGINATOR_EVENTS
} from "../_shared/helpers";

/* @INFO: re-exported so callers rendering the table need one import, not two */
export { flexRender };

export type DataScopedPaginatorOptions<D extends Record<string, unknown>> = {
  data: D[];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  columns: Array<ColumnDef<D, any>>;

  pageSize?: number;
  initialCurrentPage?: number;
  pageSliceSpanActive?: boolean;
  defaultPagesPerSlice?: number;
  pageSearchParamName?: string;
};

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
const usePaginatorEventBridge = (
  domRef: /*RefObject<HTMLElement | null>*/MutableRefObject<HTMLElement | null>,
  handlers: PaginatorEventHandlers,
  eventNamePrefix: string
) => {
  const { onPrev, onNext, onPrevSpan, onNextSpan, onCurrentPage } = handlers;

  useEffect(() => {
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

    node.addEventListener(eventNamePrefix+PAGINATOR_EVENTS.prev, handlePrev, false);
    node.addEventListener(eventNamePrefix+PAGINATOR_EVENTS.next, handleNext, false);
    node.addEventListener(eventNamePrefix+PAGINATOR_EVENTS.prevSpan, handlePrevSpan, false);
    node.addEventListener(eventNamePrefix+PAGINATOR_EVENTS.nextSpan, handleNextSpan, false);
    node.addEventListener(eventNamePrefix+PAGINATOR_EVENTS.current, handleCurrent, false);

    return () => {
      node.removeEventListener(eventNamePrefix+PAGINATOR_EVENTS.prev, handlePrev, false);
      node.removeEventListener(eventNamePrefix+PAGINATOR_EVENTS.next, handleNext, false);
      node.removeEventListener(eventNamePrefix+PAGINATOR_EVENTS.prevSpan, handlePrevSpan, false);
      node.removeEventListener(eventNamePrefix+PAGINATOR_EVENTS.nextSpan, handleNextSpan, false);
      node.removeEventListener(eventNamePrefix+PAGINATOR_EVENTS.current, handleCurrent, false);
    };
  }, [onPrev, onNext, onPrevSpan, onNextSpan, onCurrentPage]);
};

/**
 * usePageSearchParam:
 *
 * Reads and writes the current page through `react-router`.
 * 
 * @param {String} pageSearchParamName -
 * @param {Number} initialCurrentPage -
 * 
 * @returns {Object}
 */
const usePageSearchParam = (pageSearchParamName: string, initialCurrentPage: number) => {
  
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
    which is what makes browser back/forward clicks move the paginator.
    
    Local state is the fallback and will be initialized via `initialCurrentPage`.
  */
  const rawPageIndex = canUseURLState && urlPageIsUsable ? rawURLPage - 1 : initialCurrentPage;

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
    writePageIndexToURL
  } as const;
};

/**
 * useRenderScopedPainnatorProps:
 *
 */
export const useRenderScopedPaginatorProps = (
  options: {
    initialCurrentPage?: number;
    totalPageCount?: number;
    pageSliceSpanActive?: boolean;
    defaultPagesPerSlice?: number;
    pageSearchParamName?: string;
  } = {},
  callbacks: {
    onPrevActionTriggered?: () => void;
    onNextActionTriggered?: () => void;
    onCurrActionTriggered?: (page: number) => void;
  } = {}
) => {
  const $options = {
    initialCurrentPage: 1,
    totalPageCount: 0,
    pageSliceSpanActive: false,
    defaultPagesPerSlice: 10,
    pageSearchParamName: "",
    ...options,
  };
  const $callbacks = {
    onPrevActionTriggered: () => undefined,
    onNextActionTriggered: () => undefined,
    onCurrActionTriggered: (_page: number) => undefined,
    ...callbacks,
  };

  const totalPageCount = Math.max(toPositiveInteger($options.totalPageCount, 0), 0);
  const pageSliceSpanActive = Boolean($options.pageSliceSpanActive);
  const pagesPerSlice = toPositiveInteger($options.defaultPagesPerSlice, 10);
  const initialCurrentPage = Math.max(toPositiveInteger($options.initialCurrentPage, 1) - 1, 0);
  const pageSearchParamName = typeof $options.pageSearchParamName === "string"
    ? $options.pageSearchParamName : "";

  const {
    searchParams,
    canUseURLState,
    rawPageIndex,
    writePageIndexToURL
  } = usePageSearchParam(pageSearchParamName, initialCurrentPage);

  const [localPageIndex, setLocalPageIndex] = useState<number>(() => {
    /*
      @NOTE: 
    
      Initializing `localPageIndex` is based on `initialCurrentPage`,
      only when the URL does not contain the search param reserved for
      tracking the page number (i.e. `pageSearchParamName`).

      Always defaults to '0' if `initialCurrentPage` is not supplied.
    */
    return rawPageIndex
  });

  const maxPageIndex = Math.max(totalPageCount - 1, 0);
  const currentPageIndex = clampIndex(localPageIndex, maxPageIndex);
  const currentPage = totalPageCount === 0 ? 0 : currentPageIndex + 1;

  const domRef = useRef<HTMLElement | null>(null);
  const eventNamePrefix = useRef<string>(
    ((Math.random() / 0.95 + 1) * new Date().getTime())
      .toString(32)
      .replace(/([.\d])+/g, "")
  ).current;

  const commitPageIndex = useEffectCallback(
    (nextIndex: number) => {
      const safeIndex = clampIndex(nextIndex, maxPageIndex);
      setLocalPageIndex(safeIndex);
      writePageIndexToURL(safeIndex);
    },
    { immutableRef: true }
  );

  const { pageNumbers } = getVisiblePageWindow({
    currentPage,
    totalPageCount,
    pagesPerSlice,
    pageSliceSpanActive,
  });

  const onPrev = useEffectCallback(
    () => {
      if (totalPageCount === 0 || currentPage <= 1) {
        return;
      }
      $callbacks.onPrevActionTriggered();
      /*
        @NOTE:
        
        Navigation is now handled completely by `commitPageIndex`, 
        through the router.
      */
      commitPageIndex(currentPageIndex - 1);
    },
    { immutableRef: true }
  );

  const onNext = useEffectCallback(
    () => {
      if (totalPageCount === 0 || currentPage >= totalPageCount) {
        return;
      }
      $callbacks.onNextActionTriggered();
      /*
        @NOTE:
        
        Navigation is now handled completely by `commitPageIndex`, 
        through the router.
      */
      commitPageIndex(currentPageIndex + 1);
    },
    { immutableRef: true }
  );

  const onPrevSpan = useEffectCallback(
    () => {
      if (!pageSliceSpanActive || pageNumbers.length === 0) {
        return;
      }
      const prevPage = Math.max(pageNumbers[0]! - pagesPerSlice, 1);
      /*
        @NOTE:
        
        Navigation is now handled completely by `commitPageIndex`,
        through the router.
      */
      commitPageIndex(prevPage - 1);
    },
    { immutableRef: true }
  );

  const onNextSpan = useEffectCallback(
    () => {
      if (!pageSliceSpanActive || pageNumbers.length === 0) {
        return;
      }
      const nextPage = Math.min(
        pageNumbers[pageNumbers.length - 1]! + 1,
        totalPageCount
      );
      /*
        @NOTE:
        
        Navigation is now handled completely by `commitPageIndex`,
        through the router.
      */
      commitPageIndex(nextPage - 1);
    },
    { immutableRef: true }
  );

  const onCurrentPage = useEffectCallback(
    (page: number) => {
      if (!Number.isInteger(page) || page < 1) {
        return;
      }
      $callbacks.onCurrActionTriggered(page);
      /*
        @NOTE:
        
        Navigation is now handled completely by `commitPageIndex`,
        through the router.
      */
      const activatedPageIndex = page - 1;
      commitPageIndex(activatedPageIndex);
    },
    { immutableRef: true }
  );

  usePaginatorEventBridge(domRef, {
    onPrev,
    onNext,
    onPrevSpan,
    onNextSpan,
    onCurrentPage
  }, eventNamePrefix);

  /*
    @NOTE:

    Two hard-thrown errors used to live here. The first crashed the whole tree
    tree whenever `totalPageCount < defaultPagesPerSlice` — e.g. five results 
    with a slice of ten took the app down.
    
    The second fired on an empty `pageNumbers` array, which should show the ordinary 
    "no results yet" state. Both are now removed: too few pages simply renders fewer 
    buttons, and zero pages renders an empty range.
  */

  return {
    props: buildPaginatorRenderProps({
      currentPage,
      totalPageCount,
      pageNumbers,
      pageSliceSpanActive,
      canUseURLState,
      pageSearchParamName,
      searchParams,
      pageEventPrefix: eventNamePrefix,
      ref: domRef,
    }),
  } as const;
};

/**
 * useDataScopedPaginatorProps:
 *
 * Same contract as `useRenderScopedPaginatorProps`, except the page count is
 * derived from the rows by '@tanstack/react-table' rather than passed in.
 *
 * Returns the `table` instance alongside the props for `<Paginator />`.
 */
export const useDataScopedPaginatorProps = <D extends Record<string, unknown>>(
  options: DataScopedPaginatorOptions<D>,
  callbacks: PaginatorTriggerCallbacks = {}
): { props: PaginatorRenderProps; table: Table<D> } => {
  const $options = {
    pageSize: 10,
    initialCurrentPage: 1,
    pageSliceSpanActive: false,
    defaultPagesPerSlice: 10,
    pageSearchParamName: "",
    ...options,
  };
  const $callbacks = {
    onPrevActionTriggered: () => undefined,
    onNextActionTriggered: () => undefined,
    onCurrActionTriggered: (_page: number) => undefined,
    ...callbacks,
  };

  const pageSliceSpanActive = Boolean($options.pageSliceSpanActive);
  const pagesPerSlice = toPositiveInteger($options.defaultPagesPerSlice, 10);
  const pageSearchParamName =
    typeof $options.pageSearchParamName === "string"
      ? $options.pageSearchParamName
      : "";
  const pageSize = toPositiveInteger($options.pageSize, 10);

  const { searchParams, canUseURLState, rawPageIndex, writePageIndexToURL } =
    usePageSearchParam(pageSearchParamName, $options.initialCurrentPage);

  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: rawPageIndex,
    pageSize,
  }));

  const table = useReactTable({
    data: $options.data,
    columns: $options.columns,
    manualPagination: false,
    /*
        @INFO:
          
        Left off so a data change does not silently yank the reader back to page
        one and fight the URL. Out-of-range indices are clamped explicitly below.
      */
    autoResetPageIndex: false,
    state: { pagination },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPageCount = Math.max(table.getPageCount(), 0);
  const maxPageIndex = Math.max(totalPageCount - 1, 0);
  const currentPageIndex = clampIndex(pagination.pageIndex, maxPageIndex);
  const currentPage = totalPageCount === 0 ? 0 : currentPageIndex + 1;

  const domRef = useRef<HTMLElement | null>(null);
  const eventNamePrefix = useRef<string>(
    ((Math.random() / 0.95 + 1) * new Date().getTime())
      .toString(32)
      .replace(/([.\d])+/g, "")
  ).current;

  const commitPageIndex = useEffectCallback(
    (nextIndex: number) => {
      const safeIndex = clampIndex(nextIndex, maxPageIndex);
      table.setPageIndex(safeIndex);
      writePageIndexToURL(safeIndex);
    },
    { immutableRef: true }
  );

  /*
      @INFO:
        
      Write URL state back to #tanstack table oject internal state. 
    */
  useEffect(() => {
    if (!canUseURLState || rawPageIndex < 0) {
      return;
    }
    const updatedCurrentPageIndex = clampIndex(rawPageIndex, maxPageIndex);
    if (updatedCurrentPageIndex !== pagination.pageIndex) {
      setPagination((prev) => ({
        ...prev,
        pageIndex: updatedCurrentPageIndex,
      }));
    }
  }, [canUseURLState, rawPageIndex, maxPageIndex, pagination.pageIndex]);

  /* @INFO: rows removed underneath the current page — clamp back into range. */
  useEffect(() => {
    if (pagination.pageIndex > maxPageIndex) {
      commitPageIndex(maxPageIndex);
    }
  }, [maxPageIndex, pagination.pageIndex, commitPageIndex]);

  /* @INFO: `pageSize` is an option, so track it when the caller changes it. */
  useEffect(() => {
    if (pagination.pageSize !== pageSize) {
      setPagination((prev) => ({ ...prev, pageSize }));
    }
  }, [pageSize, pagination.pageSize]);

  const pageNumbers = getVisiblePageWindow({
    currentPage,
    totalPageCount,
    pagesPerSlice,
    pageSliceSpanActive,
  });

  const onPrev = useEffectCallback(
    () => {
      if (totalPageCount === 0 || !table.getCanPreviousPage()) {
        return;
      }
      $callbacks.onPrevActionTriggered();
      /*
          @NOTE:
          
          Navigation is now handled completely by `commitPageIndex`, 
          through the router.
        */
      commitPageIndex(currentPageIndex - 1);
    },
    { immutableRef: true }
  );

  const onNext = useEffectCallback(
    () => {
      if (totalPageCount === 0 || !table.getCanNextPage()) {
        return;
      }
      $callbacks.onNextActionTriggered();
      /*
          @NOTE:
          
          Navigation is now handled completely by `commitPageIndex`, 
          through the router.
        */
      commitPageIndex(currentPageIndex + 1);
    },
    { immutableRef: true }
  );

  const onPrevSpan = useEffectCallback(
    () => {
      if (!pageSliceSpanActive || pageNumbers.length === 0) {
        return;
      }
      const prevPage = Math.max(pageNumbers[0]! - pagesPerSlice, 1);
      /*
          @NOTE:
          
          Navigation is now handled completely by `commitPageIndex`, 
          through the router.
        */
      commitPageIndex(prevPage - 1);
    },
    { immutableRef: true }
  );

  const onNextSpan = useEffectCallback(
    () => {
      if (!pageSliceSpanActive || pageNumbers.length === 0) {
        return;
      }
      const nextPage = Math.min(
        pageNumbers[pageNumbers.length - 1]! + 1,
        totalPageCount
      );
      /*
          @NOTE:
          
          Navigation is now handled completely by `commitPageIndex`, 
          through the router.
        */
      commitPageIndex(nextPage - 1);
    },
    { immutableRef: true }
  );

  const onCurrentPage = useEffectCallback(
    (page: number) => {
      if (!Number.isInteger(page) || page < 1) {
        return;
      }
      $callbacks.onCurrActionTriggered(page);
      const activatedPageIndex = page - 1;
      /*
          @NOTE:
          
          Navigation is now handled completely by `commitPageIndex`, 
          through the router.
        */
      commitPageIndex(activatedPageIndex);
    },
    { immutableRef: true }
  );

  usePaginatorEventBridge(
    domRef,
    {
      onPrev,
      onNext,
      onPrevSpan,
      onNextSpan,
      onCurrentPage,
    },
    eventNamePrefix
  );

  return {
    props: buildPaginatorRenderProps({
      currentPage,
      totalPageCount,
      pageNumbers,
      pageSliceSpanActive,
      canUseURLState,
      pageSearchParamName,
      pageEventPrefix: eventNamePrefix,
      searchParams,
      ref: domRef,
    }),
    table,
  };
};
