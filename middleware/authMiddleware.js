const { findUserById } = require("../database/database");
const { createHttpError } = require("../utils/httpError");

async function loadCurrentUser(req) {
  if (req.currentUser !== undefined) {
    return req.currentUser;
  }

  if (!req.session.userId) {
    req.currentUser = null;
    return null;
  }

  const user = await findUserById(req.session.userId);
  req.currentUser = user || null;
  return req.currentUser;
}

async function requireAuth(req, res, next) {
  try {
    if (!req.session.userId) {
      return next(createHttpError(401, "Faca login para acessar esta area."));
    }

    const user = await loadCurrentUser(req);

    if (!user) {
      return next(createHttpError(401, "Sua sessao nao esta mais disponivel. Entre novamente."));
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(role) {
  return async function roleMiddleware(req, res, next) {
    try {
      const user = await loadCurrentUser(req);

      if (!user) {
        return next(createHttpError(401, "Faca login para acessar esta area."));
      }

      if (user.role !== role) {
        return next(createHttpError(403, "Voce nao tem permissao para acessar esta area."));
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

const requireAdmin = requireRole("admin");
async function requireAdminSession(req, res, next) {
  try {
    const user = await loadCurrentUser(req);

    if (!user) {
      return next(createHttpError(401, "Faca login para acessar esta area."));
    }

    if (user.role !== "admin" || !req.session.adminAuthorized) {
      return next(createHttpError(403, "Acesso administrativo requer o codigo de administrador."));
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  loadCurrentUser,
  requireAdmin: requireAdminSession,
  requireAuth,
  requireRole,
};
