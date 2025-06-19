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
  buttonClassName = "",
  textBoxPlaceholder = "Search...",
  textBoxType = "text",
  isBusy: isParentFormSubmitting,
  children,
  ...props
}: React.ComponentPropsWithRef<"div"> & {
  isBusy: boolean,
  searchParamName?: string,
  wrapperClassName?: string,
  textBoxClassName?: string,
  buttonClassName?: string;
  textBoxPlaceholder?: string,
  textBoxType?: string,
}) {
  const [stateValue] = useSearchParamStateValue(searchParamName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const searchParamValue = useMemo(() => {
    return stateValue[searchParamName];
  }, [stateValue, searchParamName]);
  const canSetButtonDisabled = useMemo(() => {
    return inputRef.current !== null && inputRef.current.value !== "";
  }, [inputRef.current]);

  return (
    <div {...props} key={searchParamValue !== "" ? searchParamValue : "default"} role="region">
      <fieldset role="group" className={wrapperClassName}>
        <input
          name={searchParamName}
          role="searchbox"
          aria-autocomplete="list"
          aria-controls={searchParamName}
          aria-haspopup="menu"
          placeholder={textBoxPlaceholder}
          type={textBoxType}
          className={textBoxClassName}
          autoComplete="no"
          spellCheck="false"
          defaultValue={searchParamValue}
          ref={inputRef}
        />
        <Button
          disabled={canSetButtonDisabled ? isParentFormSubmitting : false}
          aria-busy={isParentFormSubmitting}
          className={buttonClassName}
          type={"submit"}
        >
          {children}
        </Button>
      </fieldset>
      {/*<section id={searchParamName} role="menu">
        <ul role="group">
          <li role="menuitem"></li>
          <li role="menuitem"></li>
        </ul>
      </section>*/}
    </div>
  );
}

SearchBarForm.Controls = SearchBarControls;


/*
<SearchBarForm searchParamName={"pager"}>
  <SearchBarForm.Controls
    className={"..."}
    buttonClassName={"..."}
    textBoxClassName={"..."}
    wrapperClassName={"..."}
    searchParamName={"pager"}
    textBoxType={"search"}
  >
    <span>Search Me!</span>
  </SearchBarForm.Controls>
</SearchBarForm>
*/

export default SearchBarForm;
