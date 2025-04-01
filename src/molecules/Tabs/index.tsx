import React, { FC, useRef, useEffect } from "react";
import { useHistory } from "react-router-dom";

import { useTabsCore } from "./internal";

const hasChildren = (
  children: React.ReactNode | React.ReactNode[],
  count: number
): boolean => {
  if (!Boolean(children) && count === 0) {
    return true;
  }
  const childCount = React.Children.count(children);
  return childCount === count;
};

const isSubChild = <C extends React.ReactNode>(
  child: C,
  tag: string
): child is C =>
  React.isValidElement<C>(child) &&
  (typeof child?.type === "function"
    ? child?.type?.name === tag
    : String(child?.type).includes(tag));

type CustomElementTagProps<T extends React.ElementType> =
  React.ComponentPropsWithRef<T> & {
    as?: T;
  };

const isTabsHeaderOverflowing = (
  element: HTMLUListElement | HTMLMenuElement
) => {
  let currrenOverflowStyle =
    element.style.overflow || window.getComputedStyle(element).overflow;

  if (!currrenOverflowStyle || currrenOverflowStyle === "visible") {
    element.style.overflow = "hidden";
  }

  let isOverflowing = element.clientWidth < element.scrollWidth;

  element.style.overflow = "";

  return isOverflowing;
};

const isActiveTabTitleInOverflow = (element: HTMLLIElement) => {
  const isCorrectOffsetParent = element.parentNode === element.offsetParent;
  if (!isCorrectOffsetParent || element.offsetParent == null) {
    return false;
  }

  return (
    element.offsetLeft + element.clientWidth > element.offsetParent.clientWidth
  );
};


const renderChildren = (
  children: React.ReactNode,
  props: { activeTab: number; onClick: React.MouseEventHandler<HTMLElement> }
) => {
  const oneChild = hasChildren(children, 1);
  const noChild = hasChildren(children, 0);

  if (oneChild || noChild) {
    return null;
  }

  return React.Children.map(children, (child) => {
    switch (true) {
      case isSubChild(child, "TabsHeader"):
        if (!React.isValidElement<React.ReactNode & TabsHeaderProps>(child)) {
          return null;
        }

        return React.cloneElement(child, {
          activeTabTitleIndex: props.activeTab,
          onClick: props.onClick,
        });
      case isSubChild(child, "TabsBody"):
        if (!React.isValidElement<React.ReactNode & TabsBodyProps>(child)) {
          return null;
        }

        return React.cloneElement(child, {
          activeTabPanelIndex: props.activeTab,
        });
      default:
        return null;
    }
  });
};

interface TabsProps extends React.ComponentPropsWithRef<"section"> {
  activeTabIndex?: number;
  activeTabIdQuery?: string;
  disableTabIdOnUrlQuery?: boolean;
}

const Tabs = ({
  activeTabIndex = 0,
  activeTabIdQuery = "active_tab__react-busser",
  className,
  disableTabIdOnUrlQuery = false,
  children,
  ...props
}: TabsProps) => {
  const [activeTab, onClick] = useTabsCore(
    activeTabIndex,
    activeTabIdQuery,
    disableTabIdOnUrlQuery
  );

  useEffect(() => {
    const styleSheetsOnly = [].slice
      .call<StyleSheetList, [], StyleSheet[]>(window.document.styleSheets)
      .filter((sheet) => {
        if (sheet.ownerNode) {
          return sheet.ownerNode.nodeName === "STYLE";
        }
        return false;
      })
      .map((sheet) => {
        if (sheet.ownerNode && sheet.ownerNode instanceof Element) {
          return sheet.ownerNode.id;
        }
        return "";
      })
      .filter((id) => id !== "");

    if (
      styleSheetsOnly.length > 0 &&
      styleSheetsOnly.includes("react-busser-headless-ui_tabs")
    ) {
      return;
    }

    const tabsStyle = window.document.createElement("style");
    tabsStyle.id = "react-busser-headless-ui_tabs";

    tabsStyle.innerHTML = `  
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
        position: relative; /* @HINT: Needed to correctly calculate 'offsetParent' for tab titles */
      }
    `;
    window.document.head.appendChild(tabsStyle);

    return () => {
      window.document.head.removeChild(tabsStyle);
    };
  }, []);

  return (
    <section className={className} {...props} role="tabs">
      {renderChildren(children, {
        onClick,
        activeTab,
      })}
    </section>
  );
};

