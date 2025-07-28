import React, { useRef, useState, useCallback, useEffect } from "react";
import { useOutsideClick, useIsFirstRender } from "react-busser";
import { DayPicker, DateRange } from "react-day-picker";
import { format, isValid, parse } from "date-fns";

import TextBox from "../../subatoms/TextBox";
import Button from "../../subatoms/Button";

import { TextBoxProps } from "../../subatoms/TextBox";
import { ButtonProps } from "../../subatoms/Button";

import { hasChildren, isSubChild } from "../../../helpers/render-utils";

const SingleDateInput = ({
  onChange,
  value,
  ...props
}: Omit<
  TextBoxProps,
  "labelPosition" | "valueSync" | "ref" | "onChange" | "as"
> & {
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

    const onFormSubmitValidityCheck = () => {
      if (textBoxRef.current) {
        textBoxRef.current.reportValidity();
      }
    };

    if (textBoxRef.current && textBoxRef.current.form) {
      textBoxRef.current.form.addEventListener(
        "submit",
        onFormSubmitValidityCheck
      );
    }
    /* @ts-ignore */
    window.addEventListener("calendarinputvalue", onCalendarInputValue, false);

    return () => {
      if (textBoxRef.current && textBoxRef.current.form) {
        textBoxRef.current.form.removeEventListener(
          "submit",
          onFormSubmitValidityCheck
        );
      }

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

const SingleDateButton = ({
  children,
  Placeholder,
  placeholderPosition = "beforeContents",
  onDateChange,
  ...props
}: Omit<ButtonProps, "ref"> & {
  onDateChange?: (date: Date) => void;
  placeholderPosition: "beforeContents" | "afterContents";
  Placeholder: string | React.FunctionComponent<{ valueString: string }>;
}) => {
  const [dateString, setDateString] = React.useState<string | undefined>();
  useEffect(() => {
    const onCalendarInputValue = (e: Event & { currentValue: string }) => {
      setDateString(e.currentValue);
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

  useEffect(() => {
    if (typeof onDateChange === "function") {
      onDateChange(new Date());
    }
  }, [dateString, onDateChange]);

  const renderPlaceholder = (
    $Placeholder: string | React.FunctionComponent<{ valueString: string }>,
    dateString?: string
  ) => {
    if (typeof dateString === "undefined") {
      if (typeof $Placeholder === "string") {
        return $Placeholder;
      }
    } else {
      return <$Placeholder valueString={dateString} />;
    }

    return null;
  };
  return (
    <Button data-calendar-value="" {...props}>
      {placeholderPosition === "beforeContents"
        ? renderPlaceholder(Placeholder, dateString)
        : null}
      {children}
      {placeholderPosition === "afterContents"
        ? renderPlaceholder(Placeholder, dateString)
        : null}
    </Button>
  );
};

const CalendarBox = ({
  children,
  dateFormat = "mm/dd/yyyy",
  mode = "single",
  captionLayout = "label",
  min,
  max,
  reverseMonths,
  tabIndex = 0,
  numberOfMonths = 1,
  showOutsideDays = false,
  wrapperClassName = "",
  pagedNavigation = false,
  className = "",
  classNames = {},
  required,
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
  const [selectedSingleDate, setSelectedSingleDate] = useState<
    Date | undefined
  >(() => {
    return undefined;
  });
  /* @HINT: Hold the selected date in state in "multiple" mode */
  const [selectedMultipleDate, setSelectedMultipleDate] = useState<
    Date[] | undefined
  >(() => {
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
          const dateValue = dateInput.getAttribute("data-calendar-value") || "";
          if (
            !dateValue ||
            dateValue.includes("-") ||
            !dateValue.includes("/")
          ) {
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
    if (wrapper) {
      const pickerBox = wrapper.querySelector(
        "div[data-horizontal-position-anchor]"
      ) as HTMLElement | null;

      if (pickerBox !== null) {
        if (pickerBox.classList.contains("show")) {
          pickerBox.classList.remove("show");
        }
      }
    }
  });

  const onInputCheckNonDigitsAndDelimiter = (
    event: React.KeyboardEvent<HTMLInputElement> & { target: HTMLInputElement }
  ) => {
    const keyCode = event.keyCode;
    /* @HINT: Check if the key is a letter (A-Z) or (a-z) */
    if ((keyCode >= 65 && keyCode <= 90) || (keyCode >= 97 && keyCode <= 122)) {
      event.preventDefault();
    }
  };

  const onFocus = (
    event: React.FocusEvent<HTMLInputElement> & { target: HTMLInputElement }
  ) => {
    const focusedElement = event.target as HTMLInputElement;

    if (
      focusedElement.tagName !== "INPUT" &&
      focusedElement.tagName !== "BUTTON"
    ) {
      if (!event.isDefaultPrevented()) {
        event.preventDefault();
        return;
      }
    }
  };

  const onPointerUp = (
    event: React.PointerEvent<HTMLDivElement> & {
      target: HTMLElement;
      currenTarget: HTMLElement;
    }
  ) => {
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
        event.detail = -1;
        if (!event.isDefaultPrevented()) {
          event.preventDefault();
          return;
        }
      }
    }
  };

  const dateRegexMap = {
    "mm/dd/yyyy":
      /^(?:[0][1-9]|[1][1-2])\/(?:[0][1-9]|[1-2][0-9]|[3][0-1])\/(?:[1][9]([2][5-9]|[3-9][0-9])|[2][0][0-2][0-5])$/,
    "dd/mm/yy":
      /^(?:[0][1-9]|[1-2][0-9]|[3][0-1])\/(?:[0][1-9]|[1][1-2])\/([2][5-9]|[3-9][0-9]|[0-2][0-5])$/,
  } as const;

  const onInput = (
    event: React.KeyboardEvent<HTMLInputElement> & { target: HTMLInputElement }
  ) => {
    const keyCode = event.keyCode;
    const inputElem = event.target;
    const form = inputElem.form;
    const inputValueRegex = dateRegexMap[dateFormat];

    /* @HINT: Check `Tab` & `Capslock` keys */
    if (keyCode !== 9 && keyCode !== 20) {
      if (!inputValueRegex.test(inputElem.value)) {
        if ((form && form.noValidate) || inputElem.willValidate) {
          inputElem.setCustomValidity(
            `Please, fill in a valid date using format: ${dateFormat}`
          );
        }
        inputElem.setAttribute("aria-invalid", "true");
      } else {
        inputElem.setAttribute("aria-invalid", "false");
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
      setSelectedSingleDate(parsedDate);
      if (mode === "single") {
        setMonth(parsedDate);
      }
    } else {
      setSelectedSingleDate(undefined);
    }
  };

  const handleSingleDayPickerSelect = (date: Date) => {
    const setInputValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )!.set;

    if (!date || !(date instanceof Date)) {
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

  const handleMultipleDayPickerSelect = (date: Date[]) => {
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

  const [onlyChild] = React.Children.toArray(children);

  return (
    <section
      {...props}
      aria-label={"calendar box wrapper"}
      tabIndex={tabIndex}
      className={`calendar_wrapper-box ${wrapperClassName}`}
      onPointerUp={(
        event: React.PointerEvent<HTMLDivElement> & {
          target: HTMLElement;
          currenTarget: HTMLElement;
        }
      ) => {
        if (!event.defaultPrevented && event.detail === 0) {
          if (
            pickerBoxRef.current !== null &&
            pickerBoxRef.current.contains(event.target)
          ) {
            pickerBoxRef.current.classList.remove("show");
          }
        }
      }}
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

        if (!event.defaultPrevented) {
          if (
            pickerBoxRef.current !== null &&
            !pickerBoxRef.current.contains(event.target)
          ) {
            pickerBoxRef.current.classList.add("show");
          }
        }
      }}
      role={"group"}
      ref={wrapperRef}
      /* @CHECK: https://www.greatfrontend.com/questions/quiz/describe-event-capturing */
      onKeyDownCapture={onInputCheckNonDigitsAndDelimiter}
    >
      <div
        className={`calendar_input-box ${className}`}
        onChange={onChange}
        onFocus={onFocus}
        onKeyUp={onInput}
      >
        {hasChildren(children, 1) &&
        (isSubChild(onlyChild, "SingleDateInput") ||
          isSubChild(onlyChild, "SingleDateButton"))
          ? children
          : null}
      </div>
      <div
        className={"calendar_picker-box"}
        data-horizontal-position-anchor={"left"}
        data-vertical-position-anchor={"top"}
        ref={pickerBoxRef}
        onPointerUp={onPointerUp}
      >
        <DayPicker
          mode={mode === "single" ? (mode as "single") : (mode as "multiple")}
          captionLayout={captionLayout}
          required={required}
          role={"application"}
          aria-label={props["aria-label"]}
          month={month}
          min={mode === "single" || mode === "multiple" ? undefined : min}
          max={mode === "single" || mode === "multiple" ? undefined : max}
          reverseMonths={reverseMonths}
          onMonthChange={setMonth}
          /* @ts-ignore */
          selected={
            mode === "single" ? selectedSingleDate : selectedMultipleDate
          }
          classNames={classNames}
          numberOfMonths={numberOfMonths}
          showOutsideDays={showOutsideDays}
          pagedNavigation={pagedNavigation}
          /* @ts-ignore */
          onSelect={
            mode === "single"
              ? handleSingleDayPickerSelect
              : handleMultipleDayPickerSelect
          }
        />
      </div>
    </section>
  );
};

CalendarBox.SingleDateInput = SingleDateInput;
CalendarBox.SingleDateButton = SingleDateButton;

type CalendarBoxProps = React.ComponentProps<typeof CalendarBox>;

export type { CalendarBoxProps };

export default CalendarBox;
