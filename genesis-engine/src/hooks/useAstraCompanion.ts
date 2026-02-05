import { useState, useCallback } from 'react';

/**
 * ASTRA COMPANION (Document PiP Heist)
 * Objective: Persistent floating window for Astra across browser tabs.
 * Strategy: Use Chrome's Document Picture-in-Picture API.
 */
export function useAstraCompanion() {
    const [isCompanionActive, setIsCompanionActive] = useState(false);
    const [pipWindow, setPipWindow] = useState<any>(null);

    const toggleCompanion = useCallback(async (contentRef: React.RefObject<HTMLDivElement | null>) => {
        if (typeof window === 'undefined') return;

        // @ts-ignore - Experimental Chrome API
        if (!window.documentPictureInPicture) {
            console.warn("Document PiP not supported in this browser.");
            return;
        }

        if (isCompanionActive) {
            pipWindow?.close();
            setIsCompanionActive(false);
            setPipWindow(null);
            return;
        }

        try {
            // @ts-ignore
            const newPipWindow = await window.documentPictureInPicture.requestWindow({
                width: 300,
                height: 300,
            });

            // Move the Astra Orb/UI into the PiP window
            if (contentRef.current) {
                newPipWindow.document.body.append(contentRef.current);
            }

            // Copy styles
            const styleSheets = Array.from(document.styleSheets);
            styleSheets.forEach((styleSheet) => {
                try {
                    const cssRules = Array.from(styleSheet.cssRules)
                        .map((rule) => rule.cssText)
                        .join("");
                    const style = document.createElement("style");
                    style.textContent = cssRules;
                    newPipWindow.document.head.appendChild(style);
                } catch (e) {
                    const link = document.createElement("link");
                    if (styleSheet.href) {
                        link.rel = "stylesheet";
                        link.href = styleSheet.href;
                        newPipWindow.document.head.appendChild(link);
                    }
                }
            });

            newPipWindow.addEventListener("pagehide", () => {
                setIsCompanionActive(false);
                setPipWindow(null);
            });

            setPipWindow(newPipWindow);
            setIsCompanionActive(true);
            console.log("[AstraCompanion] Floating window active.");
        } catch (e) {
            console.error("Failed to open Astra Companion:", e);
        }
    }, [isCompanionActive, pipWindow]);

    return { isCompanionActive, toggleCompanion };
}
