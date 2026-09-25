export class EntityAlreadyExistsException extends Error {
  constructor(message = 'Recurso já existe.') {
    super(message)
    this.name = 'EntityAlreadyExistsException'
  }
}