export function AdminModalShell({
  title,
  description,
  onClose,
  children,
  width = "normal",
  actions = null,
}) {
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <div
        aria-describedby={description ? "admin-modal-description" : undefined}
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className={`admin-modal admin-modal-${width}`}
        role="dialog"
      >
        <div className="admin-modal-head">
          <div>
            <h2 id="admin-modal-title">{title}</h2>
            {description ? <p id="admin-modal-description">{description}</p> : null}
          </div>
          <button
            aria-label="Fechar painel"
            className="admin-icon-button"
            type="button"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>

        <div className="admin-modal-body">{children}</div>

        {actions ? <div className="admin-modal-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
