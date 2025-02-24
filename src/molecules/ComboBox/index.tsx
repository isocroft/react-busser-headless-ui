import React, { FC, useRef, useState, useCallback, useEffect } from "react";
import { useTextFilteredList } from "react-busser";
import pick from "lodash.pick";

import type { ComboBoxComposite, ComboBoxItem } from "./internal";
import { useComboBoxCore } from "./internal";

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

const isSubChild = <C extends React.ReactNode>(
  child: C,
  tag: string
): child is C =>
  React.isValidElement<C>(child) &&
  (typeof child?.type === "function"
    ? child?.type?.name === tag
    : String(child?.type).includes(tag));

const useMutationObserver = (
  ref,
  callback,
  options = {
    attributes: true,
    characterData: false,
    childList: false,
    subtree: false,
  }
) => {
  useEffect(() => {
    let observer = null;
    if (ref.current) {
      observer = new window.MutationObserver(callback);
      observer.observe(ref.current, options);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);
};

const generateSeededRandomId = () =>
  "a" + (Math.random() + 1).toString(36).substring(2, 7) + Date.now();

type CustomElementTagProps<T extends React.ElementType> =
  React.ComponentPropsWithRef<T> & {
    as?: T;
  };

const Trigger = <I extends ComboBoxItem>({
  children,
  className = "",
  style,
  type = "button",
  placeholder = "",
  onTriggerClick = () => undefined,
  composite = { selectedIndex: -1, selectedItem: null },
  ...props
}: Omit<React.ComponentProps<"div">, "onClick"> & {
     type?: "button" | "panel";
     placeholder?: string;
     composite?: ComboBoxComposite<I>;
     onTriggerClick?: () => void;
   }) => {
  const getTriggerDisplay = (
    selectedItem: I,
    children: React.ReactNode,
    defaultText?: string
  ) => {
    const noChild = hasChildren(children, 0);
    const oneChild = hasChildren(children, 1);

    if (!noChild) {
      if (!selectedItem) {
        return "Select an item...";
      }

      return oneChild && React.isValidElement(children)
        ? React.cloneElement(children, {
          selectedItem: selectedItem
        })
        : null;
    }

    return selectedItem
      ? selectedItem?.text || "Select an item..."
      : defaultText || "Select an item...";
  };

  return (
    <>
      {type === "button"
        ? <button
            tabIndex={0}
            key={placeholder}
            onClick={() => {
              if (typeof onTriggerClick === "function") {
                onTriggerClick();
              }
            }}
            className={className}
            title={title}
            role={type}
            style={style}
            type={type}
          >
        {
          getTriggerDisplay(composite.selectedItem, children, placeholder)
        }
        </button>
      : <div className={className} style={style} title={title} {...props} onClick={() => {
        if (typeof onTriggerClick === "function") {
          onTriggerClick();
        }
      }}>
        {getTriggerDisplay(composite.selectedItem, children, placeholder)}
      </div>}
    </>
  );
};

const C_$$ListItem: FC<
  {
    disabled?: boolean;
    selected: boolean;
  } & CustomElementTagProps<"li">
> = ({
  as: Component = "li",
  children,
  className = "",
  style,
  selected,
  disabled,
  ...props
}) => {
  return (
    <Component
      className={className}
      data-selected={JSON.stringify(selected)}
      style={style}
      role="listitem"
      {...props}
      aria-disabled={disabled}
    >
      {children}
    </Component>
  );
};

type ComboBoxListItemProps = React.ComponentProps<typeof C_$$ListItem>;

const List = <I extends ComboBoxItem>({
  as: Component = "ul",
  children,
  className = "",
  style,
  render,
  items = [],
  ListItem = C_$$ListItem,
  isMultiSelect = false,
  listItemClassName = "",
  onListItemClick = () => undefined,
  composite = { selectedIndex: -1, selectedItem: null },
  innerRef = null,
  ...props
}: {
  innerRef?: (node: HTMLOListElement | null) => void;
  "data-retract-classlist-item"?: string;
  listItemClassName?: string;
  items?: Array<I>;
  isMultiSelect?: boolean;
  composite?: ComboBoxComposite<I>;
  onListItemClick?: (indexPosition?: number) => void;
  render?: (
    item: I,
    selected: boolean,
    injectedChildNode?: React.ReactNode
  ) => React.ReactElement;
  ListItem: | React.ElementType
      | React.ComponentType<ComboBoxListItemProps | (React.ComponentProps<"li"> & { selected: boolean, listitem: I })>;
} & CustomElementTagProps<"ul" | "ol"> &
  Omit<React.ComponentProps<"ol">, "start" | "reversed">
}) => {
  const setSize = items.length;
  const noChild = hasChildren(children, 0);
  const renderSubChild = (isDefaultChild, $child, $index) => {
    if (isDefaultChild) {
      return typeof render === "function"
        ? render(
            items[$index],
            $index === composite.selectedIndex,
            $child.props.children
          )
        : items[$index].text
    }

    return null;
  };

  return setSize > 0 ? (
    <>
      <Component
        className={`${props['data-retract-classlist-item'] === "yes" ? "" : "combo_list "}${className}`}
        style={style}
        {...props}
        role="listbox"
        aria-multiselectable={isMultiSelect}
        aria-activedescendant={
          composite.selectedIndex !== -1
            ? items[composite.selectedIndex].id
            : undefined
        }
        ref={innerRef}
      >
        {noChild
          ? items.map((item, index) => {
              const keyValue = String((item.id || item.text) + "_" + index) as React.Key;
              const selected = index === composite.selectedIndex;

              if (ListItem.name === 'C_$$ListItem') {
                return (
                  <ListItem
                    id={item.id}
                    key={keyValue}
                    selected={selected}
                    onClick={() => onListItemClick(index)}
                    className={listItemClassName}
                    aria-setsize={setSize}
                    aria-posinset={index + 1}
                    aria-selected={
                      selected || isMultiSelect ? selected : undefined
                    }
                  >
                    {typeof render === "function"
                      ? render(item, index === composite.selectedIndex)
                      : item.text}
                  </ListItem>
                );
              }

              return (
                /* @ts-ignore */
                <ListItem
                  key={keyValue}
                  listitem={item}
                  selected={selected}
                  onClick={() => onListItemClick(index)}
                  data-key-index={String(index)}
                  aria-setsize={setSize}
                  aria-posinset={index + 1}
                  aria-selected={
                    selected || isMultiSelect ? selected : undefined
                  }
                />
              );
            })
          : (React.isValidElement(children) &&
              React.Children.map(children, (child, _index) => {
                const isDefaultSubChild = isSubChild(child, "C_$$ListItem");
                const newChild = renderSubChild(isDefaultSubChild, child, _index);

                return React.cloneElement(child, newChild !== null ? {
                  children: newChild,
                  selected: _index === composite.selectedIndex,
                  onClick: () => onListItemClick(_index),
                } : {
                  selected: index === composite.selectedIndex,
                  onClick: () => onListItemClick(_index)
                });
              })) ||
            null}
      </Component>
    </>
  ) : null;
};

const SearchableList = <I extends ComboBoxItem>({
  as: Component = "section",
  children,
  className = "",
  style,
  render,
  searchInputClassName,
  searchWrapperClassName,
  items = [],
  searchAlgorithmOption = "specific",
  isMultiSelect = false,
  onListItemClick = () => undefined,
  composite = { selectedIndex: -1, selectedItem: null },
  innerRef = null,
  ...props
}: {
    searchWrapperClassName?: string;
    searchInputClassName?: string;
    searchAlgorithmOption?: "specific" | "fuzzy" | "complete";
    innerRef?: (node: HTMLOListElement | null) => void;
    isMultiSelect?: boolean;
    items?: Array<I>;
    composite?: ComboBoxComposite<I>;
    onListItemClick?: (indexPosition?: number) => void;
    render?: (
      item: I,
      selected: boolean,
      injectedChildNode?: React.ReactNode
    ) => React.ReactElement;
  } & CustomElementTagProps<"section">) => {
  const oneChild = hasChildren(children, 1);
  const [searchInputId] = useState<string>(() => generateSeededRandomId());
  const searchInputName = `search-box__${searchInputId}__${Date.now()}`;
  const [controller, handleChange] = useTextFilteredList<I>(
    {
      text: "",
      list: items,
    },
    {
      filterTaskName: searchAlgorithmOption,
    }
  );
  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    return handleChange(event, ["text"]);
  };

  return (
    <section
      style={style}
      className={`combo_list ${className}`}
      {...props}
      role="group">
      <div className={searchWrapperClassName} key={searchInputId} role="search">
        <input
          type="text"
          tabIndex={0}
          value={controller.text}
          onChange={onSearchChange}
          id={searchInputId}
          name={searchInputName}
          className={searchInputClassName}
          role="searchbox"
          aria-label="reactbusser-combobox_search:rc"
          aria-autocomplete="list"
        />
      </div>
      {(React.isValidElement(children) &&
        oneChild &&
        React.Children.map(children, (child) => {
          if (!isSubChild(child, "List")) {
            return null;
          }

          return React.cloneElement(child, {
            innerRef,
            items: controller.list,
            onListItemClick,
            'data-retract-classlist-item': "yes",
            render,
            isMultiSelect,
            composite,
          });
        })) ||
        null}
    </section>
  );
};

