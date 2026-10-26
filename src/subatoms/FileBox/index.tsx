import React, { useRef, useEffect } from "react";

import { hasChildren } from "../../_shared/helpers";
import { useGenericId, useSharedStyle } from "../../_shared/hooks";

import type { FC, Ref, CSSProperties, ComponentPropsWithRef } from "react";

declare module "react" {
  interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

const FileBox: FC<
  Pick<
    ComponentPropsWithRef<"input">,
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
    wrapperStyle?: CSSProperties;
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
      wrapperClassName = "",
      labelClassName = "",
      labelPosition = "beforeInput",
      prompt = "No File Chosen",
      accept,
      wrapperStyle,
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
    const fileStyledId = useGenericId();

    const STYLESHEET_ID = "react-busser-headless-ui_file";
    const BASE_CSS = `
      :root {
        --file-input-content-${fileStyledId}-font-size: 1rem;
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
        font-size: var(--file-input-content-${fileStyledId}-font-size);
        position: relative;
        z-index: 2;
        display: inline-block;
      }
      
    `;
    
    useSharedStyle(STYLESHEET_ID, BASE_CSS);

    useEffect(() => {
      /* @NOTE: TypeScript has refused to make `CSSStyleDelcaration` a record-like type */
      /* @HINT: So, I have to use an ignore flag for the TSC to use valid JavaScript syntax */
      /* @CHECK: https://github.com/Microsoft/TypeScript/issues/17827 */
      if (wrapperDivRef.current !== null && fileInputRef.current !== null) {
        const $style = window.getComputedStyle(wrapperDivRef.current);
        const style = window.getComputedStyle(fileInputRef.current, "::after");
        /* @ts-ignore */
        if (style["font-size"] !== $style["font-size"]) {
          document.documentElement.style.setProperty(
            `--file-input-content-${fileStyledId}-font-size`,
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
        style={wrapperStyle}
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

type FileBoxProps = React.ComponentProps<typeof FileBox>;

export type { FileBoxProps };

export default FileBox;

/*

  @EXAMPLE:
  
  
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
  
  <p>{myFile ? myFile.name : "No File!"}</p>
*/
