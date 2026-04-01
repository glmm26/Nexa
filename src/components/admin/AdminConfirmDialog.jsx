import { AdminModalShell } from "./AdminModalShell";

export function AdminConfirmDialog({
  productName,
  isBusy,
  onCancel,
  onConfirm,
}) {
  return (
    <AdminModalShell
      title="Excluir produto"
      description={`Voce esta prestes a remover ${productName}. Essa acao nao pode ser desfeita.`}
      onClose={onCancel}
      actions={
        <>
          <button className="secondary-button compact-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="secondary-button compact-button danger-button"
            disabled={isBusy}
            type="button"
            onClick={onConfirm}
          >
            {isBusy ? "Excluindo..." : "Confirmar exclusao"}
          </button>
        </>
      }
    >
      <div className="admin-confirm-copy">
        <p>
          O produto sera removido do painel. Se ele ja fizer parte de pedidos, o backend continuara
          protegendo a exclusao e avisara no retorno.
        </p>
      </div>
    </AdminModalShell>
  );
}
