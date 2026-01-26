# n8n-nodes-mailpulse

This is an n8n community node that lets you track email opens and clicks with [Mailpulse](https://mailpulse.io).

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
| **API URL** | Your Mailpulse instance URL (e.g., `https://mailpulse.io`) |
| **API Key** | Your API key from Mailpulse Settings |

## Node: Email Tracker

The Email Tracker node adds tracking to your emails before sending them.

### How it works

1. Place the **Email Tracker** node **before** your email sending node (Gmail, SMTP, SendGrid, etc.)
2. Pass your HTML email content to the node
3. The node will:
   - Register the email with Mailpulse
   - Replace all links with tracked URLs
   - Add a tracking pixel for open detection
4. Use the `modifiedHtml` output in your email sending node

### Input Fields

| Field | Required | Description |
|-------|----------|-------------|
| **HTML Content** | Yes | The HTML content of your email |
| **Recipient Email** | Yes | The recipient's email address |
| **Subject** | Yes | The email subject |
| **Campaign ID** | No | Optional campaign ID to group emails |
| **Metadata** | No | Optional JSON metadata |

### Output

```json
{
  "modifiedHtml": "<html>... (with tracking links and pixel)</html>",
  "trackingId": "hE4kJ9",
  "recipient": "user@example.com",
  "subject": "Your email subject",
  "linksTracked": 3
}
```

## Example Workflow

```
[Trigger] → [Build Email HTML] → [Email Tracker] → [Send Email (Gmail/SMTP)]
```

1. **Trigger**: HTTP Request, Schedule, etc.
2. **Build Email HTML**: Function node or template
3. **Email Tracker**: This node - adds tracking
4. **Send Email**: Use `{{ $json.modifiedHtml }}` as the email body

## Tracked Events

Once your emails are sent with tracking:

- **Opens**: Tracked via invisible 1x1 pixel
- **Clicks**: All links are replaced with tracked redirect URLs

View your analytics at your Mailpulse dashboard.

## License

MIT
