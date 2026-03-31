// Label + input komponenti
export function Input({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  error = '',
  required = false,
  style = {},
  ...rest
}) {
  return (
    <div className="input-group" style={style}>
      {label && (
        <label className="input-label">
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${error ? 'input-error' : ''}`}
        {...rest}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  )
}
