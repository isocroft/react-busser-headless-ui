import React, { useEffect, useRef, useCallback } from "react";

import { useFullscreen, useHotKeys } from "@mantine/hooks";

import type { ButtonProps } from "../../subatoms/Button";

/**
 * isYouTubeUrl:
 *
 * @param {String} url
 *
 * @returns {Boolean}
 */
const isYouTubeUrl = (url?: string | null) => {
  if (!url || typeof url !== "string") {
    throw new Error("isYouTubeUrl(...): argument `url` is not a string");
  }
  return url.includes('youtube.com') || url.includes('youtu.be');
};

/**
 * isVimeoUrl:
 *
 * @param {String} url
 *
 * @returns {Boolean}
 */
const isVimeoUrl = (url?: string | null) => {
  if (!url || typeof url !== "string") {
    throw new Error("iisVimeoUrl(...): argument `url` is not a string");
  }
  return url.includes('vimeo.com') || url.includes('player.vimeo.com');
};

/**
 * getEmbedUrl:
 *
 * @param {String | Null} url
 * @param {Boolean} autoPlay
 *
 *
 * @returns {String}
 *
 */
const getEmbedUrl = (url: string | null, autoPlay = false): string => {
  if (!url || typeof url !== "string" || typeof autoPlay !== "boolean") {
    throw new Error("getEmbedUrl(...): argument `url` or `autoPlay` is not valid");
  }

  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.replace('www.', '').replace('m.', '');
    let videoId = '';
    if (domain === 'youtube.com' || domain === 'youtu.be') {
      if (parsedUrl.pathname.includes('/embed/')) {
        return `${url}${autoPlay ? '?&autoplay=1&mute=1' : ''}`;
      }
      if (parsedUrl.pathname.includes('/watch')) {
        videoId = parsedUrl.searchParams.get('v') || '';
        return `https://www.youtube.com/embed/${videoId}${autoPlay ? '?&autoplay=1&mute=1' : ''}`;
      }
      if (domain === 'youtu.be') {
        videoId = parsedUrl.pathname.replace('/', '');
        return `https://www.youtube.com/embed/${videoId}${autoPlay ? '?&autoplay=1&mute=1' : ''}`;
      }
    } else if (domain === 'vimeo.com' || domain === 'player.vimeo.com') {
      if (parsedUrl.pathname.includes('/video/')) {
        return `${url}${autoPlay ? '?&autoplay=1&muted=1' : ''}`;
      }
      videoId = parsedUrl.pathname.replace('/', '');
      return `https://player.vimeo.com/video/${videoId}${autoPlay ? '?&autoplay=1&muted=1' : ''}`;
    }
  } catch (error) {
    console.error('Invalid URL:', error);
    throw error;
  }
  return '';
};

const FullScreenMediaBox = ({
  children,
  type = "image",
  width = 300,
  height = 100,
  autoPlay = false,
  alt = "fullscreen media element",
  src,
  className,
  wrapperClassName = "",
  ...props
}: React.ComponentPropsWithRef<"section"> & {
  type?: "image" | "video";
  src: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  alt?: string;
  wrapperClassName?: string;
}) => {
  const btnElemRef = useRef<HTMLButtonElement | null>(null);
  const { ref: mediaElemRef, toggle, fullscreen } = useFullScreen();
  const onToggle = useCallback((event: React.MouseEvent<HTMLButtonElement> & { target: HTMLButtonElement }) => {
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
    const onMediaFullscreen = () => {
      if (btnElemRef.current) {
        btnElemRef.current.click();
      }
    };

    if (btnElemRef.current) {
      /* @ts-ignore */
      btnElemRef.current.parentNode!.addEventListener("mediafullscreen", onMediaFullscreen, false);
    }

    return () => {
      if (btnElemRef.current) {
        /* @ts-ignore */
        btnElemRef.current.parentNode!.removeEventListener(
          "mediafullscreen",
          onMediaFullscreen,
          false
        );
      }
    };
  }, []);

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
        padding: 0;
        opacity: 0;
        visibility: hidden;
      }
    `;

    window.document.head.appendChild(fullscreenMediaStyle);

    return () => {
      window.document.head.removeChild(fullscreenMediaStyle);
    }
  }, []);

  const getMediaContent = () => {
    if (isYouTubeUrl(src) || isVimeoUrl(src)) {
      return (
        <iframe
          width={width}
          height={height}
          ref={mediaElemRef}
          title="embed video"
          src={getEmbedUrl(src, autoPlay)}
          allow={`accelerometer${autoPlay ? " autoplay" : ""}; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share`}
          referrerPolicy={"strict-origin-when-cross-origin"}
          allowFullScreen
        />
      );
    }

    return (
      <video
        src={src}
        ref={mediaElemRef}
        width={width}
        height={height}
        data-fullscreen-mode={fullscreen ? "true" : "false"}
        className={className}
        autoPlay={autoPlay ? true : undefined}
      ></video>
    );
  };

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
          getMediaContent()
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
  onClick={(event) => {
    event.currentTarget.dispatchEvent(new Event("mediafullscreen", { bubbles: false }));
  }}
>
  <KeyShortcut
    modifier="mod"
    symbol="q"
  >
    <KeyShortcut.Summary text="trigger fullscreen" />
  </KeyShortcut>
</FullScreenMediaBox>
*/

export default FullScreenMediaBox;
