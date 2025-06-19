function getFileBytes<F extends Blob>(blob: F): Promise<ArrayBuffer | null> {
  if (!blob) {
    return Promise.reject(new TypeError("Calling getFileBytes(...): first argument `blob` is null/undefined"));
  }

  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.addEventListener('loadend', () => {
      if (this.error) {
        reject(this.error)
        return
      }

      resolve(this.result)
    })

    if (blob) {
      fileReader.readAsArrayBuffer(blob);
    }
  });
};

function base64ToBytes(base64String): Uint8Array {
  const binString = atob(base64String);
  return Uint8Array.from(binString, (byteString) => byteString.codePointAt(0));
}

function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join("");
  return btoa(binString);
}

const isBase64String = (base64String: string): boolean => {
  let base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
   return typeof base64String !== 'string'
     ? false
     : (base64String.length % 4 === 0) && base64Regex.test(base64String)
};

export const useTextFileDownload = (textFileMimeType = "text/plain") => {
  return {
    getFileBytes,
    handleDownload (textFileContent: Uint8Array | string, textFileName = "") {
      if (window.navigator.msSaveBlob) {
        const blob = typeof textFileContent === "string"
          ? new Blob(
            isBase64String(textFileContent)
              ? base64ToBytes(textFileContent)
              : [textFileContent], { type: textFileMimeType })
          : new Blob(textFileContent, { type: textFileMimeType })
        window.navigator.msSaveBlob(blob, textFileName);
      } else {
        const link = window.document.createElement("a");
        if (textFileContent instanceof Uint8Array) {
          link.setAttribute(
            "href",
            `data:${textFileMimeType};base64,${bytesToBase64(textFileContent)}`
          );
        } else if (typeof textFileContent === "string") {
          link.setAttribute(
              "href",
              isBase64String(textFileContent)
                ? `data:${textFileMimeType};charset=utf-8,%EF%BB%BF${encodeURI(textFileContent)}`
                : `data:${textFileMimeType};base64,${btoa(textFileContent)}`
          );
        }
        link.setAttribute(
            "download",
            textFileName
        );
        link.click();
      }
    }
  }
};

export const useBinaryFileDownload = (binaryFileMimeType = "application/octet-stream") => {
  return {
    getFileBytes,
    handleDownload(binaryFileContent: Uint8Array | string, binaryFileName = "") {
      if (window.navigator.msSaveBlob) {
        const saveBlob = (arrayBuffer) =>
          const blob = new Blob(arrayBuffer, { type: binaryFileMimeType })
          window.navigator.msSaveBlob(blob, binaryFileName);
        };
        if (binaryFileContent instanceof Uint8Array) {
          return saveBlob(binaryFileContent);
        } else if (typeof binaryFileContent === "string") {
          if (isBase64String(binaryFileContent)) {
            return saveBlob(base64ToBytes(binaryFileContent));
          }
          return saveBlob(base64ToBytes(btoa(binaryFileContent)));
        }
      } else {
        const link = window.document.createElement("a");
        if (binaryFileContent instanceof Uint8Array) {
          link.setAttribute(
            "href",
            `data:${binaryFileMimeType};base64,${bytesToBase64(binaryFileContent)}`
          );
        } else if (typeof binaryFileContent === "string") {
          link.setAttribute(
              "href",
              `data:${binaryFileMimeType};base64,${isBase64String(binaryFileContent)
                 ? binaryFileContent
                 : btoa(binaryFileContent)}`
          );
        }
    
        link.setAttribute(
            "download",
            binaryFileName
        );
        link.click();
      }
    } 
  }
};
