import React from "react";

import Button from "../subatoms/Button";
import type { ButtonProps } from "../subatoms/Button";

import {
  useUICommands
} from "react-busser";

const PrintPageButton = ({
  className,
  children,
  ...props
}: Omit<ButtonProps, "onClick" | "type">) => {
  const commands = useUICommands({
    print: {
      documentTitle: document.title,
      onBeforePrint: () => {
        const event = new Event(
          "beforeprintstart",
          { bubbles: true }
        );
        window.disptachEvent(event);
      },
      onAfterPrint: () => {
        const event = new Event(
          "afterprintend",
          { bubbles: true }
        );
        window.disptachEvent(event);
      },
      onPrintError: () => {
        const event = new Event(
          "printingerrored",
          { bubbles: true }
        );
        window.disptachEvent(event);
      },
      nowPrinting: () => {
        const event = new Event(
          "printingstarted",
          { bubbles: true }
        );
        window.disptachEvent(event)
      }
    }
  });
  
  return (
    <Button
      type="button"
      data-printer-object="trigger"
      onClick={async () => {
        await commands.hub.print()
      }}
      {...props}
      className={className}
    >
      {children}
    </Button>
  );
}

/*

import { BookCheck } from 'lucide-react';

<PrintPageButton
  className={"p-2 border-[#eef2ab] bg-gray-50 text-[#ffffff]"}
>
  <span><BookCheck size={14} /> <strong data-light>Print</strong></span>
</PrintPageButton>

*/

type PrintPageButtonProps = React.ComponentProps<typeof PrintPageButton>;

export type { PrintPageButtonProps };

export default PrintPageButton;
