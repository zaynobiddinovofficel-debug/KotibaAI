export default function ExpenseSummary({ summary }) {
  const { daily, weekly, monthly, monthlyIncome, monthlyLimit } = summary || {}

  const formatMoney = (n) => {
    if (!n) return '0'
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)} mln`
    if (n >= 1000) return `${(n / 1000).toFixed(0)} ming`
    return n.toString()
  }

  const formatMoneyFull = (n) =>
    n ? n.toLocaleString('uz-UZ') + " so'm" : "0 so'm"

  const limitPercent = monthlyLimit
    ? Math.min(100, ((monthly?.total || 0) / monthlyLimit) * 100)
    : 0
  const incomePercent = monthlyIncome
    ? Math.min(100, ((monthly?.total || 0) / monthlyIncome) * 100)
    : 0

  return (
    <div className="flex flex-col gap-3">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Bugun', value: daily?.total || 0, icon: '📆' },
          { label: 'Bu hafta', value: weekly?.total || 0, icon: '📅' },
          { label: 'Bu oy', value: monthly?.total || 0, icon: '🗓' }
        ].map(stat => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 text-center"
          >
            <p className="text-[11px] text-gray-400 mb-1">{stat.label}</p>
            <p className="text-sm font-bold text-gray-800 dark:text-white">{formatMoney(stat.value)}</p>
            <p className="text-[10px] text-gray-400">so'm</p>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      {(monthlyLimit > 0 || monthlyIncome > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          {monthlyIncome > 0 && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">Oylik daromad</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatMoneyFull(monthlyIncome)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${incomePercent}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Sarflangan: {incomePercent.toFixed(0)}% ({formatMoneyFull(monthly?.total || 0)})
              </p>
            </div>
          )}

          {monthlyLimit > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">Oylik limit</span>
                <span className={`text-xs font-medium ${limitPercent > 90 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {formatMoneyFull(monthlyLimit)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    limitPercent > 90
                      ? 'bg-red-500'
                      : limitPercent > 70
                      ? 'bg-amber-500'
                      : 'bg-[#6C63FF]'
                  }`}
                  style={{ width: `${limitPercent}%` }}
                />
              </div>
              <p className={`text-[10px] mt-1 ${limitPercent > 90 ? 'text-red-500' : 'text-gray-400'}`}>
                Ishlatilgan: {limitPercent.toFixed(0)}%
                {limitPercent > 90 && ' — Limitga yaqin!'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
