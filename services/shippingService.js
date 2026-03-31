const { createHttpError } = require("../utils/httpError");

function normalizeZipCode(zipCode) {
  const normalized = String(zipCode || "").replace(/\D/g, "");

  if (normalized.length !== 8) {
    throw createHttpError(400, "Informe um CEP valido com 8 digitos.");
  }

  return normalized;
}

function getShippingQuote(zipCode) {
  const normalizedZipCode = normalizeZipCode(zipCode);
  const firstDigit = normalizedZipCode[0];

  if (firstDigit === "0") {
    return {
      zipCode: normalizedZipCode,
      amount: 10,
      estimatedDays: "3 a 4 dias",
      zone: "mesma cidade",
    };
  }

  if (firstDigit === "1") {
    return {
      zipCode: normalizedZipCode,
      amount: 20,
      estimatedDays: "4 a 6 dias",
      zone: "mesmo estado",
    };
  }

  return {
    zipCode: normalizedZipCode,
    amount: 30,
    estimatedDays: "5 a 7 dias",
    zone: "outro estado",
  };
}

module.exports = {
  getShippingQuote,
  normalizeZipCode,
};
