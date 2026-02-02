#!/usr/bin/env ts-node

/**
 * Programmatic Gmail Add-on Deployment Script
 * 
 * This script uses the Google Apps Script API to:
 * 1. Create or update an Apps Script project
 * 2. Upload the Gmail add-on files
 * 3. Create a deployment
 * 
 * Prerequisites:
 * 1. Enable Apps Script API: https://script.google.com/home/usersettings
 * 2. Create OAuth credentials: https://console.cloud.google.com/apis/credentials
 * 3. Set environment variables (see below)
 * 
 * Usage:
 *   npm run deploy:gmail-addon
 *   or
 *   ts-node scripts/deploy-gmail-addon.ts
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local or .env
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const SCRIPT_ID_ENV = 'GOOGLE_APPS_SCRIPT_ID'; // Optional: existing script ID
const CLIENT_ID_ENV = 'GOOGLE_CLIENT_ID';
const CLIENT_SECRET_ENV = 'GOOGLE_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const GMAIL_ADDON_DIR = path.join(__dirname, '..', 'gmail-addon');
const CODE_GS = path.join(GMAIL_ADDON_DIR, 'Code.gs');
const APPSCRIPT_JSON = path.join(GMAIL_ADDON_DIR, 'appsscript.json');

interface TokenFile {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
}

// OAuth2 client setup
function getOAuth2Client() {
  const clientId = process.env[CLIENT_ID_ENV];
  const clientSecret = process.env[CLIENT_SECRET_ENV];

  if (!clientId || !clientSecret) {
    throw new Error(
      `Missing OAuth credentials. Please set ${CLIENT_ID_ENV} and ${CLIENT_SECRET_ENV} environment variables.\n` +
      `Get them from: https://console.cloud.google.com/apis/credentials`
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
}

// Get access token (with refresh if needed)
async function getAccessToken(oauth2Client: any): Promise<string> {
  const tokenPath = path.join(__dirname, '..', '.gmail-addon-token.json');

  // Try to load existing token
  if (fs.existsSync(tokenPath)) {
    const token: TokenFile = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    
    if (token.access_token) {
      oauth2Client.setCredentials(token);
      
      // Check if token is expired
      if (token.expiry_date && Date.now() < token.expiry_date) {
        return token.access_token;
      }
      
      // Try to refresh
      if (token.refresh_token) {
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          oauth2Client.setCredentials(credentials);
          fs.writeFileSync(tokenPath, JSON.stringify(credentials, null, 2));
          return credentials.access_token!;
        } catch (error) {
          console.log('Token refresh failed, need to re-authenticate');
        }
      }
    }
  }

  // Need to get new token
  return await getNewToken(oauth2Client, tokenPath);
}

// Get new token via OAuth flow
async function getNewToken(oauth2Client: any, tokenPath: string): Promise<string> {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/script.projects',
      'https://www.googleapis.com/auth/script.deployments',
      'https://www.googleapis.com/auth/drive.file'
    ],
  });

  console.log('\n🔐 Authorization required!');
  console.log('Please visit this URL to authorize the application:');
  console.log('\n' + authUrl + '\n');
  console.log('After authorization, you will be redirected to localhost:3000');
  console.log('Copy the "code" parameter from the URL and paste it below.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the authorization code: ', async (code) => {
      rl.close();

      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
        console.log('✅ Token stored successfully!');
        resolve(tokens.access_token!);
      } catch (error: any) {
        reject(new Error(`Error retrieving access token: ${error.message}`));
      }
    });
  });
}

// Read and prepare files for upload
function prepareFiles(): Array<{ name: string; type: string; source: string }> {
  const files: Array<{ name: string; type: string; source: string }> = [];

  // Read Code.gs
  if (fs.existsSync(CODE_GS)) {
    files.push({
      name: 'Code',
      type: 'SERVER_JS',
      source: fs.readFileSync(CODE_GS, 'utf8'),
    });
  } else {
    throw new Error(`Code.gs not found at ${CODE_GS}`);
  }

  // Read appsscript.json
  if (fs.existsSync(APPSCRIPT_JSON)) {
    const manifest = JSON.parse(fs.readFileSync(APPSCRIPT_JSON, 'utf8'));
    files.push({
      name: 'appsscript',
      type: 'JSON',
      source: JSON.stringify(manifest, null, 2),
    });
  } else {
    throw new Error(`appsscript.json not found at ${APPSCRIPT_JSON}`);
  }

  return files;
}

// Create or update project
async function createOrUpdateProject(
  script: any,
  scriptId?: string
): Promise<string> {
  const files = prepareFiles();

  if (scriptId) {
    // Update existing project
    console.log(`📝 Updating existing project: ${scriptId}`);
    try {
      await script.projects.updateContent({
        scriptId,
        requestBody: {
          files,
        },
      });
      console.log('✅ Project updated successfully!');
      return scriptId;
    } catch (error: any) {
      if (error.code === 404) {
        console.log('⚠️  Script ID not found, creating new project...');
      } else {
        throw error;
      }
    }
  }

  // Create new project
  console.log('🆕 Creating new Apps Script project...');
  const response = await script.projects.create({
    requestBody: {
      title: 'Pilot MVP Gmail Add-on',
      parentId: undefined, // Standalone project
    },
  });

  const newScriptId = response.data.scriptId!;
  console.log(`✅ Project created with ID: ${newScriptId}`);

  // Upload files
  await script.projects.updateContent({
    scriptId: newScriptId,
    requestBody: {
      files,
    },
  });

  console.log('✅ Files uploaded successfully!');
  return newScriptId;
}

// Create deployment
async function createDeployment(script: any, scriptId: string): Promise<string> {
  console.log('🚀 Creating deployment...');

  const response = await script.projects.deployments.create({
    scriptId,
    requestBody: {
      versionNumber: undefined, // Use latest version
      description: `Deployed at ${new Date().toISOString()}`,
    },
  });

  const deploymentId = response.data.deploymentId!;
  console.log(`✅ Deployment created: ${deploymentId}`);

  // Get deployment URL
  const deployment = await script.projects.deployments.get({
    scriptId,
    deploymentId,
  });

  console.log('\n📋 Deployment Details:');
  console.log(`   Script ID: ${scriptId}`);
  console.log(`   Deployment ID: ${deploymentId}`);
  console.log(`   Entry Points: ${JSON.stringify(deployment.data.entryPoints, null, 2)}`);

  return deploymentId;
}

// Main deployment function
async function deploy() {
  try {
    console.log('🚀 Starting Gmail Add-on Deployment...\n');

    // Check if files exist
    if (!fs.existsSync(CODE_GS) || !fs.existsSync(APPSCRIPT_JSON)) {
      throw new Error('Gmail add-on files not found. Please ensure Code.gs and appsscript.json exist.');
    }

    // Setup OAuth
    const oauth2Client = getOAuth2Client();
    const accessToken = await getAccessToken(oauth2Client);
    oauth2Client.setCredentials({ access_token: accessToken });

    // Initialize Apps Script API
    const script = google.script('v1');
    script.context._options.auth = oauth2Client;

    // Get or create script ID
    const scriptId = process.env[SCRIPT_ID_ENV];

    // Create or update project
    const finalScriptId = await createOrUpdateProject(script, scriptId);

    // Create deployment
    await createDeployment(script, finalScriptId);

    console.log('\n✅ Deployment completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Go to https://script.google.com');
    console.log(`   2. Open the project (ID: ${finalScriptId})`);
    console.log('   3. Review > Deploy as add-on');
    console.log('   4. Follow the prompts to install in Gmail');
    console.log('\n💡 Tip: Save the Script ID to your .env file:');
    console.log(`   ${SCRIPT_ID_ENV}=${finalScriptId}`);

  } catch (error: any) {
    console.error('\n❌ Deployment failed:');
    console.error(error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deploy();
}

export { deploy };

