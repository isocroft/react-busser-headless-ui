import React, { useRef, useState, useCallback, useEffect } from "react";
import { useOutsideClick, useIsFirstRender } from "react-busser";
import { DayPicker } from "react-day-picker";
import { format, isValid, parse } from "date-fns";

import TextBox from "../../subatoms/TextBox";

import { TextBoxProps } from "../../subatoms/TextBox";

/* @TODO: implement range dates */
//type DateRange = { from: Date | undefined; to: Date };

const DateInput = ({
  onChange,
  value,
  ...props
}: Omit<TextBoxProps, "labelPosition" | "valueSync" | "ref" | "onChange" | "as"> & {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const textBoxRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const onCalendarInputValue = (e: Event & { currentValue: string }) => {
      /* @NOTE: Programmatically trigger a `change` event on a <input> tag */
      /* @CHECK: https://github.com/facebook/react/issues/19678#issuecomment-679044981 */
      const programmaticChangeEvent = new Event("input", { bubbles: true });
      const setInputValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )!.set;

      if (typeof setInputValue !== "undefined") {
        setInputValue.call(textBoxRef.current, e.currentValue);
        if (textBoxRef.current !== null) {
          textBoxRef.current.dispatchEvent(programmaticChangeEvent);
        }
      }
    };

    /* @ts-ignore */
    window.addEventListener("calendarinputvalue", onCalendarInputValue, false);

    return () => {
      /* @ts-ignore */
      window.removeEventListener(
        "calendarinputvalue",
        onCalendarInputValue,
        false
      );
    };
  }, []);

  const $ref = useCallback((node) => {
    if (node) {
      textBoxRef.current = node;
    } else {
      textBoxRef.current = null;
    }
  }, []);

  const isFirstRender = useIsFirstRender();

  return (
    <TextBox
      {...props}
      as="input"
      defaultValue={isFirstRender ? "" : value}
      tabIndex={-1}
      data-calendar-value={value}
      onChange={(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => onChange(e as React.ChangeEvent<HTMLInputElement>)}
      labelPosition="beforeInput"
      ref={$ref}
    />
  );
};

