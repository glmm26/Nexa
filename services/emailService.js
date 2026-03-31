const { createHttpError } = require("../utils/httpError");

function renderOtpEmail({ name, otpCode, expiresMinutes }) {
  const greeting = name ? `Oi, ${name}` : "Oi";

  return `
    <div style="margin:0;padding:32px;background:#09090b;font-family:Inter,Arial,sans-serif;color:#f5f7ff;">
      <div style="max-width:560px;margin:0 auto;background:linear-gradient(180deg,#111827 0%,#0f172a 100%);border:1px solid rgba(255,255,255,0.08);border-radius:28px;padding:40px;box-shadow:0 24px 80px rgba(0,0,0,0.35);">
        <div style="display:inline-block;padding:10px 14px;border-radius:999px;background:rgba(96,165,250,0.12);color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
          Nexa Atelier
        </div>
        <h1 style="margin:22px 0 14px;font-size:32px;line-height:1.05;color:#ffffff;">Seu codigo de verificacao chegou.</h1>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#cbd5e1;">
          ${greeting}, use o codigo abaixo para concluir o acesso a sua conta.
        </p>
        <div style="padding:20px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);text-align:center;">
          <span style="display:block;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;">Codigo OTP</span>
          <strong style="display:block;font-size:42px;letter-spacing:0.28em;color:#ffffff;">${otpCode}</strong>
        </div>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#94a3b8;">
          Este codigo expira em ${expiresMinutes} minutos. Se voce nao solicitou este acesso, ignore esta mensagem.
        </p>
      </div>
    </div>
  `;
}

async function sendViaBrevo({ toEmail, toName, otpCode, expiresMinutes }) {
  const apiKey = process.env.EMAIL_API_KEY || process.env.BREVO_API_KEY;
  const senderEmail =
    process.env.EMAIL_API_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL;
  const senderName =
    process.env.EMAIL_API_SENDER_NAME ||
    process.env.BREVO_SENDER_NAME ||
    "Gestao de Gastos";
  const apiUrl =
    process.env.EMAIL_API_URL || "https://api.brevo.com/v3/smtp/email";

  if (!isConfiguredValue(apiKey)) {
    throw createExposedEmailError(
      "Configure a variavel EMAIL_API_KEY com a sua chave da Brevo para enviar o OTP.",
      "EMAIL_API_NOT_CONFIGURED"
    );
  }

  if (!isConfiguredValue(senderEmail)) {
    throw createExposedEmailError(
      "Configure a variavel EMAIL_API_SENDER_EMAIL com o email remetente autorizado na Brevo.",
      "EMAIL_SENDER_NOT_CONFIGURED"
    );
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName,
      },
      to: [
        {
          email: toEmail,
          name: toName || undefined,
        },
      ],
      subject: "Seu codigo de verificacao",
      htmlContent: renderOtpEmail({
        name: toName,
        otpCode,
        expiresMinutes,
      }),
      textContent: `Seu codigo OTP e ${otpCode}. Ele expira em ${expiresMinutes} minutos.`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Falha Brevo:", details);
    throw createExposedEmailError(
      "Nao foi possivel enviar o codigo OTP por email. Revise a chave, o remetente e a configuracao da Brevo.",
      "EMAIL_API_DELIVERY_FAILED"
    );
  }

  return {
    mode: "api",
  };
}

async function sendOtpEmail({ toEmail, toName, otpCode, expiresMinutes = 5 }) {
  const mode = getEmailProvider();

  if (mode === "console") {
    console.log(
      `[OTP-CONSOLE] Codigo para ${toEmail}: ${otpCode} | expira em ${expiresMinutes} minutos`
    );
    return {
      mode: "console",
    };
  }

  return sendViaBrevo({
    toEmail,
    toName,
    otpCode,
    expiresMinutes,
  });
}

module.exports = {
  sendOtpEmail,
};

function getEmailProvider() {
  const provider = process.env.EMAIL_PROVIDER || process.env.MAIL_MODE || "api";
  return provider.toLowerCase();
}

function isConfiguredValue(value) {
  if (!value) {
    return false;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  if (!normalizedValue) {
    return false;
  }

  const invalidValues = [
    "coloque_sua_chave_brevo_aqui",
    "coloque sua chave brevo aqui",
    "seu-email-remetente@dominio.com",
  ];

  return !invalidValues.includes(normalizedValue);
}

function createExposedEmailError(message, code) {
  return createHttpError(500, message, {
    code,
    expose: true,
  });
}
