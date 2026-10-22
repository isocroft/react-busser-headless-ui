import React from "react";

import type { FC, ComponentPropsWithRef } from "react";

const Link: FC<ComponentPropsWithRef<"a">> = ({
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