const ComboBox = <I extends ComboBoxItem>({
  as: Component = "div",
  items = [],
  placeholder = "",
  onChange = () => undefined,
  onStateChanged = () => undefined,
  tabIndex,
  name,
  id,
  className = "",
  isMultiSelect = false,
  children,
  ...props
}: {
  items: Array<I>;
  isMultiSelect?: boolean;
  onStateChanged?: (state: "open" | "closed" | "disabled") => void;
  onChange: (valueItem: I) => void;
} & Pick<React.ComponentProps<"select">, "placeholder" | "name"> &
  CustomElementTagProps<"div" | "section"> &
  Omit<React.ComponentProps<"div">, "align">) => {
  const renderChildren = (
    $children: React.ReactNode,
    extraChildProps: {
      items: Array<I>;
      placeholder: string;
      composite: ComboBoxComposite<I>;
      onListItemClick: (indexPosition?: number) => void;
      onTriggerClick: () => void;
      dropdownRef: Map<string, HTMLElement>;
      isMultiSelect: boolean;
    },
    innerRef: (node?: HTMLOListElement) => void
  ) => {
    const oneChild = hasChildren($children, 1);
    const noChild = hasChildren($children, 0);

    if (noChild || oneChild) {
      console.error(
        "[Error]: <ComboBox /> requires no less than 2 valid children; <ComboBox.Trigger /> and (<ComboBox.List /> or <ComboBox.SearchableList />)"
      );
      return null;
    }

    const childrenList = React.Children.toArray($children);

    if (typeof $children === "object") {
      if ($children !== null && Array.isArray(childrenList)) {
        return childrenList.map((child) => {
          if (!React.isValidElement(child) || !("props" in child)) {
            return null;
          }

          switch (true) {
            case isSubChild(child, "Trigger"):
              return React.cloneElement(
                child,
                Object.assign(
                  {},
                  {
                    onClick: extraChildProps.onTriggerClick,
                  },
                  pick(extraChildProps, ["placeholder", "composite"])
                )
              );

            case isSubChild(child, "List"):
            case isSubChild(child, "SearchableList") && items.length > 0:
              return React.cloneElement(
                child,
                Object.assign(
                  {},
                  pick(extraChildProps, [
                    "items",
                    "onListItemClick",
                    "isMultiSelect",
                    "composite",
                  ]),
                  {
                    innerRef,
                  }
                )
              );

            default:
              if (items.length === 0) {
                return null;
              }
              return React.isValidElement(child) ? React.cloneElement(child, { items }); : null;
          }
        });
      }
    }

    return null;
  };

  let element: HTMLElement | null = null;

  const comboBoxRef = useRef<HTMLDivElement | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const [comboBoxId] = useState<string>(() => id || generateSeededRandomId());
  const {
    composite,
    toggleOpenState,
    dropdownRef,
    handleKeys,
    setSelectedItem,
  } = useComboBoxCore<I>(
    items,
    comboBoxId,
    "$__dropdown:change:broadcast"
  );

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
      && styleSheetsOnly.includes("react-busser-headless-ui_combo")) {
      return;
    }

    const comboStyle = window.document.createElement('style');
    comboStyle.id = "react-busser-headless-ui_combo";

    comboStyle.innerHTML = `
      .combo_list {
        display: none;
        opacity: 0;
        transition-property: display, opacity;
        transition-delay: 0s;
        transition-duration: 200ms;
        transition-timing-function: ease-in;
        transition-behavior: allow-discrete;
      }

      .combo_list[data-vertical-position-anchor="top"] {
        bottom: auto;
        top: 100%;
      }

      .combo_list[data-vertical-position-anchor="bottom"] {
        top: auto;
        bottom: 100%;
      }

      .combo_list[data-horizontal-position-anchor="left"] {
        right: auto;
        left: 0;
      }

      .combo_list[data-horizontal-position-anchor="right"] {
        left: auto;
        right: 0;
      }
    
      .combo_list.combo_show-list {
        display: block;
        opacity: 1;
      }
    `;  
    window.document.head.appendChild(comboStyle);  
  
    return () => {  
      window.document.head.removeChild(comboStyle);  
    };  
  }, []);

  useEffect(() => {
    if (composite.selectedIndex === -1) {
      return;
    }

    if (composite.selectedItem) {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = composite.selectedItem.value as string;
        onChange(composite.selectedItem);
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [composite.selectedIndex]);

  const innerRef = (node) => {
    if (!node) {
      if (dropdownRef.has(comboBoxId)) {
        dropdownRef.delete(comboBoxId);
      }
    } else {
      element = node;
      if (!dropdownRef.has(comboBoxId)) {
        dropdownRef.set(comboBoxId, node);
      }
    }
  };

  useMutationObserver({ current: element }, (mutations) => {
    mutations.forEach(function (mutation) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const canTriggerStateChangeEvent = mutation.target.className !== "";

        if (!canTriggerStateChangeEvent) {
          return;
        }

        const currentState = mutation.target.classList.has(
          dropdownToggleClassName || "show-list"
        )
          ? "open"
          : "closed";

        if (comboBoxRef.current) {
          comboBoxRef.current.setAttribute(
            "aria-expanded",
            currentState === "open" ? "true" : "false"
          );
        }

        onStateChanged(currentState);
      }
    });
  });

  return (
    <Component
      data-name={name}
      id={id}
      tabIndex={tabIndex}
      onKeyDown={handleKeys}
      className={className}
      {...props}
      role="combobox"
      aria-expanded={false}
      ref={comboBoxRef}
    >
      <>
        <input type="hidden" name={name} value={""} ref={hiddenInputRef} />
        {renderChildren(
          children,
          {
            items,
            placeholder,
            onTriggerClick: toggleOpenState,
            onListItemClick: setSelectedItem,
            composite,
            dropdownRef,
            isMultiSelect,
          },
          innerRef
        )}
      </>
    </Component>
  );
};

ComboBox.Trigger = Trigger;
ComboBox.List = List;
ComboBox.SearchableList = SearchableList;
ComboBox.ListItem = C_$$ListItem;

type ComboBoxProps = React.ComponentProps<typeof ComboBox>;
type ComboBoxListProps = React.ComponentProps<typeof List>;
type ComboBoxTriggerProps = React.ComponentProps<typeof Trigger>;

export type { ComboBoxProps, ComboBoxListProps, ComboBoxListItemProps, ComboBoxTriggerProps, ComboBoxItem }

const ComboBoxEvent = {
  DROPDOWN_CHANGE_BROADCAST: "$__dropdown:change:braodcast",
};

export { ComboBoxEvent };

export default ComboBox;
