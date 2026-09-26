import { useEffect, useState } from "react"
import type { AppState, Product } from "./types"
import { fetchProduct } from "./data/products"
import { simulatePayment } from "./lib/fakePayment"
import { sendToParent } from "./lib/postMessage"
import { LoadingScreen } from "./components/LoadingScreen"
import { FatalErrorScreen } from "./components/FatalErrorScreen"
import { CheckoutForm } from "./components/CheckoutForm"
import { SuccessScreen } from "./components/SuccessScreen"

function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [product, setProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    sendToParent({ type: "READY" });

    const productId = new URLSearchParams(window.location.search).get("productId");
    if (!productId) {
      sendToParent({ type: "ERROR", code: "MISSING_PRODUCT_ID", message: "No product specified." });
      setAppState("fatal_error");
      return;
    }

    fetchProduct(productId).then((result) => {
      if (!result) {
        sendToParent({ type: "ERROR", code: "PRODUCT_NOT_FOUND", message: "This product does not exist." });
        setAppState("fatal_error");
        return;
      }
      setProduct(result);
      setAppState("form");
    });
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) handleClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting]);

  function handleClose() {
    sendToParent({ type: "CLOSED", reason: "user_closed" })
  }

  async function handlePay(cardNumber: string) {
    setIsSubmitting(true);
    setPaymentError(null);

    const result = await simulatePayment(cardNumber);

    if(result.outcome === "success") {
      const sessionId = crypto.randomUUID();
      sendToParent({ type: "SUCCESS", sessionId })
      setAppState("success");
      setTimeout(() => sendToParent({ type: "CLOSED", reason: "success" }), 1800);
      return;
    }

    setIsSubmitting(false);
    setPaymentError(result.message);
  }

  if(appState === "loading") return <LoadingScreen />
  if(appState === "fatal_error") return <FatalErrorScreen message="Something went wrong." onClose={handleClose} />
  if(appState === "success" && product) return <SuccessScreen product={product} />

  if(appState === "form" && product) {
    return (
      <CheckoutForm 
        product={product}
        isSubmitting={isSubmitting}
        paymentError={paymentError}
        onSubmit={(cardNumber) => handlePay(cardNumber)}
        onClose={handleClose}
      />
    );
  }

  return null;
}

export default App
