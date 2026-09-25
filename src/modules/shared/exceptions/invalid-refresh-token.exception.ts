export class InvalidRefreshTokenException extends Error {
  constructor(message = 'Refresh token inválido ou expirado.') {
    super(message)
    this.name = 'InvalidRefreshTokenException'
  }
}