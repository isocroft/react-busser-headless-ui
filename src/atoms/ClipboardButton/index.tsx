import React from "react";

import Button from "../subatoms/Button";
import type { ButtonProps } from "../subatoms/Button";

const ClipboardButton = ({
  className,
  children,
  textToCopy,
  ...props
}: Omit<ButtonProps, "onClick" | "type" | "disabled"> & {
  textToCopy?: string;
}) => {
  const canCopy = typeof textToCopy === "string" && textToCopy.length > 0;
  return (
    <Button
      type="button"
      data-clipboard-object="trigger"
      onClick={(
        event: React.MouseEvent<HTMLButtonElement> & {
          target: HTMLButtonElement;
          currentTarget: HTMLButtonElement;
        }
      ) => {
        if (canCopy) {
          const button = event.currentTarget!;
          window.navigator.clipboard.writeText(textToCopy).then(() => {
            const event = new Event("copy", {
              bubbles: true,
              cancelable: true,
            });
            button.dispatchEvent(event);
          });
        }
      }}
      {...props}
      className={className}
      disabled={!canCopy}
    >
      {children}
    </Button>
  );
};

/*

import { Copy } from "lucide-react";

<ClipboardButton
  textToCopy={"<<API KEY>>"}
  className={"p-2 border-[#eef2ab] bg-gray-50 text-[#ffffff]"}
>
  <Copy size={14} />
</ClipboardButton>

*/

type ClipboardButtonProps = React.ComponentProps<typeof ClipboardButton>;

export type { ClipboardButtonProps };

export default ClipboardButton;
