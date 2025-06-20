import React, { useEffcect } from "react";

function KeyShortcut ({
  children,
  ...props,
  modifier = "ctrl",
  symbol,
}: React.ComponentPropsWithRef<"kbd"> & {
  modifier?: "ctrl" | "alt" | "shift" | "cmd" | "ctrl + shift" | "alt + shift" | "ctrl + alt + shift" | "ctrl + alt",
  symbol: "a" | "s" | "k" | "j" | "z" | "w" | "x" | "f" | "c" | "h" | "d" | "r" | "t" | "u" | "o" | "b" | "q" | "g"
}) {
  useEffect(() => {
    const styleText = `
    kbd[data-hotkeys="shortcut"] {
      position: relative;
    }

    kbd[data-hotkeys="shortcut"] .modifierKeys {
      text-transform: capitalize;
    }

    kbd[data-hotkeys="shortcut"] small {
      position: absolute;
    }
    `;
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

KeyShortcut.DescriptionTip = ({ text }: { text: string ) => {
  return (<small>{text}</small>);
};

/*
<KeyShortcut
  modifier={"ctrl + alt"}
  symbol="a"
>
  <KeyShortcut.DescriptionTip text="go fullscreen" />
</KeyShortcut>
*/

export default KeyShortcut;

