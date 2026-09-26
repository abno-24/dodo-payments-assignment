(function () {
  const CHECKOUT_URL = "https://dodo-checkout-app-iota.vercel.app/";

  type CheckoutMessage =
    | { type: "READY" }
    | { type: "SUCCESS"; sessionId: string }
    | { type: "ERROR"; code: string; message: string }
    | { type: "CLOSED"; reason: "user_closed" | "success" };

  type OpenOptions = {
    productId: string;
    onSuccess?: (data: { sessionId: string }) => void;
    onClose?: (data: { reason: string }) => void;
    onError?: (data: { code: string; message: string }) => void;
  };

  const READY_TIMEOUT_MS = 8000;
  const TRANSITION_MS = 200;
  let isOpen = false;

  function ensureStylesInjected() {
    if (document.getElementById("dodo-checkout-styles")) return;

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

  function open(options: OpenOptions) {
    if (isOpen) {
      console.warn("[DodoCheckout] A checkout is already open.");
      return;
    }
    if (!options.productId) {
      options.onError?.({ code: "MISSING_PRODUCT_ID", message: "productId is required." });
      return;
    }

    isOpen = true;
    ensureStylesInjected();

    const checkoutOrigin = new URL(CHECKOUT_URL).origin;
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

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
      if (!readyReceived) {
        options.onError?.({ code: "LOAD_TIMEOUT", message: "Checkout failed to load." });
        cleanup();
      }
    }, READY_TIMEOUT_MS);

    function handleMessage(event: MessageEvent) {
      if (event.origin !== checkoutOrigin) return;

      const data = event.data as CheckoutMessage;
      if (!data || typeof data.type !== "string") return;

      switch (data.type) {
        case "READY":
          readyReceived = true;
          window.clearTimeout(readyTimeoutId);
          break;
        case "SUCCESS":
          options.onSuccess?.({ sessionId: data.sessionId });
          break;
        case "ERROR":
          options.onError?.({ code: data.code, message: data.message });
          break;
        case "CLOSED":
          options.onClose?.({ reason: data.reason });
          cleanup();
          break;
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmittingPayment) {
        options.onClose?.({ reason: "user_closed" });
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
      previouslyFocusedElement?.focus();
    }
  }

  (window as any).DodoCheckout = { open };
})();