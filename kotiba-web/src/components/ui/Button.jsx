// Qayta ishlatiladigan tugma komponenti
export function Button({
  children,
  onClick,
  variant = 'primary',  // primary | outline | danger | ghost
  loading = false,
  disabled = false,
  type = 'button',
  style = {},
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`}
      style={style}
    >
      {loading ? <span className="spinner" /> : children}
    </button>
  )
}
