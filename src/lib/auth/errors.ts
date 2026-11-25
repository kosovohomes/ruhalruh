export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("EMAIL_ALREADY_EXISTS");
    this.name = "EmailAlreadyExistsError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
  }
}
