import { useState, useCallback } from "react";
import { useHistory, useLocation } from "react-router-dom";

type History = ReturnType<typeof useHistory>;

export const DEFAULT_TAB_QUERY = "active_tab__react-busser";

const writeTabQuery = (
  history: History,
  queryKey: string,
  tabIndex: number,
  replaceInHistory: boolean
) => {
  const searchParams = new URLSearchParams(history.location.search);
  const nextValue = String(tabIndex + 1);
 
  if (searchParams.get(queryKey) === nextValue) {
    return;
  }
 
  searchParams.set(queryKey, nextValue);
 
  const nextLocation = {
    pathname: history.location.pathname,
    search: `?${searchParams.toString()}`,
    hash: history.location.hash,
  };
 
  if (replaceInHistory) {
    history.replace(nextLocation);
  } else {
    history.push(nextLocation);
  }
};

/** URL values are 1-based ("?tab=1" is the first tab); state is 0-based. */
const parseTabQueryValue = (value: string | null): number | null => {
  if (value === null) {
    return null;
  }
  const position = Number(value);
  return Number.isInteger(position) && position >= 1 ? position - 1 : null;
};

export const useTabsCore = (
  defaultTabIndex: number,
  activeTabIdQuery: string,
  disableTabIdOnUrlQuery: boolean,
  replaceInHistory: boolean
) => {
  const history = useHistory();
  const location = useLocation();
  const [localTabIndex, setLocalTabIndex] = useState(defaultTabIndex);
 
  const urlTabIndex = disableTabIdOnUrlQuery
    ? null
    : parseTabQueryValue(
        new URLSearchParams(location.search).get(activeTabIdQuery)
      );
 
  const activeTabIndex = urlTabIndex ?? localTabIndex;
 
  const setActiveTabIndex = useCallback(
    (tabIndex: number) => {
      if (disableTabIdOnUrlQuery) {
        setLocalTabIndex(tabIndex);
      } else {
        writeTabQuery(history, activeTabIdQuery, tabIndex, replaceInHistory);
      }
    },
    [history, activeTabIdQuery, disableTabIdOnUrlQuery, replaceInHistory]
  );
 
  return [activeTabIndex, setActiveTabIndex] as const;
};


