import { useEffect, useMemo, useState } from "react";
import { Query } from "appwrite";
import { databases, cfg } from "../services/appwrite";
import {
  adminSetCompanyRequestDecision,
  setProfileRole,
} from "../services/api";

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");

  const [profiles, setProfiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [requests, setRequests] = useState([]);

  const [qUsers, setQUsers] = useState("");
  const [qJobs, setQJobs] = useState("");
  const [reqFilter, setReqFilter] = useState("all"); // all/pending/approved/rejected

  const [busy, setBusy] = useState("");

  async function loadAll() {
    const [p, j, a, r] = await Promise.all([
      databases.listDocuments(cfg.db, cfg.colProfiles, [Query.orderDesc("$createdAt"), Query.limit(200)]),
      databases.listDocuments(cfg.db, cfg.colJobs, [Query.orderDesc("$createdAt"), Query.limit(200)]),
      databases.listDocuments(cfg.db, cfg.colApplications, [Query.orderDesc("$createdAt"), Query.limit(300)]),
      databases.listDocuments(cfg.db, cfg.colCompanyRequests, [Query.orderDesc("$createdAt"), Query.limit(200)]),
    ]);

    setProfiles(p.documents);
    setJobs(j.documents);
    setApps(a.documents);
    setRequests(r.documents);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const stats = useMemo(() => {
    const totalUsers = profiles.length;
    const companies = profiles.filter((x) => x.role === "company").length;
    const admins = profiles.filter((x) => x.role === "admin").length;
    const totalJobs = jobs.length;
    const totalApps = apps.length;
    const pendingReq = requests.filter((x) => x.status === "pending").length;
    return { totalUsers, companies, admins, totalJobs, totalApps, pendingReq };
  }, [profiles, jobs, apps, requests]);

  const filteredUsers = useMemo(() => {
    const q = qUsers.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((u) =>
      `${u.name || ""} ${u.email || ""} ${u.role || ""}`.toLowerCase().includes(q)
    );
  }, [profiles, qUsers]);

  const filteredJobs = useMemo(() => {
    const q = qJobs.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      `${j.title || ""} ${j.companyName || ""} ${j.location || ""}`.toLowerCase().includes(q)
    );
  }, [jobs, qJobs]);

  const filteredRequests = useMemo(() => {
    if (reqFilter === "all") return requests;
    return requests.filter((r) => r.status === reqFilter);
  }, [requests, reqFilter]);

  async function changeUserRole(profileDoc, role) {
    if (!confirm(`Change role for ${profileDoc.email} to "${role}"?`)) return;
    setBusy(profileDoc.$id);
    try {
      await setProfileRole(profileDoc.$id, role, role === "company" ? (profileDoc.companyName || "Company") : "");
      await loadAll();
    } finally {
      setBusy("");
    }
  }

  async function decideRequest(req, decision) {
    const msg =
      decision === "approved"
        ? "Approve and make this user a company?"
        : decision === "rejected"
        ? "Reject and demote this user to candidate?"
        : "Set to pending?";
    if (!confirm(msg)) return;

    setBusy(req.$id);
    try {
      await adminSetCompanyRequestDecision(req, decision);
      await loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy("");
    }
  }

  async function deleteJob(job) {
    if (!confirm(`Delete job "${job.title}"?`)) return;
    setBusy(job.$id);
    try {
      await databases.deleteDocument(cfg.db, cfg.colJobs, job.$id);
      await loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h3 className="mb-0">Admin Control Room</h3>
          <div className="text-muted small">Users • Requests • Jobs • Applications</div>
        </div>
        <button className="btn btn-outline-dark btn-sm" onClick={loadAll}>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <StatCard title="Users" value={stats.totalUsers} />
        <StatCard title="Companies" value={stats.companies} />
        <StatCard title="Jobs" value={stats.totalJobs} />
        <StatCard title="Applications" value={stats.totalApps} />
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 mb-3">
            <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>Overview</TabBtn>
            <TabBtn active={tab === "users"} onClick={() => setTab("users")}>Users</TabBtn>
            <TabBtn active={tab === "requests"} onClick={() => setTab("requests")}>
              Company Requests {stats.pendingReq ? <span className="badge text-bg-warning ms-1">{stats.pendingReq}</span> : null}
            </TabBtn>
            <TabBtn active={tab === "jobs"} onClick={() => setTab("jobs")}>Jobs</TabBtn>
            <TabBtn active={tab === "apps"} onClick={() => setTab("apps")}>Applications</TabBtn>
          </div>

          {tab === "overview" && (
            <div className="row g-3">
              <div className="col-lg-6">
                <div className="p-3 rounded border">
                  <h6 className="mb-2">Quick Actions</h6>
                  <div className="text-muted small mb-3">
                    Approve/reject company requests, change roles, delete spam jobs.
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button className="btn btn-dark btn-sm" onClick={() => setTab("requests")}>
                      Review Requests
                    </button>
                    <button className="btn btn-outline-dark btn-sm" onClick={() => setTab("users")}>
                      Manage Users
                    </button>
                    <button className="btn btn-outline-dark btn-sm" onClick={() => setTab("jobs")}>
                      Manage Jobs
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="p-3 rounded border">
                  <h6 className="mb-2">Role Counts</h6>
                  <div className="small text-muted">Admins: {stats.admins}</div>
                  <div className="small text-muted">Companies: {stats.companies}</div>
                  <div className="small text-muted">Candidates: {stats.totalUsers - stats.admins - stats.companies}</div>
                </div>
              </div>
            </div>
          )}

          {tab === "users" && (
            <>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <input
                  className="form-control form-control-sm"
                  style={{ maxWidth: 420 }}
                  placeholder="Search users by name/email/role..."
                  value={qUsers}
                  onChange={(e) => setQUsers(e.target.value)}
                />
              </div>

              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Company</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.$id}>
                        <td>{u.name || "-"}</td>
                        <td className="text-muted small">{u.email || "-"}</td>
                        <td>
                          <span className="badge text-bg-light border">{u.role}</span>
                        </td>
                        <td>{u.companyName || <span className="text-muted">—</span>}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-secondary"
                              disabled={busy === u.$id}
                              onClick={() => changeUserRole(u, "candidate")}
                            >
                              Candidate
                            </button>
                            <button
                              className="btn btn-outline-primary"
                              disabled={busy === u.$id}
                              onClick={() => changeUserRole(u, "company")}
                            >
                              Company
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              disabled={busy === u.$id}
                              onClick={() => changeUserRole(u, "admin")}
                            >
                              Admin
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan="5" className="text-muted">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "requests" && (
            <>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <div className="btn-group btn-group-sm">
                  <button className={`btn ${reqFilter === "all" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setReqFilter("all")}>All</button>
                  <button className={`btn ${reqFilter === "pending" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setReqFilter("pending")}>Pending</button>
                  <button className={`btn ${reqFilter === "approved" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setReqFilter("approved")}>Approved</button>
                  <button className={`btn ${reqFilter === "rejected" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setReqFilter("rejected")}>Rejected</button>
                </div>
                <div className="text-muted small">
                  You can approve OR reject even after approving (role will change).
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Company</th>
                      <th>Website</th>
                      <th>Status</th>
                      <th className="text-end">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r) => (
                      <tr key={r.$id}>
                        <td className="small text-muted">{r.user_id}</td>
                        <td>{r.companyName}</td>
                        <td className="small">{r.website}</td>
                        <td>
                          <span
                            className={
                              "badge " +
                              (r.status === "pending"
                                ? "text-bg-warning"
                                : r.status === "approved"
                                ? "text-bg-success"
                                : "text-bg-danger")
                            }
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-success"
                              disabled={busy === r.$id}
                              onClick={() => decideRequest(r, "approved")}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              disabled={busy === r.$id}
                              onClick={() => decideRequest(r, "rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRequests.length === 0 && (
                      <tr><td colSpan="5" className="text-muted">No requests.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "jobs" && (
            <>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <input
                  className="form-control form-control-sm"
                  style={{ maxWidth: 420 }}
                  placeholder="Search jobs by title/company/location..."
                  value={qJobs}
                  onChange={(e) => setQJobs(e.target.value)}
                />
              </div>

              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Company</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((j) => (
                      <tr key={j.$id}>
                        <td>{j.title}</td>
                        <td>{j.companyName || <span className="text-muted">—</span>}</td>
                        <td>{j.location || <span className="text-muted">—</span>}</td>
                        <td><span className="badge text-bg-light border">{j.status || "open"}</span></td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={busy === j.$id}
                            onClick={() => deleteJob(j)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredJobs.length === 0 && (
                      <tr><td colSpan="5" className="text-muted">No jobs found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "apps" && (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Candidate</th>
                    <th>Status</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.$id}>
                      <td className="small text-muted">{a.jobId}</td>
                      <td className="small">{a.candidateUserId}</td>
                      <td><span className="badge text-bg-light border">{a.status}</span></td>
                      <td className="small text-muted">{a.dateApplied || a.$createdAt}</td>
                    </tr>
                  ))}
                  {apps.length === 0 && (
                    <tr><td colSpan="4" className="text-muted">No applications yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      className={`btn btn-sm ${active ? "btn-dark" : "btn-outline-dark"}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="text-muted small">{title}</div>
          <div className="fs-4 fw-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}