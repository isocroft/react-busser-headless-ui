import React, { useState, useRef, useCallback, useContext, useEffect } from "react"; /* versions: v17.x, v18.x, v19.x */
import { NavLink, useLocation } from "react-router-dom"; /* versions: v5.x, v6.x, v7.x */

import type { Ref, /* RefObject,*/ MutableRefObject } from "react";
import type { CurrentPageTriggerDetail, PaginatorRenderProps } from "../../shared/helpers";

import Button from "../../subatoms/Button";

import { sprintf, hasRenderableChildren, PAGINATOR_EVENTS } from "../../_shared/helpers";

/* 
  @INFO:

  Modifier clicks and non-primary buttons are left to the browser so
  "open in new tab" keeps working on the page links.
*/
const isPlainLeftClick = (event: React.MouseEvent): boolean =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

export interface PaginatorProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<PaginatorRenderProps, "ref"> {
}

type BaseContextType = {
  pageEventPrefix?: PaginatorProps["pageEventPrefix"];
  /*
    @NOTE:

    `React.MutableRefObject` is deprecated in the React 19 typings;
    `React.RefObject` is mutable there and is the correct type for
    `useRef<T | null>(null)`.

    However, this implementation requires backwards compatibility 
    with React 18 and 17.
  */
  getWrapperElementFromRoot: () => MutableRefObject<HTMLElement | null>;
};

type PaginatorContextType = Omit<
PaginatorRenderProps,
  "ref"
> &
  BaseContextType;

const PaginatorContext = React.createContext<PaginatorContextType | null>(null);

const usePaginatorPropsAsOptions = () => {
  const ctx = useContext(PaginatorContext);

  if (ctx === null) {
    throw new Error("This component must be used inside <Paginator />");
  }

  return ctx;
};

const PaginationRoot = React.forwardRef(
  (
    {
      children,
      currentPage,
      totalPageCount,
      disableNextButton = false,
      disablePrevButton = false,
      showFirstPageButton = false,
      showLastPageButton = false,
      pageNumbers = [],
      showNextPageSliceSpanButton = false,
      showPrevPageSliceSpanButton = false,
      pageSearchParamName,
      searchParams,
      canUseURLState,
      pageEventPrefix = "",
      ...props
    }: PaginatorProps,
    ref: Ref<HTMLElement>
  ) => {
    const wrapperNodeRef = useRef<HTMLElement | null>(null);
    const [contextValue, ____set] = useState<BaseContextType>({
      pageEventPrefix,
      getWrapperElementFromRoot() {
        return wrapperNodeRef;
      },
    });

    useEffect(() => {
      return () => {
        /* 
          @HINT: 
        
          Though discouraged, calling the updater here is used to avoid memory leaks.
        */
        ____set({
          pageEventPrefix: undefined,
          getWrapperElementFromRoot: () => ({ current: null })
        });
      };
    }, []);

    /* 
      @NOTE:
        
      The callback ref was typed `(node: HTMLElement) => void` for React 18;
      React 19 calls it with `null` on detach. Returning a value from a 
      callback ref is now treated as a cleanup function, so this one stays `void`.
    */
    const $ref = useCallback(
      (node: HTMLElement | null) => {
        wrapperNodeRef.current = node;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref !== null && ref instanceof Object && "current" in ref) {
          (ref as MutableRefObject<HTMLElement | null>).current = node;
        }
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
      },
      [ref]
    );

    return (
      <section {...props} role={"group"} ref={$ref}>
        <PaginatorContext.Provider
          value={{
            currentPage,
            totalPageCount,
            disableNextButton,
            disablePrevButton,
            showFirstPageButton,
            showLastPageButton,
            showNextPageSliceSpanButton,
            pageSearchParamName,
            searchParams,
            canUseURLState,
            showPrevPageSliceSpanButton,
            pageEventPrefix,
            pageNumbers,
            ...contextValue,
          }}
        >
          {children}
        </PaginatorContext.Provider>
      </section>
    );
  }
);

PaginationRoot.displayName = "Paginator";

interface CaptionProps extends Omit<React.ComponentProps<"p">, "children"> {
  textTemplate?: string;
}

