'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorMessage({ 
  message, 
  onRetry = null,
  retryText = 'Reintentar'
}) {
  return (
    <div className="max-w-md mx-auto p-6 bg-red-900/20 border border-red-800 rounded-lg text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h3 className="text-red-300 font-semibold mb-2">Oops! Algo salió mal</h3>
      <p className="text-red-300 text-sm mb-4">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          {retryText}
        </button>
      )}
    </div>
  )
}
