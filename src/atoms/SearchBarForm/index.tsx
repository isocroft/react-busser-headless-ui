import React, { useCallback, useMemo, useRef } from "react";
import { useSearchParamStateValueUpdate, useSearchParamStateValue } from "react-busser";

import Button from "../../subatoms/Button";
import Form  from "../../subatoms/Form";

import type { FormProps } from "../../subatoms/Form";

function SearchBarForm({
  searchParamName = "filter",
  children,
  ...props
}: FormProps & {
  searchParamName?: string;
}) {
  const changeSearchParamFilterValue =
    useSearchParamStateValueUpdate(searchParamName);
  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const filterData = formData.get(searchParamName);

      if (typeof filterData === "string") {
        changeSearchParamFilterValue(filterData);
      }
    },
    []
  );

  return (
    <Form {...props} onSubmit={onSubmit} role="search">
      {children}
    </Form>
  );
}

function SearchBarControls({
  searchParamName = "filter",
  wrapperClassName = "",
  textBoxClassName = "",
  textBoxPlaceholder = "Search...",
  textBoxType = "text",
  isBusy: isParentFormSubmitting,
  children,
  ...props
}: React.ComponentPropsWithRef<"fieldset"> & {
  isBusy: boolean,
  searchParamName?: string,
  wrapperClassName?: string,
  textBoxClassName?: string,
  textBoxPlaceholder?: string,
  textBoxType?: string,
}) {
  const [stateValue] = useSearchParamStateValue(searchParamName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canSetButtonDisabled = useMemo(() => {
    return inputRef.current !== null && inputRef.current.value !== "";
  }, [inputRef.current]);

  return (
    <div {...props} key={filter !== "" ? filter : "default"} role="region">
      <fieldset role="group">
        <input
          name={searchParamName}
          role="searchbox"
          placeholder={textBoxPlaceholder}
          type={textBoxType}
          autoComplete="no"
          defaultValue={stateValue[searchParamName]}
          ref={inputRef}
        />
        <Button
          disabled={canSetButtonDisabled ? isParentFormSubmitting : false}
          aria-busy={isParentFormSubmitting}
          type={"submit"}
        >
          {children}
        </Button>
      </fieldset>
      {/*<section id="autocomplete" role="xxx">
        <ul></ul>
      </section>*/}
    </div>
  );
}

SearchBarForm.Controls = SearchBarControls;

export default SearchBarForm;
