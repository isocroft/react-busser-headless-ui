import React, { useEffect } from "react";
import {
  useForm,
  FormProvider,
  Form
} from "react-hook-form";

import type {
  FieldValues,
  UseFormProps,
  SubmitHandler,
  UseFormReturn
} from "react-hook-form";

import BasicForm from "../../subatoms/Form";

interface ContextFormPresetProps<V extends FieldValues>
  extends Omit<
    React.ComponentPropsWithRef<"form">,
    "onSubmit" | "method"
  > {
  onSubmit: SubmitHandler<V>;
  formOptions: UseFormProps<V>;
  onAfterSubmitFailure?: (options: {
    response?: Response
  }) => void;
  onAfterSubmitSuccessful: (options: {
    response?: Response,
    reset: UseFormReturn<V>["reset"],
    submitCount: number,
    defaultValues: UseFormProps<V>["defaultValues"]
  }) => void;
  method?: "post" | "put" | "delete";
  headers?: Record<string, string>;
}

const ContextForm = <F extends FieldValues>({
  children,
  onSubmit,
  action,
  headers,
  method = "post",
  className,
  formOptions,
  onAfterSubmitFailure,
  onAfterSubmitSuccessful,
  ...props
}: ContextFormPresetProps<F>) => {
  const { control, ...methods } = useForm<F>(
    Object.assign({ mode: "onChange" as const }, formOptions)
  );
  const { formState } = methods;

  useEffect(() => {
    if (formState.isSubmitted && formState.isSubmitSuccessful) {
      if (!formOptions.progressive) {
        onAfterSubmitSuccessful({
          reset: methods.reset,
          submitCount: formState.submitCount,
          defaultValues: formOptions.defaultValues
        });
      }
    }
  }, [formState, formOptions.progressive]);

  return (
    <>
      {formOptions.progressive ? (
        <Form<F>
          control={control}
          action={action}
          method={method}
          onSubmit={({ data, event }) => onSubmit(data, event)}
          onError={({ response }: { response?: Response }) => {
            if (typeof onAfterSubmitFailure === "function") {
              onAfterSubmitFailure({ response });
            }
          }}
          onSuccess={({ response }: { response?: Response }) => {
            onAfterSubmitSuccessful({
              response,
              reset: methods.reset,
              submitCount: formState.submitCount,
              defaultValues: formOptions.defaultValues
            });
          }}
          headers={headers}
        >
          <div className={className}>{children}</div>
        </Form>
      ) : (
        <FormProvider {...methods} control={control}>
          <BasicForm
            onSubmit={methods.handleSubmit(onSubmit)}
            className={className}
            {...props}
            method={formOptions.mode === "all" ? undefined : "post"}
          >
            {children}
          </BasicForm>
        </FormProvider>
      )}
    </>
  );
};

type ContextFormProps = React.ComponentProps<typeof ContextForm>;

export type { ContextFormProps };

export default ContextForm;
