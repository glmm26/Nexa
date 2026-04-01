export function AdminProductFilters({
  categories,
  filters,
  onFilterChange,
  totalResults,
  totalProducts,
  onCreateProduct,
}) {
  return (
    <section className="admin-filter-panel">
      <div className="admin-filter-head">
        <div>
          <span className="summary-label">Central de operacao</span>
          <h2>Produtos e estoque em um fluxo mais rapido</h2>
          <p>
            Filtre, ordene, abra detalhes, edite produtos e ajuste variacoes sem sair da mesma
            tela.
          </p>
        </div>

        <button className="primary-button" type="button" onClick={onCreateProduct}>
          Novo produto
        </button>
      </div>

      <div className="admin-filter-grid">
        <label className="field-shell">
          <span>Buscar por nome</span>
          <input
            placeholder="Ex.: Aurora, Hoodie, Cargo..."
            type="search"
            value={filters.search}
            onChange={(event) => onFilterChange("search", event.target.value)}
          />
        </label>

        <label className="field-shell">
          <span>Categoria</span>
          <select value={filters.category} onChange={(event) => onFilterChange("category", event.target.value)}>
            <option value="all">Todas</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="field-shell">
          <span>Status</span>
          <select value={filters.status} onChange={(event) => onFilterChange("status", event.target.value)}>
            <option value="all">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </label>

        <label className="field-shell">
          <span>Estoque</span>
          <select
            value={filters.inventory}
            onChange={(event) => onFilterChange("inventory", event.target.value)}
          >
            <option value="all">Qualquer faixa</option>
            <option value="healthy">Saudavel</option>
            <option value="low">Estoque baixo</option>
            <option value="out">Sem estoque</option>
            <option value="in-stock">Com estoque</option>
          </select>
        </label>

        <label className="field-shell">
          <span>Ordenar por</span>
          <select value={filters.sortBy} onChange={(event) => onFilterChange("sortBy", event.target.value)}>
            <option value="recent">Mais recentes</option>
            <option value="name">Nome</option>
            <option value="price">Preco</option>
            <option value="stock">Quantidade</option>
            <option value="category">Categoria</option>
          </select>
        </label>
      </div>

      <div className="admin-filter-footer">
        <span>
          Exibindo <strong>{totalResults}</strong> de <strong>{totalProducts}</strong> produtos.
        </span>
        <button
          className="secondary-button compact-button"
          type="button"
          onClick={() => {
            onFilterChange("search", "");
            onFilterChange("category", "all");
            onFilterChange("status", "all");
            onFilterChange("inventory", "all");
            onFilterChange("sortBy", "recent");
          }}
        >
          Limpar filtros
        </button>
      </div>
    </section>
  );
}
