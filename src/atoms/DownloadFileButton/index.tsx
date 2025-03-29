import React from "react";

import Button from "../../subatoms/Button";
import type { ButtonProps } from "../../subatoms/Button";

const DownloadFileButton = ({
  fileurl,
  filename,
  className,
  children,
  ...props
}: Omit<ButtonProps, "OnClick" | "type"> & {
  fileurl: string;
  filename: string;
}) => {
  return (
    <Button
      type="button"
      onClick={() => {
        const url = typeof fileurl === "string" ? fileurl : "";
        const name = typeof filename === "string" ? filename : "";

        if (url === "" || name === "") {
          return;
        }

        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.dispatchEvent(new CustomEvent("download", {
          detail: url
        })
      }}
      {...props}
      className={className}
    >
      {children}
    </Button>
  );
}

/*

import { Download } from "lucide-react";

<DownloadFileButton
  filename="x_file.txt"
  fileurl="https://x9Asjf40doUy6Trm8Lm30.object"
  className={"p-2 border-[#eef2ab] bg-gray-50 text-[#ffffff]"}
>
  <span><Download size={14} /> <strong data-light>Download</strong></span>
</DownloadFileButton>

*/

type DownloadFileButtonProps = React.ComponentProps<typeof DownloadFileButton>;

export type { DownloadFileButtonProps };

export default DownloadFileButton;
