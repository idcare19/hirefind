// src/services/api.js
import { ID, Query, Permission, Role } from "appwrite";
import { account, databases, cfg } from "./appwrite";

/**
 * IMPORTANT:
 * Your schema uses `user_id` (underscore) in profiles and companyRequests.
 * Permissions MUST use the Auth user id (e.g. "69a8410c..."), not companyName/website.
 */

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

// ----------------------
// PROFILES
// ----------------------

export async function getMyProfile(userId) {
  const res = await databases.listDocuments(cfg.db, cfg.colProfiles, [
    Query.equal("user_id", userId),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

export async function ensureProfile(user) {
  const existing = await getMyProfile(user.$id);
  if (existing) return existing;

  return await databases.createDocument(
    cfg.db,
    cfg.colProfiles,
    ID.unique(),
    {
      user_id: user.$id,
      name: user.name || "User",
      email: user.email,
      role: "candidate", // candidate | company | admin
      companyName: "",
    },
    [
      Permission.read(Role.user(user.$id)),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ]
  );
}

// ----------------------
// JOBS CRUD
// ----------------------

export async function listJobs() {
  return await databases.listDocuments(cfg.db, cfg.colJobs, [
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ]);
}

export async function listJobsByCompany(profileId) {
  return await databases.listDocuments(cfg.db, cfg.colJobs, [
    Query.equal("companyProfileId", profileId),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ]);
}

/**
 * Create a job.
 * ownerUserId MUST be the Auth user id (user.$id) so permissions are valid.
 */
export async function createJob(data, ownerUserId) {
  return await databases.createDocument(
    cfg.db,
    cfg.colJobs,
    ID.unique(),
    data,
    [
      Permission.read(Role.any()),              // anyone can view jobs
      Permission.update(Role.user(ownerUserId)),
      Permission.delete(Role.user(ownerUserId)),
    ]
  );
}

export async function updateJob(jobId, data) {
  return await databases.updateDocument(cfg.db, cfg.colJobs, jobId, data);
}

export async function deleteJob(jobId) {
  return await databases.deleteDocument(cfg.db, cfg.colJobs, jobId);
}

// ----------------------
// APPLICATIONS
// ----------------------

export async function applyToJob({
  jobId,
  candidateUserId,      // Auth user id
  candidateProfileId,   // profiles doc id (optional but good)
  coverLetter = "",
}) {
  return await databases.createDocument(
    cfg.db,
    cfg.colApplications,
    ID.unique(),
    {
      jobId,
      candidateUserId,
      candidateProfileId,
      status: "applied",
      dateApplied: new Date().toISOString(),
      coverLetter,
    },
    [
      Permission.read(Role.user(candidateUserId)),
      Permission.update(Role.user(candidateUserId)),
      Permission.delete(Role.user(candidateUserId)),
    ]
  );
}

export async function listMyApplications(candidateUserId) {
  return await databases.listDocuments(cfg.db, cfg.colApplications, [
    Query.equal("candidateUserId", candidateUserId),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ]);
}

export async function listApplicationsForJob(jobId) {
  return await databases.listDocuments(cfg.db, cfg.colApplications, [
    Query.equal("jobId", jobId),
    Query.orderDesc("$createdAt"),
    Query.limit(200),
  ]);
}

export async function updateApplication(appId, data) {
  return await databases.updateDocument(cfg.db, cfg.colApplications, appId, data);
}

// ----------------------
// COMPANY REQUESTS (Become a Company flow)
// Table: companyRequests
// Columns: user_id, companyName, website, status
// status: pending/approved/rejected
// ----------------------

/**
 * Create a company request.
 * user_id MUST be Auth user id (user.$id)
 */
export async function createCompanyRequest({ user_id, companyName, website }) {
  return await databases.createDocument(
    cfg.db,
    cfg.colCompanyRequests,
    ID.unique(),
    { user_id, companyName, website, status: "pending" },
    [
      // allow this user + admin to read/update/delete this request
      Permission.read(Role.user(user_id)),
      Permission.update(Role.user(user_id)),
      Permission.delete(Role.user(user_id)),
      // Optional: allow all logged-in users to read (remove if you want strict privacy)
      // Permission.read(Role.users()),
    ]
  );
}

export async function getMyCompanyRequest(user_id) {
  const res = await databases.listDocuments(cfg.db, cfg.colCompanyRequests, [
    Query.equal("user_id", user_id),
    Query.orderDesc("$createdAt"),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

export async function listCompanyRequestsPending() {
  return await databases.listDocuments(cfg.db, cfg.colCompanyRequests, [
    Query.equal("status", "pending"),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ]);
}

export async function setCompanyRequestStatus(requestId, status) {
  return await databases.updateDocument(cfg.db, cfg.colCompanyRequests, requestId, { status });
}

/**
 * Admin helper:
 * Approve request -> mark approved + update profile role to company
 */
export async function approveCompanyRequest(requestDoc) {
  // mark request approved
  await setCompanyRequestStatus(requestDoc.$id, "approved");

  // find profile by user_id and promote
  const prof = await databases.listDocuments(cfg.db, cfg.colProfiles, [
    Query.equal("user_id", requestDoc.user_id),
    Query.limit(1),
  ]);
  const profileDoc = prof.documents[0];
  if (!profileDoc) throw new Error("Profile not found for this user_id");

  await databases.updateDocument(cfg.db, cfg.colProfiles, profileDoc.$id, {
    role: "company",
    companyName: requestDoc.companyName,
  });

  return true;
}

export async function rejectCompanyRequest(requestId) {
  await setCompanyRequestStatus(requestId, "rejected");
  return true;
}

// ADMIN HELPERS

export async function setProfileRole(profileDocId, role, companyName = "") {
  return await databases.updateDocument(cfg.db, cfg.colProfiles, profileDocId, {
    role,
    companyName,
  });
}

export async function findProfileByUserId(user_id) {
  const res = await databases.listDocuments(cfg.db, cfg.colProfiles, [
    Query.equal("user_id", user_id),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

export async function setCompanyRequestStatusById(requestId, status) {
  return await databases.updateDocument(cfg.db, cfg.colCompanyRequests, requestId, { status });
}

/**
 * Approve or Reject a company request anytime.
 * - approve: request.status=approved + profile.role=company
 * - reject : request.status=rejected + profile.role=candidate
 */
export async function adminSetCompanyRequestDecision(requestDoc, decision) {
  if (!["approved", "rejected", "pending"].includes(decision)) {
    throw new Error("Invalid decision");
  }

  // 1) update request status
  await setCompanyRequestStatusById(requestDoc.$id, decision);

  // 2) update profile role based on decision
  const profile = await findProfileByUserId(requestDoc.user_id);
  if (!profile) throw new Error("Profile not found for this user_id");

  if (decision === "approved") {
    await setProfileRole(profile.$id, "company", requestDoc.companyName || "");
  } else if (decision === "rejected") {
    await setProfileRole(profile.$id, "candidate", ""); // demote + clear companyName
  }
  // pending = keep current role (no change)

  return true;
}