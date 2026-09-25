export class AccountNotActiveException extends Error {
  constructor(message = 'Conta não ativada. Por favor, confirme o seu e-mail.') {
    super(message)
    this.name = 'AccountNotActiveException'
  }
}