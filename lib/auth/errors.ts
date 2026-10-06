const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed: 'Vous devez confirmer votre adresse email avant de vous connecter. Vérifiez votre boîte mail.',
  user_already_exists: 'Un compte existe déjà avec cette adresse.',
  email_exists: 'Un compte existe déjà avec cette adresse.',
  weak_password: 'Ce mot de passe est trop faible. Choisissez-en un plus long.',
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  over_email_send_rate_limit: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
  over_request_rate_limit: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
  otp_expired: 'Ce lien a expiré. Demandez-en un nouveau.',
};

export function authErrorMessage(code: string | undefined): string {
  return (code && MESSAGES[code]) || 'Une erreur est survenue. Réessayez dans un instant.';
}
