export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function normalizeDateInput(value) {
  if (value instanceof Date) {
    return value;
  }

  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return null;
  }

  const directDate = new Date(normalizedValue);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalizedValue)) {
    const sqliteDate = new Date(normalizedValue.replace(" ", "T") + "Z");

    if (!Number.isNaN(sqliteDate.getTime())) {
      return sqliteDate;
    }
  }

  return null;
}

export function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = normalizeDateInput(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatOrderStatus(status) {
  const map = {
    pendente: "Pendente",
    confirmado: "Confirmado",
    enviado: "Enviado",
    entregue: "Entregue",
    cancelado: "Cancelado",
  };

  return map[status] || status;
}
