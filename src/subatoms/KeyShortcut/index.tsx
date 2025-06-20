import React, { useEffect } from "react";

function KeyShortcut ({
  children,
  modifier = "ctrl",
  symbol,
  ...props,
}: React.ComponentPropsWithRef<"kbd"> & {
  modifier?: "ctrl" | "alt" | "shift" | "cmd" | "ctrl + shift" | "alt + shift" | "ctrl + alt + shift" | "ctrl + alt",
  symbol: "a" | "s" | "k" | "j" | "z" | "w" | "x" | "f" | "c" | "h" | "d" | "r" | "t" | "u" | "o" | "b" | "q" | "g"
}) {
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
      && styleSheetsOnly.includes("react-busser-headless-ui_key-shortcut")) {
      return;
    }

    const keyShortcutStyle = window.document.createElement('style');
    keyShortcutStyle.id = "react-busser-headless-ui_key-shortcut";

    keyShortcutStyle.innerHTML = `
      kbd[data-hotkeys="shortcut"] {
        position: relative;
      }
  
      kbd[data-hotkeys="shortcut"] kbd.modifierKeys {
        text-transform: capitalize;
      }
  
      kbd[data-hotkeys="shortcut"] small {
        position: absolute;
      }
    `;

    window.document.head.appendChild(keyShortcutStyle);

    return () => {
      window.document.head.removeChild(keyShortcutStyle);
    };
  }, []);
  return (
    <kbd {...props} data-hotkeys="shortcut">
      <kbd className="modifierKeys">
        {`${modifier} + ${symbol}`}
      </kbd>
      {children}
    </kbd>
  )
}

const DescText = ({ text }: { text: string }) => {
  return <small>{text}</small>;
};

KeyShortcut.Description = DescText;

/*

<KeyShortcut
  modifier={"ctrl + alt"}
  symbol="a"
>
  <KeyShortcut.Description text="go fullscreen" />
</KeyShortcut>

*/

export default KeyShortcut;

