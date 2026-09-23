import React, {
  createContext,
  useLayoutEffect,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import Button from "../../subatoms/Button";

import type { ButtonProps } from "../../subatoms/Button";

import { useGenericId } from "../../_shared/hooks";

import { hasChildren, isSubChild } from "../../_shared/helpers";

const TOGGLE_CLASSNAME = "accordion_Open";
const STYLESHEET_ID = "react-busser-headless-ui_accordion";
const ITEM_VALUE_ATTRIBUTE = "data-rbhui-accordion-item-value";
const ITEM_SELECTOR = `[data-accordion-item][${ITEM_VALUE_ATTRIBUTE}]`;

const canUseDOM =
  typeof window !== "undefined" && typeof window.document !== "undefined";

/**
 * @NOTE:
 *
 * On the server there is no `window`, so we optimistically assume `<details>`
 * support. Every engine that can run this bundle ships `<details>`, and
 * assuming it keeps the server markup identical to the first client render
 * (guessing `<section>` on the server would blow up hydration).
 */
const supportsDetailsElement =
  !canUseDOM || typeof window.HTMLDetailsElement === "function";

const renderChildren = ($children: React.ReactNode) => {
  const childrenProps = React.Children.map($children, (child) => {
    switch (true) {
      case isSubChild(child, "Item"):
        return React.cloneElement(
          child as React.ReactElement<
            Omit<
              React.ComponentProps<"section" | "details">,
              "name" | "ref"
            > & {
              name: string;
            }
          >,
          {}
        );
      default:
        if (!React.isValidElement<React.ReactElement<{}>>(child) || !isSubChild(child, "Item")) {
          console.error(
            "[Accordion]: <Accordion> only accepts <Accordion.Card> elements as direct children."
          );
          return null;
        }
        return child;
    }
  });
  return childrenProps;
};

/* 
  @HINT:
  
  Shared across every mounted <Accordion> so the injected <style> node is
  only removed once the last accordion on the page unmounts.
*/
let stylesheetRefCount = 0;

/* 
  @HINT:

  Splits a className string into unique tokens. `accordion_Open` is owned
  by the accordion itself, so a consumer can never add or remove it.
*/
const toClassNameTokens = (className?: string): string[] =>
  Array.from(
    new Set(
      (className || "")
        .split(/\s+/)
        .filter((token) => token !== "" && token !== TOGGLE_CLASSNAME)
    )
  );

function getAccordionChildNode(element: HTMLElement, queryContext: string) {
  // @HINT: Check if the browser supports `:scope` natively
  try {
    return element.querySelector<HTMLElement>(`:scope > ${queryContext}`);
  } catch (_) {
    // @HINT: Fallback for IE11 and older browsers
    const oldId = element.id;
    const temporaryId =
      oldId || "temp-accordion-id-" + Math.random().toString(36).substr(2, 9);

    if (!oldId) element.id = temporaryId;

    // @HINT: Use exact CSS query string fallback:
    const fallbackQuery = "#" + temporaryId + ` > ${queryContext}`;
    const panel =
      element.ownerDocument.querySelector<HTMLElement>(fallbackQuery);

    if (!oldId) element.removeAttribute("id");
    return panel;
  }
}
const getAccordionItemValue = (accordionItem: HTMLElement): string =>
  accordionItem.getAttribute(ITEM_VALUE_ATTRIBUTE) || "";

/* Only items belonging to *this* root, so nested accordions don't leak. */
const getAccordionItems = (rootElem: HTMLElement): HTMLElement[] =>
  Array.from(rootElem.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
    (accordionItem) =>
      accordionItem.closest("[data-accordion-root]") === rootElem
  );

const findAccordionItem = (
  rootElem: HTMLElement,
  value: string
): HTMLElement | null =>
  getAccordionItems(rootElem).find(
    (accordionItem) => getAccordionItemValue(accordionItem) === value
  ) || null;

const isDetailsElement = (elem: HTMLElement): boolean => {
  const view = elem.ownerDocument.defaultView;
  return view !== null && elem instanceof view.HTMLDetailsElement;
};

/**
 * @INFO:
 *
 * Single source of truth for what "open" looks like in the DOM: the marker
 * class, the native `open` attribute, the header state attributes and — for
 * the `<section>` fallback — the panel's `hidden` attribute.
 */
const setAccordionItemState = (accordionItem: HTMLElement, open: boolean) => {
  accordionItem.classList.toggle(TOGGLE_CLASSNAME, open);

  if (isDetailsElement(accordionItem)) {
    if (open) {
      accordionItem.setAttribute("open", "");
    } else {
      accordionItem.removeAttribute("open");
    }
  } else {
    const accordionPanel = getAccordionChildNode(
      accordionItem,
      "[data-accordion-panel]"
    );
    if (accordionPanel) {
      accordionPanel.toggleAttribute("hidden", !open);
    }
  }

  const accordionHeaderTrigger = getAccordionChildNode(
    accordionItem,
    "[data-accordion-header]"
  );
  if (accordionHeaderTrigger) {
    accordionHeaderTrigger.setAttribute("data-open", open ? "true" : "false");
    accordionHeaderTrigger.setAttribute(
      "aria-expanded",
      open ? "true" : "false"
    );
  }
};

type AccordionHelperContextValue = {
  groupingName: string;
  toggle: (value: string, eventTarget: EventTarget | null) => boolean;
};

const AccordionHelperContext = createContext<AccordionHelperContextValue>({
  groupingName: "",
  toggle: () => false,
});

type AccordionItemContextValue = {
  name: string;
  headerId: string;
  panelId: string;
};

const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null
);

