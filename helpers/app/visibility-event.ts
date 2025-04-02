import { useState, useEffect } from "react";

// Define vendor-specific document properties
interface DocumentWithVendorProperties extends Document {
  msHidden?: boolean;
  webkitHidden?: boolean;
}

export function getBrowserVisibilityProp(): string | undefined {
  if (typeof document.hidden !== "undefined") {
    // Opera 12.10 and Firefox 18 and later support
    return "visibilitychange";
  } else if (typeof (document as DocumentWithVendorProperties).msHidden !== "undefined") {
    return "msvisibilitychange";
  } else if (typeof (document as DocumentWithVendorProperties).webkitHidden !== "undefined") {
    return "webkitvisibilitychange";
  }
  return undefined;
}

export function getBrowserDocumentHiddenProp(): string | undefined {
  if (typeof document.hidden !== "undefined") {
    return "hidden";
  } else if (typeof (document as DocumentWithVendorProperties).msHidden !== "undefined") {
    return "msHidden";
  } else if (typeof (document as DocumentWithVendorProperties).webkitHidden !== "undefined") {
    return "webkitHidden";
  }
  return undefined;
}

export function getIsDocumentHidden(): boolean {
  const hiddenProp = getBrowserDocumentHiddenProp();
  if (!hiddenProp) {
    // If the property is not supported, assume the document is visible
    return false;
  }
  return !(document as DocumentWithVendorProperties & Record<string, any>)[hiddenProp];
}

export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(getIsDocumentHidden());
  const onVisibilityChange = () => setIsVisible(getIsDocumentHidden());

  useEffect(() => {
    const visibilityChange = getBrowserVisibilityProp();

    if (!visibilityChange) {
      console.warn('Browser visibility change event not supported');
      return;
    }

    document.addEventListener(visibilityChange, onVisibilityChange, false);

    return () => {
      if (visibilityChange) {
        document.removeEventListener(visibilityChange, onVisibilityChange);
      }
    };
  }, []); // Added dependency array to prevent unnecessary re-renders

  return isVisible;
}

export const getVisibilityEventNames = (): [string | null, string | null] => {
  let hidden: string | null = null;
  let visibilityChange: string | null = null;

  if (typeof document.hidden !== "undefined") {
    // Opera 12.10 and Firefox 18 and later support
    hidden = "hidden";
    visibilityChange = "visibilitychange";
  } else if (typeof (document as DocumentWithVendorProperties).msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
  } else if (typeof (document as DocumentWithVendorProperties).webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
  }

  return [hidden, visibilityChange];
};
