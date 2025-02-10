import React, { FC, Ref, useRef, useEffect } from "react";

declare module "react" {
  interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

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

const FileBox: FC<
  Pick<
    React.ComponentProps<"input">,
    | "accept"
    | "multiple"
    | "onChange"
    | "onBlur"
    | "tabIndex"
    | "name"
    | "id"
    | "required"
    | "disabled"
    | "autoFocus"
  > & {
    className?: string;
    wrapperClassName?: string;
    labelClassName?: string;
    webkitdirectory?: boolean;
    labelPosition?: "beforeInput" | "afterInput";
    prompt?: string;
    ref?: Ref<HTMLInputElement>;
  }
> = React.forwardRef(
  (
    {
      id,
      name,
      tabIndex = 0,
      wrapperClassName,
      labelClassName,
      labelPosition = "beforeInput",
      prompt = "No File Chosen",
      accept,
      webkitdirectory = false,
      multiple = false,
      children,
      onChange,
      onBlur,
      className = "",
      ...props
    },
    ref: Ref<HTMLInputElement>
  ) => {
    const wrapperDivRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      const styleSheetsOnly = [].slice
        .call<StyleSheetList, [], StyleSheet[]>(window.document.styleSheets)
        .filter((sheet) => {
          if (sheet.ownerNode) {
            return sheet.ownerNode.nodeName === "STYLE";
          }
          return false;
        })
        .map((sheet) => {
          if (sheet.ownerNode && sheet.ownerNode instanceof Element) {
            return sheet.ownerNode.id;
          }
          return "";
        })
        .filter((id) => id !== "");

      if (
        styleSheetsOnly.length > 0 &&
        /* @ts-ignore */
        styleSheetsOnly.includes("react-busser-headless-ui_file")
      ) {
        return;
      }

      const fileStyle = window.document.createElement("style");
      fileStyle.id = "react-busser-headless-ui_file";

      fileStyle.innerHTML = `
      :root {
        --file-input-content-font-size: 1rem;
      }
      
      .file_wrapper-box {
        position: static;
        min-height: 0;
        min-width: fit-content;
      }

      .file-updated-input {
        position: relative;
        z-index: 0;
        clear: both;
      }

      @supports (not selector(::file-selector-button)) and
        (not selector(::-ms-browse)) and (not selector(::-webkit-file-upload-button)) {
        input[type="file"][class*="file-updated-input"]::after {
          margin-left: -20px;
        }
      }
      
      input[type="file"][class*="file-updated-input"]::-ms-browse {
        display: none;
      }
      
      input[type="file"][class*="file-updated-input"]::-webkit-file-upload-button {
        display: none;
      }
      
      input[type="file"][class*="file-updated-input"]::file-selector-button {
        display: none;
      }

      input[type="file"][class*="file-updated-input"]:not([data-prompt=""]) {
        font-size: 0;
        display: block;
        min-width: -webkit-fill-available;
        min-width: fill-available;
        min-height: 16px;
        width: 100%;
      }

      .file-updated-input::after {
        content: attr(data-prompt);
        font-size: var(--file-input-content-font-size);
        position: relative;
        z-index: 2;
        display: inline-block;
      }
      
    `;
      window.document.head.appendChild(fileStyle);

      return () => {
        window.document.head.removeChild(fileStyle);
      };
    }, []);

    useEffect(() => {
      /* @NOTE: TypeScript has refused to make `CSSStyleDelcaration` a record-like type */
      /* @HINT: So, i have to use an ignore flag for the TSC to use valid JavaScript syntax */
      /* @CHECK: https://github.com/Microsoft/TypeScript/issues/17827 */
      if (wrapperDivRef.current !== null && fileInputRef.current !== null) {
        const $style = window.getComputedStyle(wrapperDivRef.current);
        const style = window.getComputedStyle(fileInputRef.current, "::after");
        /* @ts-ignore */
        if (style["font-size"] !== $style["font-size"]) {
          document.documentElement.style.setProperty(
            "--file-input-content-font-size",
            /* @ts-ignore */
            parseInt(style["font-size"]) / 16 + "rem"
          );
        }
      }
    }, []);

