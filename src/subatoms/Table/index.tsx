import React, {
  createContext,
  forwardRef,
  useContext,
  useRef,
} from "react";

import { composeClassesModule } from "../../_shared/helpers";
import { useIsomorphicLayoutEffect, useMergedRef, useSharedStyle } from "../../_shared/hooks";


const STYLE_ID_PREFIX = "react-busser-headless-ui_table";

/**
 * @INFO:
 * 
 * Base styles: horizontal scrolling + sticky columns for the wide layout.
 * Everything visual is exposed through CSS custom properties so consumers can
 * theme the table without fighting specificity.
 */
const BASE_CSS = `
.data-box-table-wrapper {
  container-name: data-box-table;
  container-type: inline-size;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
 
.data-box-table {
  width: 100%;
  border-collapse: collapse;
}
 
.data-box-table .table-sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--data-box-table-sticky-bg, Canvas);
}
 
.data-box-table .table-sticky-col-right {
  left: auto;
  right: 0;
}
`;

/*
 * Stacked ("card") layout, generated per breakpoint.
 *
 * Modern browsers get a container query, so the table reacts to the space it
 * actually has (a sidebar, a modal, a grid cell). Browsers without container
 * queries (Chrome < 105, Safari < 16, Firefox < 110) get the same rules inside
 * a viewport media query instead. The fallback is gated behind
 * `@supports not (...)` so modern browsers never apply it: otherwise a wide
 * table on a narrow screen would stack even though its container has room.
 *
 * The rules themselves also avoid newer syntax: no `:is()`, physical-property
 * fallbacks before logical ones, plain values before `var()`, and margins
 * instead of flexbox `gap`.
 *
 *
 * CSS variables deployed:
 * =======================
 * - var(--data-box-table-sticky-bg)
 * - var(--data-box-table-row-border)
 * - var(--data-box-table-row-gap)
 * - var(--data-box-table-label-weight)
 */
const stackedRules = (scope: string) => {
  /** Expand `<scope> > (tbody|tfoot) > tr <tail>` without relying on :is(). */
  const rows = (tail = "") =>
    ["tbody", "tfoot"].map((s) => `${scope} > ${s} > tr${tail}`).join(",\n  ");
  /** Expand `<scope> > (tbody|tfoot) > tr > (td|th)<suffix>`. */
  const cells = (suffix = "") =>
    ["tbody", "tfoot"]
      .flatMap((s) =>
        ["td", "th"].map((c) => `${scope} > ${s} > tr > ${c}${suffix}`)
      )
      .join(",\n  ");

  return `
  ${scope},
  ${scope} > caption,
  ${scope} > thead,
  ${scope} > tbody,
  ${scope} > tfoot,
  ${scope} > thead > tr,
  ${rows()} {
    display: block;
    width: 100%;
  }
 
  /* Keep column headers for screen readers, hide them visually. */
  ${scope} > thead {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
 
  ${rows()} {
    margin-bottom: 1rem;
    margin-bottom: var(--data-box-table-row-gap, 1rem);
    border: 1px solid;
    border: var(--data-box-table-row-border, 1px solid currentColor);
  }
 
  ${cells()} {
    display: -webkit-box;
    display: -webkit-flex;
    display: flex;
    -webkit-flex-wrap: wrap;
    flex-wrap: wrap;
    -webkit-align-items: center;
    align-items: center;
    -webkit-justify-content: space-between;
    justify-content: space-between;
    text-align: right;
    text-align: end;
    border: none;
  }
 
  ${cells('[data-label]:not([data-label=""])::before')} {
    content: attr(data-label);
    -webkit-flex: 1 1 auto;
    flex: 1 1 auto;
    margin-inline-end: 1rem;
    text-align: left;
    text-align: start;
    font-weight: 600;
    font-weight: var(--data-box-table-label-weight, 600);
  }
 
  /* margin-right and margin-inline-end are different properties, so declaring
     both would put a margin on each side of the label in RTL layouts. Only
     fall back to the physical one where the logical one is unknown. */
  @supports not (margin-inline-end: 1rem) {
    ${cells('[data-label]:not([data-label=""])::before')} {
      margin-right: 1rem;
    }
  }
 
  /* A label with no value next to it is just noise. */
  ${cells(":empty")} {
    display: none;
  }
 
  /* A row header becomes the title of its card. */
  ${rows(' > th[scope="row"]')} {
    -webkit-justify-content: flex-start;
    justify-content: flex-start;
    text-align: left;
    text-align: start;
  }
 
  ${rows(' > th[scope="row"]::before')} {
    content: none !important;
  }
 
  ${scope} .table-sticky-col {
    position: static;
  }
`;
};

