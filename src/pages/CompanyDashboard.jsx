import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import JobCard from "../components/JobCard";
import JobForm from "../components/JobForm";
import { createJob, deleteJob, listJobsByCompany, updateJob, listApplicationsForJob, updateApplication } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function CompanyDashboard() {
  const { profile } = useAuth();
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [apps, setApps] = useState([]);

  const sidebarItems = [
    { key: "jobs", label: "Manage Jobs" },
    { key: "post", label: "Post Job" },
    { key: "applications", label: "Applications" },
  ];

  async function refreshJobs() {
    const res = await listJobsByCompany(profile.$id);
    setJobs(res.documents);
  }

  useEffect(() => {
    refreshJobs();
  }, [profile?.$id]);

  async function submitJob(form) {
    setSubmitting(true);
    try {
      if (editing) {
        await updateJob(editing.$id, form);
        setEditing(null);
      } else {
        await createJob({
          ...form,
          companyProfileId: profile.$id,
          companyName: profile.companyName || "Company",
        });
      }
      await refreshJobs();
      setTab("jobs");
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(jobId) {
    if (!confirm("Delete this job?")) return;
    await deleteJob(jobId);
    await refreshJobs();
  }

  async function openApps(job) {
    setSelectedJob(job);
    const res = await listApplicationsForJob(job.$id);
    setApps(res.documents);
    setTab("applications");
  }

  async function setAppStatus(appId, status) {
    await updateApplication(appId, { status });
    const res = await listApplicationsForJob(selectedJob.$id);
    setApps(res.documents);
  }

  return (
    <div className="container py-4">
      <div className="row g-3">
        <div className="col-lg-3">
          <Sidebar items={sidebarItems} active={tab} onSelect={setTab} />
        </div>

        <div className="col-lg-9">
          {tab === "jobs" && (
            <div className="d-grid gap-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.$id}
                  job={job}
                  rightSlot={
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={() => { setEditing(job); setTab("post"); }}>
                        Edit
                      </button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => remove(job.$id)}>
                        Delete
                      </button>
                      <button className="btn btn-dark btn-sm" onClick={() => openApps(job)}>
                        Applicants
                      </button>
                    </div>
                  }
                />
              ))}
              {jobs.length === 0 && <div className="text-muted">No jobs posted yet.</div>}
            </div>
          )}

          {tab === "post" && (
            <JobForm initial={editing} onSubmit={submitJob} submitting={submitting} />
          )}

          {tab === "applications" && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Applications</h6>
                  <span className="small text-muted">{selectedJob ? selectedJob.title : ""}</span>
                </div>

                <div className="table-responsive mt-3">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>CandidateUserId</th>
                        <th>Status</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apps.map((a) => (
                        <tr key={a.$id}>
                          <td className="small">{a.candidateUserId}</td>
                          <td><span className="badge text-bg-light">{a.status}</span></td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-secondary" onClick={() => setAppStatus(a.$id, "interview")}>Interview</button>
                              <button className="btn btn-outline-success" onClick={() => setAppStatus(a.$id, "hired")}>Hired</button>
                              <button className="btn btn-outline-danger" onClick={() => setAppStatus(a.$id, "rejected")}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {apps.length === 0 && (
                        <tr><td colSpan="3" className="text-muted">No applicants yet.</td></tr>
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