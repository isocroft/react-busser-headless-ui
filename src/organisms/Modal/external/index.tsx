import React, { useState, useMemo, useRef, useEffect, useContext } from "react";
import { useOutsideClick, useSearchParamsState } from "react-busser";

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

import Modal from "../";

type ModalControls = {
  show: (
    node: React.ReactNode,
    reference: React.MutableRefObject<(HTMLDivElement & HTMLDialogElement) | null>,
    callback: () => void
  ) => string;
  close: (modalId: string) => void;
};

function useModalCore(styles: {
  className: string;
  wrapperClassName: string;
}): [
  React.ReactElement<any, string | React.JSXElementConstructor<any>>[],
  ModalControls
] {
  const sequentialIdGeneratorFactory = (): (() => string) => {
    let i = 0;
    return () => `$__modal_${i++}`;
  };
  const markModalsPosition = useRef<
    Record<
      string,
      { position: number; ref: React.MutableRefObject<(HTMLDivElement & HTMLDialogElement) | null> }
    >
  >({});
  const [modals, setModals] = useState<React.ReactElement[]>([]);
  const controls = useMemo(() => {
    const idGeneratorRoutine = sequentialIdGeneratorFactory();
    const close = (modalRefId: string, callback?: () => void) => {
      let id = modalRefId;

      if (typeof HTMLDialogElement == "function") {
        const { ref } = markModalsPosition.current[id];

        delete markModalsPosition.current[id];
  
        if (ref.current
          && ref.current.tagName === 'DIALOG') {
          ref.current.close();
        }

        ref.current = null;
      } else {
        setModals((prevModals) => {
          if (!id) {
            return prevModals;
          }
  
          const clonedPrevModals = prevModals.slice(0);
          const { position, ref } = markModalsPosition.current[id];
  
          clonedPrevModals.splice(position, 1);
          delete markModalsPosition.current[id];
        
          ref.current = null;
  
          return clonedPrevModals;
        });
      }

      if (typeof callback === "function") {
        callback();
      }
    };

    return {
      show(
        node: React.ReactNode,
        reference: React.MutableRefObject<(HTMLDivElement & HTMLDialogElement) | null>,
        callback: () => void
      ) {
        if (reference.current !== null) {
          return reference.current.id;
        }

        const id = idGeneratorRoutine();
        /* @CHECK: https://legacy.reactjs.org/docs/reconciliation.html#tradeoffs */
        const modal = (
          <Modal
            key={id}
            className={styles.className}
            wrapperClassName={styles.wrapperClassName}
            id={id}
            close={close.bind(null, id, callback)}
            ref={reference}
          >
            {node}
          </Modal>
        );
  
        setModals((prevModals) => {
          markModalsPosition.current[id] = {
            position: prevModals.length,
            ref: reference,
          };

          if (typeof HTMLDialogElement == "function") {
            window.setTimeout(() => {
              if (reference.current
                && reference.current.tagName === 'DIALOG') {
                reference.current.showModal();
              }
            }, 0);
          } 

          return [...prevModals, modal];
        });

        return id;
      },
      close: close,
    };
  }, []);

  useEffect(() => {
    return () => {
      markModalsPosition.current = {};
      setModals([]);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return [modals, controls];
}

const useModalControls = (
  controls: ModalControls,
  id: string,
  ariaTags?: {
    labelledBy: string;
    describedBy: string;
  }
) => {
  const modalNode = useRef<React.ReactElement<{ id?: string }> | null>(null);
  const [modalVisibilityState, setModalVisibilityState, unsetParamsOnUrl] =
    useSearchParamsState<"hidden" | "visible">(id, false, "hidden");
  const [modalRef] = useOutsideClick<HTMLDivElement & HTMLDialogElement>((subject) => {
    setModalVisibilityState((prevModalVisibilityState) => {
      if (prevModalVisibilityState === "visible") {
        return "hidden";
      }
      return prevModalVisibilityState;
    });
    /* @NOTE: Close the modal if any DOM element outside it is clicked */
    if (subject) {
      controls.close(subject.id);
    }
  });

  useEffect(() => {
    if (modalRef.current) {
      if (ariaTags?.labelledBy) {
        modalRef.current.setAttribute("arai-labelledby", ariaTags?.labelledBy);
      }

      if (ariaTags?.describedBy) {
        modalRef.current.setAttribute("arai-describedby", ariaTags?.labelledBy);
      }
    }

    return () => {
      if (modalNode.current) {
        modalNode.current = null;
      }
      unsetParamsOnUrl();
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (modalVisibilityState === "visible") {
    if (
      React.isValidElement<{ id?: string }>(modalNode.current) &&
      modalNode.current !== null
    ) {
      if (modalRef.current === null) {
        /* @HINT: Automatically show the modal when page is freshly loaded 
            with <URL> + query params containing `modalVisibilityState`
        */
        controls.show(
          React.cloneElement(modalNode.current, { id }),
          modalRef,
          () => {
            setModalVisibilityState((prevModalVisibilityState) => {
              if (prevModalVisibilityState === "visible") {
                return "hidden";
              }
              return prevModalVisibilityState;
            });
          }
        );
      }
    }
  } else {
    if (modalRef.current !== null) {
      setModalVisibilityState("hidden");
      controls.close(id || modalRef.current.id);
    }
  }

  return {
    get isModalVisible() {
      return modalVisibilityState === "visible";
    },
    showModal(node: React.ReactNode) {
      if (
        hasChildren(node, 0) ||
        !React.isValidElement<{ id?: string }>(node)
      ) {
        throw new Error("cannot display this modal!");
      }

      if (modalRef.current !== null && modalNode.current === node) {
        /* @HINT: No need to re-run `showModal()` again while modal 
          is already visible prior */
        return modalRef.current.id;
      }

      modalNode.current = node;

      setModalVisibilityState("visible");

      return controls.show(
        React.cloneElement(modalNode.current, { id }),
        modalRef,
        () =>
          setModalVisibilityState((prevModalVisibilityState) => {
            if (prevModalVisibilityState === "visible") {
              return "hidden";
            }
            return prevModalVisibilityState;
          })
      );
    },
    closeModal($id?: string) {
      if (modalRef.current) {
        setModalVisibilityState("hidden");
        controls.close($id || modalRef.current.id);
        modalRef.current = null;
      }
    },
  };
};

const ModalControlsContext = React.createContext<ModalControls | null>(null);

export const ModalControlsProvider = ({
  children,
  styles = { className: "", wrapperClassName: "" },
}: {
  children: React.ReactNode;
  styles: {
    className: string;
    wrapperClassName: string;
  };
}) => {
  const [modals, controls] = useModalCore(styles);

  return (
    <ModalControlsContext.Provider value={controls}>
      {modals} {children}
    </ModalControlsContext.Provider>
  );
};

export const useModal = (
  modalId: string,
  ariaTags?: {
    labelledBy: string;
    describedBy: string;
  }
) => {
  const controls = useContext(ModalControlsContext);
  return useModalControls(
    !controls
      ? {
          show() {
            throw new Error("unable to fulfill `show()` call for `useModal()` hook");
          },
          close() {
            throw new Error("unable to fulfill `close()` call for `useModal()` hook");
          },
        }
      : controls,
    modalId,
    ariaTags
  );
};
