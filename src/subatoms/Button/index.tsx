import React, { FC } from "react";

const Button: FC<Omit<React.ComponentProps<"button">, "role">> = ({
  id,
  name,
  tabIndex = 0,
  children,
  ...props
}) => {
  return (
    <button id={id} name={name} role="button" tabIndex={tabIndex} {...props}>
      {children}
    </button>
  );
};

/*
<Button id="a-button" type="submit">Click Me!</Button>
*/

type ButtonProps = React.ComponentProps<typeof Button>;

export type { ButtonProps };

export default Button;
