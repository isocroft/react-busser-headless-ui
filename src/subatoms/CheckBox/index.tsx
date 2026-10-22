import React from "react";

import { hasChildren } from "../../_shared/helpers";
import { useSharedStyle } from "../../_shared/hooks";

import type { FC, Ref, ComponentPropsWithRef, CSSProperties } from "react";


import { MarkIcon } from "./assets/MarkIcon";

const CheckBox: FC<
  {
    placeholder?: string;
    wrapperClassName?: string;
    wrapperStyle?: CSSProperties;
    labelClassName?: string;
    displayStyle?: "transparent" | "adjusted";
    checkIconSize?: number;
    checkIconFillColor?: string;
    ref?: Ref<HTMLInputElement>;
  } & Omit<ComponentPropsWithRef<"input">, "type" | "placeholder" | "ref">
> = React.forwardRef(
  (
    {
      id,
      name,
      tabIndex = 0,
      wrapperClassName = "",
      labelClassName = "",
      className = "",
      children,
      wrapperStyle,
      checkIconSize = 27,
      checkIconFillColor,
      displayStyle = "transparent",
      ...props
    },
    ref: Ref<HTMLInputElement>
  ) => {
    const STYLESHEET_ID = "react-busser-headless-ui_check";
    const BASE_CSS = `
        .check_wrapper-box {
          position: static;
          display: inline-block; /* shrink-to-fit trigger */
          min-height: 0;
          min-width: fit-content;
        }
  
        .check_hidden-input[data-display-style="transparent"] {
          opacity: 0;
        }
  
        .check_hidden-input[data-display-style="adjusted"] {
          -moz-appearance: -moz-none;
          -moz-apperance: none;
          -webkit-appearance: none;
          appearance: none;
        }
  
        .check_hidden-input {
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
          z-index: 1;
          cursor: pointer;
        }
  
        .check_hidden-input + svg {
          display: block;
          pointer-events: none;
          position: relative;
          z-index: 10;
        }
  
        .check_hidden-input:not(:checked) + svg path {
          stroke: transparent;
        }
  
        .check_control-icon-box {
          min-height: 0;
          min-width: fit-content;
          position: relative;
          display: inline-block;
          vertical-align: middle;
        }
     `;
    useSharedStyle(STYLESHEET_ID, BASE_CSS);
    
    return (
      <>
        <div className={wrapperClassName} style={wrapperStyle} role="group">
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
              data-display-style={displayStyle}
              className={"check_hidden-input"}
              ref={ref}
            />
            <MarkIcon size={checkIconSize} iconFill={checkIconFillColor} />
          </span>
          {hasChildren(children, 0) ? null : (
            <label htmlFor={id} className={labelClassName}>
              {hasChildren(children, 1)
                ? React.cloneElement(
                    children as React.ReactElement<{ required: boolean }>,
                    {
                      required: props.required,
                    }
                  )
                : null}
            </label>
          )}
        </div>
      </>
    );
  }
);


type CheckBoxProps = React.ComponentProps<typeof CheckBox>;

export type { CheckBoxProps };

export default CheckBox;

/*

  @EXAMPLE:


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
