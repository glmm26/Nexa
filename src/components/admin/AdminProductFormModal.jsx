import { AdminModalShell } from "./AdminModalShell";
import { buildVariantKey, getTotalVariantStock } from "./adminProductUtils";

export function AdminProductFormModal({
  editingProductId,
  form,
  sizeDraft,
  colorDraft,
  isSaving,
  onClose,
  onSubmit,
  onChangeField,
  onChangeVariantStock,
  onChangeSizeDraft,
  onChangeColorDraft,
  onAddSize,
  onAddColor,
  onRemoveSize,
  onRemoveColor,
}) {
  const totalStock = getTotalVariantStock(
    form.availableSizes,
    form.availableColors,
    form.variantStockMap
  );

  return (
    <AdminModalShell
      description="Cadastre o produto, defina o status e monte a grade completa de tamanhos, cores e estoque."
      onClose={onClose}
      title={editingProductId ? "Editar produto" : "Novo produto"}
      width="wide"
      actions={
        <>
          <button className="secondary-button compact-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button compact-button" disabled={isSaving} form="admin-product-form" type="submit">
            {isSaving ? "Salvando..." : editingProductId ? "Salvar produto" : "Criar produto"}
          </button>
        </>
      }
    >
      <form className="admin-editor-layout" id="admin-product-form" onSubmit={onSubmit}>
        <div className="admin-editor-main">
          <label className="field-shell">
            <span>Nome</span>
            <input
              required
              type="text"
              value={form.name}
              onChange={(event) => onChangeField("name", event.target.value)}
            />
          </label>

          <label className="field-shell">
            <span>Descricao</span>
            <textarea
              required
              rows="5"
              value={form.description}
              onChange={(event) => onChangeField("description", event.target.value)}
            />
          </label>

          <div className="field-grid">
            <label className="field-shell">
              <span>Categoria</span>
              <input
                required
                type="text"
                value={form.category}
                onChange={(event) => onChangeField("category", event.target.value)}
              />
            </label>

            <label className="field-shell">
              <span>Preco</span>
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                value={form.price}
                onChange={(event) => onChangeField("price", event.target.value)}
              />
            </label>
          </div>

          <div className="field-grid">
            <label className="field-shell">
              <span>Status</span>
              <select value={form.status} onChange={(event) => onChangeField("status", event.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </label>

            <label className="field-shell">
              <span>Imagem URL</span>
              <input
                required
                type="url"
                value={form.imageUrl}
                onChange={(event) => onChangeField("imageUrl", event.target.value)}
              />
            </label>
          </div>

          <div className="admin-editor-block">
            <div className="admin-variant-builder">
              <div className="admin-variant-block">
                <div className="admin-variant-head">
                  <div>
                    <span className="summary-label">Tamanhos</span>
                    <h3>Grade do produto</h3>
                  </div>
                </div>

                <div className="admin-inline-form">
                  <input
                    placeholder="P, M, G, 38..."
                    type="text"
                    value={sizeDraft}
                    onChange={(event) => onChangeSizeDraft(event.target.value)}
                  />
                  <button className="secondary-button compact-button" type="button" onClick={onAddSize}>
                    Adicionar
                  </button>
                </div>

                <div className="variation-pill-list">
                  {form.availableSizes.map((size) => (
                    <button
                      className="variation-pill variation-pill-removable"
                      key={size}
                      type="button"
                      onClick={() => onRemoveSize(size)}
                    >
                      {size} x
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-variant-block">
                <div className="admin-variant-head">
                  <div>
                    <span className="summary-label">Cores</span>
                    <h3>Paleta disponivel</h3>
                  </div>
                </div>

                <div className="admin-inline-form">
                  <input
                    placeholder="preto, branco, azul..."
                    type="text"
                    value={colorDraft}
                    onChange={(event) => onChangeColorDraft(event.target.value)}
                  />
                  <button className="secondary-button compact-button" type="button" onClick={onAddColor}>
                    Adicionar
                  </button>
                </div>

                <div className="variation-pill-list">
                  {form.availableColors.map((color) => (
                    <button
                      className="variation-pill variation-pill-removable"
                      key={color}
                      type="button"
                      onClick={() => onRemoveColor(color)}
                    >
                      {color} x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-editor-block">
            <div className="admin-table-head">
              <div>
                <span className="summary-label">Estoque por variacao</span>
                <h3>Matriz de tamanho x cor</h3>
              </div>
              <strong>{totalStock} unidades no total</strong>
            </div>

            {form.availableSizes.length && form.availableColors.length ? (
              <div className="admin-variant-matrix-scroll">
                <table className="admin-variant-matrix">
                  <thead>
                    <tr>
                      <th scope="col">Tamanho</th>
                      {form.availableColors.map((color) => (
                        <th key={`header-${color}`} scope="col">
                          {color}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.availableSizes.map((size) => (
                      <tr key={size}>
                        <th scope="row">{size}</th>
                        {form.availableColors.map((color) => (
                          <td key={buildVariantKey(size, color)}>
                            <label className="admin-variant-cell" htmlFor={buildVariantKey(size, color)}>
                              <span>{size} / {color}</span>
                              <input
                                id={buildVariantKey(size, color)}
                                min="0"
                                type="number"
                                value={form.variantStockMap[buildVariantKey(size, color)] || "0"}
                                onChange={(event) =>
                                  onChangeVariantStock(size, color, event.target.value)
                                }
                              />
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="selection-helper">
                Adicione pelo menos um tamanho e uma cor para montar a grade do estoque.
              </p>
            )}
          </div>
        </div>

        <aside className="admin-editor-preview">
          <span className="summary-label">Preview</span>
          <div className="admin-editor-preview-card">
            {form.imageUrl ? (
              <img alt={form.name || "Preview do produto"} src={form.imageUrl} />
            ) : (
              <div className="admin-editor-preview-placeholder">Imagem do produto</div>
            )}
            <div className="admin-editor-preview-copy">
              <h3>{form.name || "Nome do produto"}</h3>
              <p>{form.description || "A descricao aparecera aqui durante a edicao."}</p>
              <div className="variation-pill-list">
                <span className="variation-pill">{form.category || "categoria"}</span>
                <span className="variation-pill">{form.status}</span>
                <span className="variation-pill">{totalStock} un.</span>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </AdminModalShell>
  );
}
