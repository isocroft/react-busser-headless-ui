import { useState, useRef, useEffect, useCallback } from "react";

export const useTabsCore = (
  initialActiveTabIndex: number,
  activeTabIdQuery: string,
  disableTabIdOnUrlQuery = false
) => {
  const pageSearchParams = new window.URLSearchParams(window.location.search);
  const previousActiveTabIdQuery = useRef<string>(
    pageSearchParams.get(activeTabIdQuery) || String(initialActiveTabIndex + 1)
  );

  const history = useHistory();
  const [activeTabIndex, setActiveTabIndex] = useState<number>(() => {
    const activeTabIdFromUrlQuery = Number(previousActiveTabIdQuery.current);
    return activeTabIdFromUrlQuery - 1;
  });

  const handleSetActiveTab = useCallback<React.MouseEventHandler<HTMLElement>>(
    (event: React.MouseEvent<HTMLElement>) => {
      const tabHeaderNode = event.currentTarget as Node;
      const targetNode = event.target as Node;
      const parentNode = targetNode.parentNode as HTMLElement;
      const clickedTabIndex = Number(
        tabHeaderNode.contains(targetNode) &&
          (event.target as HTMLElement).hasAttribute("data-tab-title-index")
          ? (event.target as HTMLElement).dataset.tabTitleIndex
          : targetNode.parentNode &&
            tabHeaderNode.contains(targetNode.parentNode) &&
            parentNode.hasAttribute("data-tab-title-index")
          ? parentNode.dataset.tabTitleIndex
          : parentNode?.parentNode &&
            tabHeaderNode.contains(parentNode.parentNode) &&
            (parentNode?.parentNode as HTMLElement).hasAttribute(
              "data-tab-title-index"
            )
          ? (parentNode?.parentNode as HTMLElement).dataset.tabTitleIndex
          : "-1"
      );

      if (!Number.isNaN(clickedTabIndex) && clickedTabIndex !== -1) {
        setActiveTabIndex((prevTabIndex) => {
          if (prevTabIndex === clickedTabIndex) {
            return prevTabIndex;
          }
          return clickedTabIndex;
        });
      }
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    },
    []
  );

  useEffect(() => {
    if (disableTabIdOnUrlQuery) {
      return;
    }

    const onTabIdQueryChange = (
      $location: ReturnType<typeof useHistory>["location"]
    ) => {
      const currentPageSearchParams = new window.URLSearchParams(
        $location.search
      );
      const currentTabfromUrlQuery = Number(
        currentPageSearchParams.get(activeTabIdQuery)
      );

      if (
        !Number.isNaN(currentTabfromUrlQuery) &&
        previousActiveTabIdQuery.current !== String(currentTabfromUrlQuery)
      ) {
        previousActiveTabIdQuery.current = String(currentTabfromUrlQuery);
        setActiveTabIndex((prevTabIndex) => {
          if (prevTabIndex === currentTabfromUrlQuery) {
            return prevTabIndex;
          }
          return currentTabfromUrlQuery;
        });
      }
    };

    const unlisten = history.listen((location) => {
      return onTabIdQueryChange(location);
    });

    return () => {
      unlisten();
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [history, activeTabIdQuery]);

  return [activeTabIndex, handleSetActiveTab] as const;
};
