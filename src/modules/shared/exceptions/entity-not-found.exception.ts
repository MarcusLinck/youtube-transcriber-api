export class EntityNotFoundException extends Error {
  constructor(message = 'Recurso não encontrado.') {
    super(message)
    this.name = 'EntityNotFoundException'
  }
}