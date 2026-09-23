import React, { useState, useEffect, useRef } from "react";
import InputBox from "../subatoms/InputBox";

import type { FC } from "react";
import type { InputBoxProps } from "../subatoms/InputBox";

interface CompositionEvent<T = Element>
  extends React.SyntheticEvent<T, CompositionEvent> {
  data: string;
}

type OTPEntryBoxProps = {
  name: string;
  masked?: boolean;
  entryType?: "numeric" | "text";
  inputMode?: "numeric" | "text" | "decimal" | "tel";
  placeholder?: string;
  slots?: number;
  required?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  onChange?: (
    event: React.ChangeEvent<HTMLInputElement> & { target: HTMLInputElement }
  ) => void;
  onComplete?: (value: string) => void;
  pasteTransformer?: (pastedText: string) => string;
  noScriptCSSFallback?: string | null;
};

type CustomElementTagProps<T extends React.ElementType> =
  React.ComponentPropsWithRef<T> & {
    as?: T;
  };

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

function ClonedFormInputElements({
  as: Component = "div",
  children,
  count = 1,
  keyPrefix = "cloned",
  elementProps = { type: "text", placeholder: "", inputMode: "tel" },
  defaultValues = "",
  className,
  onChange,
  onPaste,
  onFocus,
  onKeyDown,
  onBeforeInput,
  ...props
}: {
  count?: number;
  keyPrefix?: string;
  defaultValues?: string;
  elementProps?: Pick<
    React.ComponentPropsWithRef<"input">,
    | "type"
    | "inputMode"
    | "maxLength"
    | "minLength"
    | "size"
    | "tabIndex"
    | "disabled"
    | "placeholder"
  >;
  className?: string;
  onChange?: React.ComponentProps<"input">["onChange"];
  onPaste?: React.ComponentProps<"input">["onPaste"];
  onFocus?: React.ComponentProps<"input">["onFocus"];
  onKeyDown?: React.ComponentProps<"input">["onKeyDown"];
  onBeforeInput?: React.ComponentProps<"input">["onBeforeInput"];
} & CustomElementTagProps<"nav" | "header" | "section" | "div"> &
  Omit<React.ComponentProps<"div">, "align">) {
  const OTP_PLACEHOLDER_ARR =
    typeof elementProps.placeholder === "string" &&
    elementProps.placeholder.length > 0
      ? elementProps.placeholder.split("").slice(0, count)
      : Array(count).fill("*");
  const childrenArray = React.Children.toArray(children);
  const firstChild = childrenArray[0] as React.ReactElement<
    InputBoxProps,
    React.JSXElementConstructor<InputBoxProps>
  >;

  if (
    typeof keyPrefix !== "string" ||
    !firstChild ||
    !isSubChild(firstChild, "CodeInput") ||
    hasChildren(children, 0)
  ) {
    return null;
  }

  const dValue = useRef<string>("").current;

  const clonedElements = Array.from({ length: count }).map((_, index) => {
    if (React.isValidElement(firstChild)) {
      return React.cloneElement<InputBoxProps>(firstChild, {
        valueSync: true,
        ...elementProps,
        placeholder: OTP_PLACEHOLDER_ARR[index],
        name: "",
        form: "none", // @HINT: Stop input from being submitted by any HTML form: `<input form="none" name="">`
        defaultValue: defaultValues.charAt(index) || dValue,
        className,
        onChange,
        onPaste,
        onFocus,
        onKeyDown,
        onBeforeInput,
        key: `${keyPrefix.toLowerCase()}-${index}`,
        ["aria-label"]: `Digit ${index + 1} of ${count}`,
        [`data-${keyPrefix.toLowerCase()}-index`]: String(index),
      });
    }
    return null;
  });

  return <Component {...props}>{clonedElements}</Component>;
}

