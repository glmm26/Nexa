import { useEffect, useMemo, useState } from "react";
import { AdminModalShell } from "./AdminModalShell";
import { getVariantOptions } from "./adminProductUtils";

export function AdminStockAdjustModal({ isSaving, product, onClose, onSubmit }) {
  const options = useMemo(() => getVariantOptions(product), [product]);
  const [selectedVariantKey, setSelectedVariantKey] = useState(options[0]?.key || "");
  const [movementType, setMovementType] = useState("entry");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  useEffect(() => {
    setSelectedVariantKey(options[0]?.key || "");
    setMovementType("entry");
    setQuantity("1");
    setReason("");
  }, [product?.id]);

  const selectedVariant = options.find((option) => option.key === selectedVariantKey) || options[0];
  const parsedQuantity = Number.parseInt(quantity, 10) || 0;
  const projectedStock = selectedVariant
    ? movementType === "entry"
      ? selectedVariant.stock + parsedQuantity
      : selectedVariant.stock - parsedQuantity
    : 0;

  function handleSubmit() {
    if (!selectedVariant) {
      return;
    }

    onSubmit({
      color: selectedVariant.color,
      quantity: parsedQuantity,
      reason,
      size: selectedVariant.size,
      type: movementType,
    });
  }

  return (
    <AdminModalShell
      description={`Ajuste o estoque do produto ${product.name} sem sair da listagem.`}
      onClose={onClose}
      title="Ajuste rapido de estoque"
      actions={
        <>
          <button className="secondary-button compact-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="primary-button compact-button"
            disabled={!selectedVariant || parsedQuantity <= 0 || projectedStock < 0 || isSaving}
            type="button"
            onClick={handleSubmit}
          >
            {isSaving ? "Salvando..." : "Aplicar ajuste"}
          </button>
        </>
      }
    >
      <div className="admin-stock-adjust-grid">
        <label className="field-shell">
          <span>Variacao</span>
          <select
            value={selectedVariantKey}
            onChange={(event) => setSelectedVariantKey(event.target.value)}
          >
            {options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label} ({option.stock} em estoque)
              </option>
            ))}
          </select>
        </label>

        <label className="field-shell">
          <span>Tipo</span>
          <select value={movementType} onChange={(event) => setMovementType(event.target.value)}>
            <option value="entry">Entrada</option>
            <option value="exit">Saida</option>
          </select>
        </label>

        <label className="field-shell">
          <span>Quantidade</span>
          <input
            min="1"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>

        <label className="field-shell">
          <span>Motivo</span>
          <input
            placeholder="Reposicao, ajuste fisico, avaria..."
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
      </div>

      {selectedVariant ? (
        <div className="admin-stock-adjust-preview">
          <div>
            <span className="summary-label">Estoque atual</span>
            <strong>{selectedVariant.stock}</strong>
          </div>
          <div>
            <span className="summary-label">Ajuste</span>
            <strong>{movementType === "entry" ? "+" : "-"}{parsedQuantity || 0}</strong>
          </div>
          <div>
            <span className="summary-label">Saldo projetado</span>
            <strong>{projectedStock}</strong>
          </div>
        </div>
      ) : null}
    </AdminModalShell>
  );
}
