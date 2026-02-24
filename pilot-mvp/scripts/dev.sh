#!/bin/bash
# Ensures npm/node is found (e.g. when nvm isn't loaded in non-interactive shells)
export PATH="${HOME}/.nvm/versions/node/v22.17.1/bin:${HOME}/.nvm/versions/node/v20.19.6/bin:${HOME}/.nvm/versions/node/v18.20.8/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
cd "$(dirname "$0")/.." && npm run dev