const Caption: React.FC<CaptionProps> = ({
  textTemplate = "Page %d of %d",
  ...props
}) => {
  const { currentPage, totalPageCount } = usePaginatorPropsAsOptions();
  let captionText = "";

  try {
    captionText = sprintf(textTemplate, currentPage, totalPageCount);
  } catch (e) {
    if (e instanceof Error) {
      const $err = new TypeError(
        e.message.replace("argument 1", "`textTemplate`")
      );
      $err.stack = e.stack;
      throw new Error("<Paginator.Caption />: cannot render fully", {
        cause: $err,
      });
    }
    captionText = "";
  }

  return <p {...props}>{captionText}</p>;
};

const Content: React.FC<
  React.PropsWithChildren<React.ComponentProps<"nav">>
> = ({ children, ...props }) => {
  return <nav {...props}>{children}</nav>;
};

type CustomElementTagProps<T extends React.ElementType> =
  React.ComponentPropsWithRef<T> & {
    as?: T;
  };

interface PageLinkProp {
  page: number;
  style?: React.CSSProperties;
  activeClassName?: string;
  to?: string | Record<"hash" | "search" | "pathname", string>;
}

const PageLink: React.FC<
  PageLinkProp &
    (
      | Omit<CustomElementTagProps<"a">, "href" | "style">
      | Omit<CustomElementTagProps<typeof NavLink>, "to" | "style">
    )
> = ({
  page,
  className = "",
  to = "",
  activeClassName = "",
  as: Component = "a",
  ...props
}) => {
  const {
    currentPage,
    pageEventPrefix,
    pageSearchParamName,
    searchParams,
    canUseURLState,
    getWrapperElementFromRoot,
  } = usePaginatorPropsAsOptions();
  const [wrapperNodeRef] = useState(() => getWrapperElementFromRoot());
  const location = useLocation();

  if (typeof page !== "number" || Number.isNaN(page)) {
    throw new Error("<Paginator.PageLink />: cannot render fully", {
      cause: new TypeError("`page` prop is not a number"),
    });
  }

  const isCurrentPage = currentPage === page;

  let toRoutePath: string = location.pathname;

  if (canUseURLState) {
    const linkSearchParams = new URLSearchParams(searchParams);
    linkSearchParams.set(pageSearchParamName, String(page));
    toRoutePath = `${location.pathname}?${linkSearchParams.toString()}`;
  }

  if (to) {
    toRoutePath =
      typeof to === "string" ? to : `${to.pathname}${to.search}${to.hash}`;
  }

  const staticClassName = typeof className === "string" ? className : "";
  const composedClassName =
    [staticClassName, isCurrentPage ? activeClassName : ""]
      .filter(Boolean)
      .join(" ")
      .trim() || undefined;

  const onPageLinkClick = (event: React.MouseEvent) => {
    if (isCurrentPage) {
      event.preventDefault();
      return;
    }

    if (!isPlainLeftClick(event)) {
      return;
    }

    /* 
      @NOTE:
        
      Navigation is driven by the hook (via `setSearchParams`), never by the
      element's own `href`/`to` props. Therefore, do not let efault action
      through.
    */
    event.preventDefault();

    const node = wrapperNodeRef.current;

    if (node) {
      event.stopPropagation();
      /* 
        @NOTE:
        
        Pass the current page number as `CustomEvent` property: `detail`.
      */
      node.dispatchEvent(
        new CustomEvent<CurrentPageTriggerDetail>(pageEventPrefix+PAGINATOR_EVENTS.current, {
          bubbles: false,
          detail: { page },
        })
      );
    }
  };

  const { children, ...rest } = props;
  const hasOwnChildren = hasRenderableChildren(children);

  return Component === "a" ? (
    <Component
      href={toRoutePath}
      className={composedClassName}
      {...rest}
      onClick={onPageLinkClick}
      aria-current={isCurrentPage ? "page" : undefined}
      aria-disabled={isCurrentPage}
      data-index={String(page - 1)}
      data-page={String(page)}
      data-event={`${pageEventPrefix}:${pageSearchParamName}:${page}`}
    >
      {hasOwnChildren && typeof children !== "function" ? children : page}
    </Component>
  ) : (
    <Component
      to={toRoutePath}
      className={composedClassName}
      {...rest}
      onClick={onPageLinkClick}
      aria-current={isCurrentPage ? "page" : undefined}
      aria-disabled={isCurrentPage}
      data-index={String(page - 1)}
      data-page={String(page)}
      data-event={`${pageEventPrefix}:${pageSearchParamName}:${page}`}
    >
      {hasOwnChildren ? children : page}
    </Component>
  );
};

