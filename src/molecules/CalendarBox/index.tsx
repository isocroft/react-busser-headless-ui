import React, { useRef, useState, useCallback, useEffect } from "react";
import { useOutsideClick, useIsFirstRender } from "react-busser";
import { DayPicker, DateRange } from "react-day-picker";
import { format, isValid, parse } from "date-fns";

import Button from "../../subatoms/Button";
import TextBox from "../../subatoms/TextBox";
import PopoverBox from "../../atoms/PopoverBox";

import type { TextBoxProps } from "../../subatoms/TextBox";
import type { ButtonProps } from "../../subatoms/Button";

import { hasChildren, isSubChild } from "../../_shared/helpers";

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
}: React.ComponentPropsWithoutRef<"section"> &
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
  const popoverBoxRef = useRef<HTMLElement | null>(null);

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
    if (popoverBoxRef.current !== null) {
      const wrapper = popoverBoxRef.current;
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
    const calendarTable = event.currentTarget.getElementsByTagName("table")[0];
    let calendarTableHead: HTMLElement | null;
    if (calendarTable !== null) {
      calendarTableHead = calendarTable.getElementsByTagName("thead")[0];
      if (calendarTableHead !== null) {
        if (
          (!calendarTable.contains(event.target) ||
            calendarTableHead.contains(event.target)) &&
          event.target.tagName !== "BUTTON"
        ) {
          //event.stopPropagation();
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
    <PopoverBox
      {...props}
      aria-label={"calendar-box-wrapper"}
      tabIndex={tabIndex}
      className={wrapperClassName ? wrapperClassName : undefined}
      ref={popoverBoxRef}
      /* @CHECK: https://www.greatfrontend.com/questions/quiz/describe-event-capturing */
      onKeyDownCapture={onInputCheckNonDigitsAndDelimiter}
    >
      <PopoverBox.Trigger
        className={className ? className : undefined}
        onChange={onChange}
        onFocus={onFocus}
        onKeyUp={onInput}
      >
        {hasChildren(children, 1) &&
        (isSubChild(onlyChild, "SingleDateInput") ||
          isSubChild(onlyChild, "SingleDateButton"))
          ? children
          : null}
      </PopoverBox.Trigger>
      <PopoverBox.Content onPointerUp={onPointerUp}>
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
      </PopoverBox.Content>
    </PopoverBox>
  );
};

CalendarBox.SingleDateInput = SingleDateInput;
CalendarBox.SingleDateButton = SingleDateButton;

type CalendarBoxProps = React.ComponentProps<typeof CalendarBox>;

export type { CalendarBoxProps };

export default CalendarBox;

/*

@EXAMPLE: 

import { getDefaultClassNames } from "react-day-picker";

const defaultClassNames = getDefaultClassNames();

const [inputValue, setInputValue] = useState("02/12/2024");

<CalendarBox
 className=""
 dateFormat="mm/dd/yyyy"
 wrapperClassName=""
 classNames={{
   root: `${defaultClassNames.root} shadow-lg p-5`,
   chevron: `${defaultClassNames.chevron} fill-amber-500`
 }}
>
  <CalendarBox.SingleDateInput
    className=""
    value={inputValue}
    onChange={(e) => setInputValue(e.target.value)}
  >
    <span>Label:</span> 
  </CalendarBox.SingleDateInput>
</CalendarBox>

*/
