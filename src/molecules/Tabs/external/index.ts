import { useSearchParamsState } from "react-busser";
import { DEFAULT_TAB_QUERY } from "../internal";

/**
 * @HINT:
 *
 * Programmatically activate a tab of a `<Tabs>` instance that syncs with the URL.
 * `activeTabIdQuery` must match the `activeTabIdQuery` prop given to `<Tabs>`.
 */
export const useTabs = (
  activeTabIdQuery = DEFAULT_TAB_QUERY,
  activeTabIndex = 1,
  replaceInHistory = false
) => {
  const [activeTabId, setUrlSearchParamsState] = useSearchParamsState(
    activeTabIdQuery,
    replaceInHistory,
    String(activeTabIndex)
  );
  const activate = (currentTabIndex: number) => {
    setUrlSearchParamsState((previousTabIdQuery) => {
      if (previousTabIdQuery === String(currentTabIndex)
        || previousTabIdQuery === String(currentTabIndex + 1)) {
        return previousTabIdQuery;
      }
      return String(currentTabIndex + 1);
    });
  };

  return [activate, activeTabIdQuery, Number(activeTabId)] as const;
};
