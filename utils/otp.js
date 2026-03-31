const crypto = require("crypto");

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtpCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function createOtpExpiry(minutes = 5) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function hasOtpExpired(expiresAt) {
  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() < Date.now();
}

function isOtpCodeMatch(storedCode, providedCode) {
  if (!storedCode || !providedCode) {
    return false;
  }

  if (String(storedCode).length === 6) {
    return String(storedCode) === String(providedCode);
  }

  return hashOtpCode(providedCode) === storedCode;
}

module.exports = {
  createOtpExpiry,
  generateOtpCode,
  hasOtpExpired,
  hashOtpCode,
  isOtpCodeMatch,
};
