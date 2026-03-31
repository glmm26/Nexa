import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { resendOtp, verifyOtp } from "../services/authService";

export function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    otp: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useDocumentTitle("Verificacao OTP | NEXA");

  useEffect(() => {
    if (user) {
      navigate("/perfil", { replace: true });
    }
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await verifyOtp(form);
      showToast("Conta confirmada. Agora voce ja pode entrar.", "success");
      navigate("/login");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setIsResending(true);

    try {
      await resendOtp({
        email: form.email,
      });
      showToast("Novo codigo enviado com sucesso.", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="shell-content auth-shell">
      <section className="auth-panel">
        <SectionHeader
          eyebrow="Verificacao"
          title="Confirme seu email para liberar a conta."
          description="Digite o codigo de 6 digitos enviado para o seu email."
        />
        <div className="auth-copy-stack">
          <div className="mini-feature">
            <strong>Codigo temporario</strong>
            <span>Expiracao curta para manter o acesso protegido.</span>
          </div>
          <div className="mini-feature">
            <strong>Reenvio rapido</strong>
            <span>Solicite um novo codigo sempre que precisar.</span>
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
            <span>Codigo OTP</span>
            <input
              required
              inputMode="numeric"
              maxLength={6}
              type="text"
              value={form.otp}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  otp: event.target.value.replace(/\D/g, "").slice(0, 6),
                }))
              }
            />
          </label>

          <button className="primary-button block-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Validando..." : "Confirmar codigo"}
          </button>
        </form>

        <div className="auth-footnote auth-footnote-spread">
          <span>Precisa de um novo codigo?</span>
          <button
            className="ghost-inline-button"
            disabled={isResending}
            type="button"
            onClick={handleResend}
          >
            {isResending ? "Enviando..." : "Reenviar OTP"}
          </button>
        </div>

        <p className="auth-footnote">
          Ja confirmou o acesso? <Link to="/login">Ir para login</Link>
        </p>
      </section>
    </div>
  );
}
