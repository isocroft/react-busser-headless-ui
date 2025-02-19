export {};

declare class Stringified<T> extends String {
  private ___stringified: T;
}

declare global {
  interface DocumentEventMap {
    ["filezonedropaction"]: CustomEvent<{ files: FileList | null }>;
  }

  interface IDBEventTarget extends EventTarget {
    result: IDBDatabase;
  }

  interface IDBEvent extends IDBVersionChangeEvent {
    target: IDBEventTarget;
  }

  interface DataTransfer {
    dropEffect: "none" | "copy" | "link" | "move";
    effectAllowed : "none" | "copy" | "copyLink" | "move";
    setData: (format: string, data: string) => void
  }

  interface DragEvent extends Event { 
    dataTransfer: DataTransfer
  }

  interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
    readonly webkitRelativePath: string;
  }

  interface Navigator {
    readonly standalone?: boolean;
    msSaveBlob?: (blob: Blob, defaultName?: string) => boolean;
    msSaveOrOpenBlob: (blobOrBase64: Blob | string, filename: string) => void;
  }

  interface Window {
    JSON: {
      stringify<T>(
        value: T,
        replacer?: (key: string, value: any) => any,
        space?: string | number
      ): string & Stringified<T>;
      parse<T>(
        text: string | Stringified<T>,
        reviver?: (key: any, value: any) => any
      ): T | null;
      parse(text: string, reviver?: (key: any, value: any) => any): any;
    };
  }
}
