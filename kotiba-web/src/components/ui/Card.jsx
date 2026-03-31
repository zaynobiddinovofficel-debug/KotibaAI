// Karta wrapper komponenti
export function Card({ children, style = {}, className = '' }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  )
}
