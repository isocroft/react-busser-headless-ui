import React, { useRef, useCallback, useEffect } from "react";

import { hasChildren } from "../../_shared/helpers";
import { useSharedStyle } from "../../_shared/hooks";

import type { FC, Ref, CSSProperties } from "react";

type CustomElementTagProps<T extends React.ElementType> =
  React.ComponentProps<T> & {
    as?: T;
  };

/* @ts-ignore */
const TextBox: FC<
  CustomElementTagProps<"input" | "textarea"> &
    Omit<
      React.ComponentProps<"input">,
      | "type"
      | "ref"
      | "onChange"
      | "onInput"
      | "pattern"
      | "size"
      | "src"
      | "checked"
      | "multiple"
      | "defaultChecked"
      | "onInvalid"
    > &
    Omit<
      React.ComponentProps<"textarea">,
      | "wrap"
      | "cols"
      | "textLength"
      | "rows"
      | "onChange"
      | "onInput"
      | "ref"
      | "onInvalid"
    > & {
      rows?: number;
      cols?: number;
      wrap?: "hard" | "soft" | "off";
      pattern?: string;
      src?: string;
      size?: number;
      onChange?: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => void;
      onInput?: () => void;
      onInvalid?: () => void;
      type?: "text" | "password" | "email" | "search" | "url";
    } & {
      wrapperClassName?: string;
      wrapperStyle?: CSSProperties;
      labelPosition?: "beforeInput" | "afterInput";
      labelClassName?: string;
      valueSync?: boolean;
    }
> = React.forwardRef(
  (
    {
      as: Component = "input",
      id,
      name,
      type = "text",
      rows,
      cols,
      wrap = "off",
      pattern,
      src,
      size,
      onChange,
      children,
      wrapperClassName = "",
      labelPosition = "afterInput",
      labelClassName = "",
      className = "",
      wrapperStyle,
      defaultValue = "",
      valueSync = false,
      tabIndex = 0,
      ...props
    },
    ref: Ref<HTMLInputElement & HTMLTextAreaElement>
  ) => {
    const anyValue = (defaultValue ? defaultValue : props.value) as string;
    const textBoxRef = useRef<(HTMLInputElement & HTMLTextAreaElement) | null>(
      null
    );
    const STYLESHEET_ID = "react-busser-headless-ui_text";
    const BASE_CSS = `  
      .text_wrapper-box {
        overflow: hidden;
      }

      .text_wrapper-box input,
      .text_wrapper-box textarea {
        display: block;
      }
    `;
    useSharedStyle(STYLESHEET_ID, BASE_CSS);

    useEffect(() => {
      if (!valueSync || textBoxRef.current === null || anyValue === "") {
        return;
      }
      /* @NOTE: Programmatically trigger a `change` event on a <input> tag */
      /* @CHECK: https://github.com/facebook/react/issues/19678#issuecomment-679044981 */
      const programmaticChangeEvent = new Event("input", { bubbles: true });
      const setInputValue =
        Component === "textarea"
          ? Object.getOwnPropertyDescriptor(
              HTMLTextAreaElement.prototype,
              "value"
            )!.set
          : Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              "value"
            )!.set;

      if (typeof setInputValue !== "undefined") {
        setInputValue.call(
          textBoxRef.current,
          anyValue === "undefined" ? "" : anyValue
        );
        textBoxRef.current.dispatchEvent(programmaticChangeEvent);
      }
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [valueSync, anyValue]);

    const $ref = useCallback((node: HTMLInputElement) => {
      if (node) {
        textBoxRef.current = node;
      } else {
        textBoxRef.current = null;
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

    return (
      <>
        <div
          className={`text_wrapper-box ${
            wrapperClassName ? wrapperClassName : ""
          }`}
          style={wrapperStyle}
        >
          {hasChildren(children, 0)
            ? null
            : (labelPosition === "beforeInput" && (
                <label htmlFor={name} className={labelClassName}>
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
          <Component
            rows={
              typeof rows === "number" && Component === "textarea"
                ? rows
                : undefined
            }
            cols={
              typeof cols === "number" && Component === "textarea"
                ? cols
                : undefined
            }
            wrap={
              typeof wrap === "string" && Component === "textarea"
                ? wrap
                : undefined
            }
            type={
              typeof type === "string" && Component === "input"
                ? type
                : undefined
            }
            onChange={typeof onChange === "function" ? onChange : undefined}
            pattern={
              typeof pattern === "string" && Component === "input"
                ? pattern
                : undefined
            }
            src={
              typeof src === "string" && Component === "input" ? src : undefined
            }
            size={
              typeof size === "number" && Component === "input"
                ? size
                : undefined
            }
            id={id}
            name={name}
            tabIndex={tabIndex}
            className={className}
            {...props}
            defaultValue={
              !props.value && defaultValue !== "" ? defaultValue : undefined
            }
            /* @ts-ignore */
            ref={$ref}
          />
          {hasChildren(children, 0)
            ? null
            : (labelPosition === "afterInput" && (
                <label htmlFor={name} className={labelClassName}>
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
      </>
    );
  }
);

type TextBoxProps = React.ComponentProps<typeof TextBox>;

export type { TextBoxProps };

export default TextBox;

/*

  @EXAMPLE:
  
  import React, { useState } from "react";
  const [myText, setMyText] = useState<string>("");
  
  
  <TextBox
    id="mytext"
    name="mytext"
    className=""
    value={myText}
    onChange={(
      event: React.ChangeEvent<HTMLInputElement> & {
        target: HTMLInputElement;
      }
    ) => {
      setMyText(event.target.value);
    }}
  >
    <span>My Text:</span>
  </TextBox>

  <p>{myText ? myText : "..."}</p>

*/
