export function AdminProductsSummary({ metrics }) {
  const cards = [
    {
      label: "Total de produtos",
      value: metrics.total,
      tone: "neutral",
      hint: "Catalogo monitorado pelo painel",
    },
    {
      label: "Produtos ativos",
      value: metrics.ativos,
      tone: "success",
      hint: "Disponiveis para operacao",
    },
    {
      label: "Estoque baixo",
      value: metrics.baixoEstoque,
      tone: "warning",
      hint: "Abaixo do limite recomendado",
    },
    {
      label: "Sem estoque",
      value: metrics.semEstoque,
      tone: "danger",
      hint: "Itens que exigem reposicao",
    },
  ];

  return (
    <section className="admin-kpi-grid">
      {cards.map((card) => (
        <article className={`admin-kpi-card admin-kpi-card-${card.tone}`} key={card.label}>
          <span className="summary-label">{card.label}</span>
          <strong>{card.value}</strong>
          <p>{card.hint}</p>
        </article>
      ))}
    </section>
  );
}
