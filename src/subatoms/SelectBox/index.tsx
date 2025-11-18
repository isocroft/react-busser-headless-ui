import React, { useRef, useCallback, useMemo, useEffect } from "react";
//import { useEffectMemo } from "react-busser";

import type { Ref, ComponentPropsWithRef, ComponentProps } from "react";

type EffectMemoCallbackArgs<DepsType = unknown[]> = {
  dependencies: DepsType;
  changed: Partial<DepsType> | [];
};

import { ChevronIcon } from "./assets/ChevronIcon";

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

export const useEffectMemo = <Z extends Array<unknown>, V = unknown>(
  callback: (options: EffectMemoCallbackArgs<Z>) => V,
  deps: Z
) => {
  const safeDeps = (Array.isArray(deps) ? deps : []) as Z;
  const memoRef = useRef<ReturnType<typeof callback> | null>(
    typeof callback === "function"
      ? callback({ dependencies: safeDeps, changed: [] })
      : null
  );

  const depsRef = useRef<string[]>(
    safeDeps.map((dep) =>
      typeof dep === "object" ? JSON.stringify(dep) : String(dep || "")
    )
  );

  useEffect(() => {
    const depsIndexMap: Record<number, Z[number]> = {};
    const newlyChangedDeps = safeDeps.filter((dep, index) => {
      const status = dep !== depsRef.current[index];
      if (status) {
        depsIndexMap[index] = dep;
      }
      return status;
    }) as Partial<Z>;

    if (newlyChangedDeps.length > 0) {
      depsRef.current = safeDeps.map((dep, index) => {
        if (depsIndexMap[index]) {
          return String(depsIndexMap[index] || "");
        }
        return String(dep || "");
      });

      memoRef.current =
        typeof callback === "function"
          ? callback({ dependencies: safeDeps, changed: newlyChangedDeps })
          : null;
    }
  });

  return useMemo<ReturnType<typeof callback> | null>(() => memoRef.current, []);
};

