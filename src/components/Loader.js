'use client'

export default function Loader({ size = 'md', text = null }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-green-500 ${sizeClasses[size]}`}></div>
      {text && (
        <p className="text-gray-400 text-sm mt-3">{text}</p>
      )}
    </div>
  )
}
