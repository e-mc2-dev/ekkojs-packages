# @ekkojs/smtp-dev changelog

## 1.0.3

Requires EkkoJS `>= 0.8.6` (no maximum).

- Fixed: the webmail used the router `Link` as a global, which no longer exists on EkkoJS 0.8.6+
  (it failed with "Link is not defined"). Every page now imports `Link` from `ekko:rune/router`, so the
  webmail runs correctly on 0.8.6.
- Settings: the implicit-TLS (SSL) note now reads "(Coming soon)".

## 1.0.2

- Stability fixes and a full-width webmail redesign.

## 1.0.0

- Initial release: in-memory catch-all SMTP server (port 1025) plus a webmail to read captured
  messages and send test mail. Nothing is relayed; mail is discarded on exit.
