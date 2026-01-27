import type {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

export class MailpulseStats implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Mailpulse Statistics",
    name: "mailpulseStats",
    icon: "file:mailpulse-io.svg",
    group: ["transform"],
    version: 1,
    subtitle: "Get statistics from Mailpulse",
    description: "Retrieve global statistics or campaign analytics",
    defaults: {
      name: "Mailpulse Stats",
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
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Campaign',
            value: 'campaign',
          },
          {
            name: 'Stats',
            value: 'stats',
          },
        ],
        default: 'stats',
        required: true,
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: [
              'stats',
            ],
          },
        },
        options: [
          {
            name: 'Get All',
            value: 'getAll',
            description: 'Get global statistics',
            action: 'Get all stats',
          },
        ],
        default: 'getAll',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: [
              'campaign',
            ],
          },
        },
        options: [
          {
            name: 'Get Stats',
            value: 'getStats',
            description: 'Get advanced stats for a campaign',
            action: 'Get campaign stats',
          },
        ],
        default: 'getStats',
      },
      {
        displayName: 'Campaign',
        name: 'campaignId',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getCampaigns',
        },
        default: '',
        displayOptions: {
          show: {
            resource: ['campaign'],
            operation: ['getStats'],
          },
        },
        required: true,
        description: 'Select the campaign to get stats for',
      },
      {
        displayName: 'Period',
        name: 'period',
        type: 'options',
        options: [
          {
            name: 'Last 7 Days',
            value: '7d',
          },
          {
            name: 'Last 30 Days',
            value: '30d',
          },
          {
            name: 'Last 90 Days',
            value: '90d',
          },
        ],
        default: '30d',
        displayOptions: {
          show: {
            resource: ['campaign'],
            operation: ['getStats'],
          },
        },
        description: 'Time period for the stats',
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
            value: campaign.id,
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
    const resource = this.getNodeParameter("resource", 0) as string;
    const operation = this.getNodeParameter("operation", 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        if (resource === 'stats' && operation === 'getAll') {
          const response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${apiUrl}/api/stats`,
            headers: {
              'x-api-key': apiKey,
            },
            json: true,
          });
          returnData.push({ json: response });
        } else if (resource === 'campaign' && operation === 'getStats') {
          const campaignId = this.getNodeParameter('campaignId', i) as string;
          const period = this.getNodeParameter('period', i) as string;
          const response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${apiUrl}/api/campaigns/${campaignId}/stats`,
            qs: {
              period,
            },
            headers: {
              'x-api-key': apiKey,
            },
            json: true,
          });
          returnData.push({ json: response });
        }
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
