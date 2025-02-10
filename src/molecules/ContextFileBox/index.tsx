import React, { FC, useEffect } from "react";
import { useFormContext } from "react-hook-form";

import FileBox from "../../subatoms/FileBox";

import type { FileBoxProps } from "../../subatoms/FileBox";

const ContextFileBox: FC<
  FileBoxProps & {
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
  children,
  name = "",
  required,
  disabled,
  tabIndex = 0,
  wrapperClassName = "",
  className = "",
  shouldUnregister = true,
  labelClassName = "",
  requiredErrorMessage,
  ErrorComponent,
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
      <FileBox
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
      </FileBox>
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

/*
  <ContextFileBox
      name="filez"
      id="files"
      accept="image/*"
      multiple={true}
      prompt=""
    >
    <span>My File:</span>
  </ContextFileBox>
*/
type ContextFileBoxProps = React.ComponentProps<typeof ContextFileBox>;

export type { ContextFileBoxProps };

export default ContextFileBox;
