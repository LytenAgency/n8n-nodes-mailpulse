import type {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

export class EmailSender implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Mailpulse Email Sender",
    name: "emailSender",
    icon: "file:mailpulse-io.svg",
    group: ["output"],
    version: 1,
    subtitle: "Send emails with tracking",
    description:
      "Send emails through Mailpulse with automatic open and click tracking",
    defaults: {
      name: "Email Sender",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "mailpulseApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "From",
        name: "from",
        type: "string",
        default: "",
        required: true,
        placeholder: "Your Name <you@yourdomain.com>",
        description:
          "Sender address. The domain must be verified in your Mailpulse settings.",
      },
      {
        displayName: "To",
        name: "to",
        type: "string",
        default: "",
        required: true,
        placeholder: "recipient@example.com",
        description:
          "Recipient email address(es). Comma-separated for multiple.",
      },
      {
        displayName: "Subject",
        name: "subject",
        type: "string",
        default: "",
        required: true,
        description: "Email subject line",
      },
      {
        displayName: "HTML Content",
        name: "htmlContent",
        type: "string",
        typeOptions: {
          rows: 10,
        },
        default: "",
        required: true,
        description: "HTML content of the email",
      },
      {
        displayName: "Reply To",
        name: "replyTo",
        type: "string",
        default: "",
        placeholder: "reply@example.com",
        description: "Reply-to email address",
      },
      {
        displayName: "CC",
        name: "cc",
        type: "string",
        default: "",
        placeholder: "cc@example.com",
        description: "CC email address(es). Comma-separated for multiple.",
      },
      {
        displayName: "BCC",
        name: "bcc",
        type: "string",
        default: "",
        placeholder: "bcc@example.com",
        description: "BCC email address(es). Comma-separated for multiple.",
      },
      {
        displayName: "Campaign",
        name: "campaignSource",
        type: "options",
        options: [
          { name: "None", value: "none" },
          { name: "Select Existing", value: "existing" },
          { name: "Create New", value: "new" },
        ],
        default: "none",
        description: "Choose how to assign a campaign",
      },
      {
        displayName: "Campaign Name",
        name: "campaignName",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getCampaigns",
        },
        default: "",
        displayOptions: {
          show: {
            campaignSource: ["existing"],
          },
        },
        description: "Select an existing campaign",
      },
      {
        displayName: "New Campaign Name",
        name: "newCampaignName",
        type: "string",
        default: "",
        displayOptions: {
          show: {
            campaignSource: ["new"],
          },
        },
        description:
          "Name for the new campaign (will be created if it doesn't exist)",
      },
      {
        displayName: "Metadata",
        name: "metadata",
        type: "json",
        default: "{}",
        description: "Optional JSON metadata to store with the email",
      },
    ],
  };

  methods = {
    loadOptions: {
      async getCampaigns(
        this: ILoadOptionsFunctions
      ): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials("mailpulseApi");
        const apiUrl = credentials.apiUrl as string;
        const apiKey = credentials.apiKey as string;

        try {
          const response = await this.helpers.httpRequest({
            method: "GET",
            url: `${apiUrl}/api/campaigns`,
            headers: { "x-api-key": apiKey },
          });

          const campaigns = response.campaigns as Array<{
            id: string;
            name: string;
          }>;

          return campaigns.map((campaign) => ({
            name: campaign.name,
            value: campaign.name,
          }));
        } catch {
          return [];
        }
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials("mailpulseApi");
    const apiUrl = credentials.apiUrl as string;
    const apiKey = credentials.apiKey as string;

    for (let i = 0; i < items.length; i++) {
      try {
        const from = this.getNodeParameter("from", i) as string;
        const toRaw = this.getNodeParameter("to", i) as string;
        const subject = this.getNodeParameter("subject", i) as string;
        const htmlContent = this.getNodeParameter("htmlContent", i) as string;
        const replyTo = this.getNodeParameter("replyTo", i) as string;
        const ccRaw = this.getNodeParameter("cc", i) as string;
        const bccRaw = this.getNodeParameter("bcc", i) as string;
        const campaignSource = this.getNodeParameter(
          "campaignSource",
          i
        ) as string;
        const metadataStr = this.getNodeParameter("metadata", i) as string;

        const to = toRaw
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);
        const cc = ccRaw
          ? ccRaw
              .split(",")
              .map((e) => e.trim())
              .filter(Boolean)
          : undefined;
        const bcc = bccRaw
          ? bccRaw
              .split(",")
              .map((e) => e.trim())
              .filter(Boolean)
          : undefined;

        let campaignId: string | undefined;
        if (campaignSource === "existing") {
          campaignId = this.getNodeParameter("campaignName", i) as string;
        } else if (campaignSource === "new") {
          campaignId = this.getNodeParameter("newCampaignName", i) as string;
        }

        let metadata: Record<string, unknown> = {};
        try {
          metadata = JSON.parse(metadataStr || "{}");
        } catch {
          metadata = {};
        }

        const response = await this.helpers.httpRequest({
          method: "POST",
          url: `${apiUrl}/api/send`,
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: {
            from,
            to,
            subject,
            htmlContent,
            replyTo: replyTo || undefined,
            cc,
            bcc,
            campaignId: campaignId || undefined,
            metadata,
          },
        });

        returnData.push({
          json: {
            id: response.id,
            emailTrackingId: response.emailTrackingId,
            from: response.from,
            to: response.to,
            subject: response.subject,
            linksTracked: response.links?.length || 0,
          },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: (error as Error).message } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