const SBox = React.forwardRef(
  (
    {
      children,
      defaultValue = "",
      valueSync = false,
      chevronSize = 8,
      placeholderTextIndent = 8,
      placeholder = "",
      chevronOpacity = 0.6063,
      widthFillAvailable = false,
      wrapperClassName = "",
      onBlur,
      onChange,
      ...props
    }: ComponentPropsWithRef<"select"> & {
      valueSync?: boolean;
      chevronSize?: number;
      chevronOpacity?: number;
      placeholder?: string;
      placeholderTextIndent?: number;
      widthFillAvailable?: boolean;
      wrapperClassName?: string;
    },
    ref: Ref<HTMLSelectElement>
  ) => {
    const multiple = (props.multiple || false) as boolean;
    const anyValue = (defaultValue ? defaultValue : props.value) as string;
    const contentWidthOffset =
      useEffectMemo(
        () => (multiple ? 0 : chevronSize + Math.floor(chevronSize / 2)),
        [chevronSize, multiple]
      ) || 0;
    const cssDynamicStyleAttrSelector = useRef<string>(
      ((Math.random() / 0.95 + 1) * new Date().getTime())
        .toString(32)
        .replace(/([.\d])+/g, "")
    ).current;
    const selectRef = useRef<HTMLSelectElement | null>(null);
    const spanRef = useRef<HTMLSpanElement | null>(null);
    const prevRuleSet = useRef<string>("");

    const styleProp = useEffectMemo(() => props.style, [props.style]);

    const $ref = useCallback((node) => {
      if (node) {
        selectRef.current = node;
      } else {
        selectRef.current = null;
      }
      return typeof ref === "function" ? ref(node) : ref;
    }, []);

    useEffect(() => {
      if (!valueSync || selectRef.current === null || anyValue === "") {
        return;
      }
      /* @NOTE: Programmatically trigger a `change` event on a <select> tag */
      /* @CHECK: https://github.com/facebook/react/issues/19678#issuecomment-679044981 */
      const selectOptions = Array.from(selectRef.current.options);
      const selectTagIndexMap = selectOptions.reduce(
        (indexMap, currentOption, index) => {
          indexMap[currentOption.value.toLowerCase()] = index;
          return indexMap;
        },
        {} as Record<string, number>
      );

      const programmaticChangeEvent = new Event("change", { bubbles: true });
      const setSelectTagIndex = Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        "selectedIndex"
      )!.set;

      if (typeof setSelectTagIndex !== "undefined") {
        setSelectTagIndex.call(
          selectRef.current,
          selectTagIndexMap[anyValue.toLowerCase()]
        );
        selectRef.current.dispatchEvent(programmaticChangeEvent);
      }
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [valueSync, anyValue]);

    useEffect(() => {
      if (spanRef.current === null || selectRef.current === null) {
        return;
      }

      const onChangeDetected = (event: Event) => {
        const selectElem = event.target as HTMLSelectElement;
        const spanElem = selectElem.parentNode! as HTMLSpanElement;
        const selectOptions = Array.from(selectElem.options);
        const selectedIndex =
          selectElem.selectedIndex >= 0
            ? selectElem.selectedIndex
            : selectOptions.findIndex((option) => {
                return (
                  option.value === anyValue || option.hasAttribute("selected")
                );
              });

        if (selectedIndex !== -1) {
          spanElem.setAttribute(
            "data-selected-value",
            selectOptions[selectedIndex].text
          );

          if (!spanElem.classList.contains("hide-placeholder")) {
            spanElem.classList.add("hide-placeholder");
            spanElem.setAttribute("title", "");
          }
        }
      };

      selectRef.current.addEventListener("input", onChangeDetected, false);
      if (valueSync) {
        selectRef.current.dispatchEvent(new Event("input"));
      }

      return () => {
        selectRef.current!.removeEventListener(
          "input",
          onChangeDetected,
          false
        );
      };
    }, [valueSync, anyValue]);

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
        /* @ts-ignore */
        styleSheetsOnly.includes("react-busser-headless-ui_select")
      ) {
        return;
      }

      const selectStyle = window.document.createElement("style");

      selectStyle.id = "react-busser-headless-ui_select";
      selectStyle.innerHTML = `
        span[id="select_wrapper"] select {
            white-space: nowrap;
            position: relative;
            display: block;
            transform: rotate(0);
            opacity: 0;
            margin: 0;
            min-width: 100%;
            height: 100%;
            box-sizing: border-box;
        }
        
        span[id="select_wrapper"] select:focus,
        span[id="select_wrapper"] select:focus-visible {
            cursor: pointer;
        }
        
        span[id="select_wrapper"] {
            white-space: nowrap;
            vertical-align: middle;
            display: inline-flex;
            cursor: pointer;
            position: relative;
            min-height: 0;
            height: auto;
            max-width: 100%;
            padding: 0;
        }
        
        span[id="select_wrapper"].fill_available {
            min-width: 100%;
        }
        
        span[id="select_wrapper"] svg {
            display: inline-block;
            position: absolute;
            z-index: 10;
            pointer-events: none;
            top: 0;
            right: 0;
            padding-right: 0;
            background-color: transparent;
        }
        
        span[id="select_wrapper"]::before {
            content: attr(data-selected-value);
        }

        span[id="select_wrapper"]::after {
            content: attr(data-placeholder);
        }
        
        html span[id="select_wrapper"][data-selected-value=""]::before {
            display: none;
        }
        
        html span[id="select_wrapper"].hide-placeholder::after {
            display: none;
        }
      `;

      window.document.head.appendChild(selectStyle);

      return () => {
        window.document.head.removeChild(selectStyle);
      };
    }, []);

    useEffect(() => {
      const selectMirrorStyle = window.document.createElement("style");

      selectMirrorStyle.id = `react-busser-headless-ui_select-mirror-${cssDynamicStyleAttrSelector}`;
      selectMirrorStyle.innerHTML = `
        span#select_wrapper {
            border: 1px solid transparent;
            color: inherit;
            background-color: transparent;
        }
      `;
      window.document.head.appendChild(selectMirrorStyle);

      return () => {
        window.document.head.removeChild(selectMirrorStyle);
      };
    }, [cssDynamicStyleAttrSelector]);

    useEffect(() => {
      const selectDynStyle = window.document.createElement("style");
      selectDynStyle.id = `react-busser-headless-ui_select-dyn-${cssDynamicStyleAttrSelector}`;
      selectDynStyle.innerHTML = `
        span#select_wrapper[data-dyn-style-name="styl-${cssDynamicStyleAttrSelector}"]::before,
        span#select_wrapper[data-dyn-style-name="styl-${cssDynamicStyleAttrSelector}"]::after {
            -webkit-align-self: center;
            align-self: center;
            background-color: transparent;
            overflow: hidden;
            text-indent: ${placeholderTextIndent}px;
            text-overflow: ellipsis;
            white-space: nowrap;
            pointer-events: none;
            width: -moz-calc(100% - ${contentWidthOffset}px);
            width: -webkit-calc(100% - ${contentWidthOffset}px);
            width: calc(100% - ${contentWidthOffset}px);
            min-height: 0;
            position: absolute;
        }

        span#select_wrapper[data-dyn-style-name="styl-${cssDynamicStyleAttrSelector}"] select {
          opacity: ${multiple ? "1" : "0"};
          -webkit-appearance: ${multiple ? "none" : "menulist"};
          -moz-appearance: ${multiple ? "none" : "menulist"};
          appearance: ${multiple ? "none" : "auto"};
          ${multiple ? "border: none;" : ""}
        }

        ${
          multiple
            ? `html span#select_wrapper[data-dyn-style-name="styl-${cssDynamicStyleAttrSelector}"]::before,
              html span#select_wrapper[data-dyn-style-name="styl-${cssDynamicStyleAttrSelector}"]::after {
                display: none;
              }`
            : ""
        }
      `;
      window.document.head.appendChild(selectDynStyle);

      return () => {
        window.document.head.removeChild(selectDynStyle);
      };
    }, [
      placeholderTextIndent,
      cssDynamicStyleAttrSelector,
      contentWidthOffset,
      multiple,
    ]);

    useEffect(() => {
      if (selectRef.current === null) {
        return;
      }

      const mirrorStyle = document.getElementById(
        `react-busser-headless-ui_select-mirror-${cssDynamicStyleAttrSelector}`
      )! as HTMLStyleElement;
      const mirrorStyleSheet = mirrorStyle.sheet!;
      const styleDeclaration = window.getComputedStyle(selectRef.current);
      const propertiesToMirror = [
        "background-image",
        "background-position",
        "background-color",
        "color",
        "border",
      ];

      const ruleSet = propertiesToMirror.map((property) => {
        let rule = `${property}: ${styleDeclaration.getPropertyValue(
          property
        )};`;
        if (property === "border") {
          if (
            !/\:(?:\d+)(?:px|rem|em|cm|ch)?(?:[\s]+)(?:solid|ridge|dotted|double|groove|dashed)(?:[\s]+)(?:[^ &%$@!+-_=*}|`~;?<>{]+);$/.test(
              rule
            )
          ) {
            rule = `${property}: ${styleDeclaration.getPropertyValue(
              "border-width"
            )} ${styleDeclaration.getPropertyValue(
              "border-style"
            )} ${styleDeclaration.getPropertyValue("border-color")};`;
          }
        }
        return rule;
      });

      const currentRuleSet = ruleSet.join("\r\n");

      if (prevRuleSet.current !== currentRuleSet) {
        mirrorStyleSheet.deleteRule(0);
        mirrorStyleSheet.insertRule(
          ["span#select_wrapper {", currentRuleSet, "}"].join("\r\n"),
          0
        );
        prevRuleSet.current = currentRuleSet;
      }
    }, [
      placeholderTextIndent,
      cssDynamicStyleAttrSelector,
      chevronOpacity,
      placeholder,
      props.className,
      chevronSize,
      widthFillAvailable,
      styleProp,
    ]);

    return (
      <span
        id="select_wrapper"
        ref={spanRef}
        className={`${wrapperClassName} ${
          widthFillAvailable ? "fill_available" : ""
        }`}
        title={widthFillAvailable ? undefined : placeholder}
        data-placeholder={placeholder}
        data-selected-value={""}
        data-dyn-style-name={`styl-${cssDynamicStyleAttrSelector}`}
      >
        <select
          {...props}
          onBlur={onBlur}
          onChange={onChange}
          defaultValue={
            !props.value && defaultValue !== "" ? defaultValue : undefined
          }
          ref={$ref}
        >
          {hasChildren(children, 0) ? null : children}
        </select>
        <ChevronIcon
          iconSize={multiple ? 0 : chevronSize}
          iconOpacity={multiple ? 0 : chevronOpacity}
        />
      </span>
    );
  }
);

const Option = ({
  value,
  children,
  ...props
}: ComponentProps<"option">) => {
  return (
    <option {...props} value={value}>
      {children}
    </option>
  );
};

const OptionGroup = ({
  children,
  ...props
}: ComponentProps<"optgroup">) => {
  return <optgroup {...props}>{children}</optgroup>;
};

const SelectBox = Object.assign(SBox, { Option, OptionGroup });

type SelectBoxProps = React.ComponentProps<typeof SelectBox>;

export type { SelectBoxProps };

export default SelectBox;


/*
        <SelectBox
          name={"sorter"}
          valueSync
          chevronSize={17}
          chevronOpacity={0.76}
          wrapperClassName={"selectbox"}
          widthFillAvailable
          className={"dropdown"}
          placeholder="Select Sort Order"
          defaultValue={"ASC"}
        >
          <SelectBox.Option value="ASC">ASC</SelectBox.Option>
          <SelectBox.Option value="DESC">DESC</SelectBox.Option>
        </SelectBox>  
*/
