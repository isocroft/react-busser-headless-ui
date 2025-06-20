import React, { useEffect, useRef, useCallback } from "react";

import { useFullscreen, useHotKeys } from "@mantine/hooks";

import type { ButtonProps } from "../../subatoms/Button";

const FullScreenMediaBox = ({
  children,
  type = "image",
  width = 300,
  height = 100,
  alt = "fullscreen media element",
  src,
  className,
  wrapperClassName = "",
  onClick,
  ...props
}: Omit<React.ComponentPropsWithRef<"section">, "onClick"> & {
  type?: "image" | "video",
  src: string,
  width?: number,
  height?: number,
  alt?: string,
  wrapperClassName?: string,
  onClick?: ButtonProps["onClick"]
}) => {
  const btnElemRef = useRef<HTMLButtonElement | null>(null);
  const { ref: mediaElemRef, toggle, fullscreen } = useFullScreen();
  const onToggle = useCallback((event: React.MouseEvent<HTMLButtonElement> & { target: HTMLButtonElement }) => {
    event.fullscreenTarget = mediaElemRef.current;

    if (typeof onClick === "function") {
      onClick(event);
    }

    toggle();
  }, [fullscreen.toString(), toggle]);

  useHotKeys([
    ['mod+Enter', () => {
      if (btnElemRef.current) {
        btnElemRef.current.click();
      }
    }]
  ], []);

  useEffect(() => {
    const styleSheetsOnly = [].slice.call<StyleSheetList, [], StyleSheet[]>(
      window.document.styleSheets
    ).filter(
      (sheet) => {
        if (sheet.ownerNode) {
          return sheet.ownerNode.nodeName === "STYLE";
        }
        return false;
    }).map(
      (sheet) => {
        if (sheet.ownerNode
          && sheet.ownerNode instanceof Element) {
          return sheet.ownerNode.id;
        }
        return "";
    }).filter(
      (id) => id !== ""
    );

    if (styleSheetsOnly.length > 0
      /* @ts-ignore */
      && styleSheetsOnly.includes("react-busser-headless-ui_fullscreen-media")) {
      return;
    }
    
    const fullscreenMediaStyle = window.document.createElement('style');
    fullscreenMediaStyle.id = "react-busser-headless-ui_fullscreen-media";

    fullscreenMediaStyle.innerHTML = `
      button.fullscreen-action-trigger {
        width: 0;
        height: 0;
        font-size: 0;
        opacity: 0;
        visibility: hidden;
      }
    `;

    window.document.head.appendChild(fullscreenMediaStyle);

    return () => {
      window.document.head.removeChild(fullscreenMediaStyle);
    }
  }, []);

  return (
    <section {...props} className={wrapperClassName}>
      <button
        ref={btnElemRef}
        onClick={onToggle}
        tabIndex={-1}
        data-fullscreen-mode-active={fullscreen ? "true" : "false"}
        className="fullscreen-action-trigger">
        x
      </button>
      {type === "image"
        ?
          <img 
            src={src}
            ref={mediaElemRef}
            width={width}
            height={height}
            data-fullscreen-mode={fullscreen ? "true" : "false"}
            className={className}
            alt={alt}
          />
        :
          <video
            src={src}
            ref={mediaElemRef}
            width={width}
            height={height}
            data-fullscreen-mode={fullscreen ? "true" : "false"}
            className={className}
            alt={alt}
          ></video>
      }
      {children}
    </section>
  );
};

/*

<FullScreenMediaBox
  type="video"
  src="https://vimeo.com/video/Jdne8749094"
  width={600}
  height={210}
  className={"..."}
  wrapperClassName={"..."}
>
  <KeyShortcut
    modifier="ctrl"
    symbol="q"
  >
    <KeyShortcut.Description text="" />
  </KeyShortcut>
</FullScreenMediaBox>
*/

export default FullScreenMediaBox;
