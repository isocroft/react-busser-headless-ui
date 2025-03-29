export const useTextFileDownload = (textFileMimeType = "text/plain")  => {
  return {
    handleDownload (textFileContent =  "", textFileName = "") {
      if (window.navigator.msSaveBlob) {
        const blob = new Blob([textFileContent], { type: textFileMimeType })
        window.navigator.msSaveBlob(blob, textFileName);
      } else {
        const link = window.document.createElement("a");
        link.setAttribute(
            "href",
            `data:${textFileMimeType};charset=utf-8,%EF%BB%BF${encodeURI(textFileContent)}`
        );
        link.setAttribute(
            "download",
            textFileName
        );
        link.click();
      }
    }
  }
}