interface ControlLinkProp {
  kind: "prev" | "next";
  style?: React.CSSProperties;
  to?: string | Record<"hash" | "search" | "pathname", string>;
}

const ControlLink: React.FC<
  ControlLinkProp &
    (
      | Omit<CustomElementTagProps<"a">, "href" | "style">
      | Omit<CustomElementTagProps<typeof NavLink>, "to" | "style">
    )
> = ({ kind, to = "", className = "", as: Component = "a", ...props }) => {
  const {
    currentPage,
    searchParams,
    canUseURLState,
    totalPageCount,
    pageEventPrefix,
    pageSearchParamName,
    disablePrevButton,
    disableNextButton,
    getWrapperElementFromRoot,
  } = usePaginatorPropsAsOptions();
  const [wrapperNodeRef] = useState(() => getWrapperElementFromRoot());
  const location = useLocation();

  if (kind !== "prev" && kind !== "next") {
    throw new Error("<Paginator.ControlLink />: cannot render fully", {
      cause: new TypeError('`kind` prop must be either "prev" or "next"'),
    });
  }

  const isPrev = kind === "prev";
  const isDisabled = isPrev ? disablePrevButton : disableNextButton;

  const targetPage = isPrev
    ? Math.max(currentPage - 1, 1)
    : Math.min(currentPage + 1, totalPageCount);

  let toRoutePath: string = location.pathname;

  if (canUseURLState) {
    /* @HINT: clone rather than mutate the shared instance during render. */
    const linkSearchParams = new URLSearchParams(searchParams);
    linkSearchParams.set(pageSearchParamName, String(targetPage));
    toRoutePath = `${location.pathname}?${linkSearchParams.toString()}`;
  }

  if (to) {
    toRoutePath =
      typeof to === "string" ? to : `${to.pathname}${to.search}${to.hash}`;
  }

  const textMap = {
    prev: "Previous",
    next: "Next",
  } as const;

  const onControlLinkClick = (event: React.MouseEvent) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }

    if (!isPlainLeftClick(event)) {
      return;
    }

    /* @FIX:
        This is the primary reload. The old guard was:

          if (isPrevDisabled || isNextDisabled || !canUseURLState) {
            e.preventDefault()
          }

        so in the normal case — URL state on, button enabled — preventDefault
        was skipped and the browser followed the <a href="?page=N"> that this
        component renders by default (`as` defaults to "a"). The custom event
        fired, state updated, and then the document navigated anyway.
    */
    event.preventDefault();

    const node = wrapperNodeRef.current;

    if (node) {
      event.stopPropagation();
      node.dispatchEvent(new CustomEvent(kind === "prev"
      ? pageEventPrefix+PAGINATOR_EVENTS.prev
      : pageEventPrefix+PAGINATOR_EVENTS.next, {
        bubbles: false
      }));
    }
  };

  const { children, ...rest } = props;
  const hasOwnChildren = hasRenderableChildren(children);

  return Component === "a" ? (
    <Component
      href={toRoutePath}
      className={typeof className === "string" ? className : undefined}
      {...rest}
      aria-disabled={isDisabled}
      onClick={onControlLinkClick}
      data-event={`${pageEventPrefix}:${pageSearchParamName}:${kind}`}
    >
      {hasOwnChildren && typeof children !== "function"
        ? children
        : textMap[kind]}
    </Component>
  ) : (
    <Component
      to={toRoutePath}
      className={typeof className === "string" ? className : undefined}
      {...rest}
      aria-disabled={isDisabled}
      onClick={onControlLinkClick}
      data-event={`${pageEventPrefix}:${pageSearchParamName}:${kind}`}
    >
      {hasOwnChildren ? children : textMap[kind]}
    </Component>
  );
};

interface PageSpanActivatorProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  kind: "prev" | "next";
}

