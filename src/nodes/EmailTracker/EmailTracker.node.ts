import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";
import * as cheerio from "cheerio";

export class EmailTracker implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Mailpulse Email Tracker",
    name: "emailTracker",
    icon: "file:mailpulse.svg",
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
        displayName: "Campaign ID",
        name: "campaignId",
        type: "string",
        default: "",
        description: "Optional campaign ID to group emails",
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
      const campaignId = this.getNodeParameter("campaignId", i) as string;
      const metadataStr = this.getNodeParameter("metadata", i) as string;

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