interface TabTitleProps extends React.ComponentPropsWithRef<"li"> {
  isActive?: boolean;
  "data-tab-title-index": string;
}

const TabTitle: FC<TabTitleProps> = ({
  children,
  className,
  isActive,
  ...props
}) => {
  return (
    <li
      className={className}
      {...props}
      role="tab"
      aria-selected={isActive ? "true" : "false"}
      tabIndex={isActive ? 0 : -1}
    >
      {children}
    </li>
  );
};

type TabsHeaderProps = CustomElementTagProps<"menu" | "ul"> & {
  activeTabTitleIndex?: number;
  wrapperClassName?: string;
};

const TabsHeader: FC<TabsHeaderProps> = ({
  as: Component = "ul",
  className = "",
  wrapperClassName = "",
  activeTabTitleIndex,
  children,
  ...props
}) => {
  const tabTitleElement = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!tabTitleElement.current) {
      return;
    }
    if (isTabsHeaderOverflowing(tabTitleElement.current)) {
      const activeTabElement = tabTitleElement.current.querySelector(
        `[data-tab-title-index="${activeTabTitleIndex}"]`
      );

      if (!activeTabElement) {
        return;
      }
      if (isActiveTabTitleInOverflow(activeTabElement as HTMLLIElement)) {
        /* @HINT: Make sure that no active tab is hidden within a CSS overflow */
        tabTitleElement.current.scrollBy(5000, 0);
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [activeTabTitleIndex]);

  return (
    <div className={`tabs_header-box ${wrapperClassName}`} role="group">
      <Component
        className={`tabs_header-inner-box ${className}`}
        {...props}
        role="tablist"
        ref={tabTitleElement}
      >
        {React.Children.map(children, (child, index) => {
          if (
            !React.isValidElement<TabTitleProps>(child) ||
            !isSubChild(child, "TabTitle")
          ) {
            return null;
          }

          return React.cloneElement(child, {
            isActive: activeTabTitleIndex === index,
            "data-tab-title-index": String(index),
          });
        })}
      </Component>
    </div>
  );
};

type TabPanelProps = React.ComponentPropsWithRef<"div">;

const TabPanel: FC<TabPanelProps> = ({ children, className, ...props }) => {
  return (
    <div className={className} {...props} role="tabpanel" tabIndex={0}>
      {children}
    </div>
  );
};

interface TabsBodyProps extends React.ComponentPropsWithRef<"section"> {
  activeTabPanelIndex: number;
}

const TabsBody: FC<TabsBodyProps> = ({
  children,
  className = "",
  activeTabPanelIndex,
  ...props
}) => {
  const activeTabPanel = React.Children.toArray(children)[activeTabPanelIndex];

  return (
    <section className={`tabs_body-box ${className}`} role="group" {...props}>
      {isSubChild(activeTabPanel, "TabPanel") ? activeTabPanel : null}
    </section>
  );
};

Tabs.TabsHeader = TabsHeader;
Tabs.TabTitle = TabTitle;
Tabs.TabsBody = TabsBody;
Tabs.TabPanel = TabPanel;

// import { useIsFirstRender } from "react-busser";

// const isFirstRender = useIsFirstRender();
// const [activate] = useTabs("group_settings_tab", 1);

// useEffect(() => {
//   if (isFirstRender) {
//     /* programmatically reset to the active tab to the first tab */
//     activate(0);
//   }
// }, []);

// <Tabs activeTabIndex={1} activeTabIdQuery={"group_settings_tab"}>
//   <TabsHeader>
//     <TabTitle>General</TabTitle>
//   </TabsHeader>
//   <TabsBody>
//     <TabPanel>
//       <h4>General Settings</h4>
//       <p>All settings for user app</p>
//     </TabPanel>
//   </TabsBody>
// </Tabs>

export type {
  TabsProps,
  TabsHeaderProps,
  TabTitleProps,
  TabsBodyProps,
  TabPanelProps,
};

export default Tabs;
