export class InvalidConfirmationTokenException extends Error {
  constructor(message = 'Token de confirmação inválido.') {
    super(message)
    this.name = 'InvalidConfirmationTokenException'
  }
}