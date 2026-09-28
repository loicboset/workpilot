# 0002. Online access with a built-in login

- Status: Accepted
- Date: 2026-09-27

## Decision

The app can be hosted online and reached from a phone anywhere, through a normal web URL protected by a built-in login screen. No auth framework and no private network are required.

## Why

Same pattern as Actual Budget, SilverBullet and Trilium. A private network (e.g. Tailscale) or an access proxy (e.g. Cloudflare Access) can still be added in front.
