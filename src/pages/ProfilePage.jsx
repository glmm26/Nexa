import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { fetchProfile, updatePassword, updateProfile } from "../services/profileService";

export function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const { setUser } = useAuth();
  const { showToast } = useToast();

  useDocumentTitle("Minha conta | NEXA");

  useEffect(() => {
    fetchProfile()
      .then((response) => {
        setProfile(response.user);
        setProfileForm({ name: response.user.name });
      })
      .catch((error) => {
        showToast(error.message, "error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setIsSavingProfile(true);

    try {
      const response = await updateProfile(profileForm);
      setProfile(response.user);
      setUser((current) => ({
        ...(current || {}),
        ...response.user,
      }));
      showToast(response.message, "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setIsSavingPassword(true);

    try {
      const response = await updatePassword(passwordForm);
      showToast(response.message, "success");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="shell-content section-space">
        <div className="loading-block">
          <span className="loading-ring" />
          <p>Carregando sua conta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shell-content section-space">
      <div className="profile-hero">
        <div>
          <span className="section-kicker">Minha conta</span>
          <h1>{profile.name}</h1>
          <p>{profile.email}</p>
        </div>
        <div className="profile-status">
          <span className={`status-chip ${profile.verified ? "status-chip-success" : "status-chip-warning"}`}>
            {profile.verified ? "Conta verificada" : "Verificacao pendente"}
          </span>
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <h2>Resumo da conta</h2>
          <StatusMessage tone="info" title="Conta ativa">
            Seu acesso esta pronto para salvar carrinho, editar dados e concluir pedidos.
          </StatusMessage>
          <div className="profile-summary">
            <div>
              <span className="summary-label">Nome</span>
              <strong>{profile.name}</strong>
            </div>
            <div>
              <span className="summary-label">Email</span>
              <strong>{profile.email}</strong>
            </div>
            <div>
              <span className="summary-label">Status</span>
              <strong>{profile.verified ? "Verificada" : "Pendente"}</strong>
            </div>
            <div>
              <span className="summary-label">Perfil</span>
              <strong>{profile.role === "admin" ? "Administrador" : "Cliente"}</strong>
            </div>
          </div>
          <div className="profile-actions-row">
            <Link className="secondary-button compact-button" to="/meus-pedidos">
              Ver meus pedidos
            </Link>
            {profile.adminAuthorized ? (
              <Link className="secondary-button compact-button" to="/admin/estoque">
                Abrir admin
              </Link>
            ) : null}
          </div>
        </section>

        <section className="profile-card">
          <h2>Dados pessoais</h2>
          <form className="form-panel" onSubmit={handleProfileSubmit}>
            <label className="field-shell">
              <span>Nome exibido</span>
              <input
                required
                type="text"
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <button className="primary-button block-button" disabled={isSavingProfile} type="submit">
              {isSavingProfile ? "Salvando..." : "Salvar alteracoes"}
            </button>
          </form>
        </section>

        <section className="profile-card profile-card-wide">
          <h2>Alterar senha</h2>
          <form className="form-panel" onSubmit={handlePasswordSubmit}>
            <div className="field-grid">
              <label className="field-shell">
                <span>Senha atual</span>
                <input
                  required
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field-shell">
                <span>Nova senha</span>
                <input
                  required
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                  }
                />
              </label>
            </div>

            <label className="field-shell">
              <span>Confirmar nova senha</span>
              <input
                required
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </label>

            <button className="primary-button block-button" disabled={isSavingPassword} type="submit">
              {isSavingPassword ? "Atualizando..." : "Atualizar senha"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
