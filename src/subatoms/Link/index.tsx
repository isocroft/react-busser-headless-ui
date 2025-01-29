import React, { FC } from "react";

const Link: FC<React.ComponentPropsWithRef<"a">> = ({
  id,
  tabIndex = 0,
  children,
  ...props
}) => {
  return (
    <a {...props} id={id} tabIndex={tabIndex}>
      {children}
    </a>
  );
};

type LinkProps = React.ComponentProps<typeof Link>;

export type { LinkProps };

export default Link;
