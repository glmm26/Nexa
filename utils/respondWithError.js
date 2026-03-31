function respondWithError(res, error) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  const payload = {
    message:
      statusCode >= 500 && error.expose !== true
        ? "Ocorreu um erro interno. Tente novamente em instantes."
        : error.message,
  };

  if (error.code) {
    payload.code = error.code;
  }

  if (error.requiresVerification) {
    payload.requiresVerification = true;
  }

  if (error.email) {
    payload.email = error.email;
  }

  if (error.redirectTo) {
    payload.redirectTo = error.redirectTo;
  }

  if (error.details) {
    payload.details = error.details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  respondWithError,
};
