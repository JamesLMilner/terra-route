import { useCallback } from "preact/hooks";

export function useDownloadJSON() {
  const downloadJSON = useCallback(
    (json: Record<string, any>, filename: string) => {
      // Turn the JSON object into a string
      const data = JSON.stringify(json, null, 4);

      // Pass the string to a Blob and turn it
      // into an ObjectURL
      const blob = new Blob([data], { type: "text/plain" });
      const jsonObjectUrl = URL.createObjectURL(blob);

      // Create an anchor element, set it's
      // href to be the Object URL we have created
      // and set the download property to be the file name
      // we want to set
      const anchorEl = document.createElement("a");
      anchorEl.href = jsonObjectUrl;
      anchorEl.download = filename;

      // There is no need to actually attach the DOM
      // element but we do need to click on it
      anchorEl.click();

      // We don't want to keep a reference to the file
      // any longer so we release it manually
      URL.revokeObjectURL(jsonObjectUrl);
    },
    []
  );

  return downloadJSON;
}
