import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import SelectBox from "../../subatoms/SelectBox";

import type { FC } from "react";
import type { SelectBoxProps } from "../../subatoms/SelectBox";

const ContextSelectBox: FC<
  Omit<SelectBoxProps, "ref"> & {
    shouldUnregister?: boolean;
    requiredErrorMessage?: string;
    ErrorComponent?: React.FunctionComponent<{
      isDirty: boolean;
      invalid: boolean;
      errorMessage: string | null;
    }>;
  }
> = ({
  name = "",
  children,
  className = "",
  wrapperClassName = "",
  valueSync = false,
  chevronSize = 10,
  chevronOpacity = 0.76,
  widthFillAvailable = false,
  ErrorComponent,
  shouldUnregister = false,
  requiredErrorMessage,
  required,
  disabled,
  ...props
}) => {
  const { register, getFieldState, formState } = useFormContext();

  let { isDirty, invalid, error } = getFieldState(name, formState);

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
    shouldUnregister,
  };

  if (typeof props.onChange === "function") {
    mergedRegisterOptions.onChange = props.onChange;
    delete props["onChange"];
  }

  if (typeof props.onBlur === "function") {
    mergedRegisterOptions.onBlur = props.onBlur;
    delete props["onBlur"];
  }

  const { onChange, onBlur, ref } = register(name, mergedRegisterOptions);

  return (
    <>
      <SelectBox
        ref={ref}
        onBlur={onBlur}
        onChange={onChange}
        name={name}
        {...props}
        className={className}
        wrapperClassName={wrapperClassName}
        valueSync={valueSync}
        chevronSize={chevronSize}
        chevronOpacity={chevronOpacity}
        widthFillAvailable={widthFillAvailable}
      >
        {children}
      </SelectBox>
      {ErrorComponent ? (
        <ErrorComponent
          isDirty={isDirty}
          invalid={invalid}
          errorMessage={error?.message || null}
        />
      ) : null}
    </>
  );
};

type ContextSelectBoxProps = React.ComponentProps<typeof ContextSelectBox>;

export type { ContextSelectBoxProps };