const PageSpanActivator: React.FC<PageSpanActivatorProps> = ({
  kind,
  className = "",
  children,
  ...props
}) => {
  const { pageEventPrefix, getWrapperElementFromRoot } = usePaginatorPropsAsOptions();
  const [wrapperNodeRef] = useState(() => getWrapperElementFromRoot());

  return (
    <Button
      {...props}
      className={className}
      aria-label={kind === "prev" ? "Previous pages" : "Next pages"}
      onClick={() => {
        const node = wrapperNodeRef.current;

        if (node) {
          node.dispatchEvent(new CustomEvent(kind === "prev"
          ? pageEventPrefix+PAGINATOR_EVENTS.prevSpan
          : pageEventPrefix+PAGINATOR_EVENTS.nextSpan, {
            bubbles: false
          }));
        }
      }}
    >
      {children}
    </Button>
  );
};

const LinkGroup: React.FC<
  React.PropsWithChildren<React.ComponentProps<"div">>
> = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

interface RangeLinkProps
  extends Omit<React.ComponentProps<typeof Content>, "children"> {
  wrapperClassName?: string;
  currentPageActiveClassName?: string;
}

const RangeLinks: React.FC<RangeLinkProps> = ({
  wrapperClassName = "",
  className = "",
  currentPageActiveClassName = "",
  ...props
}) => {
  const {
    pageNumbers,
    showPrevPageSliceSpanButton,
    showNextPageSliceSpanButton,
    showLastPageButton,
    showFirstPageButton,
    totalPageCount,
    pageSearchParamName,
  } = usePaginatorPropsAsOptions();

  const range = pageNumbers.slice(0);

  return (
    <Content {...props} className={wrapperClassName}>
      {showFirstPageButton ? (
        <PageLink
          as={NavLink}
          key={"first_" + `${pageSearchParamName}_` + String(0)}
          page={1}
          className={className}
          activeClassName={currentPageActiveClassName}
        />
      ) : null}
      {showPrevPageSliceSpanButton ? (
        <PageSpanActivator
          kind={"prev"}
          key={`${pageSearchParamName}_` + "prev_span"}
          className={className}
        >
          <span>&hellip;</span>
        </PageSpanActivator>
      ) : null}
      {range.map((pageNumber: number, index: number) => (
        <PageLink
          as={NavLink}
          key={
            `intermediate_${index}` + `${pageSearchParamName}_` + String(pageNumber - 1)
          }
          page={pageNumber}
          className={className}
          activeClassName={currentPageActiveClassName}
        />
      ))}
      {showNextPageSliceSpanButton ? (
        <PageSpanActivator
          kind="next"
          key={`${pageSearchParamName}_` + "next_span"}
          className={className}
        >
          <span>&hellip;</span>
        </PageSpanActivator>
      ) : null}
      {showLastPageButton ? (
        <PageLink
          as={NavLink}
          key={"last_" + `${pageSearchParamName}_` + String(totalPageCount - 1)}
          page={totalPageCount}
          className={className}
          activeClassName={currentPageActiveClassName}
        />
      ) : null}
    </Content>
  );
};

type PageLinkProps = React.ComponentProps<typeof PageLink>;
type ControlLinkProps = React.ComponentProps<typeof ControlLink>;
type LinkGroupProps = React.ComponentProps<typeof LinkGroup>;

export type {
  PageSpanActivatorProps,
  RangeLinkProps,
  PageLinkProps,
  ControlLinkProps,
  LinkGroupProps,
  CaptionProps,
};

const Paginator = Object.assign(PaginationRoot, {
  Caption,
  PageLink,
  Content,
  ControlLink,
  RangeLinks,
  LinkGroup,
  PageSpanActivator,
});

export default Paginator;

/*

@EXAMPLE:


const { props: paginatorProps } = useRenderScopedPaginatorProps({
  pageSearchParamName: "page",
  pageSliceSpanActive: true,
  totalPageCount: Math.ceil(rows.length / rowsPerPage),
  initialCurrentPage: 1
});

<Paginator className={""} {...paginatorProps}>
  <Paginator.Caption textTemplate={"> Page %d of %d"} />

  <Paginator.LinkGroup className={""}>
    <Paginator.ControlLink className={""} kind={"prev"}>
      <strong>&lt;</strong>
      <span>Previous</span>
    </Paginator.ControlLink>
    <Paginator.RangeLinks
      className={""}
      wrapperClassName={""}
      currentPageActiveClassName={""}
    />
    <Paginator.ControlLink className={""} kind={"next"}>
      <span>Next</span>
      <strong>&gt;</strong>
    </Paginator.ControlLink>
  </Paginator.LinkGroup>
</Paginator>

*/
