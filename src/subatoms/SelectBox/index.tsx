import React, { useRef, useCallback, useEffect } from "react";
import { useEffectMemo } from "react-busser";

import { useGenericId, useSharedStyle } from "../../_shared/hooks";

import type { Ref, ComponentPropsWithRef, ComponentProps } from "react";


import { ChevronIcon } from "./assets/ChevronIcon";

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
    const STYLESHEET_ID = "react-busser-headless-ui_select";
    const BASE_CSS = `
        span[data-select-wrapper] select {
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
        
        span[data-select-wrapper] select:focus,
        span[data-select-wrapper] select:focus-visible {
            cursor: pointer;
        }
        
        span[data-select-wrapper] {
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
        
        span[data-select-wrapper].fill_available {
            min-width: 100%;
        }
        
        span[data-select-wrapper] svg {
            display: inline-block;
            position: absolute;
            z-index: 10;
            pointer-events: none;
            top: 0;
            right: 0;
            padding-right: 0;
            background-color: transparent;
        }
        
        span[data-select-wrapper]::before {
            content: attr(data-selected-value);
        }

        span[data-select-wrapper]::after {
            content: attr(data-placeholder);
        }
        
        html span[data-select-wrapper][data-selected-value=""]::before {
            display: none;
        }
        
        html span[data-select-wrapper].hide-placeholder::after {
            display: none;
        }
      `;
    
    const multiple = (props.multiple || false) as boolean;
    const cssDynamicStyleAttrSelector = useGenericId();
    const selectRef = useRef<HTMLSelectElement | null>(null);
    const spanRef = useRef<HTMLSpanElement | null>(null);
    const prevRuleSet = useRef<string>("");
    const contentWidthOffset = useEffectMemo(
        () => (multiple ? 0 : chevronSize + Math.floor(chevronSize / 2)),
        [chevronSize, multiple]
      ) || 0;

    const MIRROR_STYLESHEET_ID = `react-busser-headless-ui_select-mirror-${cssDynamicStyleAttrSelector}`;
    const DYN_STYLESHEET_ID = `react-busser-headless-ui_select-dyn-${cssDynamicStyleAttrSelector}`;
    const MIRROR_BASE_CSS = `
        span[data-select-wrapper] {
            border: 1px solid transparent;
            color: inherit;
            background-color: transparent;
        }
      `;
    const DYN_BASE_CSS = `
        span[data-select-wrapper][data-dyn-style-name="styl-${cssDynamicStyleAttrSelector}"]::before,
        span[data-select-wrapper][data-dyn-style-name="styl-${cssDynamicStyleAttrSelector}"]::after {
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

        span[data-select-wrapper][data-dyn-style-name="styl-${cssDynamicStyleAttrSelector}"] select {
          opacity: ${multiple ? "1" : "0"};
          -webkit-appearance: ${multiple ? "none" : "menulist"};
          -moz-appearance: ${multiple ? "none" : "menulist"};
          appearance: ${multiple ? "none" : "auto"};
          ${multiple ? "border: none;" : ""}
        }

        ${
          multiple
            ? `html span[data-select-wrapper][data-dyn-style-name="styl-${cssDynamicStyleAttrSelector}"]::before,
              html span[data-select-wrapper][data-dyn-style-name="styl-${cssDynamicStyleAttrSelector}"]::after {
                display: none;
              }`
            : ""
        }
      `;
    const anyValue = (defaultValue ? defaultValue : props.value) as string;

    const styleProp = useEffectMemo(() => props.style, [props.style]);
    const $ref = useCallback((node: HTMLSelectElement) => {
      if (node) {
        selectRef.current = node;
      } else {
        selectRef.current = null;
      }
      
      if (typeof ref === "function") {
        ref(node)
      }

      if (ref !== null
        && ref instanceof Object
          && 'current' in ref) {
        ref.current = node;
      }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, []);

    useEffect(() => {
      if (!valueSync || selectRef.current === null) {
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
        if (typeof anyValue !== "undefined") {
          setSelectTagIndex.call(
            selectRef.current,
            selectTagIndexMap[anyValue.toLowerCase()]
          );
          selectRef.current.dispatchEvent(programmaticChangeEvent);
        } else {
          throw new Error(
            "SelectBox: `defaultValue` or `value` prop not supplied"
          );
        }
      }
    }, [valueSync, anyValue, props.disabled]);

    useEffect(() => {
      if (spanRef.current === null || selectRef.current === null) {
        return;
      }

      const onChangeDetected = (event: Event | { target: HTMLElement }) => {
        const selectElem = event.target as HTMLSelectElement;
        const spanElem = selectElem.parentNode! as HTMLSpanElement;
        const selectOptions = Array.from(selectElem.options);
        const selectedIndex =
          selectElem.selectedIndex >= 0 && anyValue !== ""
            ? selectElem.selectedIndex
            : selectOptions.findIndex((option) => {
                return (
                  option.value === anyValue || option.hasAttribute("selected")
                );
              });

        if (selectedIndex !== -1) {
          spanElem.setAttribute(
            "data-selected-value",
            selectOptions[selectedIndex]!.text
          );

          const hasHidePlaceholder = spanElem.hasAttribute("data-title-visibility")
          ? spanElem.getAttribute("data-title-visibility")
          : "";

          if (!hasHidePlaceholder) {
            spanElem.setAttribute("data-title-visibility", "hide-placeholder");
            spanElem.setAttribute("title", "");
          }
        }
      };

      selectRef.current.addEventListener("input", onChangeDetected, false);

      if (valueSync) {
        selectRef.current.dispatchEvent(new CustomEvent("input"));
      } else {
        onChangeDetected({ target: selectRef.current });
      }

      return () => {
        if (selectRef.current) {
          selectRef.current.removeEventListener(
            "input",
            onChangeDetected,
            false
          );
        }
      };
    }, [valueSync, anyValue]);

    useSharedStyle(STYLESHEET_ID, BASE_CSS);

    useSharedStyle(MIRROR_STYLESHEET_ID, MIRROR_BASE_CSS);

    useSharedStyle(DYN_STYLESHEET_ID, DYN_BASE_CSS);

    useEffect(() => {
      if (selectRef.current === null) {
        return;
      }

      const mirrorStyle = document.getElementById(
        MIRROR_STYLESHEET_ID
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
        data-select_wrapper={""}
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
          {children}
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

type SelectBoxProps = ComponentProps<typeof SelectBox>;

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
