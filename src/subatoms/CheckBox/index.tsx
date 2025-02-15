import React, { FC, Ref, useEffect } from "react";

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

import { MarkIcon } from "./assets/MarkIcon";


const CheckBox: FC<
  {
    placeholder?: string;
    wrapperClassName?: string;
    labelClassName?: string;
    children?: React.ReactNode;
    checkIconSize?: number;
    checkIconFillColor?: string;
    ref?: Ref<HTMLInputElement>;
  } &
   Omit<React.ComponentProps<"input">, "type" | "placeholder" | "ref">
> = React.forwardRef(({
  id,
  name,
  tabIndex = 0,
  wrapperClassName = "",
  labelClassName = "",
  className = "",
  children,
  checkIconSize = 16,
  checkIconFillColor,
  ...props
}, ref: Ref<HTMLInputElement>) => {
  useEffect(() => {
    const styleSheetsOnly = [].slice.call<StyleSheetList, [], StyleSheet[]>(
      window.document.styleSheets
    ).filter(
      (sheet) => {
        if (sheet.ownerNode) {
          return sheet.ownerNode.nodeName === "STYLE";
        }
        return false;
    }).map(
      (sheet) => {
        if (sheet.ownerNode
          && sheet.ownerNode instanceof Element) {
          return sheet.ownerNode.id;
        }
        return "";
    }).filter(
      (id) => id !== ""
    );

    if (styleSheetsOnly.length > 0
      /* @ts-ignore */
      && styleSheetsOnly.includes("react-busser-headless-ui_check")) {
      return;
    }

    const checkStyle = window.document.createElement('style');
    checkStyle.id = "react-busser-headless-ui_check";

    checkStyle.innerHTML = `
      .check_wrapper-box {
        position: static;
        display: inline-block; /* shrink-to-fit trigger */
        min-height: 0;
        min-width: fit-content;
      }

      .check_hidden-input {
        opacity: 0;
        position: absolute;
        display: inline-block;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        border: none;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
      }

      .check_hidden-input svg {
        display: block;
      }

      /*.check_hidden-input:checked + svg path {
        stroke: #888888;
      }*/

      .check_control-icon-box {
        min-height: 0;
        min-width: fit-content;
        position: relative;
        display: inline-block;
        vertical-align: middle;
      }
    `;  
    window.document.head.appendChild(checkStyle);  
  
    return () => {  
      window.document.head.removeChild(checkStyle);  
    };
  }, []);

  return (
    <>
      <div className={wrapperClassName} role="group">
        <span
          className={`
            check_control-icon-box ${className}
          `}
        >
          <input
            id={id}
            name={name}
            type="checkbox"
            tabIndex={tabIndex}
            {...props}
            className={"check_hidden-input"}
            ref={ref}
          />
          {typeof checkIconSize === "number" ? (<MarkIcon
            size={checkIconSize}
            iconFill={checkIconFillColor}
          />) : null}
        </span>
        {hasChildren(children, 0) ? null : <label htmlFor={id} className={labelClassName}>
          {
            hasChildren(children, 1)
              ? React.cloneElement(
                children as React.ReactElement<
                  { required: boolean }
                >,
                {
                  required: props.required
                }
              )
              : null
          }
        </label>}
      </div>
    </>
  );
});

/*
  import React, { useState } from "react";

  const [toggle, setToggle] = useState(true);

  <CheckBox
    name="checky"
    id="checky"
    checked={toggle}
    onChange={(event: React.ChangeEvent<HTMLInputElement> & { target: HTMLInputElement }) => {
      setToggle(event.target.checked);
  }}>
    <span>Label:</span>
  </CheckBox>
*/


type CheckBoxProps = React.ComponentProps<typeof CheckBox>;

export type { CheckBoxProps };

export default CheckBox;
