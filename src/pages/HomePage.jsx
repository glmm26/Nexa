import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ProductCard } from "../components/catalog/ProductCard";
import { LoadingBlock } from "../components/ui/LoadingBlock";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { fetchCatalog } from "../services/catalogService";
import { formatCurrency } from "../utils/formatters";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80";

const HERO_HIGHLIGHTS = [
  {
    label: "Entrega",
    value: "Frete gratis acima de R$ 350",
  },
  {
    label: "Drop",
    value: "Novidades semanais em destaque",
  },
  {
    label: "Compra",
    value: "Checkout rapido e conta segura",
  },
];

const SERVICE_HIGHLIGHTS = [
  {
    title: "Entrega expressa",
    description: "Capitais com despacho agil e acompanhamento do pedido.",
  },
  {
    title: "Troca simplificada",
    description: "Processo rapido para ajustes e devolucoes dentro do prazo.",
  },
  {
    title: "Selecao premium",
    description: "Pecas para usar agora, com imagem forte e visual limpo.",
  },
];

export function HomePage() {
  const [catalog, setCatalog] = useState({ products: [], categories: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [busyProductId, setBusyProductId] = useState(null);
  const deferredSearch = useDeferredValue(searchTerm.trim().toLowerCase());

  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const featuredProducts = catalog.products.slice(0, 3);

  useDocumentTitle("NEXA | Nova colecao");

  useEffect(() => {
    fetchCatalog()
      .then((response) => {
        setCatalog(response);
      })
      .catch((error) => {
        showToast(error.message, "error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredProducts = catalog.products.filter((product) => {
    const matchesCategory =
      activeCategory === "all" || product.category.toLowerCase() === activeCategory;
    const matchesSearch =
      !deferredSearch ||
      `${product.name} ${product.description}`.toLowerCase().includes(deferredSearch);

    return matchesCategory && matchesSearch;
  });

  async function handleAddToCart(product) {
    if (!isAuthenticated) {
      showToast("Entre na sua conta para adicionar produtos ao carrinho.", "info");
      navigate("/login", {
        state: {
          from: location.pathname,
        },
      });
      return;
    }

    setBusyProductId(product.id);

    try {
      await addItem({
        productId: product.id,
        quantity: 1,
      });
      showToast("Produto adicionado ao carrinho.", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusyProductId(null);
    }
  }

  return (
    <div className="page-stack storefront-page">
      <section className="hero-panel">
        <div className="shell-content hero-layout">
          <div className="hero-copy">
            <span className="section-kicker">Nova colecao</span>
            <h1>Essenciais modernos</h1>
            <p>Pecas limpas, jeans marcantes e bases premium para entrar no guarda-roupa agora.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#colecao">
                Comprar agora
              </a>
              <a className="secondary-button" href="#destaques">
                Ver destaques
              </a>
            </div>
            <div className="hero-stat-grid">
              {HERO_HIGHLIGHTS.map((item) => (
                <div className="hero-stat-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-media">
            <img alt="Modelo vestindo a nova colecao" src={HERO_IMAGE_URL} />
            <div className="hero-floating-card">
              <span>Nova colecao</span>
              <strong>Silhueta urbana, visual limpo e foco total no produto.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="shell-content section-space" id="destaques">
        <SectionHeader
          eyebrow="Destaques"
          title="Pecas em alta nesta semana."
          description="Selecao enxuta para quem quer decidir rapido e comprar melhor."
        />

        {isLoading ? (
          <LoadingBlock label="Carregando destaques..." />
        ) : (
          <div className="feature-strip">
            {featuredProducts.map((product) => (
              <Link className="feature-card" key={product.id} to={`/produto/${product.id}`}>
                <div className="feature-card-media">
                  <img alt={product.name} loading="lazy" src={product.imageUrl} />
                </div>
                <div className="feature-card-body">
                  <span>{product.category}</span>
                  <strong>{product.name}</strong>
                  <small>{formatCurrency(product.price)}</small>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="shell-content section-space" id="colecao">
        <SectionHeader
          eyebrow="Loja"
          title="Pecas para entrar no carrinho."
          description="Busque por categoria, encontre rapido e compre com menos friccao."
        />

        <div className="catalog-toolbar">
          <div className="chip-row">
            {["all", ...catalog.categories].map((category) => (
              <button
                key={category}
                className={`filter-chip ${activeCategory === category ? "filter-chip-active" : ""}`}
                type="button"
                onClick={() =>
                  startTransition(() => {
                    setActiveCategory(category);
                  })
                }
              >
                {category === "all" ? "Tudo" : category}
              </button>
            ))}
          </div>

          <label className="search-field">
            <span>Buscar produto</span>
            <input
              placeholder="Camiseta, jaqueta, tenis..."
              type="search"
              value={searchTerm}
              onChange={(event) =>
                startTransition(() => {
                  setSearchTerm(event.target.value);
                })
              }
            />
          </label>
        </div>

        {isLoading ? (
          <LoadingBlock label="Carregando produtos..." />
        ) : (
          <>
            <div className="catalog-summary">
              <span>{filteredProducts.length} produtos encontrados</span>
            </div>

            {filteredProducts.length ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    isBusy={busyProductId === product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-panel">
                <h2>Nenhum produto encontrado.</h2>
                <p>Teste outra busca ou selecione uma categoria diferente.</p>
              </div>
            )}
          </>
        )}
      </section>

      <section className="shell-content section-space">
        <div className="service-strip">
          {SERVICE_HIGHLIGHTS.map((item) => (
            <article className="service-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
