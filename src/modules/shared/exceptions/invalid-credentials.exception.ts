export class InvalidCredentialsException extends Error {
  constructor(message = 'E-mail ou senha inválidos.') {
    super(message)
    this.name = 'InvalidCredentialsException'
  }
}