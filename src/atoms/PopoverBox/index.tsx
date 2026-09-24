import React, {
  useRef,
  useState,
  useCallback,
  useContext,
  useEffect,
  createContext
} from "react";
import { useOutsideClick } from "react-busser";

import type { Ref, MutableRefObject } from "react";

import { useGenericId, useRouteChanged } from "../../_shared/hooks";
  
const PopoverContext = createContext<{
  closeTriggerEventNameSuffix: string;
  getPickerElementFromRoot: () => MutableRefObject<HTMLDivElement | null>;
}>({
  closeTriggerEventNameSuffix: "",
  getPickerElementFromRoot() {
    return {
      current:
        typeof window === "undefined"
          ? null
          : window.document.createElement("div"),
    };
  },
});

const usePopoverPicker = () => {
  return useContext(PopoverContext);
};

const PopoverShowTrigger = ({
  children,
  isToggle = false,
  onClick,
  ...props
}: React.ComponentProps<"div"> & { isToggle?: boolean }) => {
  const { getPickerElementFromRoot, closeTriggerEventNameSuffix } =
    usePopoverPicker();
  const [pickerBoxRef] = useState(() => getPickerElementFromRoot());

  useEffect(() => {
    const onToggleTrigger = (
      event: Event & {
        target: (EventTarget & { classList?: DOMTokenList }) | null;
      }
    ) => {
      if (event.target && event.target.classList) {
        event.target.classList.toggle("show");
      }
    };

    if (isToggle) {
      if (pickerBoxRef.current) {
        pickerBoxRef.current.addEventListener(
          `toggle-trigger-${closeTriggerEventNameSuffix}`,
          onToggleTrigger,
          false
        );
      }
    }

    return () => {
      if (isToggle) {
        if (pickerBoxRef.current) {
          pickerBoxRef.current.removeEventListener(
            `toggle-trigger-${closeTriggerEventNameSuffix}`,
            onToggleTrigger,
            false
          );
        }
      }
    };
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);
  const onTriggerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (typeof onClick === "function") {
      onClick(event);
    }

    if (!event.defaultPrevented) {
      if (pickerBoxRef.current) {
        pickerBoxRef.current.dispatchEvent(
          new CustomEvent(`toggle-trigger-${closeTriggerEventNameSuffix}`)
        );
      }
    }
  };
  const onFocus = (e: React.FocusEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };
  return (
    <div
      {...props}
      onClick={onTriggerClick}
      onFocus={isToggle ? onFocus : undefined}
    >
      {children}
    </div>
  );
};

/* @TODO: This will be a component to insert an arrow into a <Popover.Content/> section */
/* @FIXME: Implement this much later after this popover can render as a drawer on mobile devices */
//const PopoverArrow = ({}: React.ComponentProps<"span">) => {};

const PopoverContent = ({
  children,
  position = { horizontalAnchor: "left", verticalAnchor: "top" },
  className = "",
  ...props
}: React.ComponentProps<"div"> & {
  position?: {
    horizontalAnchor: "left" | "right";
    verticalAnchor: "top" | "bottom";
  };
}) => {
  let { getPickerElementFromRoot } = usePopoverPicker();
  const [pickerBoxRef] = useState(() => getPickerElementFromRoot());

  useEffect(() => {
    return () => {
      /* @ts-expect-error won't fix because TS error report is not correct for logic here */
      getPickerElementFromRoot =
        null; /* @INFO: Prevent memory leak for React ref */
    };
  }, []);

  return (
    <div
      {...props}
      className={`popover_picker-box ${className}`}
      data-horizontal-position-anchor={position.horizontalAnchor}
      data-vertical-position-anchor={position.verticalAnchor}
      ref={pickerBoxRef}
    >
      {children}
    </div>
  );
};

const PopoverCloseTrigger = ({
  children,
  className = "",
  onClick,
  ...props
}: React.ComponentProps<"span">) => {
  const { getPickerElementFromRoot } = usePopoverPicker();
  const [pickerBoxRef] = useState(() => getPickerElementFromRoot());
  const onCloseTriggerClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (typeof onClick === "function") {
      onClick(event);
    }

    if (!event.defaultPrevented) {
      if (pickerBoxRef.current !== null) {
        if (pickerBoxRef.current.classList.contains("show")) {
          pickerBoxRef.current.classList.remove("show");
        }
      }
    }
  };
  return (
    <span
      className={`popover_trigger[shrink-to-fit] ${className}`}
      {...props}
      data-close-trigger-island="react-busser-popover-trigger-trap"
      onClick={onCloseTriggerClick}
    >
      {children}
    </span>
  );
};

