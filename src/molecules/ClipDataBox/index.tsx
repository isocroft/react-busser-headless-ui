import React, { useRef, useState } from "react";

import InputBox from "../../subatoms/InputBox";
import ClipboardButton from "../../atoms/ClipboardButton";

import type { InputBoxProps } from "../../subatoms/InputBox";
import type { ClipboardButtonProps } from "../../atoms/ClipboardButton";

const hasChildren = (
  children: React.ReactNode | React.ReactNode[],
  count: number
): boolean => {
  if (!Boolean(children) && count === 0) {
    return true;
  }
  const childCount = React.Children.count(children);
  return childCount === count;
};

const isSubChild = <C extends React.ReactNode>(
  child: C,
  tag: string
): child is C =>
  React.isValidElement<C>(child) &&
  (typeof child?.type === "function"
    ? child?.type?.name === tag
    : String(child?.type).includes(tag));

const useCurrentValue = (defaultValue: string) => {
  const [value, setValue] = useState<string>(defaultValue);
  const prevDefaultValue = useRef<string>(defaultValue);

  if (defaultValue !== prevDefaultValue.current) {
    prevDefaultValue.current = value;
  }

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement> & { target: HTMLInputElement }
  ) => {
    const currentValue = event.target.value;
    setValue((prevValue) => {
      prevDefaultValue.current = prevValue;
      if (prevValue === currentValue) {
        return prevValue;
      }
      return currentValue;
    });
  };

  return [value, handleInputChange] as const;
};

const ClipBoardInput = ({
  defaultValue = "",
  ...props
}: Omit<InputBoxProps, "onChange" | "type" | "children">) => {
  const stringDdefaultValue = defaultValue as string;
  return (
    <InputBox
      {...props}
      type={"text"}
      defaultValue={defaultValue}
      readOnly={stringDdefaultValue.length > 0}
    />
  );
};

const ClipDataBox = ({
  defaultValue,
  children,
  ...props
}: React.ComponentProps<"div"> & { defaultValue: string }) => {
  const [value] = useCurrentValue(defaultValue);
  const renderChildren = ($children: React.ReactNode) => {
    const childrenProps = React.Children.map($children, (child) => {
      switch (true) {
        case React.isValidElement(child) && isSubChild(child, "ClipBoardInput"):
          return React.cloneElement(
            child as React.ReactElement<Omit<InputBoxProps, "onChange">>,
            {
              defaultValue: value,
            }
          );
          break;
        case React.isValidElement(child) &&
          isSubChild(child, "ClipboardButton"):
          return React.cloneElement(
            child as React.ReactElement<ClipboardButtonProps>,
            {
              textToCopy: value,
            }
          );
          break;
        default:
          return null;
          break;
      }
    });
    return childrenProps;
  };

  return (
    <div {...props}>
      {hasChildren(children, 0) ? null : renderChildren(children)}
    </div>
  );
};

/*
  import { Copy } from "lucide-react";

  <ClipDataBox defaultValue={"Hallo!"}>
    <ClipDataBox.ClipInput />
    <ClipDataBox.ClipButton>
      <Copy size={14} />
    </ClipDataBox.ClipButton>
  </ClipDataBox>

*/

ClipDataBox.ClipInput = ClipBoardInput;
ClipDataBox.ClipButton = ClipboardButton;

type ClipDataBoxProps = React.ComponentProps<typeof ClipDataBox>;

export type { ClipDataBoxProps };

export default ClipDataBox;