const CodeEntryBox = ({
  name,
  masked = false,
  entryType = "numeric",
  inputMode = "numeric",
  placeholder = "",
  slots = 4,
  required = false,
  disabled = false,
  className = "",
  defaultValue = "",
  wrapperClassName = "",
  pasteTransformer = (pastedText: string) => pastedText,
  onChange,
  children,
  ...props
}: React.PropsWithChildren<OTPEntryBoxProps>) => {
  const keyPrefix = useRef<string>(
    ((Math.random() / 0.95 + 1) * new Date().getTime())
      .toString(32)
      .replace(/([.\d])+/g, "")
  ).current;

  const STYLESHEET_ID = "react-busser-headless-ui_codeentrybox";
  const MAX_NUMBER_INPUTS = slots;
  const MIN_LENGTH_INPUT = 1;
  const MAX_LENGTH_INPUT = 1;
  const NUMBER_REGEX = /^[0-9]+$/;
  const ALL_REGEX = /^.+$/;
  const INPUT_TYPE = masked
    ? "password"
    : entryType === "numeric"
    ? "tel"
    : "text";
  const INPUT_CORE_PROPS = {
    type: INPUT_TYPE,
    required,
    placeholder,
    disabled,
    tabIndex: 0,
    minLength: MIN_LENGTH_INPUT,
    maxLength: MAX_LENGTH_INPUT,
    size: 1,
    inputMode,
  };

  let stylesheetRefCount = 0;

  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  const setInputLettersArray = (letters: string[]): boolean => {
    let returnValue = false;
    if (!Array.isArray(letters)) {
      return returnValue;
    }

    if (hiddenInputRef.current) {
      const newValue = letters.join("");
      if (hiddenInputRef.current.value !== newValue) {
        returnValue = true;
        const setInputValue = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )!.set;
        /* @CHECK: https://www.designcise.com/web/tutorial/how-to-trigger-change-event-on-html-hidden-input-element-using-javascript */
        if (typeof setInputValue !== "undefined") {
          setInputValue.call(hiddenInputRef.current, newValue);
          setTimeout(
            (val) => {
              hiddenInputRef.current.setAttribute("value", val);
            },
            0,
            newValue
          );

          hiddenInputRef.current.dispatchEvent(
            new Event("input", { bubbles: true })
          );
        }
      }
    }

    return returnValue;
  };

  const getInputLettersString = (): string => {
    if (hiddenInputRef.current) {
      return hiddenInputRef.current.value;
    }

    return "";
  };

  // @HINT: Priority: entryType > allCharactersAllowed
  const [selectedRegex] = useState<RegExp>(
    entryType === "numeric" ? NUMBER_REGEX : ALL_REGEX
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

    const codeEntryBoxStyle = window.document.createElement("style");
    codeEntryBoxStyle.id = STYLESHEET_ID;

    codeEntryBoxStyle.innerHTML = `
      [data-codeentrybox-root] [type="text"][data-codeentrybox-hidden] {
        font-size: 0;
        padding: 0;
        visibility: hidden;
        pointer-events: none;
        position: absolute;
      }

      [data-codeentrybox-root] legend {
        font-size: 0;
        padding: 0;
        visibility: hidden;
        pointer-events: none;
      }
    `;
    window.document.head.appendChild(codeEntryBoxStyle);

    return () => {
      stylesheetRefCount -= 1;

      if (stylesheetRefCount > 0) {
        /* 
          @HINT:
          
          If there are still `<CodeEntryBox />` components mounted, don't pull out 
          the stylesheet from the DOM
        */
        return;
      }

      const codeEntryBoxStyle = window.document.getElementById(STYLESHEET_ID);
      if (codeEntryBoxStyle !== null && codeEntryBoxStyle.parentNode !== null) {
        codeEntryBoxStyle.parentNode.removeChild(codeEntryBoxStyle);
      }
    };
  }, []);

  const focusNextInput = (
    index: number,
    parentNode: ParentNode | null
  ): void => {
    if (index >= MAX_NUMBER_INPUTS - 1 || index < -1) {
      return;
    }

    const nextInputNode = parentNode
      ? parentNode.querySelector<HTMLInputElement>(
          `input[data-${keyPrefix.toLowerCase()}-index="${index + 1}"]`
        )
      : null;

    if (nextInputNode) {
      nextInputNode.focus();
    }
  };

  const focusPrevInput = (
    index: number,
    parentNode: ParentNode | null
  ): void => {
    if (index <= 0) {
      return;
    }

    const prevInputNode = parentNode
      ? parentNode.querySelector<HTMLInputElement>(
          `input[data-${keyPrefix.toLowerCase()}-index="${index - 1}"]`
        )
      : null;

    if (prevInputNode) {
      prevInputNode.focus();
    }
  };

  const handleOnInputChange = (
    event: React.ChangeEvent<HTMLInputElement> & { target: HTMLInputElement }
  ): void => {
    const _name = event.target.getAttribute("name");

    if (_name === "_") {
      event.target.setAttribute("name", "");
      return;
    }

    const index = Number(
      event.target.dataset[`${keyPrefix.toLowerCase()}Index`]
    );
    const inputLettersArray = getInputLettersString().split("");
    const inputText = event.target.value;

    if (selectedRegex.test(inputText)) {
      setInputLettersArray([
        ...inputLettersArray.slice(0, index),
        inputText,
        ...inputLettersArray.slice(index + 1),
      ]);
      focusNextInput(index, event.target.parentNode);
    }
  };

  const handlePasteCapture = (
    event: React.ClipboardEvent<HTMLInputElement> & { target: HTMLInputElement }
  ) => {
    const rawPastedText = event.clipboardData.getData("text/plain");
    const pastedText = rawPastedText.slice(0, MAX_NUMBER_INPUTS);

    if (!selectedRegex.test(pastedText)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleOnInputPaste = (
    event: React.ClipboardEvent<HTMLInputElement> & { target: HTMLInputElement }
  ) => {
    event.preventDefault();

    const index = Number(
      event.target.dataset[`${keyPrefix.toLowerCase()}Index`]
    );
    const rawPastedText = pasteTransformer(
      event.clipboardData.getData("text/plain") || ""
    );
    const candidateText = rawPastedText.slice(0, MAX_NUMBER_INPUTS - index);

    if (!selectedRegex.test(candidateText)) {
      return;
    }

    const pastedText = candidateText.split("");
    const inputLettersArray = getInputLettersString().split("");
    const isOverMaxLength = index + pastedText.length >= MAX_NUMBER_INPUTS;

    let chars = [];
    let nextInput = event.target;

    if (isOverMaxLength) {
      chars = [...inputLettersArray.slice(0, index), ...pastedText].slice(
        0,
        MAX_NUMBER_INPUTS
      );
      setInputLettersArray(chars);
    } else {
      chars = [
        ...inputLettersArray.slice(0, index),
        ...pastedText,
        ...inputLettersArray.slice(pastedText.length + 1),
      ].slice(0, MAX_NUMBER_INPUTS);
      setInputLettersArray(chars);
    }

    const setInputValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )!.set;

    chars.map((char) => {
      /* @CHECK: https://www.designcise.com/web/tutorial/how-to-trigger-change-event-on-html-hidden-input-element-using-javascript */
      if (typeof setInputValue !== "undefined") {
        setInputValue.call(nextInput, char);
        nextInput.setAttribute("name", "_");
        nextInput.dispatchEvent(new Event("input", { bubbles: true }));
        nextInput = nextInput.nextElementSibling;
      }
    });

    focusNextInput(index + pastedText.length - 2, event.target.parentNode);
  };

  const handleOnBeforeInputKeyDown = (
    event: React.CompositionEvent<HTMLInputElement>
  ) => {
    const data = event.data;
    const letters = (getInputLettersString() + data).slice("");
    setInputLettersArray(letters);
  };

  const handleOnInputMouseUp = (event: React.MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
  };

  const handleOnInputFocus = (
    event: React.FocusEvent<HTMLInputElement> & { target: HTMLInputElement }
  ) => {
    setTimeout(() => {
      event.target.select();
      event.target.setSelectionRange(0, event.target.value.length);
    }, 0);
  };

  const handleOnInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement> & { target: HTMLInputElement }
  ) => {
    const index = Number(
      event.target.dataset[`${keyPrefix.toLowerCase()}Index`]
    );

    if (
      event.keyCode === 8 ||
      event.key === "Backspace" ||
      event.keyCode === 46 ||
      event.key === "Delete"
    ) {
      event.preventDefault();
      const inputLettersString = getInputLettersString();
      const inputLettersArray = inputLettersString.split("");
      const value = inputLettersString.charAt(index);
      setInputLettersArray([
        ...inputLettersArray.slice(0, index),
        "",
        ...inputLettersArray.slice(index + 1),
      ]);
      if (value || event.target.value) {
        event.target.value = "";
        focusPrevInput(index, event.target.parentNode);
      }
    } else if (event.keyCode === 37 || event.key === "ArrowLeft") {
      focusPrevInput(index, event.target.parentNode);
    } else if (event.keyCode === 39 || event.key === "ArrowRight") {
      focusNextInput(index, event.target.parentNode);
    }
  };

  return (
    <fieldset
      className={wrapperClassName}
      onPasteCapture={handlePasteCapture}
      data-codeentrybox-root={"yes"}
    >
      {/* Screen readers will announce this legend first */}
      <legend>{props.title}</legend>
      <input
        type={"text"}
        name={name}
        data-codeentrybox-hidden={""}
        defaultValue={
          hiddenInputRef.current ? hiddenInputRef.current.value : defaultValue
        }
        onChange={typeof onChange === "function" ? onChange : undefined}
        ref={hiddenInputRef}
      />
      <ClonedFormInputElements
        count={slots}
        elementProps={INPUT_CORE_PROPS}
        keyPrefix={keyPrefix}
        defaultValues={defaultValue}
        onChange={handleOnInputChange}
        onPaste={handleOnInputPaste}
        onFocus={handleOnInputFocus}
        onKeyDown={handleOnInputKeyDown}
        onMouseUp={handleOnInputMouseUp}
        onBeforeInput={handleOnBeforeInputKeyDown}
        className={className}
      >
        {children}
      </ClonedFormInputElements>
    </fieldset>
  );
};

const CodeInput = ({
  ...props
}: Omit<InputBoxProps, "onChange" | "type" | "children">) => {
  return <InputBox {...props} />;
};

CodeEntryBox.Input = CodeInput;

export default CodeEntryBox;

/*
<CodeEntryBox
  name="otp"
  slots={6}
  title={"OTP"}
  onChange={(event) => {
    console.log("haha! ", event.target.value);
  }}
>
  <CodeEntryBox.Input />
</CodeEntryBox>
*/
