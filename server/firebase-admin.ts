import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

let projectId = "";
try {
  const configRaw = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
  const config = JSON.parse(configRaw);
  projectId = config.projectId;
} catch (e) {
  console.warn("Could not read firebase-applet-config.json, admin SDK might fail.");
}

if (!getApps().length) {
  initializeApp({
    projectId: projectId || process.env.GOOGLE_CLOUD_PROJECT || "demo-project"
  });
}

export const auth = getAuth();
