import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { databases, cfg } from "../services/appwrite";
import { useAuth } from "../context/AuthContext";
import { applyToJob } from "../services/api";

export default function JobDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const doc = await databases.getDocument(cfg.db, cfg.colJobs, id);
      setJob(doc);
    })();
  }, [id]);

  async function apply() {
    if (!user) return alert("Login first");
    if (profile?.role !== "candidate") return alert("Only candidates can apply");
    setBusy(true);
    try {
      await applyToJob({ jobId: id, candidateUserId: user.$id, candidateProfileId: profile.$id });
      alert("Applied ✅");
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!job) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container py-4">
      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h4 className="mb-1">{job.title}</h4>
              <div className="text-muted small mb-3">
                {job.companyName} • {job.location} • {job.type} • <span className="badge text-bg-light">{job.status}</span>
              </div>

              <h6>Description</h6>
              <p className="text-muted">{job.description}</p>

              <h6>Requirements</h6>
              <p className="text-muted">{job.requirements || "—"}</p>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6>Apply Now</h6>
              <p className="small text-muted">Fast apply with your candidate profile.</p>
              <button className="btn btn-primary w-100" disabled={busy || job.status !== "open"} onClick={apply}>
                {busy ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}