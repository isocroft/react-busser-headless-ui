import { useSearchParamsState } from "react-busser";

export const useTabs = (
  activeTabIdQuery = "active_tab__react-busser",
  activeTabIndex = 0,
  replaceInHistory = false
) => {
  const [, setUrlSearchParamsState] = useSearchParamsState(
    activeTabIdQuery,
    replaceInHistory,
    String(activeTabIndex + 1)
  );
  const activate = (currentTabIndex: number) => {
    setUrlSearchParamsState((previousTabIdQuery) => {
      if (previousTabIdQuery === String(currentTabIndex + 1)) {
        return previousTabIdQuery;
      }
      return String(currentTabIndex + 1);
    });
  };

  return [activate] as const;
};
