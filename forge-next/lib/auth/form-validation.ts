export function canContinueLogin(email: string, password: string): boolean {
  return email.trim().length > 0 && password.length > 0;
}

export function canContinueSignup(
  fullName: string,
  email: string,
  password: string,
): boolean {
  return (
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8
  );
}
