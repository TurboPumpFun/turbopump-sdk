export class TurboPumpError extends Error {
  public override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "TurboPumpError";
    this.cause = cause;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
