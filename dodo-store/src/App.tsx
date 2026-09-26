import { useState } from "react"

type LogEntry = {
  timestamp: string;
  message: string;
};

declare global {
  interface Window {
    DodoCheckout: {
      open: (options: {
        productId: string;
        onSuccess?: (data: { sessionId: string }) => void;
        onClose?: (data: { reason: string }) => void;
        onError?: (data: { code: string; message: string }) => void;
      }) => void;
    };
  }
}

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  function addLog(message: string) {
    setLogs((prev) => [
      { timestamp: new Date().toLocaleTimeString(), message },
      ...prev,
    ]);
  }

  function handleBuy() {
    addLog("Open() called");
    window.DodoCheckout.open({
      productId: "prod_123",
      onSuccess: ({ sessionId }) => addLog(`onSuccess — sessionId: ${sessionId}`),
      onClose: ({ reason }) => addLog(`onClose — reason: ${reason}`),
      onError: ({ code, message }) => addLog(`onError — ${code}: ${message}`),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4 gap-10">
      <div className="text-center">
        <p className="text-sm text-gray-400 uppercase tracking-wide">Demo Store</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Dodo Pro Plan</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-sm flex flex-col gap-4">
        <div>
          <p className="text-gray-500 text-sm">Monthly subscription</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">$49.00</p>
        </div>
        <button
          onClick={handleBuy}
          className="rounded-lg bg-gray-900 text-white text-sm font-medium py-2.5 hover:bg-gray-800 transition-colors"
        >
          Buy now
        </button>
      </div>

      <div className="w-full max-w-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Callback log
        </p>
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {logs.length === 0 && (
            <p className="text-sm text-gray-400 px-4 py-3">Nothing yet — click Buy now.</p>
          )}
          {logs.map((log, i) => (
            <div key={i} className="px-4 py-2 text-sm font-mono text-gray-600">
              <span className="text-gray-400">{log.timestamp}</span> — {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
