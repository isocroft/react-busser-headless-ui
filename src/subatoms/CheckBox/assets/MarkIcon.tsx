import React, { SVGAttributes } from "react";

interface MarkIconProps extends SVGAttributes<SVGElement> {
  size?: number;
  iconFill?: string;
  iconStroke?: string;
}

export const MarkIcon = ({
  size = 16,
  iconFill = "#0fE1ab",
  iconStroke = "currentColor",
  ...props
}: MarkIconProps) => {
  const translateXMap: Record<string, number> = {
    "16": 2,
    "17": 1.8,
    "18": 1.4,
    "19": 1.2,
    "20": 0.8,
    "21": 0.5,
    "22": 0.2,
    "23": -0.5,
    "24": -0.2,
    "25": -1.0,
    "26": -1.1,
    "27": -1.4,
    "28": -1.7,
    "29": -1.9,
    "30": -2.2,
    "31": -2.5,
    "32": -2.7,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      {...props}
      role="presentation"
      preserveAspectRatio="none"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={Number((size / 2).toFixed(1))}
        fill={iconFill}
      />
      <g
        transform={`translate(${translateXMap[String(size)]}, 2) scale(${
          size / 16 - 0.5
        }, ${size / 16 - 0.5})`}
      >
        <path
          d="M6.6665 10.6L10.7617 15L12.0713 13.5M17.9998 7L15.999 9L13.3808 12"
          stroke={iconStroke}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