const useAccordionItemContext = (componentName: string) => {
  const itemContext = useContext(AccordionItemContext);

  if (itemContext === null) {
    console.error(
      `[Accordion]: <${componentName}> must be rendered inside an <Accordion.Card>.`
    );
  }

  return itemContext;
};

export function Accordion({
  children,
  defaultName,
  role,
  ...props
}: React.ComponentProps<"article"> & { defaultName?: string }) {
  const rootElemRef = useRef<HTMLElement | null>(null);
  /* @HINT: Single-open accordion: at most one value is open at any time. */
  const openValueRef = useRef<string | null>(null);
  const defaultNameRef = useRef<string | undefined>(defaultName);

  /* @INFO: `useGenericId()`: stable across SSR/hydration. */
  const groupingName = `accrodion_Grouping_${useGenericId().replace(
    /[^a-zA-Z0-9_-]/g,
    ""
  )}`;

  const toggle = useCallback(
    (value: string, eventTarget: EventTarget | null) => {
      const rootElem = rootElemRef.current;

      if (rootElem === null || !(eventTarget instanceof Element)) {
        return false;
      }

      const accordionItem = eventTarget.closest<HTMLElement>(ITEM_SELECTOR);

      if (
        accordionItem === null ||
        getAccordionItemValue(accordionItem) !== value
      ) {
        return false;
      }

      const wasOpen = openValueRef.current === value;

      /* 
        @HINT:
      
         Close the currently open item first (looked up from the root, not
         from inside the clicked item) so the native `name` grouping on
         `<details>` never has to close anything behind our back.
      */
      if (openValueRef.current !== null) {
        const lastOpenAccordionItem = findAccordionItem(
          rootElem,
          openValueRef.current
        );
        if (lastOpenAccordionItem !== null) {
          setAccordionItemState(lastOpenAccordionItem, false);
        }
        openValueRef.current = null;
      }

      if (!wasOpen) {
        setAccordionItemState(accordionItem, true);
        openValueRef.current = value;
      }

      return openValueRef.current === value;
    },
    []
  );

  const contextValue = useMemo<AccordionHelperContextValue>(
    () => ({ groupingName, toggle }),
    [groupingName, toggle]
  );

  useEffect(() => {
    stylesheetRefCount += 1;

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
      /* @ts-ignore */
      styleSheetsOnly.includes(STYLESHEET_ID)
    ) {
      return;
    }

    /*
      if (window.document.getElementById(STYLESHEET_ID) !== null) {
        return;
      }
    */

    const accordionStyle = window.document.createElement("style");
    accordionStyle.id = STYLESHEET_ID;

    accordionStyle.innerHTML = `
      [data-accordion-root] details[data-accordion-item] > summary[data-accordion-header] {
        list-style: none; /* Hides the default arrow */
        cursor: pointer;
      }

      [data-accordion-root] details[data-accordion-item] > summary[data-accordion-header]::-webkit-details-marker {
        display: none; /* Removes the default arrow on Chrome */
      }

      [data-accordion-root] section[data-accordion-item]:not(.${TOGGLE_CLASSNAME}) > [data-accordion-panel] {
        /* Only the <section> fallback needs help hiding its panel; */
        /* <details> does that natively. */
        display: none;
      }
    `;
    window.document.head.appendChild(accordionStyle);

    return () => {
      stylesheetRefCount -= 1;

      if (stylesheetRefCount > 0) {
        /* 
          @HINT:
          
          If there are still `<Accordion />` components mounted, don't pull out 
          the stylesheet from the DOM
        */
        return;
      }

      const accordionStyle = window.document.getElementById(STYLESHEET_ID);
      if (accordionStyle !== null && accordionStyle.parentNode !== null) {
        accordionStyle.parentNode.removeChild(accordionStyle);
      }
    };
  }, []);

  useEffect(() => {
    const rootElem = rootElemRef.current;

    if (rootElem === null) {
      return;
    }

    const accordionItems = getAccordionItems(rootElem);

    if (accordionItems.length === 0) {
      return;
    }

    /* `defaultName` is uncontrolled, so it is only read on mount. */
    const defaultValue =
      defaultNameRef.current || getAccordionItemValue(accordionItems[0]!);

    openValueRef.current = null;

    accordionItems.forEach((accordionItem, index) => {
      accordionItem.setAttribute("data-index", String(index));

      const isDefaultOpen =
        getAccordionItemValue(accordionItem) === defaultValue;

      setAccordionItemState(accordionItem, isDefaultOpen);

      if (isDefaultOpen) {
        openValueRef.current = defaultValue;
      }
    });
  }, []);

  return (
    <AccordionHelperContext.Provider value={contextValue}>
      <article
        {...props}
        data-accordion-root
        role={role ?? "region"}
        ref={rootElemRef}
      >
        {hasChildren(children, 0) ? null : renderChildren(children)}
      </article>
    </AccordionHelperContext.Provider>
  );
}

