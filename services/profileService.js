const bcrypt = require("bcrypt");
const {
  findUserById,
  updateUserName,
  updateUserPassword,
} = require("../database/database");
const { createHttpError } = require("../utils/httpError");
const { serializeUser } = require("../utils/serializers");

const SALT_ROUNDS = 12;

function validateProfileName(name) {
  const normalizedName = String(name || "").trim();

  if (!normalizedName) {
    throw createHttpError(400, "Informe o nome que deseja salvar.");
  }

  if (normalizedName.length < 2) {
    throw createHttpError(400, "O nome precisa ter pelo menos 2 caracteres.");
  }

  return normalizedName;
}

function validatePassword(nextPassword) {
  const normalizedPassword = String(nextPassword || "");

  if (normalizedPassword.length < 8) {
    throw createHttpError(400, "A nova senha precisa ter pelo menos 8 caracteres.");
  }

  return normalizedPassword;
}

function withAdminAuthorization(user, adminAuthorized) {
  return {
    ...serializeUser(user),
    adminAuthorized: Boolean(adminAuthorized && user.role === "admin"),
  };
}

async function getProfile(userId, adminAuthorized = false) {
  const user = await findUserById(userId);

  if (!user) {
    throw createHttpError(404, "Usuario nao encontrado.");
  }

  return {
    user: withAdminAuthorization(user, adminAuthorized),
  };
}

async function updateProfile(userId, payload, adminAuthorized = false) {
  const nextName = validateProfileName(payload.name);
  const updatedUser = await updateUserName({
    userId,
    nome: nextName,
  });

  return {
    message: "Perfil atualizado com sucesso.",
    user: withAdminAuthorization(updatedUser, adminAuthorized),
  };
}

async function changePassword(userId, payload) {
  const currentPassword = String(payload.currentPassword || "");
  const nextPassword = validatePassword(payload.newPassword);
  const confirmation = String(payload.confirmPassword || "");

  if (!currentPassword) {
    throw createHttpError(400, "Informe sua senha atual.");
  }

  if (nextPassword !== confirmation) {
    throw createHttpError(400, "A confirmacao da nova senha nao confere.");
  }

  const user = await findUserById(userId);

  if (!user) {
    throw createHttpError(404, "Usuario nao encontrado.");
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.senha_hash);

  if (!passwordMatches) {
    throw createHttpError(401, "A senha atual esta incorreta.");
  }

  const nextPasswordHash = await bcrypt.hash(nextPassword, SALT_ROUNDS);
  await updateUserPassword({
    userId,
    senhaHash: nextPasswordHash,
  });

  return {
    message: "Senha atualizada com sucesso.",
  };
}

module.exports = {
  changePassword,
  getProfile,
  updateProfile,
};
