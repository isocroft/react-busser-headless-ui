import React, { SVGAttributes } from "react";

interface ChevronIconProps extends SVGAttributes<SVGElement> {
  iconSize?: number;
  iconFill?: string;
  iconOpacity?: number;
  edgeMergin?: number;
}

export const ChevronIcon = ({
  iconSize = 8,
  iconFill = "currentColor",
  iconOpacity = 0.6063,
  ...props
}: ChevronIconProps) => {
  return (
    <svg
      x="0"
      y="0"
      width={iconSize}
      height="100%"
      viewBox="0 0 8 6"
      fill="none"
      role="presentation"
      data-name="react-busser-headless-ui-select-chevron"
      {...props}
    >
      <g transform={`scale(1, 1)`}>
        <style>
          {`svg[data-name="react-busser-headless-ui-select-chevron"] {
            display: inline-block;
            margin-right: ${Math.floor(iconSize / 2)}px;
          }
          `}
        </style>
        <path
          d="M-0.00195312 1.5C-0.00195312 1.42969 0.0117188 1.36523 0.0390625 1.30664C0.0664062 1.24414 0.101562 1.19141 0.144531 1.14844C0.191406 1.10156 0.244141 1.06445 0.302734 1.03711C0.365234 1.00977 0.431641 0.996094 0.501953 0.996094C0.576172 0.996094 0.640625 1.00977 0.695312 1.03711C0.75 1.06055 0.802734 1.09766 0.853516 1.14844L4 4.29492L7.14648 1.14844C7.24805 1.04688 7.36523 0.996094 7.49805 0.996094C7.56836 0.996094 7.63281 1.00977 7.69141 1.03711C7.75391 1.06445 7.80664 1.10156 7.84961 1.14844C7.89648 1.19141 7.93359 1.24414 7.96094 1.30664C7.98828 1.36523 8.00195 1.42969 8.00195 1.5C8.00195 1.63672 7.95312 1.75391 7.85547 1.85156L4.35156 5.35547C4.25391 5.45312 4.13672 5.50195 4 5.50195C3.86328 5.50195 3.74609 5.45312 3.64844 5.35547L0.144531 1.85156C0.046875 1.75391 -0.00195312 1.63672 -0.00195312 1.5Z"
          fill={iconFill}
          fillOpacity={String(iconOpacity)}
        />
      </g>
    </svg>
  );
};
