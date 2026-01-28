import type {
  IAuthenticateGeneric,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

export class MailpulseApi implements ICredentialType {
  name = "mailpulseApi";
  displayName = "Mailpulse API";
  documentationUrl = "https://mailpulse-io.lyten.agency/docs";

  properties: INodeProperties[] = [
    {
      displayName: "API URL",
      name: "apiUrl",
      type: "string",
      default: "https://mailpulse-io.lyten.agency",
      placeholder: "https://mailpulse-io.lyten.agency",
      description: "The base URL of your Mailpulse instance",
    },
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: {
        password: true,
      },
      default: "",
      description: "Your Mailpulse API key",
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        "x-api-key": "={{$credentials.apiKey}}",
      },
    },
  };
}
