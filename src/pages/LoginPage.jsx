import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    loginAsAdmin: false,
    adminCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useDocumentTitle("Entrar | NEXA");

  useEffect(() => {
    if (user) {
      navigate(user.adminAuthorized ? "/admin/estoque" : "/perfil", { replace: true });
    }
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await login(form);
      showToast(
        response.user.adminAuthorized ? "Acesso administrativo liberado." : "Bem-vindo de volta.",
        "success"
      );
      navigate(
        location.state?.from || (response.user.adminAuthorized ? "/admin/estoque" : "/perfil"),
        {
        replace: true,
        }
      );
    } catch (error) {
      if (error.requiresVerification) {
        showToast("Confirme o codigo enviado ao seu email antes de entrar.", "info");
        navigate(`/verificar?email=${encodeURIComponent(error.email || form.email)}`);
      } else {
        showToast(error.message, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="shell-content auth-shell">
      <section className="auth-panel">
        <SectionHeader
          eyebrow="Login"
          title="Entre para continuar sua compra."
          description="Acesse sua conta para salvar itens, acompanhar pedidos e editar seu perfil."
        />
        <div className="auth-copy-stack">
          <div className="mini-feature">
            <strong>Checkout rapido</strong>
            <span>Seu carrinho fica pronto para finalizar assim que voce entrar.</span>
          </div>
          <div className="mini-feature">
            <strong>Conta protegida</strong>
            <span>Login liberado somente depois da verificacao por email.</span>
          </div>
          <div className="mini-feature">
            <strong>Acesso admin por codigo</strong>
            <span>Administradores usam um codigo secreto adicional no login.</span>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <form className="form-panel" onSubmit={handleSubmit}>
          <label className="field-shell">
            <span>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label className="field-shell">
            <span>Senha</span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </label>

          <label className="toggle-shell" htmlFor="login-admin-toggle">
            <input
              id="login-admin-toggle"
              type="checkbox"
              checked={form.loginAsAdmin}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  loginAsAdmin: event.target.checked,
                  adminCode: event.target.checked ? current.adminCode : "",
                }))
              }
            />
            <span>Entrar como administrador</span>
          </label>

          {form.loginAsAdmin ? (
            <label className="field-shell">
              <span>Codigo de administrador</span>
              <input
                required
                type="password"
                value={form.adminCode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, adminCode: event.target.value }))
                }
              />
            </label>
          ) : null}

          <button className="primary-button block-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-footnote">
          Ainda nao tem conta? <Link to="/cadastro">Criar agora</Link>
        </p>
      </section>
    </div>
  );
}
