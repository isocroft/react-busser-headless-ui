import React, { useEffect } from "react";
import { toast, useSonner } from "sonner";

import type { ToastT } from "sonner";

export const useToastManager = ({
  timeout = Infinity,
  className = "",
}: {
  timeout?: number;
  className?: string;
}) => {
  const { toasts } = useSonner();

  useEffect(() => {
    function removeAllToasts() {
      toasts.forEach(($toast: ToastT) => toast.dismiss($toast.id));
    }

    return () => {
      removeAllToasts();
    };
  }, [toasts.length]);

  return {
    showToast({
      cancel,
      title,
      description = "",
      icon,
      action,
      position,
      onClose,
    }: {
      title: string | React.FunctionComponent<{}>;
      description?: string | React.FunctionComponent<{}>;
      cancel?: React.ReactNode;
      icon?: React.ReactNode;
      action?: React.ReactNode;
      onClose?: (t: ToastT) => void;
      position?:
        | "top-center"
        | "top-left"
        | "top-right"
        | "bottom-center"
        | "bottom-left"
        | "bottom-right";
    }) {
      return toast(
        title,
        Object.assign(
          {
            position: "bottom-right" as const,
          },
          {
            className,
            description,
            duration: timeout,
            onAutoClose: onClose,
            icon,
            cancel,
            action,
          }
        )
      );
    },
  };
};
