const {
  getCurrentUser,
  loginUser,
  registerUser,
  resendOtp,
  verifyOtp,
} = require("../services/authService");
const { respondWithError } = require("../utils/respondWithError");

async function register(req, res) {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function verifyRegistrationOtp(req, res) {
  try {
    const result = await verifyOtp(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function resendRegistrationOtp(req, res) {
  try {
    const result = await resendOtp(req.body.email);
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function login(req, res) {
  try {
    const result = await loginUser(req.body);
    req.session.userId = result.user.id;
    req.session.adminAuthorized = Boolean(result.adminAuthorized);
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("nexa_session");
    res.status(200).json({
      message: "Sessao encerrada com sucesso.",
    });
  });
}

async function me(req, res) {
  try {
    const user = await getCurrentUser(req.session.userId, req.session.adminAuthorized);

    if (!user) {
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    return res.status(200).json({
      authenticated: true,
      user,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

module.exports = {
  login,
  logout,
  me,
  register,
  resendRegistrationOtp,
  verifyRegistrationOtp,
};
