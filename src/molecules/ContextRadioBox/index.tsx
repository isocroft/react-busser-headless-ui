import React, { FC, useEffect } from "react";
import { useFormContext } from "react-hook-form";

import RadioBox from "../RadioBox";

import type { RadioBoxProps } from "../RadioBox";

const ContextRadioBox: FC<
  RadioBoxProps & {
    shouldUnregister?: boolean;
    requiredErrorMessage?: string;
    ErrorComponent?: React.FunctionComponent<{
      isDirty: boolean;
      fieldName: string;
      invalid: boolean;
      errorMessage: string | null;
    }>;
  }
> = ({
  name = "",
  children,
  className = "",
  wrapperClassName = "",
  tabIndex = 0,
  displayStyle = "transparent",
  shouldUnregister = true,
  labelClassName = "",
  radioIconSize,
  requiredErrorMessage,
  radioIconStrokeColor,
  ErrorComponent,
  required,
  disabled,
  ...props
}) => {
  const { register, getFieldState, formState } = useFormContext();

  let { isDirty, invalid, error } = getFieldState(name, formState)
  

  useEffect(() => {
    const fieldState = getFieldState(name, formState);
    invalid = fieldState.invalid;
    error = fieldState.error;
  }, [isDirty]);

  const mergedRegisterOptions: Record<string, unknown> = {
    required:
      required === true
        ? requiredErrorMessage || `${name} is required`
        : undefined,
    disabled,
    shouldUnregister
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
      <RadioBox
        {...props}
        name={name}
        required={required}
        disabled={disabled}
        className={className}
        aria-invalid={invalid ? "true" : "false"}
        ref={(node?: HTMLInputElement | null) => ref(node)}
        onChange={onChange}
        onBlur={onBlur}
        displayStyle={displayStyle}
        tabIndex={tabIndex}
        wrapperClassName={wrapperClassName}
        labelClassName={labelClassName}
        radioIconSize={radioIconSize}
        radioIconStrokeColor={radioIconStrokeColor}
      >
        {children}
      </RadioBox>
      {ErrorComponent
        ? <ErrorComponent
            isDirty={isDirty}
            fieldName={name}
            invalid={invalid}
            errorMessage={error ? `${error.type}: ${error.message}` : null}
          />
        : null
      }
    </>
  );
};

/*
  <ContextRadioBox
      name="optionx"
      id="optionz"
      displayStyle={"adjusted"}
      radioIconSize={22}
      radioIconStrokeColor={"green"}
    >
    <span>Option 1:</span>
  </ContextRadioBox>
*/
type ContextRadioBoxProps = React.ComponentProps<typeof ContextRadioBox>;

export type { ContextRadioBoxProps };

export default ContextRadioBox;
