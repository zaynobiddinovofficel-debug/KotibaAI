export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-[#6C63FF] border-t-transparent rounded-full animate-spin`}
      />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7FF] dark:bg-[#0F0F1A]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#6C63FF] flex items-center justify-center shadow-lg">
          <span className="text-white text-2xl font-bold">K</span>
        </div>
        <div className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Yuklanmoqda...</p>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="skeleton w-6 h-6 rounded-full flex-shrink-0 mt-0.5" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-4 rounded-lg w-3/4" />
          <div className="skeleton h-3 rounded-lg w-1/2" />
          <div className="flex gap-2 mt-1">
            <div className="skeleton h-5 rounded-lg w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
