import type { AtCommandOptions, AtTransport } from "../types";

export type MockResponder = string[] | ((command: string) => string[]);

export class MockAtTransport implements AtTransport {
  readonly label = "mock";
  readonly commands: string[] = [];
  private readonly responders = new Map<string, MockResponder>();

  constructor(responders: Record<string, MockResponder> = {}) {
    for (const [command, response] of Object.entries(responders)) {
      this.responders.set(command, response);
    }
  }

  async open(): Promise<void> {
    return Promise.resolve();
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }

  async sendCommand(command: string, _options: AtCommandOptions = {}): Promise<string[]> {
    this.commands.push(command);
    const responder = this.responders.get(command) ?? defaultResponse(command);
    return typeof responder === "function" ? responder(command) : responder;
  }
}

function defaultResponse(command: string): string[] {
  if (command === "AT") {
    return ["OK"];
  }
  if (command === "AT+CSQ") {
    return ["+CSQ: 18,0", "OK"];
  }
  if (command === "AT+CGATT?") {
    return ["+CGATT: 1", "OK"];
  }
  if (command === "AT+CEREG?") {
    return ["+CEREG: 0,1", "OK"];
  }
  if (command === "AT+NCONFIG?") {
    return [
      "+NCONFIG: AUTOCONNECT,TRUE",
      "+NCONFIG: CR_0354_0338_SCRAMBLING,TRUE",
      "+NCONFIG: CR_0859_SI_AVOID,TRUE",
      "OK"
    ];
  }
  if (command.startsWith("AT+NSOCR=")) {
    return ["0", "OK"];
  }
  if (command.startsWith("AT+NSOST=")) {
    return ["0,14", "OK"];
  }
  if (command.startsWith("AT+NPING=")) {
    return ["+NPING: 1,64,128", "OK"];
  }
  return ["OK"];
}
