export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireDigit: true,
};

export const passwordPolicyMessage = () =>
  'Le mot de passe doit contenir au moins 8 caractères, dont une majuscule et un chiffre';

export const isPasswordStrong = (password) => {
  if (!password || password.length < PASSWORD_POLICY.minLength) return false;
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) return false;
  if (PASSWORD_POLICY.requireDigit && !/\d/.test(password)) return false;
  return true;
};

export const validatePassword = (password) => {
  if (!isPasswordStrong(password)) {
    const error = new Error(passwordPolicyMessage());
    error.status = 400;
    throw error;
  }
  return true;
};

export const buildPasswordValidation = (z) =>
  z.string().refine((value) => isPasswordStrong(value), { message: passwordPolicyMessage() });