Accordion.displayName = "Accordion";

type ItemProps = Omit<
  React.ComponentPropsWithoutRef<"section" | "details">,
  "name" | "ref"
> & {
  name: string;
};

function Item({ name, children, className, ...props }: ItemProps) {
  const { groupingName } = useContext(AccordionHelperContext);
  const itemId = useGenericId();

  const itemElemRef = useRef<HTMLElement | null>(null);

  const initialClassNameRefValue = useRef<string | undefined>(
    toClassNameTokens(className).join(" ") || undefined
  ).current;
  const prevClassNameTokensRef = useRef<string[]>(toClassNameTokens(className));

  useLayoutEffect(() => {
    const itemElem = itemElemRef.current;
    if (itemElem === null) return;

    const prevTokens = prevClassNameTokensRef.current;
    const nextTokens = toClassNameTokens(className);
    const prevTokenSet = new Set(prevTokens);
    const nextTokenSet = new Set(nextTokens);

    if (
      prevTokens.slice().sort().join("") === nextTokens.slice().sort().join("")
    ) {
      /* No change between previous `className` and next `className` */
      return;
    }

    prevTokens.forEach((token) => {
      if (!nextTokenSet.has(token)) itemElem.classList.remove(token);
    });
    nextTokens.forEach((token) => {
      if (!prevTokenSet.has(token)) itemElem.classList.add(token);
    });

    prevClassNameTokensRef.current = nextTokens;
  }, [className]);
  const itemContextValue = useMemo<AccordionItemContextValue>(
    () => ({
      name,
      headerId: `accordion-header-${itemId}`,
      panelId: `accordion-panel-${itemId}`,
    }),
    [name, itemId]
  );

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      {supportsDetailsElement ? (
        <details
          {...props}
          ref={itemElemRef as React.Ref<HTMLDetailsElement>}
          className={initialClassNameRefValue} // @HINT: Freeze this prop so React never rewrites it
          name={groupingName}
          data-index="-1"
          role="group"
          data-accordion-item=""
          data-rbhui-accordion-item-value={name}
        >
          {children}
        </details>
      ) : (
        <section
          {...props}
          ref={itemElemRef}
          className={initialClassNameRefValue} // @HINT: Freeze this prop so React never rewrites it
          data-index="-1"
          role="group"
          data-accordion-item=""
          data-rbhui-accordion-item-value={name}
        >
          {children}
        </section>
      )}
    </AccordionItemContext.Provider>
  );
}

