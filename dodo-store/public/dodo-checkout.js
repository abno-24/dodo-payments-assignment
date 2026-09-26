"use strict";
(function () {
    const CHECKOUT_URL = "https://dodo-checkout-app-iota.vercel.app/";
    const READY_TIMEOUT_MS = 8000;
    const TRANSITION_MS = 200;
    let isOpen = false;
    function ensureStylesInjected() {
        if (document.getElementById("dodo-checkout-styles"))
            return;
        const style = document.createElement("style");
        style.id = "dodo-checkout-styles";
        style.textContent = `
      [data-dodo-checkout-overlay] {
        opacity: 0;
        transition: opacity ${TRANSITION_MS}ms ease;
      }
      [data-dodo-checkout-overlay][data-visible="true"] {
        opacity: 1;
      }
      [data-dodo-checkout-overlay] iframe {
        transform: scale(0.96);
        transition: transform ${TRANSITION_MS}ms ease;
      }
      [data-dodo-checkout-overlay][data-visible="true"] iframe {
        transform: scale(1);
      }
    `;
        document.head.appendChild(style);
    }
    function open(options) {
        var _a;
        if (isOpen) {
            console.warn("[DodoCheckout] A checkout is already open.");
            return;
        }
        if (!options.productId) {
            (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, { code: "MISSING_PRODUCT_ID", message: "productId is required." });
            return;
        }
        isOpen = true;
        ensureStylesInjected();
        const checkoutOrigin = new URL(CHECKOUT_URL).origin;
        const previouslyFocusedElement = document.activeElement;
        const overlay = document.createElement("div");
        overlay.setAttribute("data-dodo-checkout-overlay", "");
        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "999999",
        });
        const iframe = document.createElement("iframe");
        iframe.src = `${CHECKOUT_URL}/?productId=${encodeURIComponent(options.productId)}`;
        iframe.title = "Checkout";
        Object.assign(iframe.style, {
            width: "520px",
            maxWidth: "100vw",
            height: "600px",
            maxHeight: "100vh",
            border: "none",
            borderRadius: "12px",
            background: "white",
        });
        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
        document.body.style.overflow = "hidden";
        requestAnimationFrame(() => {
            overlay.setAttribute("data-visible", "true");
        });
        iframe.addEventListener("load", () => {
            iframe.focus();
        });
        let readyReceived = false;
        let isSubmittingPayment = false;
        const readyTimeoutId = window.setTimeout(() => {
            var _a;
            if (!readyReceived) {
                (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, { code: "LOAD_TIMEOUT", message: "Checkout failed to load." });
                cleanup();
            }
        }, READY_TIMEOUT_MS);
        function handleMessage(event) {
            var _a, _b, _c;
            if (event.origin !== checkoutOrigin)
                return;
            const data = event.data;
            if (!data || typeof data.type !== "string")
                return;
            switch (data.type) {
                case "READY":
                    readyReceived = true;
                    window.clearTimeout(readyTimeoutId);
                    break;
                case "SUCCESS":
                    (_a = options.onSuccess) === null || _a === void 0 ? void 0 : _a.call(options, { sessionId: data.sessionId });
                    break;
                case "ERROR":
                    (_b = options.onError) === null || _b === void 0 ? void 0 : _b.call(options, { code: data.code, message: data.message });
                    break;
                case "CLOSED":
                    (_c = options.onClose) === null || _c === void 0 ? void 0 : _c.call(options, { reason: data.reason });
                    cleanup();
                    break;
            }
        }
        function handleKeyDown(event) {
            var _a;
            if (event.key === "Escape" && !isSubmittingPayment) {
                (_a = options.onClose) === null || _a === void 0 ? void 0 : _a.call(options, { reason: "user_closed" });
                cleanup();
            }
        }
        window.addEventListener("message", handleMessage);
        window.addEventListener("keydown", handleKeyDown);
        function cleanup() {
            window.clearTimeout(readyTimeoutId);
            window.removeEventListener("message", handleMessage);
            window.removeEventListener("keydown", handleKeyDown);
            overlay.setAttribute("data-visible", "false");
            window.setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = "";
            }, TRANSITION_MS);
            isOpen = false;
            previouslyFocusedElement === null || previouslyFocusedElement === void 0 ? void 0 : previouslyFocusedElement.focus();
        }
    }
    window.DodoCheckout = { open };
})();
//# sourceMappingURL=index.js.map