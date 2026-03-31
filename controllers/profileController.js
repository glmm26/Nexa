const {
  changePassword,
  getProfile,
  updateProfile,
} = require("../services/profileService");
const { respondWithError } = require("../utils/respondWithError");

async function getCurrentProfile(req, res) {
  try {
    const result = await getProfile(req.session.userId, req.session.adminAuthorized);
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function updateCurrentProfile(req, res) {
  try {
    const result = await updateProfile(req.session.userId, req.body, req.session.adminAuthorized);
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function updateCurrentPassword(req, res) {
  try {
    const result = await changePassword(req.session.userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

module.exports = {
  getCurrentProfile,
  updateCurrentPassword,
  updateCurrentProfile,
};
