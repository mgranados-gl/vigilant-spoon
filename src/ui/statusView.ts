type Elements = {
  status: HTMLDivElement;
  validation: HTMLDivElement;
  button: HTMLButtonElement;
};

export class StatusView {
  private readonly elements: Elements;

  constructor(elements: Elements) {
    this.elements = elements;
  }

  setRunning(message: string): void {
    this.elements.button.disabled = true;
    this.elements.validation.textContent = "";
    this.elements.status.textContent = message;
  }

  setProgress(message: string): void {
    this.elements.status.textContent = message;
  }

  setError(message: string): void {
    this.elements.button.disabled = false;
    this.elements.validation.textContent = message;
  }

  setSuccess(message: string): void {
    this.elements.button.disabled = false;
    this.elements.validation.textContent = "";
    this.elements.status.textContent = message;
  }

  clear(): void {
    this.elements.status.textContent = "";
    this.elements.validation.textContent = "";
  }
}
