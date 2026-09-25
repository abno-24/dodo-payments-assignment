import type { CheckoutMessage } from "../types";

export function sendToParent(message: CheckoutMessage) {
  window.parent.postMessage(message, "*");
}