export class PasswordMismatchException extends Error {
  constructor(message = 'As senhas informadas não coincidem.') {
    super(message)
    this.name = 'PasswordMismatchException'
  }
}
