import React, { FC, CSSProperties, Ref, useRef, useEffect, useMemo } from "react";
import type { RadioBoxListProps } from "./RadioBoxList";
import { RadioIcon } from "./RadioBoxList";

import { useFormContext } from "react-hook-form";

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
): child is C => {
  const getChildTypeName = (
    $child: React.ReactElement<C, string | React.JSXElementConstructor<string>>
  ) => {
    if (typeof $child !== "object" || $child === null) {
      return "";
    }
    /* @ts-ignore */
    return "render" in $child?.type ? $child?.type?.render?.name : $child?.type;
  };

  return (
    React.isValidElement<C>(child) &&
    (typeof child?.type === "function"
      ? child?.type?.name === tag
      : String(getChildTypeName(child)).includes(tag))
  );
};

import { CircleIcon } from "../../subatoms/RadioBox/assets/CircleIcon";

type CustomElementTagProps<T extends React.ElementType> =
  React.ComponentPropsWithRef<T> & {
    as?: T;
  };

type ContextRadioBoxListControlProps = {
  value?: string;
  displayStyle?: "transparent" | "adjusted";
  radioIconFillColor?: string;
  radioIconStrokeColor?: string;
  radioIconSize?: number;
  ref?: Ref<HTMLInputElement>;
} & Omit<
  React.ComponentProps<"input">,
  "type" | "placeholder" | "crossOrigin" | "ref" | "value"
>;

const InputOption: FC<
  {
    labelClassName?: string;
    wrapperClassName?: string;
    wrapperStyle?: CSSProperties;
  } & ContextRadioBoxListControlProps
> = React.forwardRef(function InputOption(
  {
    value,
    tabIndex = 0,
    name = "",
    id,
    displayStyle = "transparent",
    wrapperClassName = "",
    labelClassName = "",
    className = "",
    wrapperStyle,
    radioIconFillColor,
    radioIconStrokeColor,
    radioIconSize = 16,
    onChange,
    onBlur,
    children,
    ...props
  },
  ref
) {
  return (
    <div className={wrapperClassName ? wrapperClassName : ""} style={wrapperStyle}>
      <span
        className={`
          radio_control-icon-box ${className}
        `}
      >
        <input
          id={id || value}
          name={name}
          type="radio"
          onChange={onChange}
          data-display-style={displayStyle}
          onBlur={onBlur}
          ref={ref}
          {...props}
          value={value}
          className={"radio_hidden-input"}
        />
        {typeof radioIconSize === "number" ? (
          <CircleIcon
            size={radioIconSize}
            iconFill={"transparent"}
            iconStroke={radioIconStrokeColor}
          />
        ) : null}
      </span>
      {hasChildren(children, 0) ? null : (
        <label htmlFor={id || value} className={labelClassName}>
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
  );
});

const ContextRadioBoxList = ({
  as: Component = "div",
  className = "",
  name = "",
  children,
  tabIndex = 0,
  displayStyle = "transparent",
  wrapperClassName = "",
  labelClassName = "",
  radioIconFillColor,
  radioIconStrokeColor,
  requiredErrorMessage,
  shouldUnregister = true,
  ErrorComponent,
  radioIconSize = 16,
  required,
  disabled,
  ...props
}: Omit<RadioBoxListProps, "radioDefaultValue"> & {
  requiredErrorMessage?: string;
  shouldUnregister?: boolean;
  ErrorComponent?: React.FunctionComponent<{
    isDirty: boolean;
    fieldName: string;
    invalid: boolean;
    errorMessage: string | null;
  }>;
}) => {
  const { register, getFieldState, formState } = useFormContext();

  let { isDirty, invalid, error } = getFieldState(name, formState);

  const extraRegisterOptions: Record<string, unknown> = {
    required:
      required === true
        ? requiredErrorMessage || `${name} is required`
        : undefined,
    disabled,
    shouldUnregister,
  };

  useEffect(() => {
    const fieldState = getFieldState(name, formState);
    invalid = fieldState.invalid;
    error = fieldState.error;
  }, [isDirty]);

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
      styleSheetsOnly.includes("react-busser-headless-ui_radio-contextbox")
    ) {
      return;
    }

    const radioStyle = window.document.createElement("style");
    radioStyle.id = "react-busser-headless-ui_radio-contextbox";

    radioStyle.innerHTML = `
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
      }

      .radio_hidden-input + svg {
        display: block;
      }

      /*.radio_hidden-input:checked + svg rect {
        stroke: #888888;
        fill: ${radioIconFillColor};
      }*/

      .radio_control-icon-box {
        min-height: 0;
        min-width: fit-content;
        position: relative;
        display: inline-block;
        vertical-align: middle;
      }
    `;
    window.document.head.appendChild(radioStyle);

    return () => {
      window.document.head.removeChild(radioStyle);
    };
  }, []);

  const childrenProps = useMemo(
    () =>
      React.Children.map(children, (child) => {
        if (!React.isValidElement(child) || !isSubChild(child, "InputOption")) {
          return null;
        }
        const childValue: string = child.props.value;

        const { ref, onChange, onBlur } = register(name, extraRegisterOptions);

        return React.cloneElement(
          child as React.ReactElement<
            {
              labelClassName?: string;
              wrapperClassName?: string;
            } & ContextRadioBoxListControlProps
          >,
          {
            name: name,
            value: childValue,
            radioIconFillColor,
            wrapperClassName,
            labelClassName,
            onChange,
            onBlur,
            displayStyle,
            radioIconStrokeColor,
            radioIconSize,
            ref: (node?: HTMLInputElement | null) => {
              if (typeof ref === "function") {
                ref(node);
              }
            },
          }
        );
      }),
    [
      name,
      displayStyle,
      wrapperClassName,
      labelClassName,
      radioIconStrokeColor,
      radioIconFillColor,
      radioIconSize,
      shouldUnregister,
      requiredErrorMessage,
      isDirty,
      required,
      disabled,
    ]
  );

  return (
    <Component
      {...props}
      className={`radio_wrapper-box${className ? ` ${className}` : ""}`}
      tabIndex={tabIndex}
      onChange={(
        e: React.ChangeEvent<HTMLInputElement>
      ) => {
        if (typeof props.onChange === "function") {
          props.onChange(e);
        }
      }}
      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
        if (typeof props.onBlur === "function") {
          props.onBlur(e);
        }
      }}
    >
      <>{childrenProps}</>
      {ErrorComponent ? (
        <ErrorComponent
          isDirty={isDirty}
          fieldName={name}
          invalid={invalid}
          errorMessage={error ? `${error.type}: ${error.message}` : null}
        />
      ) : null}
    </Component>
  );
};

/*

<ContextRadioBoxList
  as="section"
  name="gender"
  id="gender"
  displayStyle="adjusted"
  radioIconSize={RadioIcon.IconSizes.BIG}
  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('current value: ', event.target.value);
  }}
>
  <ContextRadioBoxList.Option value="male" id="male">
    <span>Male</span>
  </ContextRadioBoxList.Option>
  <ContextRadioBoxList.Option value="female" id="female">
    <span>Female</span>
  </ContextRadioBoxList.Option>
</ContextRadioBoxList>

*/

ContextRadioBoxList.Option = InputOption;

export { RadioIcon };

type ContextRadioBoxListProps = React.ComponentProps<
  typeof ContextRadioBoxList
>;

export type { ContextRadioBoxListProps };

export default ContextRadioBoxList;
