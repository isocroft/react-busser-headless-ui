import React, { FC } from "react";

const Form: FC<React.ComponentPropsWithRef<"form">> = ({
  onSubmit,
  children,
  ...props
}) => {
  return (
    <form {...props} onSubmit={onSubmit}>
      {children}
    </form>
  );
};

type FormProps = React.ComponentProps<typeof Form>;

export type { FormProps };

export default Form;
