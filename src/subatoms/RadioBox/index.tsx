import React from "react";

import { hasChildren } from "../../_shared/helpers";
import { useSharedStyle } from "../../_shared/hooks";

import type { FC, Ref, CSSProperties, ComponentPropsWithRef } from "react";


import { CircleIcon } from "./assets/CircleIcon";

const RadioIconSizes = {
    TINY: 14,
    SMALL: 18,
    MID: 22,
    LARGE: 32
};

const RadioBox: FC<
  {
    wrapperClassName?: string;
    wrapperStyle?: CSSProperties;
    labelClassName?: string;
    labelPosition?: "beforeInput" | "afterInput";
    children?: React.ReactNode;
    displayStyle?: "transparent" | "adjusted";
    radioIconSize?: number;
    radioIconStrokeColor?: string;
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
      labelPosition = "beforeInput",
      className = "",
      children,
      wrapperStyle,
      radioIconSize,
      radioIconStrokeColor,
      displayStyle = "transparent",
      onChange,
      onBlur,
      ...props
    },
    ref: Ref<HTMLInputElement>
  ) => {
    const STYLESHEET_ID = "react-busser-headless-ui_radio";
    const BASE_CSS = `
      .radio_wrapper-box {
        position: static;
        display: inline-block; /* shrink-to-fit trigger */
        min-height: 0;
        min-width: fit-content;
      }

      .radio_hidden-input[data-display-style="transparent"] {
        opacity: 0;
      }

      .radio_hidden-input[data-display-style="adjusted"] {
        -moz-appearance: -moz-none;
        -moz-apperance: none;
        -webkit-appearance: none;
        appearance: none;
      }

      .radio_hidden-input {
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
        cursor: pointer;
      }

      .radio_hidden-input + svg {
        display: block;
      }

      .radio_control-icon-box {
        min-height: 0;
        min-width: fit-content;
        position: relative;
        display: inline-block;
        vertical-align: middle;
      }
    `;
    useSharedStyle(STYLESHEET_ID, BASE_CSS);

    return (
      <div className={wrapperClassName} style={wrapperStyle} tabIndex={tabIndex}>
        {hasChildren(children, 0)
          ? null
          : (labelPosition === "beforeInput" && (
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
            )) ||
            null}
        <span
          className={`
          radio_control-icon-box ${className}
        `}
        >
          <input
            {...props}
            id={id}
            name={name}
            type="radio"
            data-display-style={displayStyle}
            onChange={onChange}
            onBlur={onBlur}
            className={"radio_hidden-input"}
            ref={ref}
          />
          {typeof radioIconSize === "number" ? (
            <CircleIcon
              size={radioIconSize}
              iconStroke={radioIconStrokeColor}
            />
          ) : null}
        </span>
        {hasChildren(children, 0)
          ? null
          : (labelPosition === "afterInput" && (
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
            )) ||
            null}
      </div>
    );
  }
);

type RadioBoxProps = React.ComponentProps<typeof RadioBox>;

export { RadioIconSizes };

export type { RadioBoxProps };

export default RadioBox;

/*

  @EXAMPLE:


  import { useState } from 'react';

  const [decoration, setDecoration] = useState('flat');

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDecoration(event.target.value);
  };

  <RadioBox
    id="decoration-flat"
    name="decoration"
    value="flat"
    checked={decoration === 'flat'}
    onChange={onChange}
    wrapperClassName="picnic_option"
    displayStyle="adjusted"
    radioIconSize={RadioIconSizes.SMALL}
    radioIconStrokeColor="cyan"
  >
    <span>Flat decoration</span>
  </RadioBox>

*/