const stackedCss = (breakpoint: number) => {
  const scope = `.data-box-table-wrapper[data-stack-below="${breakpoint}"] > table.data-box-table`;
  const rules = stackedRules(scope);
  const max = `${breakpoint - 0.02}px`;

  return `
@container data-box-table (max-width: ${max}) {${rules}}
 
@supports not (container-type: inline-size) {
  @media screen and (max-width: ${max}) {${rules}}
}
`;
};

/* @HINT: Automatic row cell labeling from headers */
const AUTO_FLAG = "data-label-auto";

function syncCellLabels(table: HTMLTableElement) {
  const headerRow = table.tHead?.rows[table.tHead.rows.length - 1];
  if (!headerRow) return;

  /* @HINT: Map every visual column index to its header text (respecting colSpan). */
  const labels: string[] = [];
  Array.from(headerRow.cells).forEach((cell) => {
    const text =
      cell.getAttribute("data-label") ??
      cell.getAttribute("aria-label") ??
      cell.textContent?.trim() ??
      "";
    for (let i = 0; i < Math.max(1, cell.colSpan); i++) labels.push(text);
  });

  const bodies = [...Array.from(table.tBodies), table.tFoot].filter(
    Boolean
  ) as HTMLTableSectionElement[];

  bodies.forEach((section) => {
    Array.from(section.rows).forEach((row) => {
      let col = 0;
      Array.from(row.cells).forEach((cell) => {
        const userProvided =
          cell.hasAttribute("data-label") && !cell.hasAttribute(AUTO_FLAG);
        if (!userProvided) {
          const label = labels[col] ?? "";
          if (cell.getAttribute("data-label") !== label) {
            cell.setAttribute("data-label", label);
          }
          cell.setAttribute(AUTO_FLAG, "");
        }
        col += Math.max(1, cell.colSpan);
      });
    });
  });
}

type Section = "head" | "body" | "foot";
const SectionContext = createContext<Section>("body");

type TableOwnProps = {
  /**
   * Width (px) of the table's container below which rows stack into cards.
   * Pass `false` to keep the table layout at every width (it scrolls instead).
   * @default 560
   */
  stackBelow?: number | false;
  /** Fill `data-label` on body/footer cells from the header text. @default true */
  autoLabel?: boolean;
  /** `className` for wrapper (<div>). @default "" */
  wrapperClassName?: string;
};

type TableProps = React.ComponentPropsWithoutRef<"table"> & TableOwnProps;