const CalendarBox = ({
  children,
  dateFormat = "mm/dd/yyyy",
  captionLayout = "label",
  mode = "single",
  reverseMonths = false,
  required = false,
  min = 1,
  max = 1,
  tabIndex = 0,
  numberOfMonths = 1,
  showOutsideDays = false,
  wrapperClassName = "",
  pagedNavigation = false,
  className = "",
  classNames = {},
  ...props
}: React.ComponentProps<"section"> &
  Pick<React.ComponentProps<"input">, "tabIndex"> & {
    dateFormat?: "mm/dd/yyyy" | "dd/mm/yy";
    reverseMonths?: boolean;
    min?: number;
    max?: number;
    mode?: "single" | "multiple"; // | "range"; @TODO:
    required?: boolean;
    captionLayout?: "label" | "dropdown";
    showOutsideDays?: boolean;
    numberOfMonths?: number;
    pagedNavigation?: boolean;
    classNames?: Record<string, string>;
    wrapperClassName?: string;
  }) => {
  const pickerBoxRef = useRef<HTMLDivElement | null>(null);

  /* @HINT: Hold the month in state to control the calendar when the input changes */
  const [month, setMonth] = useState<Date>(() => {
    const today = new Date();
    return today;
  });
  /* @HINT: Hold the selected date in state in "single" mode */
  const [selectedSignleDate, setSelectedSingleDate] = useState<Date | undefined>(() => {
    return undefined;
  });
  /* @HINT: Hold the selected date in state in "multiple" mode */
  const [selectedMultipleDate, setSelectedMultipleDate] = useState<Date[] | undefined>(() => {
    return undefined;
  });
  /* @HINT: Hold the selected date in state in "range" mode */
  /* @TODO: implement range dates */
  // const [selectedRangeDate, setSelectedRangeDate] = useState<DateRange | undefined>(() => {
  //   return undefined;
  // });

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
      styleSheetsOnly.includes("react-busser-headless-ui_calendar")
    ) {
      return;
    }

    const calendarStyle = window.document.createElement("style");
    calendarStyle.id = "react-busser-headless-ui_calendar";

    calendarStyle.innerHTML = `
      
      .calendar_wrapper-box {
        position: relative;
        display: inline-block; /* shrink-to-fit trigger */
        min-height: 0;
        min-width: fit-content;
      }

      .calendar_picker-box {
        position: absolute;
        display: none;
      }

      .calendar_picker-box[data-vertical-position-anchor="top"] {
        bottom: auto;
        top: 100%;
      }

      .calendar_picker-box[data-vertical-position-anchor="bottom"] {
        top: auto;
        bottom: 100%;
      }

      .calendar_picker-box[data-horizontal-position-anchor="left"] {
        right: auto;
        left: 0;
      }

      .calendar_picker-box[data-horizontal-position-anchor="right"] {
        left: auto;
        right: 0;
      }

      .calendar_wrapper-box > .calendar_picker-box.show {
        display: block;
      }
    `;
    window.document.head.appendChild(calendarStyle);

    return () => {
      window.document.head.removeChild(calendarStyle);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (pickerBoxRef.current !== null) {
        const wrapper = pickerBoxRef.current.parentNode as HTMLElement | null;
        if (wrapper !== null) {
          const { left, right, bottom, width } =
            wrapper.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const elementWidth = width || right - left;
          const elementHeight = parseInt(
            window.getComputedStyle(pickerBoxRef.current)["height"]
          );

          if (viewportWidth - right <= elementWidth) {
            pickerBoxRef.current.dataset.horizontalPositionAnchor = "right";
          } else {
            pickerBoxRef.current.dataset.horizontalPositionAnchor = "left";
          }

          if (viewportHeight - bottom <= elementHeight) {
            pickerBoxRef.current.dataset.verticalPositionAnchor = "bottom";
          } else {
            pickerBoxRef.current.dataset.verticalPositionAnchor = "top";
          }
        }
      }
    };

    window.addEventListener("resize", onResize, false);

    onResize();

    return () => {
      window.removeEventListener("resize", onResize, false);
    };
  }, []);

  useEffect(() => {
    if (pickerBoxRef.current !== null) {
      const wrapper = pickerBoxRef.current.parentNode as HTMLElement | null;
      if (wrapper !== null) {
        const dateInput = wrapper.querySelector("input[data-calendar-value]")!;
        if (dateInput !== null) {
          dateInput.setAttribute("placeholder", dateFormat);
          const dateValue = dateInput.getAttribute("data-calendar-value");
          if (value.includes("-") || !value.includes("/")) {
            console.error(
              `react-busser-headless-ui: <CalendarBox /> component error; dateValue: "${dateValue}" doesn't match dateFormat: "${dateFormat}"`
            );
          }
          const event = new Event("calendarinputvalue");
          /* @ts-ignore */
          event.currentValue = dateValue;
          window.dispatchEvent(event);
        }
      }
    }
  }, []);

  const [wrapperRef] = useOutsideClick<HTMLDivElement>((wrapper) => {
    const pickerBox = wrapper.querySelector(
      "div[data-horizontal-position-anchor]"
    ) as HTMLElement | null;

    if (pickerBox !== null) {
      if (pickerBox.classList.contains("show")) {
        pickerBox.classList.remove("show");
      }
    }
  });

  const onFocus = (
    event: React.FocusEvent<HTMLInputElement> & { target: HTMLInputElement }
  ) => {
    const focusedElement = event.target as HTMLInputElement;

    if (focusedElement.tagName !== "INPUT") {
      return;
    }

    if (pickerBoxRef.current !== null) {
      pickerBoxRef.current.classList.add("show");
    }
  };

  const onPointerUp = (
    event: React.PointerEvent<HTMLDivElement> & {
      target: HTMLElement;
      currenTarget: HTMLElement;
    }
  ) => {
    if (pickerBoxRef.current !== null) {
      //const calendarRoot = event.currentTarget.firstElementChild;
      const calendarNav = event.currentTarget.getElementsByTagName("nav")[0];
      const parentElement = event.target.parentNode as HTMLElement | null;
      if (parentElement !== null) {
        if (
          calendarNav.contains(event.target) ||
          calendarNav.contains(parentElement) ||
          event.target.tagName === "SELECT" ||
          parentElement.tagName === "SELECT"
        ) {
          return;
        }
        pickerBoxRef.current.classList.remove("show");
      }
    }
  };

  const onInput = () => {
    if (pickerBoxRef.current !== null) {
      if (pickerBoxRef.current.classList.contains("show")) {
        pickerBoxRef.current.classList.remove("show");
      }
    }
  };

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement> & { target: HTMLInputElement }
  ) => {
    const parsedDate = parse(
      event.target.value,
      dateFormat.replace("mm", "MM"),
      new Date()
    );

    if (isValid(parsedDate)) {
      setSelectedDate(parsedDate);
      if (mode === "single") {
        setMonth(parsedDate);
      }
    } else {
      setSelectedDate(undefined);
    }
  };

  const handleSingleDayPickerSelect = (date: Date | undefined) => {
    const setInputValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )!.set;

    if (!date) {
      if (typeof setInputValue !== "undefined") {
        setTimeout(() => {
          const event = new Event("calendarinputvalue");
          /* @ts-ignore */
          event.currentValue = "";
          window.dispatchEvent(event);
        }, 0);
      }
      setSelectedSingleDate(undefined);
    } else {
      if (typeof setInputValue !== "undefined") {
        setTimeout(() => {
          const event = new Event("calendarinputvalue");
          /* @ts-ignore */
          event.currentValue = format(date, dateFormat.replace("mm", "MM"));
          window.dispatchEvent(event);
        }, 0);
      }
      setSelectedSingleDate(date);
      setMonth(date);
    }
  };

  const handleMultipleDayPickerSelect = (date: Date[] | undefined) => {
    const setInputValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )!.set;

    if (!date) {
      if (typeof setInputValue !== "undefined") {
        setTimeout(() => {
          const event = new Event("calendarinputvalue");
          /* @ts-ignore */
          event.currentValue = "";
          window.dispatchEvent(event);
        }, 0);
      }
      setSelectedMultipleDate(undefined);
    } else {
      if (typeof setInputValue !== "undefined") {
        setTimeout(() => {
          const event = new Event("calendarinputvalue");
          /* @ts-ignore */
          event.currentValue = format(date[0], dateFormat.replace("mm", "MM"));
          window.dispatchEvent(event);
        }, 0);
      }
      setSelectedMultipleDate(date);
    }
  };

  return (
    <section
      {...props}
      tabIndex={tabIndex}
      className={`calendar_wrapper-box ${wrapperClassName}`}
      onFocus={(
        event: React.FocusEvent<HTMLElement> & { target: HTMLElement }
      ) => {
        const wrapper = event.target;
        if (wrapper !== null) {
          const dateInput = wrapper.querySelector(
            "input[data-calendar-value]"
          )! as HTMLInputElement | null;
          if (dateInput !== null) {
            dateInput.focus();
          }
        }
      }}
      ref={wrapperRef}
    >
      <div
        className={`calendar_input-box ${className}`}
        onChange={onChange}
        onFocus={onFocus}
        onKeyPress={onInput}
      >
        {children}
      </div>
      <div
        className={"calendar_picker-box"}
        data-horizontal-position-anchor={"left"}
        data-vertical-position-anchor={"top"}
        ref={pickerBoxRef}
        onPointerUp={onPointerUp}
      >
        <DayPicker
          mode={mode}
          required={required}
          min={mode === "single" ? undefined : min}
          max={mode === "single" ? undefined : max}
          captionLayout={captionLayout}
          reverseMonths={reverseMonths}
          month={month}
          onMonthChange={setMonth}
          selected={selectedDate}
          classNames={classNames}
          numberOfMonths={numberOfMonths}
          showOutsideDays={showOutsideDays}
          pagedNavigation={pagedNavigation}
          onSelect={mode === "single" ? handleSingleDayPickerSelect : handleMultipleDayPickerSelect}
        />
      </div>
    </section>
  );
};

CalendarBox.DateInput = DateInput;

/*
import { getDefaultClassNames } from "react-day-picker";

const defaultClassNames = getDefaultClassNames();

const [inputValue, setInputValue] = useState(() => {
  return "02/12/2024"
});

<CalendarBox
 className=""
 dateFormat="mm/dd/yyyy"
 mode="single"
 captionLayout="dropdown"
 wrapperClassName=""
 classNames={{
   root: `${defaultClassNames.root} shadow-lg p-5`,
   chevron: `${defaultClassNames.chevron} fill-amber-500`
 }}
>
  <CalendarBox.DateInput
    className=""
    labelClassName=""
    value={inputValue}
    onChange={(e) => setInputValue(e.target.value)}
  >
    <span>Label:</span> 
  </CalendarBox.DateInput>
</CalendarBox>
*/

type CalendarBoxProps = React.ComponentProps<typeof CalendarBox>;

export type { CalendarBoxProps };

export default CalendarBox;
