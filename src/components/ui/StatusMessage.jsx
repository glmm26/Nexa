export function StatusMessage({ tone = "info", title, children }) {
  return (
    <div className={`status-message status-${tone}`}>
      {title ? <strong>{title}</strong> : null}
      {children ? <span>{children}</span> : null}
    </div>
  );
}
