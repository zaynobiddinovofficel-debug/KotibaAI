import { useEffect } from 'react'
import { X } from 'lucide-react'

// Modal: fixed header + scrollable body + fixed footer
export function Modal({ open, onClose, title, children, footer }) {
  // ESC tugmasi bilan yopish
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>

        {/* Fixed header */}
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="modal-body">
          {children}
        </div>

        {/* Fixed footer (tugmalar) */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
