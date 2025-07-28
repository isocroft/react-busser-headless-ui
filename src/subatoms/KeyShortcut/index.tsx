import React, { useState, useEffect } from "react";

type OSMod = "ctrl" | "cmd" | ("mod" & {});
type Mods =
  | OSMod
  | "alt"
  | "shift"
  | `${OSMod} + shift`
  | "alt + shift"
  | `${OSMod} + alt + shift`
  | `${OSMod} + alt`;

function KeyShortcut({
  children,
  modifier = "mod",
  symbol,
  ...props
}: React.ComponentPropsWithRef<"kbd"> & {
  modifier?:
    | "mod"
    | "alt"
    | "shift"
    | "mod + shift"
    | "alt + shift"
    | "mod + alt + shift"
    | "mod + alt";
  symbol?:
    | "a"
    | "s"
    | "k"
    | "j"
    | "z"
    | "w"
    | "x"
    | "f"
    | "c"
    | "h"
    | "d"
    | "r"
    | "t"
    | "u"
    | "o"
    | "b"
    | "q"
    | "g";
}) {
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
      styleSheetsOnly.includes("react-busser-headless-ui_key-shortcut")
    ) {
      return;
    }

    const keyShortcutStyle = window.document.createElement("style");
    keyShortcutStyle.id = "react-busser-headless-ui_key-shortcut";

    keyShortcutStyle.innerHTML = `
      kbd[data-hotkeys="shortcut"] {
        position: relative;
      }
  
      kbd[data-hotkeys="shortcut"] kbd.modifier_keys {
        text-transform: capitalize;
      }
  
      kbd[data-hotkeys="shortcut"] sub {
        display: none;
        position: absolute;
        bottom: auto;
        right: auto;
        top: 100%;
        left: 0;
      } 
      
      kbd[data-hotkeys="shortcut"]:hover sub {
        display: inline-block;
        white-space: nowrap;
      }
    `;

    window.document.head.appendChild(keyShortcutStyle);

    return () => {
      window.document.head.removeChild(keyShortcutStyle);
    };
  }, []);

  const [$modifier, setModifier] = useState<Mods>(modifier);

  useEffect(() => {
    setModifier((prevModifier) => {
      return prevModifier.replace(
        "mod",
        window.navigator.platform.indexOf("Mac") === 0 ? "cmd" : "ctrl"
      ) as Mods;
    });
  }, []);

  return (
    <small>
      <kbd {...props} data-hotkeys="shortcut">
        <kbd className="modifier_keys" data-hotkey-envelope>
          {symbol ? `${$modifier} + ${symbol.toUpperCase()}` : $modifier}
        </kbd>
        {children}
      </kbd>
    </small>
  );
}

const DescText = ({
  className = "",
  text,
}: {
  className?: string;
  text: string;
}) => {
  return <sub className={className}>{text}</sub>;
};

KeyShortcut.Summary = DescText;

export default KeyShortcut;
