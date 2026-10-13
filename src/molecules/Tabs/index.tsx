import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { DEFAULT_TAB_QUERY, useTabsCore } from "./internal";
import { getChildrenOfType } from "../../_shared/helpers";
import { useGenericId, useSharedStyle } from "../../_shared/hooks";

import type { FC } from "react";

interface TabsContextValue {
  baseId: string;
  activeTabIndex: number;
  setActiveTabIndex: (tabIndex: number) => void;
}

const STYLESHEET_ID = "react-busser-headless-ui_tabs";
const BASE_CSS = `
  .tabs_body-box {
    width: 100%;
    min-height: 1;
  }

  .tabs_header-box {
    min-height: 1;
    width: 100%;
    max-width: 100%;
  }

  .tabs_header-inner-box {
    overflow-x: auto;
    position: relative; /* makes tab titles' offsetLeft relative to the list */
  }
`;
 
const TabsContext = createContext<TabsContextValue | null>(null);
 
/** @HINT: Position of the current Title/Panel among its siblings. */
const TabIndexContext = createContext<number>(-1);
 
const useTabsContext = (componentName: string) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`<${componentName}> must be rendered inside <Tabs>.`);
  }
  return context;
};
 
const useTabIndex = (componentName: string, parentName: string) => {
  const index = useContext(TabIndexContext);
  if (index < 0) {
    throw new Error(
      `<${componentName}> must be a direct child of <${parentName}>.`
    );
  }
  return index;
};
 
const getTabId = (baseId: string, index: number) => `${baseId}-tab-${index}`;
const getPanelId = (baseId: string, index: number) => `${baseId}-panel-${index}`;
 
interface TabsProps extends React.ComponentPropsWithoutRef<"section"> {
  /** @HINT: Tab shown when the URL has no (valid) tab query. 0-based. */
  activeTabIndex?: number;
  activeTabIdQuery?: string;
  disableTabIdOnUrlQuery?: boolean;
  replaceInHistory?: boolean;
}
 
const TabsRoot: FC<TabsProps> = ({
  activeTabIndex = 0,
  activeTabIdQuery = DEFAULT_TAB_QUERY,
  disableTabIdOnUrlQuery = false,
  replaceInHistory = false,
  children,
  ...props
}) => {
  /** @HINT: Injects the base styles once and removes them when the last Tabs unmounts. */
  useSharedStyle(STYLESHEET_ID, BASE_CSS);
 
  const baseId = useGenericId();
  const [currentTabIndex, setActiveTabIndex] = useTabsCore(
    activeTabIndex,
    activeTabIdQuery,
    disableTabIdOnUrlQuery,
    replaceInHistory
  );
 
  const contextValue = useMemo<TabsContextValue>(
    () => ({ baseId, activeTabIndex: currentTabIndex, setActiveTabIndex }),
    [baseId, currentTabIndex, setActiveTabIndex]
  );
 
  return (
    <TabsContext.Provider value={contextValue}>
      <section {...props}>{children}</section>
    </TabsContext.Provider>
  );
};
 
type TabsHeaderProps = Omit<React.HTMLAttributes<HTMLUListElement>, "role"> & {
  as?: "ul" | "menu";
  wrapperClassName?: string;
};
 
const Header: FC<TabsHeaderProps> = ({
  as = "ul",
  className = "",
  wrapperClassName = "",
  onKeyDown,
  children,
  ...props
}) => {
  const { activeTabIndex, setActiveTabIndex } = useTabsContext("Tabs.Header");
  const listRef = useRef<HTMLUListElement>(null);
  const titles = getChildrenOfType(children, Title);
 
  /** @HINT: `<menu>` and `<ul>` share the same list semantics and DOM API we rely on. */
  const ListElement = as as "ul";
 
  useEffect(() => {
    const list = listRef.current;
    let activeTitle = null; 
    
    if (list) {
      activeTitle = list.querySelector<HTMLElement>(
        `[data-tab-title-index="${activeTabIndex}"]`
      );
    }

    if (!list || !activeTitle) {
      return;
    }
 
    const titleStart = activeTitle.offsetLeft;
    const titleEnd = titleStart + activeTitle.offsetWidth;

    /** @HINT: Keep the active title visible when the header scrolls horizontally. */
    if (titleStart < list.scrollLeft) {
      list.scrollLeft = titleStart;
    } else if (titleEnd > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = titleEnd - list.clientWidth;
    }
  }, [activeTabIndex]);
 
  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || titles.length === 0) {
      return;
    }
 
    const lastIndex = titles.length - 1;
    const current = Math.min(Math.max(activeTabIndex, 0), lastIndex);
    let nextIndex: number;
 
    switch (event.key) {
      case "ArrowRight":
        nextIndex = current === lastIndex ? 0 : current + 1;
        break;
      case "ArrowLeft":
        nextIndex = current === 0 ? lastIndex : current - 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = lastIndex;
        break;
      default:
        return;
    }
 
    event.preventDefault();
    setActiveTabIndex(nextIndex);
    
    if (listRef.current) {
      const tabTitle = listRef.current.querySelector<HTMLElement>(
        `[data-tab-title-index="${nextIndex}"]`
      );
      if (tabTitle) {
        tabTitle.focus();
      }
    }
  };
 
  return (
    <div className={`tabs_header-box ${wrapperClassName}`.trim()}>
      <ListElement
        {...props}
        ref={listRef}
        role="tablist"
        className={`tabs_header-inner-box ${className}`.trim()}
        onKeyDown={handleKeyDown}
      >
        {titles.map((title, index) => (
          <TabIndexContext.Provider key={title.key} value={index}>
            {title}
          </TabIndexContext.Provider>
        ))}
      </ListElement>
    </div>
  );
};
 
