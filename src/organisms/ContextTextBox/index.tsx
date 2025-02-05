import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";

import TextBox from "../../subatoms/TextBox";

import type { TextBoxProps } from "../../subatoms/TextBox";

const ContextTextBox = ({
  as: C_as = "input",
  name = "",
  type = "text",
  placeholder,
  pattern,
  children,
  className = "",
  disabled,
  required,
  value,
  requiredErrorMessage,
  valueAsType = false,
  shouldUnregister = true,
  wrapperClassName = "",
  labelClassName = "",
  ErrorComponent,
  ...props
}: TextBoxProps & {
  valueAsType?: boolean;
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

  const extraRegisterOptions: Record<string, unknown> = {};

  useEffect(() => {
    const fieldState = getFieldState(name, formState);
    invalid = fieldState.invalid;
    error = fieldState.error;
  }, [isDirty]);

  /* @NOTE: `maxLength` seems not to work as an option for `register(name, ...)` */
  /* @CHECK: https://github.com/react-hook-form/documentation/issues/1043 */
  if (C_as === "input") {
    switch (type) {
      case "text":
      case "password":
        if (typeof props.maxLength === "number") {
          extraRegisterOptions.maxLength = {
            value: props.maxLength,
            message: `${name} cannot exceed ${props.maxLength} characters`,
          };
        }

        if (typeof props.minLength === "number") {
          extraRegisterOptions.minLength = {
            value: props.minLength,
            message: `${name} cannot exceed ${props.minLength} characters`,
          };
        }

        if (typeof pattern === "string") {
          extraRegisterOptions.pattern = new RegExp(pattern);
        }
        break;
      case "email":
        extraRegisterOptions.validate = (data: string) => {
          const hasAtSymbol = /^(?:[^@\s]+)(?=\@)/.test(data);
          const hasTopLevelDomain = /\.[a-z]{2,4}$/.test(data);
          return hasAtSymbol && hasTopLevelDomain;
        };
        break;
      case "number":
      case "range":
        if (typeof props.min !== "undefined") {
          extraRegisterOptions.min = props.min;
        }
        if (typeof props.max !== "undefined") {
          extraRegisterOptions.max = props.max;
        }
        if (valueAsType === true && type === "number") {
          extraRegisterOptions.valueAsNumber = true;
        }
        break;
      case "date":
        if (valueAsType === true) {
          extraRegisterOptions.valueAsDate = true;
        }
        break;
      default:
        extraRegisterOptions.value = value;
        break;
    }
  } else if (C_as === "textarea") {
    if (typeof props.maxLength === "number") {
      extraRegisterOptions.maxLength = {
        value: props.maxLength,
        message: `${name} cannot exceed ${props.maxLength} characters`,
      };
    }

    if (typeof props.minLength === "number") {
      extraRegisterOptions.minLength = {
        value: props.minLength,
        message: `${name} cannot exceed ${props.minLength} characters`,
      };
    }
  }

  const mergedRegisterOptions: Record<string, unknown> = {
    ...extraRegisterOptions,
    required:
      required === true
        ? requiredErrorMessage || `${name} is required`
        : undefined,
    disabled,
    shouldUnregister: true,
  };

  if (typeof props.onChange === "function") {
    mergedRegisterOptions.onChange = props.onChange;
    delete props["onChange"];
  }

  if (typeof props.onBlur === "function") {
    mergedRegisterOptions.onBlur = props.onBlur;
    delete props["onBlur"];
  }

  const { onChange, onBlur, ref } = register(
    name,
    mergedRegisterOptions
  );

  return (
    <>
      <TextBox
        {...props}
        name={name}
        onBlur={onBlur}
        onChange={onChange}
        aria-invalid={invalid ? "true" : "false"}
        ref={(node?: HTMLInputElement | null) => ref(node)}
        type={type}
        pattern={pattern}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        wrapperClassName={wrapperClassName}
        labelClassName={labelClassName}
        as={C_as}
        role={
          (C_as === "input" && type === "text") || C_as === "textarea"
            ? "textbox"
            : undefined
        }
      >
        {children}
      </TextBox>
      {ErrorComponent ? (
        <ErrorComponent
          isDirty={isDirty}
          fieldName={name}
          invalid={invalid}
          errorMessage={error ? `${error.type}: ${error.message}` : null}
        />
      ) : null}
    </>
  );
};

type ContextTextBoxProps = React.ComponentProps<typeof ContextTextBox>;

export type { ContextTextBoxProps };

export default ContextTextBox;

