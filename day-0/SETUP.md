# Rippled Development Environment Setup Guide

## Setting up Rippled Environment

- mac: [mac](mac.md)
- ubuntu: [ubuntu](ubuntu.md)
- windows: [ubuntu](windows.md)

## Setting up Playground Environment

### Node.js Setup

Install and configure Node.js using nvm for better version management:

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use the latest LTS version of Node.js
nvm install --lts
nvm use --lts

# Verify installation
node --version
npm --version
```