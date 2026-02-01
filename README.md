![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-mailpulse

This is an n8n community node that lets you track email opens and clicks with [Mailpulse](https://mailpulse-io.lyten.agency).

[![npm version](https://img.shields.io/npm/v/n8n-nodes-mailpulse.svg)](https://www.npmjs.com/package/n8n-nodes-mailpulse)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Mailpulse](https://mailpulse-io.lyten.agency) is an email tracking analytics platform that helps you understand how your emails perform. This node integrates seamlessly with your n8n workflows to add tracking to any email you send.

## Features

- 📧 **Email Open Tracking** - Know when recipients open your emails
- 🔗 **Click Tracking** - Track all link clicks in your emails
- 📊 **Campaign Analytics** - Group emails by campaign for aggregate stats
- 🏷️ **Custom Metadata** - Attach custom data to each tracked email
- ⚡ **Zero-config** - Works with any email sending node (Gmail, SMTP, SendGrid, etc.)

## Installation

### Community Node (Recommended)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-mailpulse`
4. Click **Install**

### Manual Installation

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-mailpulse
```

## Credentials

You need to configure the Mailpulse API credentials:

| Field | Description |
|-------|-------------|
| **API URL** | Your Mailpulse instance URL (e.g., `https://mailpulse-io.lyten.agency`) |
| **API Key** | Your API key from Mailpulse Settings |

### Getting Your API Key

1. Go to [mailpulse-io.lyten.agency](https://mailpulse-io.lyten.agency)
2. Create an account or sign in
3. Navigate to **Settings** → **API Keys**
4. Create a new API key

## Nodes

### Email Tracker

The Email Tracker node adds tracking to your emails before sending them.

#### How it works

1. Place the **Email Tracker** node **before** your email sending node (Gmail, SMTP, SendGrid, etc.)
2. Pass your HTML email content to the node
3. The node will:
   - Register the email with Mailpulse
   - Replace all links with tracked URLs
   - Add a tracking pixel for open detection
4. Use the `modifiedHtml` output in your email sending node

#### Input Fields

| Field | Required | Description |
|-------|----------|-------------|
| **HTML Content** | Yes | The HTML content of your email |
| **Recipient Email** | Yes | The recipient's email address |
| **Subject** | Yes | The email subject |
| **Campaign ID** | No | Optional campaign ID to group emails |
| **Metadata** | No | Optional JSON metadata |

#### Output

```json
{
  "modifiedHtml": "<html>... (with tracking links and pixel)</html>",
  "trackingId": "hE4kJ9",
  "recipient": "user@example.com",
  "subject": "Your email subject",
  "linksTracked": 3
}
```

### Mailpulse Stats

The Mailpulse Stats node retrieves tracking statistics from your Mailpulse account.

#### Operations

| Operation | Description |
|-----------|-------------|
| **Get Email Stats** | Get statistics for a specific tracked email |
| **Get Campaign Stats** | Get aggregate statistics for a campaign |
| **List Recent Emails** | List recently tracked emails |

## Example Workflows

### Basic Email Tracking

```
[Trigger] → [Build Email HTML] → [Email Tracker] → [Send Email (Gmail/SMTP)]
```

1. **Trigger**: HTTP Request, Schedule, Webhook, etc.
2. **Build Email HTML**: Function node or template
3. **Email Tracker**: This node - adds tracking
4. **Send Email**: Use `{{ $json.modifiedHtml }}` as the email body

### With Campaign Tracking

```
[Webhook] → [Email Tracker (with Campaign ID)] → [Gmail] → [Respond to Webhook]
```

Set the **Campaign ID** field to group emails together for aggregate analytics.

### Monitoring Stats

```
[Schedule] → [Mailpulse Stats] → [IF Low Opens] → [Slack Notification]
```

Periodically check your email stats and get notified of low-performing campaigns.

## Tracked Events

Once your emails are sent with tracking:

| Event | How it's tracked |
|-------|------------------|
| **Opens** | Invisible 1x1 tracking pixel |
| **Clicks** | Links replaced with tracked redirect URLs |

View your analytics at your [Mailpulse dashboard](https://mailpulse-io.lyten.agency).

## Resources

- [Mailpulse Documentation](https://mailpulse-io.lyten.agency/docs)
- [n8n Community Nodes Docs](https://docs.n8n.io/integrations/community-nodes/)
- [Report Issues](https://github.com/LytenAgency/n8n-nodes-mailpulse/issues)

## License

MIT © [Lyten Agency](https://lyten.agency)
