import React, { FC } from "react";
import { useFormContext, useFormState } from "react-hook-form";

import Button from "../../subatoms/Button";

import type { ButtonProps } from "../../subatoms/Button";

const ContextSubmitButton: FC<
  Omit<ButtonProps, "disabled" | "type"> & { isLoading?: boolean, ignoreStatus?: boolean }
> = ({ children, className = "", isLoading = false, ignoreStatus = false ...props }) => {
  const { control } = useFormContext();
  const { isValid, isSubmitting } = useFormState({ control });

  return (
    <Button
      {...props}
      type={"submit"}
      disabled={(ignoreStatus ? false : !isValid) || isSubmitting || isLoading}
      data-busy={JSON.stringify(isSubmitting || isLoading)}
      className={className}
    >
      {children}
    </Button>
  );
};

type ContextSubmitButtonProps = React.ComponentProps<
  typeof ContextSubmitButton
>;

export type { ContextSubmitButtonProps };

export default ContextSubmitButton;
