export function AdminPagination({ currentPage, totalPages, onChangePage }) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="admin-pagination">
      <button
        className="secondary-button compact-button"
        disabled={currentPage === 1}
        type="button"
        onClick={() => onChangePage(currentPage - 1)}
      >
        Anterior
      </button>

      <div className="admin-pagination-pages">
        {pages.map((page) => (
          <button
            className={`admin-page-button ${page === currentPage ? "admin-page-button-active" : ""}`}
            key={page}
            type="button"
            onClick={() => onChangePage(page)}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        className="secondary-button compact-button"
        disabled={currentPage === totalPages}
        type="button"
        onClick={() => onChangePage(currentPage + 1)}
      >
        Proxima
      </button>
    </div>
  );
}
