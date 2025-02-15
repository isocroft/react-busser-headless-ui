import React, { SVGAttributes } from "react";

interface MarkIconProps extends SVGAttributes<SVGElement> {
  size?: number;
  iconFill?: string;
  iconStroke?: string;
}

export const MarkIcon = ({ size = 16, iconFill = "#0fE1ab", iconStroke = "currentColor", ...props }: MarkIconProps) => {
  return (
    <svg  width={size} height={size} viewBox="0 0 26 26" fill="none" {...props} role="presentation">
      <rect width={size} height={size} rx={Number((size/2).toFixed(1))} fill={iconFill} />
      <path
        d="M8.6665 12.6L10.7617 15L12.0713 13.5M15.9998 9L13.3808 12"
        stroke={iconStroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
