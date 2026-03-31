const bcrypt = require("bcrypt");
const {
  createUser,
  deleteUserById,
  findUserByEmail,
  findUserById,
  markUserAsVerified,
  updateUserRole,
  USER_ROLE_ADMIN,
  updateUserOtp,
} = require("../database/database");
const { createHttpError } = require("../utils/httpError");
const { serializeUser } = require("../utils/serializers");
const {
  createOtpExpiry,
  generateOtpCode,
  hasOtpExpired,
  hashOtpCode,
  isOtpCodeMatch,
} = require("../utils/otp");
const { sendOtpEmail } = require("./emailService");

const SALT_ROUNDS = 12;
const OTP_EXPIRATION_MINUTES = 5;

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeCredentials({ name, email, password }) {
  return {
    name: String(name || "").trim(),
    email: String(email || "").trim().toLowerCase(),
    password: String(password || ""),
  };
}

function getAdminAccessCode() {
  return String(process.env.ADMIN_ACCESS_CODE || "nexa-admin-2026").trim();
}

async function issueOtpForUser(user) {
  const otpCode = generateOtpCode();
  const otpExpiraEm = createOtpExpiry(OTP_EXPIRATION_MINUTES);

  await updateUserOtp({
    userId: user.id,
    otpCode: hashOtpCode(otpCode),
    otpExpiraEm,
  });

  await sendOtpEmail({
    toEmail: user.email,
    toName: user.nome,
    otpCode,
    expiresMinutes: OTP_EXPIRATION_MINUTES,
  });

  return {
    otpExpiresAt: otpExpiraEm,
  };
}

async function registerUser(payload) {
  const credentials = normalizeCredentials(payload);

  if (!credentials.name || !credentials.email || !credentials.password) {
    throw createHttpError(400, "Preencha nome, email e senha para continuar.");
  }

  if (!validateEmail(credentials.email)) {
    throw createHttpError(400, "Informe um email valido.");
  }

  if (credentials.password.length < 8) {
    throw createHttpError(400, "A senha precisa ter pelo menos 8 caracteres.");
  }

  const existingUser = await findUserByEmail(credentials.email);

  if (existingUser && existingUser.verificado) {
    throw createHttpError(409, "Este email ja esta cadastrado.");
  }

  if (existingUser && !existingUser.verificado) {
    throw createHttpError(409, "Esta conta ainda nao foi verificada.", {
      requiresVerification: true,
      email: credentials.email,
      redirectTo: "/verificar",
    });
  }

  const senhaHash = await bcrypt.hash(credentials.password, SALT_ROUNDS);
  const otpCode = generateOtpCode();
  const otpExpiraEm = createOtpExpiry(OTP_EXPIRATION_MINUTES);

  const user = await createUser({
    nome: credentials.name,
    email: credentials.email,
    senhaHash,
    otpCode: hashOtpCode(otpCode),
    otpExpiraEm,
    role: "cliente",
  });

  try {
    await sendOtpEmail({
      toEmail: credentials.email,
      toName: credentials.name,
      otpCode,
      expiresMinutes: OTP_EXPIRATION_MINUTES,
    });
  } catch (error) {
    await deleteUserById(user.id);
    throw error;
  }

  return {
    message: "Conta criada. Digite o codigo enviado para o seu email.",
    email: credentials.email,
    otpExpiresAt: otpExpiraEm,
    user: serializeUser(user),
  };
}

async function verifyOtp({ email, otp }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedOtp = String(otp || "").trim();

  if (!normalizedEmail || !normalizedOtp) {
    throw createHttpError(400, "Informe email e codigo OTP.");
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw createHttpError(404, "Nenhuma conta encontrada para este email.");
  }

  if (user.verificado) {
    return {
      message: "Conta ja verificada. Voce pode entrar normalmente.",
      user: serializeUser(user),
    };
  }

  if (hasOtpExpired(user.otp_expira_em)) {
    throw createHttpError(400, "O codigo expirou. Solicite um novo envio.");
  }

  if (!isOtpCodeMatch(user.otp_code, normalizedOtp)) {
    throw createHttpError(400, "Codigo OTP invalido.");
  }

  const verifiedUser = await markUserAsVerified(user.id);

  return {
    message: "Conta verificada com sucesso.",
    user: serializeUser(verifiedUser),
  };
}

async function resendOtp(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    throw createHttpError(400, "Informe o email da conta.");
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw createHttpError(404, "Nenhuma conta encontrada para este email.");
  }

  if (user.verificado) {
    throw createHttpError(400, "Esta conta ja foi verificada.");
  }

  const otpData = await issueOtpForUser(user);

  return {
    message: "Novo codigo enviado com sucesso.",
    email: normalizedEmail,
    otpExpiresAt: otpData.otpExpiresAt,
  };
}

async function loginUser({ email, password, loginAsAdmin, adminCode }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");
  const wantsAdminAccess = Boolean(loginAsAdmin);

  if (!normalizedEmail || !normalizedPassword) {
    throw createHttpError(400, "Informe email e senha.");
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw createHttpError(401, "Email ou senha invalidos.");
  }

  if (!user.verificado) {
    throw createHttpError(403, "Sua conta ainda nao foi verificada.", {
      requiresVerification: true,
      email: normalizedEmail,
      redirectTo: "/verificar",
    });
  }

  const isPasswordValid = await bcrypt.compare(normalizedPassword, user.senha_hash);

  if (!isPasswordValid) {
    throw createHttpError(401, "Email ou senha invalidos.");
  }

  let nextUser = user;
  let adminAuthorized = false;

  if (wantsAdminAccess) {
    const normalizedAdminCode = String(adminCode || "").trim();

    if (!normalizedAdminCode) {
      throw createHttpError(400, "Informe o codigo de administrador.");
    }

    if (normalizedAdminCode !== getAdminAccessCode()) {
      throw createHttpError(403, "Codigo de administrador invalido.");
    }

    if (user.role !== USER_ROLE_ADMIN) {
      nextUser = await updateUserRole({
        userId: user.id,
        role: USER_ROLE_ADMIN,
      });
    }

    adminAuthorized = true;
  }

  return {
    message: "Login realizado com sucesso.",
    user: {
      ...serializeUser(nextUser),
      adminAuthorized,
    },
    adminAuthorized,
  };
}

async function getCurrentUser(userId, adminAuthorized = false) {
  if (!userId) {
    return null;
  }

  const user = await findUserById(userId);

  if (!user) {
    return null;
  }

  return {
    ...serializeUser(user),
    adminAuthorized: Boolean(adminAuthorized && user.role === USER_ROLE_ADMIN),
  };
}

module.exports = {
  getCurrentUser,
  loginUser,
  registerUser,
  resendOtp,
  verifyOtp,
};
