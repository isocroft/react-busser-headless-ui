import React, { FC, useEffect } from "react";
import defaultImagePath from "./assets/svg/photo-holder.svg";

export enum AvatarSizes {
  Tiny="tn",
  Small="sm",
  Medium="md",
  Large="lg",
  XtraLarge="xlg"
}

export interface AvatarProps extends React.ComponentPropsWithRef<"div"> {
  size?: AvatarSizes;
  wrapperClassName?: string;
  src?: string;
  widgetSize?: number;
  letters?: string;
  alt?: string;
}
  
const Avatar: FC<AvatarProps> = ({
  size,
  src = defaultImagePath,
  className = "",
  wrapperClassName = "",
  alt = "avatar",
  widgetSize = 40,
  letters = "",
  ...props
}: AvatarProps) => {
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
      && styleSheetsOnly.includes("react-busser-headless-ui_avatar")) {
      return;
    }

    const avatarStyle = window.document.createElement('style');
    avatarStyle.id = "react-busser-headless-ui_avatar";

    avatarStyle.innerHTML = `  
      .avatar_wrapper-box {
        display: inline-block;
        overflow: hidden;
        border-radius: 50%;
      }

      .avatar_letter-box {
        display: inline-block;
        vertical-align: middle;
        text-transform: uppercase;
        position: relative;
      }

      .avatar_letter-box svg {
        opacity: 0;
        margin: 0;
        padding: 0;
        display: block;
      }

      .avatar_letter-box[data-letter-size] svg {
        display: none;
        visibility: hidden;
      }

      .avatar_letter-box[data-letter]::after {
        display: inline-flex;
        position: absolute;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        content: attr(data-letter);
      }
    
      .avatar_image-box[width] {
        object-fit: cover;
        display: inline-block;
        aspect-ratio: 1 / 1;
        height: auto;
      }

      img[data-responsize="true"] {
        width: 100%;
      }

      .avatar_letter-box[data-letter-size="tn"],
      .avatar_image-box[data-image-size="tn"] {
        width: 24px;
        height: 24px;
      }

      .avatar_letter-box[data-letter-size="sm"],
      .avatar_image-box[data-image-size="sm"] {
        width: 40px;
        height: 40px;
      }

      .avatar_letter-box[data-letter-size="md"],
      .avatar_image-box[data-image-size="md"] {
        width: 60px;
        height: 60px;
      }

      .avatar_letter-box[data-letter-size="lg"],
      .avatar_image-box[data-image-size="lg"] {
        width: 80px;
        height: 80px;
      }

      .avatar_letter-box[data-letter-size="xlg"],
      .avatar_image-box[data-image-size="xlg"] {
        width: 100px;
        height: 100px;
      }
    `;  
    window.document.head.appendChild(avatarStyle);  
 
    return () => {  
      window.document.head.removeChild(avatarStyle);  
    };  
  }, []);

  const sizeMap = {
    "xlg": 100,
    "lg": 80, 
    "md": 60,
    "sm": 40,
    "tn": 24
  } as const;

  return (
    <div {...props} className={`${wrapperClassName} avatar_wrapper-box`}>
      {typeof letters === "string" && letters
        ? <span
            className={`${className} avatar_letter-box`}
            data-letter-size={size ? size : undefined}
            data-letter={letters}
            title={alt}
          >
          <svg
            width={widgetSize}
            height={widgetSize}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="generic"
          >  
            <rect width={widgetSize} height={widgetSize} />  
          </svg>
        </span>
        : <img
            alt={alt}
            title={alt}
            className={`${className} avatar_image-box`}
            src={src}
            data-image-size={size ? size : undefined}
            width={size ? sizeMap[size] : widgetSize}
            height={size ? sizeMap[size] : widgetSize}
          />
      }
    </div>
  );
};

export const AvatarWidget = {
  WidgetSizes: {
    TINY: 24,
    SMALL: 40,
    MID: 60,
    LARGE: 80,
    XTRALARGE: 100
  }
};

/*
  <Avatar
    widgetSize={48}
    letters={"MN"}
    alt={"Minas Nerith"}
    className={"..."}
    wrapperClassName={"..."}
  />
*/

export default Avatar;
