import React, { useState, useEffect } from "react";

import { useSharedStyle } from "../../_shared/hooks";

import type { ComponentPropsWithRef } from "react";

type OSMod = "ctrl" | "cmd" | ("mod" & {});
type Mods =
  | OSMod
  | "alt"
  | "shift"
  | `${OSMod} + shift`
  | "alt + shift"
  | `${OSMod} + alt + shift`
  | `${OSMod} + alt`;

type KeyShortcutProps = ComponentPropsWithRef<"kbd"> & {
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
};

function KeyShortcut({
  children,
  modifier = "mod",
  symbol,
  ...props
}: KeyShortcutProps) {
  const STYLESHEET_ID = "react-busser-headless-ui_key-shortcut";
  const BASE_CSS = `
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
  useSharedStyle(STYLESHEET_ID, BASE_CSS);

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

export type { KeyShortcutProps };

export default KeyShortcut;
