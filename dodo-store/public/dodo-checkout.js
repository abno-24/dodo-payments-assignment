"use strict";
(function () {
    const CHECKOUT_URL = "http://localhost:5173";
    const READY_TIMEOUT_MS = 8000;
    let isOpen = false;
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
        const checkoutOrigin = new URL(CHECKOUT_URL).origin;
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
        let readyReceived = false;
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
        window.addEventListener("message", handleMessage);
        function cleanup() {
            window.clearTimeout(readyTimeoutId);
            window.removeEventListener("message", handleMessage);
            overlay.remove();
            document.body.style.overflow = "";
            isOpen = false;
        }
    }
    window.DodoCheckout = { open };
})();
//# sourceMappingURL=index.js.map