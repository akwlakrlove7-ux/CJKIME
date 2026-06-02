export class XtermCjkSandboxAddon {
  private terminal: any;
  private sandboxInput: HTMLInputElement | null = null;
  private onSendCallback: (data: string) => void;
  private isComposing: boolean = false;

  constructor(onSend: (data: string) => void) {
    this.onSendCallback = onSend;
  }

  activate(terminal: any): void {
    this.terminal = terminal;
    this.createSandbox();
    this.bindEvents();
  }

  private createSandbox(): void {
    const container = document.createElement("div");
    container.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;z-index:-1;";
    
    const input = document.createElement("input");
    input.type = "text";
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocorrect", "off");
    input.style.cssText = "width:100%;height:100%;border:none;background:transparent;outline:none;";
    
    container.appendChild(input);
    document.body.appendChild(container);
    this.sandboxInput = input;
  }

  private bindEvents(): void {
    if (!this.sandboxInput || !this.terminal) return;

    this.terminal.onTextAreaFocus?.(() => this.sandboxInput?.focus());
    
    this.sandboxInput.addEventListener("compositionstart", () => {
      this.isComposing = true;
    });

    this.sandboxInput.addEventListener("compositionend", () => {
      this.isComposing = false;
      setTimeout(() => this.flush(), 0);
    });

    this.sandboxInput.addEventListener("input", () => {
      if (this.isComposing) return;
      this.flush();
    });

    this.sandboxInput.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && !this.isComposing) {
        this.onSendCallback(this.sandboxInput!.value + "\r");
        this.sandboxInput!.value = "";
        e.preventDefault();
      }
    });
  }

  private flush(): void {
    if (!this.sandboxInput) return;
    const value = this.sandboxInput.value;
    if (value.length > 0) {
      this.onSendCallback(value);
      this.sandboxInput.value = "";
    }
  }

  dispose(): void {
    this.sandboxInput?.parentElement?.remove();
  }
}