import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import JobCard from "../components/JobCard";
import { applyToJob, listJobs, listMyApplications } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function CandidateDashboard() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("recommended");
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    (async () => {
      const res = await listJobs();
      setJobs(res.documents);
      const a = await listMyApplications(user.$id);
      setApps(a.documents);
    })();
  }, [user?.$id]);

  const sidebarItems = [
    { key: "recommended", label: "Recommended" },
    { key: "applications", label: "Applications" },
  ];

  async function onApply(jobId) {
    setBusyId(jobId);
    try {
      await applyToJob({ jobId, candidateUserId: user.$id, candidateProfileId: profile.$id });
      const a = await listMyApplications(user.$id);
      setApps(a.documents);
      alert("Application sent ✅");
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId("");
    }
  }

  const appliedJobIds = new Set(apps.map((a) => a.jobId));

  return (
    <div className="container py-4">
      <div className="row g-3">
        <div className="col-lg-3">
          <Sidebar items={sidebarItems} active={tab} onSelect={setTab} />
        </div>

        <div className="col-lg-9">
          <div className="row g-3 mb-2">
            <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><div className="small text-muted">Applications Sent</div><div className="h4 mb-0">{apps.length}</div></div></div></div>
            <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><div className="small text-muted">Interviews</div><div className="h4 mb-0">{apps.filter(a => a.status === "interview").length}</div></div></div></div>
            <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><div className="small text-muted">Profile Views</div><div className="h4 mb-0">115</div></div></div></div>
          </div>

          {tab === "recommended" && (
            <div className="d-grid gap-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.$id}
                  job={job}
                  rightSlot={
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={busyId === job.$id || appliedJobIds.has(job.$id) || job.status !== "open"}
                      onClick={() => onApply(job.$id)}
                    >
                      {appliedJobIds.has(job.$id) ? "Applied" : busyId === job.$id ? "Applying..." : "Apply"}
                    </button>
                  }
                />
              ))}
            </div>
          )}

          {tab === "applications" && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="mb-3">Your Applications</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>JobId</th>
                        <th>Status</th>
                        <th>Applied</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apps.map((a) => (
                        <tr key={a.$id}>
                          <td className="small">{a.jobId}</td>
                          <td><span className="badge text-bg-light">{a.status}</span></td>
                          <td className="small">{new Date(a.$createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {apps.length === 0 && (
                        <tr><td colSpan="3" className="text-muted">No applications yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}