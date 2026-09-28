# 0003. Credentials in an environment variable

- Status: Accepted
- Date: 2026-09-27

## Decision

The login is set with WORKPILOT_USER=name:password in the Docker config. Forgot the password: edit the variable and restart. Session cookie (httpOnly, secure), rate-limited login attempts, HTTPS required. Optional 2FA later.

## Why

Simplest option for self-hosting developers. No reset flow, no recovery codes, no email server.
