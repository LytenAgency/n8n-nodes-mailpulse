import type {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";
import * as cheerio from "cheerio";

export class EmailTracker implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Mailpulse Email Tracker",
    name: "emailTracker",
    icon: "file:mailpulse-io.svg",
    group: ["transform"],
    version: 1,
    subtitle: "Track email opens and clicks",
    description: "Add tracking to emails for opens and clicks analytics",
    defaults: {
      name: "Email Tracker",
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
        displayName: "HTML Content",
        name: "htmlContent",
        type: "string",
        typeOptions: {
          rows: 10,
        },
        default: "",
        required: true,
        description: "The HTML content of the email to track",
      },
      {
        displayName: "Recipient Email",
        name: "recipient",
        type: "string",
        default: "",
        required: true,
        placeholder: "recipient@example.com",
        description: "The email address of the recipient",
      },
      {
        displayName: "Subject",
        name: "subject",
        type: "string",
        default: "",
        required: true,
        description: "The subject of the email",
      },
      {
        displayName: "Campaign",
        name: "campaignSource",
        type: "options",
        options: [
          {
            name: "None",
            value: "none",
          },
          {
            name: "Select Existing",
            value: "existing",
          },
          {
            name: "Create New",
            value: "new",
          },
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
        description: "Name for the new campaign (will be created if it doesn't exist)",
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
            headers: {
              "x-api-key": apiKey,
            },
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
      const htmlContent = this.getNodeParameter("htmlContent", i) as string;
      const recipient = this.getNodeParameter("recipient", i) as string;
      const subject = this.getNodeParameter("subject", i) as string;
      const campaignSource = this.getNodeParameter("campaignSource", i) as string;
      const metadataStr = this.getNodeParameter("metadata", i) as string;

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
        url: `${apiUrl}/api/emails`,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: {
          recipient,
          subject,
          htmlContent,
          campaignId: campaignId || undefined,
          metadata,
        },
      });

      const { emailTrackingId, links, pixelUrl } = response as {
        emailTrackingId: string;
        links: Array<{
          originalUrl: string;
          trackingId: string;
          trackingUrl: string;
        }>;
        pixelUrl: string;
      };

      const $ = cheerio.load(htmlContent);

      for (const link of links) {
        $(`a[href="${link.originalUrl}"]`).each((_, el) => {
          $(el).attr("href", link.trackingUrl);
        });
      }

      const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
      if ($("body").length > 0) {
        $("body").append(pixelHtml);
      } else {
        $.root().append(pixelHtml);
      }

      const modifiedHtml = $.html();

      returnData.push({
        json: {
          modifiedHtml,
          trackingId: emailTrackingId,
          recipient,
          subject,
          linksTracked: links.length,
        },
      });
    }

    return [returnData];
  }
}
