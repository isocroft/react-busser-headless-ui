import React, { SVGAttributes } from "react";

interface CircleIconProps extends SVGAttributes<SVGElement> {
  size?: number;
  iconFill?: string;
  iconStroke?: string;
}

export const CircleIcon = ({
  size = 16,
  iconFill = "#ffffff",
  iconStroke = "currentColor",
  ...props
}: CircleIconProps) => {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" {...props} role="presentation">
      <rect
        x={0.5}
        y={0.5}
        width={size + 1}
        height={size + 1}
        rx={Number((size + 1 / 2).toFixed(1))}
        fill={iconFill}
        stroke={iconStroke}
      />
    </svg>
  );
};
