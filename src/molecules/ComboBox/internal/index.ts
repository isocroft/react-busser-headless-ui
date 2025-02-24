import { useEffect, useRef, useCallback } from "react";
import { useBus, useComposite } from "react-busser";

export interface ComboBoxItem<V = unknown> {
  text?: string,
  id: string,
  value: V
};

export type ComboBoxComposite<I = ComboBoxItem> = {
  selectedIndex: number;
  selectedItem: I | null;
};

export const useComboBoxCore = <I extends ComboBoxItem>(
  items: Array<I> = [],
  key: string,
  dropDownEventName = "combobox:change"
) => {
  const itemsCopy = items.slice(0);
  const [bus] = useBus(
    {
      fires: [dropDownEventName],
      subscribes: [],
    },
    key
  );
  const dropdownRef = useRef(new Map()).current;
  const [composite, handleUpdatesFactory] = useComposite<
    [ComboBoxComposite],
    ComboBoxComposite,
    ComboBoxComposite
  >(
    "__dropdown:menu:change",
    (prevComposite, nextComposite) => {
      return {
        ...prevComposite,
        ...nextComposite,
      };
    },
    {
      selectedIndex: -1,
      selectedItem: null,
    },
    key
  );

  useEffect(() => {
    /* @HINT: Trigger single/stream braodcast in the cascade chain */
    bus.emit(dropDownEventName, { composite, key });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [bus, composite.selectedIndex, dropDownEventName, key]);

  const onSelectedItemChange = handleUpdatesFactory("__dropdown:menu:change");

  const handleKeys = useCallback(() => undefined, []);

  const toggleOpenState = useCallback(() => {
    const dropdownListNode = dropdownRef.get(key);

    if (dropdownListNode) {
      dropdownListNode.classList.toggle("combo_show-list");
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [key]);

  const setSelectedItem = useCallback(
    (index) => {
      const dropdownListNode = dropdownRef.get(key);

      if (dropdownListNode) {
        dropdownListNode.classList.remove("combo_show-list");
      }

      onSelectedItemChange({
        selectedIndex: index,
        selectedItem: itemsCopy[index],
      });
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    },
    [
      key,
      itemsCopy.map((item) => item.id || item.value || item.text).join("|"),
    ]
  );

  return {
    composite,
    handleKeys,
    dropdownRef,
    toggleOpenState,
    setSelectedItem,
  };
};
