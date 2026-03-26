'use strict';

const fs = require('fs');
const path = require('path');

// Prefer the built server code under `dist/` (useful for npm packaging),
// but fall back to the source folder for local dev.
const distServerSrc = path.join(__dirname, 'dist', 'server', 'src');
const fallbackServerSrc = path.join(__dirname, 'server', 'src');

module.exports = require(fs.existsSync(distServerSrc) ? distServerSrc : fallbackServerSrc);


