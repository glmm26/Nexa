export function LoadingBlock({ label = "Carregando..." }) {
  return (
    <div className="loading-block">
      <span className="loading-ring" />
      <p>{label}</p>
    </div>
  );
}