type TabTitleProps = Omit<
  React.LiHTMLAttributes<HTMLLIElement>,
  "id" | "role" | "tabIndex" | "aria-selected" | "aria-controls"
>;
 
const Title: FC<TabTitleProps> = ({ children, onClick, ...props }) => {
  const { baseId, activeTabIndex, setActiveTabIndex } =
    useTabsContext("Tabs.Title");
  const index = useTabIndex("Tabs.Title", "Tabs.Header");
  const isActive = index === activeTabIndex;
 
  const handleClick = (event: React.MouseEvent<HTMLLIElement>) => {
    if (typeof onClick === "function") {
      onClick(event);
    }
    if (!event.defaultPrevented) {
      setActiveTabIndex(index);
    }
  };
 
  return (
    <li
      {...props}
      id={getTabId(baseId, index)}
      role="tab"
      aria-selected={isActive}
      aria-controls={isActive ? getPanelId(baseId, index) : undefined}
      tabIndex={isActive ? 0 : -1}
      data-tab-title-index={index}
      onClick={handleClick}
    >
      {children}
    </li>
  );
};
 
type TabsBodyProps = React.ComponentPropsWithoutRef<"section">;
 
const Body: FC<TabsBodyProps> = ({ children, className = "", ...props }) => {
  const { activeTabIndex } = useTabsContext("Tabs.Body");
  const panelChildren = useMemo(() => getChildrenOfType(children, Panel), [activeTabIndex, React.Children.count(children)]);
  const activePanel = panelChildren[activeTabIndex];
 
  return (
    <section {...props} className={`tabs_body-box ${className}`.trim()}>
      <TabIndexContext.Provider value={activeTabIndex}>
        {Boolean(activePanel) ? (
          activePanel
        ) : null}
      </TabIndexContext.Provider>
    </section>
  );
};
 
type TabPanelProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "id" | "role" | "aria-labelledby"
>;
 
const Panel: FC<TabPanelProps> = ({ children, ...props }) => {
  const { baseId } = useTabsContext("Tabs.Panel");
  const index = useTabIndex("Tabs.Panel", "Tabs.Body");
 
  return (
    <div
      tabIndex={0}
      {...props}
      id={getPanelId(baseId, index)}
      role="tabpanel"
      aria-labelledby={getTabId(baseId, index)}
    >
      {children}
    </div>
  );
};
 
TabsRoot.displayName = "Tabs";
Header.displayName = "Tabs.Header";
Title.displayName = "Tabs.Title";
Body.displayName = "Tabs.Body";
Panel.displayName = "Tabs.Panel";

const Tabs = Object.assign(TabsRoot, { Header, Title, Body, Panel });
 
export type {
  TabsProps,
  TabsHeaderProps,
  TabTitleProps,
  TabsBodyProps,
  TabPanelProps,
};
 
export default Tabs;

/**
 * @example:
 *
 * const [ activate, id, tabIndex ] = useTabs("group_settings_tab", 1);
 * 
 * <Tabs activeTabIndex={tabIndex} activeTabIdQuery={id}>
 *   <Tabs.Header>
 *     <Tabs.Title>General</Tabs.Title>
 *     <Tabs.Title>Members</Tabs.Title>
 *   </Tabs.Header>
 *   <Tabs.Body>
 *     <Tabs.Panel>
 *        <h4>General Settings</h4>
 *        <p>All settings for user app</p>
 *     </Tabs.Panel>
 *     <Tabs.Panel>
 *       <h4>>Member settings</h4>
 *       <p>Seetings for group members</p>
 *     </Tabs.Panel>
 *   </Tabs.Body>
 * </Tabs>
 */
