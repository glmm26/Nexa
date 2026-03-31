import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { register as registerAccount } from "../services/authService";

export function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useDocumentTitle("Criar conta | NEXA");

  useEffect(() => {
    if (user) {
      navigate("/perfil", { replace: true });
    }
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      showToast("As senhas informadas nao coincidem.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerAccount({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      showToast("Conta criada. Digite o codigo enviado para o seu email.", "success");
      navigate(`/verificar?email=${encodeURIComponent(response.email)}`);
    } catch (error) {
      if (error.requiresVerification) {
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
          eyebrow="Cadastro"
          title="Crie sua conta e compre com rapidez."
          description="Receba um codigo por email, confirme o acesso e finalize seus pedidos."
        />
        <div className="auth-copy-stack">
          <div className="mini-feature">
            <strong>Ativacao rapida</strong>
            <span>Codigo de 6 digitos para liberar sua conta em poucos minutos.</span>
          </div>
          <div className="mini-feature">
            <strong>Minha conta</strong>
            <span>Edite nome, senha e acompanhe o status do seu acesso.</span>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <form className="form-panel" onSubmit={handleSubmit}>
          <label className="field-shell">
            <span>Nome</span>
            <input
              required
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
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
          <label className="field-shell">
            <span>Confirmar senha</span>
            <input
              required
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((current) => ({ ...current, confirmPassword: event.target.value }))
              }
            />
          </label>

          <button className="primary-button block-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="auth-footnote">
          Ja possui conta? <Link to="/login">Entrar agora</Link>
        </p>
      </section>
    </div>
  );
}