    useEffect(() => {
      const onCancel = () => {
        if (typeof prompt === "string" && prompt !== "") {
          if (fileInputRef.current !== null) {
            fileInputRef.current.files = null;
            fileInputRef.current.dispatchEvent(new Event("input"));
            fileInputRef.current.dataset.prompt = prompt;
            fileInputRef.current.setAttribute("title", prompt);
          }
        }
      };

      if (fileInputRef.current !== null) {
        /* @NOTE: ReactJS does not yet support the `onCancel` event on file inputs */
        /* @CHECK: https://github.com/facebook/react/issues/27858 */
        fileInputRef.current.addEventListener("cancel", onCancel, false);
      }

      return () => {
        if (fileInputRef.current !== null) {
          fileInputRef.current.removeEventListener("cancel", onCancel, false);
        }
      };
    }, [fileInputRef]);

    return (
      <div
        tabIndex={tabIndex}
        {...props}
        className={`file_wrapper-box ${wrapperClassName}`}
        ref={wrapperDivRef}
      >
        {hasChildren(children, 0)
          ? null
          : (labelPosition === "beforeInput" && (
              <label htmlFor={id} className={labelClassName}>
                {hasChildren(children, 1)
                  ? React.cloneElement(
                      children as React.ReactElement<{ required: boolean }>,
                      {
                        required: props.required,
                      }
                    )
                  : null}
              </label>
            )) ||
            null}
        <input
          id={id}
          name={name}
          type={"file"}
          accept={accept}
          title={
            typeof prompt === "string" && prompt !== "" ? prompt : undefined
          }
          onChange={(
            event: React.ChangeEvent<HTMLInputElement> & {
              target: HTMLInputElement;
            }
          ) => {
            if (typeof prompt === "string" && prompt !== "") {
              const files = (event.target.files || [null]) as FileList;
              const firstFile = files[0];

              if (firstFile) {
                const fileLength = files.length;
                if (fileInputRef.current !== null) {
                  fileInputRef.current.dataset.prompt =
                    fileLength === 1 ? firstFile.name : `${fileLength} files`;
                  fileInputRef.current.setAttribute(
                    "title",
                    Array.from(files)
                      .map((file) => file.name)
                      .join("\r\n")
                  );
                }
              } else {
                if (fileInputRef.current !== null) {
                  fileInputRef.current.dataset.prompt = prompt;
                  fileInputRef.current.setAttribute("title", prompt);
                }
              }
            }
            if (typeof onChange === "function") {
              onChange(event);
            }
          }}
          onBlur={onBlur}
          data-prompt={prompt}
          webkitdirectory={webkitdirectory ? "" : undefined}
          multiple={multiple ? multiple : undefined}
          className={`file-updated-input ${className}`}
          ref={(node) => {
            if (node) {
              fileInputRef.current = node;
            } else {
              fileInputRef.current = null;
            }
            return typeof ref === "function" ? ref(node) : ref;
          }}
        />
        {hasChildren(children, 0)
          ? null
          : (labelPosition === "afterInput" && (
              <label htmlFor={id} className={labelClassName}>
                {hasChildren(children, 1)
                  ? React.cloneElement(
                      children as React.ReactElement<{ required: boolean }>,
                      {
                        required: props.required,
                      }
                    )
                  : null}
              </label>
            )) ||
            null}
      </div>
    );
  }
);

/*
import React, { useState } from "react";
const [myFile, setMyFile] = useState<File | null>(null);

<FileBox
  id="myfile"
  name="myfile"
  className=""
  prompt="Lol"
  onChange={(
    event: React.ChangeEvent<HTMLInputElement> & {
      target: HTMLInputElement;
    }
  ) => {
    if (event.target.files !== null) {
      setMyFile(event.target.files[0]);
    }
  }}
>
  <span>My File:</span>
</FileBox>

{myFile ? myFile.name : "No File!"}
*/

type FileBoxProps = React.ComponentProps<typeof FileBox>;

export type { FileBoxProps };

export default FileBox;
