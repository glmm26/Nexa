function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.nome,
    email: user.email,
    verified: Boolean(user.verificado),
    role: user.role || "cliente",
    createdAt: user.criado_em,
  };
}

module.exports = {
  serializeUser,
};
