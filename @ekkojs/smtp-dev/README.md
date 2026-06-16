# @ekkojs/smtp-dev

A local email server with a built-in webmail, for testing the emails your app sends during
development. Point your app at it, and every message it tries to send is captured and shown in your
browser instead of being delivered. Nothing ever leaves your machine.

## Run it

```bash
ekko add @ekkojs/smtp-dev
ekko run @ekkojs/smtp-dev
```

- **Webmail** opens at <http://localhost:1080>, read messages, view attachments, and send test mail.
- **SMTP** listens on port `1025`, set that as the mail host in the app you're testing.

Messages are kept in memory and cleared when you stop it, so each run starts clean. You can change the
SMTP port and toggle SSL from the settings page.
