import { Client, Account, Databases, Storage } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const cfg = {
  db: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  colProfiles: import.meta.env.VITE_APPWRITE_COL_PROFILES,
  colJobs: import.meta.env.VITE_APPWRITE_COL_JOBS,
  colApplications: import.meta.env.VITE_APPWRITE_COL_APPLICATIONS,
  colCompanyRequests: import.meta.env.VITE_APPWRITE_COL_COMPANY_REQUESTS
};