export default function ClinicCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="h-4 bg-white/10 rounded w-3/4"></div>
        <div className="h-5 w-16 bg-white/10 rounded-full"></div>
      </div>
      <div className="h-3 bg-white/10 rounded w-1/2 mb-1"></div>
      <div className="h-3 bg-white/10 rounded w-1/3 mb-3"></div>
      <div className="h-9 bg-white/10 rounded-xl w-full"></div>
    </div>
  )
}
