type Props = {
  message: string;
  onClose: () => void;
}

export function FatalErrorScreen({ message, onClose }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center gap-4">
      <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 text-xl">
        !
      </div>
      <p className="text-gray-700 max-w-xs">{message}</p>
      <button
        onClick={onClose}
        className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
      >
        Close
      </button>
    </div>
  )
}