// Electron module wrapper - handles the case where require('electron') returns a path string
// instead of the actual Electron API module

let electron;

// First, try the standard require
try {
  electron = require('electron');
} catch (e) {
  electron = null;
}

// If we got a string (path to executable), we're running inside Electron but
// the npm package is shadowing the built-in module
if (typeof electron === 'string') {
  // In Electron, the built-in module should be accessible through process._linkedBinding
  // or through the Electron binary's internal module system
  // Since neither works, we need to use a workaround

  // Check if we're running inside Electron
  if (process.versions && process.versions.electron) {
    // We're inside Electron, but the module is not accessible
    // This is a known issue with certain Electron versions
    // The only solution is to ensure the npm package version matches the binary version

    // As a workaround, try to find the Electron module in the process
    const Module = require('module');

    // Try to load from the Electron binary's resources
    const path = require('path');
    const fs = require('fs');

    // Check for electron.asar in various locations
    const possiblePaths = [
      path.join(process.resourcesPath, 'electron.asar'),
      path.join(process.resourcesPath, 'app.asar'),
      path.join(path.dirname(process.execPath), 'resources', 'electron.asar'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          electron = require(p);
          if (typeof electron === 'object' && electron.app) {
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
    }

    // If still not found, create a minimal electron object
    // This will at least prevent the crash, but the app won't work properly
    if (typeof electron === 'string' || !electron) {
      console.error('WARNING: Could not load Electron API module.');
      console.error('This is likely due to a version mismatch between the npm package and the binary.');
      console.error('Please reinstall electron: npm install electron@latest --save-dev');
      electron = {};
    }
  }
}

module.exports = electron;