const PBox = React.forwardRef(
  (
    {
      children,
      onFocus,
      onPointerUp,
      className = "",
      ...props
    }: React.ComponentProps<"section">,
    ref: Ref<HTMLElement>
  ) => {
    const popoverStyleRef = useRef<HTMLStyleElement | null>(null);
    const pickerBoxRef = useRef<HTMLDivElement | null>(null);
    const eventNameSuffix = useGenericId();
    const [contextValue] = useState({
      closeTriggerEventNameSuffix: eventNameSuffix,
      getPickerElementFromRoot() {
        return pickerBoxRef;
      },
    });

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
        styleSheetsOnly.includes("react-busser-headless-ui_popover")
      ) {
        return;
      }

      const popoverStyle = window.document.createElement("style");
      popoverStyle.id = "react-busser-headless-ui_popover";

      /* eslint-disable no-useless-escape */
      popoverStyle.innerHTML = `
      .popover_wrapper-box,
      .popover_trigger\[shrink-to-fit\] {
        position: relative;
        display: inline-block; /* shrink-to-fit trigger */
        min-height: 0;
        min-width: fit-content;
      }

      .popover_picker-box {
        position: absolute;
        display: none;
      }

      .popover_picker-box[data-vertical-position-anchor="top"] {
        bottom: auto;
        top: 100%;
      }

      .popover_picker-box[data-vertical-position-anchor="bottom"] {
        top: auto;
        bottom: 100%;
      }

      .popover_picker-box[data-horizontal-position-anchor="left"] {
        right: auto;
        left: 0;
      }

      .popover_picker-box[data-horizontal-position-anchor="right"] {
        left: auto;
        right: 0;
      }

      .popover_wrapper-box > .popover_picker-box.show {
        display: block;
      }
    `;
    /* eslint-enable no-useless-escape */

      popoverStyleRef.current = popoverStyle;
      window.document.head.appendChild(popoverStyle);

    }, []);

    useRouteChanged(() => {
      if (popoverStyleRef.current) {
        window.document.head.removeChild(popoverStyleRef.current);
      }
    });

    const [wrapperNodeRef] = useOutsideClick<HTMLElement>((wrapperNode) => {
      if (wrapperNode) {
        if (pickerBoxRef.current !== null) {
          if (pickerBoxRef.current.classList.contains("show")) {
            pickerBoxRef.current.classList.remove("show");
          }
        }
      }
    });
    const $ref = useCallback((node: HTMLElement) => {
      if (node) {
        wrapperNodeRef.current = node;
      } else {
        wrapperNodeRef.current = null;
      }
      
      if (typeof ref === "function") {
        ref(node);
      }

      if (ref !== null
        && ref instanceof Object
          && 'current' in ref) {
        ref.current = node;
      }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, []);

    useEffect(() => {
      const onResize = () => {
        if (pickerBoxRef.current !== null) {
          if (wrapperNodeRef.current !== null) {
            const { left, right, bottom, width } =
              wrapperNodeRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const elementWidth = width || right - left;
            const elementHeight =
              parseInt(
                window.getComputedStyle(pickerBoxRef.current)["height"]
              ) || 0;

            if (viewportWidth - right <= elementWidth) {
              pickerBoxRef.current.dataset.horizontalPositionAnchor = "right";
            } else {
              pickerBoxRef.current.dataset.horizontalPositionAnchor = "left";
            }

            if (viewportHeight - bottom <= elementHeight) {
              pickerBoxRef.current.dataset.verticalPositionAnchor = "bottom";
            } else {
              pickerBoxRef.current.dataset.verticalPositionAnchor = "top";
            }
          }
        }
      };

      window.addEventListener("resize", onResize, false);
      window.addEventListener("scroll", onResize, false);

      if (wrapperNodeRef.current !== null) {
        wrapperNodeRef.current.addEventListener("focuswithin", onResize, false);
      }

      onResize();

      return () => {
        window.removeEventListener("resize", onResize, false);
        window.removeEventListener("scroll", onResize, false);

        if (wrapperNodeRef.current !== null) {
          wrapperNodeRef.current.removeEventListener(
            "focuswithin",
            onResize,
            false
          );
        }
      };
    }, []);

    return (
      <section
        {...props}
        className={`popover_wrapper-box ${className}`}
        onPointerUp={(
          event: React.PointerEvent<HTMLDivElement> & {
            target: HTMLElement;
            currenTarget: HTMLElement;
          }
        ) => {
          if (typeof onPointerUp === "function") {
            onPointerUp(event);
          }

          if (!event.defaultPrevented) {
            if (
              pickerBoxRef.current !== null &&
              pickerBoxRef.current.contains(event.target)
            ) {
              const hasCloseTriggerSet = Boolean(
                pickerBoxRef.current.querySelector(
                  '[data-close-trigger-island="react-busser-popover-trigger-trap"]'
                )
              );
              if (!hasCloseTriggerSet) {
                pickerBoxRef.current.classList.remove("show");
              }
            }
          }
        }}
        onFocus={(
          event: React.FocusEvent<HTMLElement> & { target: HTMLElement }
        ) => {
          if (typeof onFocus === "function") {
            onFocus(event);
          }

          if (!event.defaultPrevented) {
            if (
              pickerBoxRef.current !== null &&
              !pickerBoxRef.current.contains(event.target)
            ) {
              if (!pickerBoxRef.current.classList.contains("show")) {
                pickerBoxRef.current.classList.add("show");
              }
              wrapperNodeRef.current!.dispatchEvent(
                new CustomEvent("focuswithin")
              );
            }
          }
        }}
        role={"group"}
        // @/ts-expect-error will fix later because TS error reports that types don't match
        ref={$ref}
      >
        <PopoverContext.Provider value={contextValue}>
          {children}
        </PopoverContext.Provider>
      </section>
    );
  }
);

const PopoverBox = Object.assign(PBox, {
  Trigger: PopoverShowTrigger,
  Content: PopoverContent,
  Close: PopoverCloseTrigger,
});

type PopoverBoxProps = React.ComponentProps<typeof PopoverBox>;

export type { PopoverBoxProps };

export default PopoverBox;

/*

  @EXAMPLE:

  <PopoverBox>
    <PopoverBox.Trigger isToggle>
      <button>Go for It!</button>
    </PopoverBox.Trigger>
    <PopoverBox.Content
      position={{ horizontalAnchor: "left", verticalAnchor: "top" }}
    >
      <span>HelloYammy!</span>
  
      <PopoverBox.Close>
        <button>Close</button>
      </PopoverBox.Close>
    </PopoverBox.Content>
  </PopoverBox>
*/
