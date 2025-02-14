import React, { FC, useEffect } from "react";
import { useFormContext } from "react-hook-form";

import SwitchBox from "../../atoms/SwitchBox";

import type { SwitchBoxProps } from "../../atoms/SwitchBox";

const ContextSwitchBox: FC<
  SwitchBoxProps & {
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
  shouldUnregister = true,
  labelClassName = "",
  requiredErrorMessage,
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
      <SwitchBox
        {...props}
        name={name}
        required={required}
        disabled={disabled}
        className={className}
        aria-invalid={invalid ? "true" : "false"}
        ref={(node?: HTMLInputElement | null) => ref(node)}
        onChange={onChange}
        onBlur={onBlur}
        tabIndex={tabIndex}
        wrapperClassName={wrapperClassName}
        labelClassName={labelClassName}
      >
        {children}
      </SwitchBox>
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
  <ContextSwitchBox
      name="switcha"
      id="switchy"
      widgetSize={22}
    >
    <span>Switcha:</span>
  </ContextSwitchBox>
*/

type ContextSwitchBoxProps = React.ComponentProps<typeof ContextSwitchBox>;

export type { ContextSwitchBoxProps };

export default ContextSwitchBox;
