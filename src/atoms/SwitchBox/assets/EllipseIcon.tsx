import React, { SVGAttributes } from "react";

interface EllipseIconProps extends SVGAttributes<SVGElement> {
  size?: number;
}

export const EllipseIcon = ({ size = 16, ...props }: EllipseIconProps) => {
  return (
    <svg
      width={size * 2}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      {...props}
      role="presentation"
    >
      <rect
        x="0.5"
        y="0.5"
        width={size + 1}
        height={size + 1}
        rx={Number((size + 1 / 2).toFixed(1))}
        fill="transparent"
        stroke="transparent"
      />
    </svg>
  );
};
