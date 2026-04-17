export default function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="w-full animate-pulse px-4 py-2">
      <div className="flex border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded mx-2"></div>
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex py-4 border-b border-slate-50 dark:border-slate-800/50">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="flex-1 h-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg mx-2"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
