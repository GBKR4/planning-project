export const verificationEmailTemplate = (link) => ({
  subject: "Verify your email address",
  text: `Please verify your email by clicking on the following link: ${link}`,
});

export const resetPasswordEmail = (link) => ({
  subject: "Reset your password",
  text: `You can reset your password by clicking on the following link: ${link}`,
});