const TableRoot = forwardRef<HTMLTableElement, TableProps>(function Table(
  {
    children,
    className = "",
    stackBelow = 560,
    autoLabel = true,
    wrapperClassName = "",
    ...props
  },
  forwardedRef
) {
  const tableRef = useRef<HTMLTableElement>(null);
  const ref = useMergedRef(tableRef, forwardedRef);

  useSharedStyle(STYLE_ID_PREFIX, BASE_CSS);
  const breakpoint =
    typeof stackBelow === "number" && stackBelow > 0
      ? Math.round(stackBelow)
      : 0;
  useSharedStyle(
    breakpoint ? `${STYLE_ID_PREFIX}-${breakpoint}` : `${STYLE_ID_PREFIX}-none`,
    breakpoint ? stackedCss(breakpoint) : ""
  );

  useIsomorphicLayoutEffect(() => {
    const table = tableRef.current;
    if (!autoLabel || !table) return;

    syncCellLabels(table);
    /** 
     * @INFO:
     * 
     * Re-sync when rows/cells/text change. Attributes are NOT observed, so
     * our own `.setAttribute(...)` calls can't cause an infinite loop.
     */ 
    const observer = new MutationObserver(() => syncCellLabels(table));
    observer.observe(table, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [autoLabel]);

  return (
    <div
      className={composeClassesModule("data-box-table-wrapper", wrapperClassName) || undefined}
      data-stack-below={breakpoint || undefined}
    >
      {/* Explicit roles: changing a table's `display` (stacked layout)
          strips its table semantics in some browsers. */}
      <table
        role="table"
        {...props}
        ref={ref}
        className={composeClassesModule("data-box-table", className) || undefined}
      >
        {children}
      </table>
    </div>
  );
});

const Caption = forwardRef<
  HTMLTableCaptionElement,
  React.ComponentPropsWithoutRef<"caption"> & {
    /** @deprecated pass children instead */
    captionText?: string;
  }
>(function Caption({ captionText = "", children, ...props }, ref) {
  return (
    <caption {...props} ref={ref}>
      {children ?? captionText}
    </caption>
  );
});

const Header = forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<"thead">
>(function Header({ children, ...props }, ref) {
  return (
    <SectionContext.Provider value="head">
      <thead role="rowgroup" {...props} ref={ref}>
        {children}
      </thead>
    </SectionContext.Provider>
  );
});

const Content = forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<"tbody">
>(function Content({ children, ...props }, ref) {
  return (
    <SectionContext.Provider value="body">
      <tbody role="rowgroup" {...props} ref={ref}>
        {children}
      </tbody>
    </SectionContext.Provider>
  );
});

const Footer = forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<"tfoot">
>(function Footer({ children, ...props }, ref) {
  return (
    <SectionContext.Provider value="foot">
      <tfoot role="rowgroup" {...props} ref={ref}>
        {children}
      </tfoot>
    </SectionContext.Provider>
  );
});

const Row = forwardRef<
  HTMLTableRowElement,
  React.ComponentPropsWithoutRef<"tr">
>(function Row({ children, ...props }, ref) {
  return (
    <tr role="row" {...props} ref={ref}>
      {children}
    </tr>
  );
});

/* ----------------------------- Polymorphic cells ---------------------------- */

type PolymorphicProps<E extends React.ElementType, P> = P & {
  /* @HINT: Element or component to render instead of the default cell. */
  as?: E;
} & Omit<React.ComponentPropsWithRef<E>, keyof P | "as">;

type PolymorphicComponent<D extends React.ElementType, P> = (<
  E extends React.ElementType = D
>(
  props: PolymorphicProps<E, P>
) => React.ReactElement | null) & { displayName?: string };

type StickySide = "left" | "right";

type CellOwnProps = {
  /* @HINT: Pin the cell while the table scrolls horizontally (wide layout only). */
  sticky?: StickySide;
  /* @HINT: CSS class name */
  className?: string;
};

type TitleColumnOwnProps = CellOwnProps & {
  /* @HINT: Defaults to "col" inside Table.Header and "row" elsewhere. */
  scope?: "col" | "row" | "colgroup" | "rowgroup";
};

type ContentColumnOwnProps = CellOwnProps & {
  /* @HINT: Label shown beside the value in the stacked layout. Overrides autoLabel. */
  label?: string;
};

const stickyClasses = (sticky?: StickySide) => {
  return sticky 
  ? composeClassesModule(
      "table-sticky-col",
      sticky === "right" && "table-sticky-col-right"
    )
  : "";
};

const TitleColumn = forwardRef(function TitleColumn(
  {
    as,
    scope,
    sticky,
    className,
    children,
    ...props
  }: PolymorphicProps<React.ElementType, TitleColumnOwnProps>,
  ref: React.Ref<Element>
) {
  const section = useContext(SectionContext);
  const Component = as ?? "th";
  const resolvedScope = scope ?? (section === "head" ? "col" : "row");

  return (
    <Component
      role={resolvedScope.startsWith("col") ? "columnheader" : "rowheader"}
      /* @OTE: The `scope` is only valid on a real <th> tag/JSX. */
      {...(Component === "th" ? { scope: resolvedScope } : {})}
      {...props}
      ref={ref}
      className={composeClassesModule(stickyClasses(sticky), className) || undefined}
    >
      {children}
    </Component>
  );
}) as PolymorphicComponent<"th", TitleColumnOwnProps>;

const ContentColumn = forwardRef(function ContentColumn(
  {
    as,
    label,
    sticky,
    className,
    children,
    ...props
  }: PolymorphicProps<React.ElementType, ContentColumnOwnProps>,
  ref: React.Ref<Element>
) {
  const Component = as ?? "td";

  return (
    <Component
      role="cell"
      {...(label !== undefined ? { "data-label": label } : {})}
      {...props}
      ref={ref}
      className={composeClassesModule(stickyClasses(sticky), className) || undefined}
    >
      {children}
    </Component>
  );
}) as PolymorphicComponent<"td", ContentColumnOwnProps>;

TitleColumn.displayName = "Table.TitleColumn";
ContentColumn.displayName = "Table.ContentColumn";

type TableCaptionProps = React.ComponentProps<typeof Caption>;
type TableHeaderProps = React.ComponentProps<typeof Header>;
type TableContentProps = React.ComponentProps<typeof Content>;
type TableFooterProps = React.ComponentProps<typeof Footer>;
type TableRowProps = React.ComponentProps<typeof Row>;
type TableTitleColumnProps<E extends React.ElementType = "th"> =
  PolymorphicProps<E, TitleColumnOwnProps>;
type TableContentColumnProps<E extends React.ElementType = "td"> =
  PolymorphicProps<E, ContentColumnOwnProps>;

export type {
  TableProps,
  TableCaptionProps,
  TableHeaderProps,
  TableContentProps,
  TableFooterProps,
  TableRowProps,
  TableTitleColumnProps,
  TableContentColumnProps,
};

const Table = Object.assign(TableRoot, {
  Caption,
  Header,
  Content,
  Row,
  Footer,
  TitleColumn,
  ContentColumn,
});

export default Table;

/*
 
  const MyRowItem = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
    function MyRowItem({ children, ...props }, ref) {
      // Don't hard-code `display: table-cell` inline: inline styles beat the
      // stacked layout's CSS. A <section> outside a <tr> also isn't valid
      // table markup, so prefer the default <td> unless you really need this.
      return <section {...props} ref={ref}>{children}</section>;
    }
  );
 
  <Table stackBelow={600}>
    <Table.Caption>Services</Table.Caption>
    <Table.Header>
      <Table.Row>
        <Table.TitleColumn sticky="left">Service</Table.TitleColumn>
        <Table.TitleColumn>Price</Table.TitleColumn>
      </Table.Row>
    </Table.Header>
    <Table.Content>
      <Table.Row>
        <Table.TitleColumn sticky="left">Hosting</Table.TitleColumn>   // scope="row"
        <Table.ContentColumn>$20</Table.ContentColumn>                // data-label="Price"
      </Table.Row>
    </Table.Content>
    <Table.Footer>
      <Table.Row>
        <Table.TitleColumn>Total</Table.TitleColumn>
        <Table.ContentColumn label="Total price">$20</Table.ContentColumn>
      </Table.Row>
    </Table.Footer>
  </Table>
*/