Item.displayName = "Item";

type HeadingButtonProps = ButtonProps &
  React.ComponentPropsWithoutRef<"summary">;

const HeadingButton: React.FC<HeadingButtonProps> = ({
  children,
  onClick,
  id,
  ...props
}) => {
  const { toggle } = useContext(AccordionHelperContext);
  const itemContext = useAccordionItemContext("Accordion.Trigger");

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (typeof onClick === "function") {
      onClick(
        event as React.MouseEvent<HTMLButtonElement> &
          React.MouseEvent<HTMLElement>
      );
    }

    if (event.defaultPrevented) {
      /* 
        @HINT:
        
        A consumer calling `event.preventDefault()`
        opts out of toggling.
      */
      return;
    }

    /* `<summary>` would otherwise flip `open` itself right after this
       handler and undo the state we just set. */
    event.preventDefault();

    const isOpen = toggle(itemContext?.name || "", event.currentTarget);

    event.currentTarget.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );
  };

  const sharedProps = {
    /* 
      @INFO:
      
      The generated id wins: `aria-labelledby` on the panel points
      at it.
    */
    id: itemContext?.headerId ?? id,
    "aria-controls": itemContext?.panelId,
    "aria-expanded": false,
    "data-open": "false",
    "data-item-header-name": itemContext?.name || "",
    onClick: handleClick,
  } as const;

  return supportsDetailsElement ? (
    <summary {...props} {...sharedProps} data-accordion-header="auto">
      {children}
    </summary>
  ) : (
    <Button {...props} {...sharedProps} data-accordion-header="manual">
      {children}
    </Button>
  );
};

HeadingButton.displayName = "HeadingButton";

const Panel: React.FC<React.ComponentProps<"div">> = ({
  children,
  ...props
}) => {
  const itemContext = useAccordionItemContext("Accordion.Content");

  return (
    <div
      {...props}
      id={itemContext?.panelId}
      role="region"
      aria-labelledby={itemContext?.headerId}
      data-accordion-panel="basic"
      data-item-panel-name={itemContext?.name || ""}
    >
      {children}
    </div>
  );
};

Panel.displayName = "Panel";

Accordion.Content = Panel;
Accordion.Trigger = HeadingButton;
Accordion.Card = Item;

type AccordionProps = React.ComponentProps<typeof Accordion>;

export type { AccordionProps, ItemProps, HeadingButtonProps };

export default Accordion;

/*
  <Accordion defaultName={"item_1"} aria-label={"Frequently asked questions"}>
    <Accordion.Card name={"item_1"} className={"card"}>
      <Accordion.Trigger>
        {"Item 1"}
      </Accordion.Trigger>
      <Accordion.Content>
        <p>Details of Item 1</p>
      </Accordion.Content>
    </Accordion.Card>
    <Accordion.Card name={"item_2"}>
      <Accordion.Trigger>
        {"Item 2"}
      </Accordion.Trigger>
      <Accordion.Content>
        <p>Details of Item 2</p>
      </Accordion.Content>
    </Accordion.Card>
  </Accordion>
*/
