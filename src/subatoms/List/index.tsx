import React, { Ref, useRef, useCallback, useEffect } from "react";

type CustomElementTagPropsWithRef<T extends React.ElementType> =
  React.ComponentProps<T> & {
    as?: T;
  };

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

const $List = <D extends string | Record<string, string | number | object>>(
  {
    data = [],
    listItemClassName = "",
    keyPropName = "id",
    textPropName = "text",
    as: Component = "ul",
    DataListItem = "li",
    children,
    ...props
  }: Omit<React.ComponentProps<"ol">, "start" | "reversed"> &
    Omit<CustomElementTagPropsWithRef<"ul" | "ol" | "menu">, "ref"> & {
      data?: Array<D>;
      keyPropName?: string;
      textPropName?: string;
      listItemClassName?: string;
      DataListItem?:
        | React.ElementType
        | React.ComponentType<React.ComponentProps<"li"> & { listitem: D }>;
    },
  ref: React.Ref<HTMLUListElement & HTMLOListElement>
) => {
  return (
    <Component {...props} role="list" ref={ref}>
      {hasChildren(children, 0)
        ? data.map((todo, index) => {
            const keyValue =
              typeof todo !== "object"
                ? String(index)
                : ((todo[keyPropName] || String(index)) as React.Key);
            if (typeof DataListItem === "function") {
              return (
                <DataListItem
                  key={keyValue}
                  listitem={todo}
                  role="listitem"
                  data-key-index={String(index)}
                />
              );
            }

            return (
              <DataListItem
                className={listItemClassName}
                key={keyValue}
                role="listitem"
                data-key-index={String(index)}
              >
                {typeof todo !== "object" ? String(todo) : todo[textPropName]}
              </DataListItem>
            );
          })
        : children}
    </Component>
  );
};

const List = React.forwardRef($List);

type ListProps = React.ComponentProps<typeof List>;

export type { ListProps };

export default List;
