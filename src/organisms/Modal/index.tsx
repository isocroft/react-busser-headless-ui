import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { useLockBodyScroll } from "react-busser";

import type { FC, ReactElement, ReactNode } from "react";

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

type ModalTriggerProps = {
  close?: () => void;
};

type CustomElementTagProps<T extends React.ElementType> =
  React.ComponentPropsWithRef<T> & {
    as?: T;
  };

const renderChildren = (
  children: React.ReactNode,
  { close, parent = "Modal" }: Required<ModalTriggerProps> & { parent: string }
) => {
  const oneChild = hasChildren(children, 1);
  const topChildren = React.Children.toArray(children);

  if (parent === "Modal") {
    const [parentChild] = topChildren;
    if (
      !oneChild ||
      !React.isValidElement<ReactElement & { children: ReactNode, close: () => void }>(parentChild) ||
      parentChild?.type === React.Fragment
    ) {
      console.error("[Error]: invalid Modal inner wrapper component found");
      return null;
    }
  }

  if (typeof children === "object") {
    if (children !== null && children !== undefined) {
      if (parent === "Modal") {
        const [parentChild] = topChildren;
        if (
          !React.isValidElement<ReactElement & { children: ReactNode, close: () => void }>(parentChild) ||
          !("props" in parentChild) ||
          (typeof parentChild.props.children !== "object" &&
            parentChild.props.children !== null) ||
          React.Children.count(parentChild.props.children) !== 3
        ) {
          console.error(
            "[Error]: Modal must have at least 3 valid children; " +
              "<Modal.Header />, <Modal.Body /> and <Modal.Footer />"
          );
          return null;
        }

        return topChildren.map((child) => {
          if (!React.isValidElement<ReactElement & { children: ReactNode, close: () => void }>(child)) {
            return null;
          }

          const { children, ...childProps } = child.props;
          return (
            <child.type {...childProps}>
              {React.Children.map(child.props.children, (innerChild) => {
                if (!React.isValidElement<ReactElement & { children: ReactNode, close: () => void }>(innerChild)) {
                  return null;
                }
              
                switch (true) {
                  case parent === "Modal" && isSubChild(innerChild, "Header"):
                  case parent === "Modal" && isSubChild(innerChild, "Footer"):
                  case parent === "Modal" && isSubChild(innerChild, "Body"):
                    return React.cloneElement(innerChild, {
                      close: close,
                    });
                    break;
                  default:
                    return null;
                    break;
                }
              })}
            </child.type>
          );
        });
      }

      return React.Children.map(children, ($innerChild) => {
        switch (true) {
          case parent !== "Modal":
            if (
              $innerChild &&
              React.isValidElement<ReactElement & { close: () => void }>(
                $innerChild
              )
            ) {
              return React.cloneElement($innerChild, {
                close,
              });
            }
            break;
          default:
            return null;
            break;
        }
      });
    }
  }

  return null;
};

const Header: FC<
  ModalTriggerProps &
    CustomElementTagProps<"header" | "section" | "div"> &
    Omit<React.ComponentProps<"div">, "align">
> = ({
  as: Component = "header",
  close = () => undefined,
  className,
  children,
  ...props
}) => {
  return (
    <Component className={className} {...props}>
      {renderChildren(children, { close, parent: "Header" })}
    </Component>
  );
};

type BodyProps = ModalTriggerProps & React.ComponentProps<"section">;

const Body = ({
  children,
  close = () => undefined,
  className,
  ...props
}: BodyProps) => {
  return (
    <section className={className} {...props}>
      {renderChildren(children, { close, parent: "Body" })}
    </section>
  );
};

const Footer: FC<
  ModalTriggerProps &
    CustomElementTagProps<"footer" | "section" | "div"> &
    Omit<React.ComponentProps<"div">, "align">
> = ({
  as: Component = "footer",
  close = () => undefined,
  className,
  children,
  ...props
}) => {
  return (
    <Component className={className} {...props}>
      {renderChildren(children, { close, parent: "Footer" })}
    </Component>
  );
};

const Modal = Object.assign(
  React.forwardRef<
    (HTMLDivElement & HTMLDialogElement),
    React.HTMLAttributes<(HTMLDivElement & HTMLDialogElement)> & {
      wrapperClassName?: string;
      onClose?: () => void;
      close: () => void;
    }
  >(function Modal(props, ref) {
    const {
      id,
      wrapperClassName = "",
      className = "",
      children: allChildren,
      close,
      onClose,
      ...modalProps
    } = props;

    useLockBodyScroll();

    useEffect(() => {
      return () => {
        if (typeof window.HTMLDialogElement !== 'function') {
          if (typeof onClose === "function") {
            onClose();
          }
        }
      };
    }, []);

    return ReactDOM.createPortal(
      typeof window.HTMLDialogElement === 'function'
      ? (<dialog className={className} id={id} role="dialog" aria-modal ref={ref} onClose={onClose}>
          {renderChildren(allChildren, {
            close: close,
            parent: "Modal",
          })}
      </dialog>)
      : (<div
        className={className}
        id={id}
        ref={ref}
        role="dialog"
        aria-modal
        {...modalProps}
      >
        <div className={wrapperClassName}>
          {renderChildren(allChildren, {
            close,
            parent: "Modal",
          })}
        </div>
      </div>),
      document.body
    );
  }),
  {
    Header,
    Body,
    Footer,
  }
);

type HeaderProps = React.ComponentProps<typeof Header>;
type FooterProps = React.ComponentProps<typeof Footer>;

export type { HeaderProps, BodyProps, FooterProps };

export default Modal;
