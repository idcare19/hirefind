import { useEffect, useMemo, useState } from "react";
import { listJobs } from "../services/api";
import JobCard from "../components/JobCard";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Landing() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await listJobs();
        setJobs(res.documents || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dashboardLink =
    profile?.role === "candidate"
      ? { to: "/candidate", label: "Candidate Dashboard" }
      : profile?.role === "company"
      ? { to: "/company", label: "Company Dashboard" }
      : profile?.role === "admin"
      ? { to: "/admin", label: "Admin Dashboard" }
      : { to: "/login", label: "Login / Signup" };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return jobs.filter((j) => {
      const text = `${j.title || ""} ${j.location || ""} ${j.type || ""} ${j.companyName || ""}`.toLowerCase();
      const matchesQuery = !needle || text.includes(needle);

      // Remote filter: match "remote" in location or type
      const remoteMatch =
        (j.location || "").toLowerCase().includes("remote") ||
        (j.type || "").toLowerCase().includes("remote");

      const matchesType =
        typeFilter === "All" ||
        (typeFilter === "Remote"
          ? remoteMatch
          : (j.type || "").toLowerCase() === typeFilter.toLowerCase());

      const isOpen = !j.status || j.status === "open";
      return matchesQuery && matchesType && isOpen;
    });
  }, [jobs, q, typeFilter]);

  const openJobsCount = useMemo(
    () => jobs.filter((j) => !j.status || j.status === "open").length,
    [jobs]
  );

  return (
    <div className="bg-light" style={{ minHeight: "100vh" }}>
      {/* Slim top banner (instead of big alert) */}
      <div className="bg-warning-subtle border-bottom">
        <div className="container py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="small">
            🚧 <b>Under Production</b> — core features work; improvements are ongoing.
          </div>
          <a className="small text-decoration-none text-dark" href="#jobs">
            View jobs ↓
          </a>
        </div>
      </div>

      {/* HERO */}
      <div className="bg-white border-bottom">
        <div className="container py-5">
          <div className="row g-4 align-items-center">
            {/* LEFT */}
            <div className="col-lg-7">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="badge text-bg-dark">HireFind</span>
                <span className="text-muted small">by IDCARE19</span>
              </div>

              <h1 className="fw-bold mb-2" style={{ letterSpacing: "-0.6px" }}>
                Find jobs fast. Hire smarter.
              </h1>

              <p className="text-muted mb-4" style={{ maxWidth: 560 }}>
                Candidates apply in seconds. Companies post jobs with full control. Admin manages everything from one dashboard.
              </p>

              {/* SEARCH + CTA */}
              <div className="row g-2 align-items-center">
                <div className="col-md-8">
                  <div className="input-group input-group-lg shadow-sm">
                    <span className="input-group-text bg-white border-end-0">🔎</span>
                    <input
                      className="form-control border-start-0"
                      placeholder="Search title, company, location..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4 d-grid">
                  <Link className="btn btn-dark btn-lg" to={dashboardLink.to}>
                    {dashboardLink.label}
                  </Link>
                </div>
              </div>

              {/* FILTER PILLS (cleaner style) */}
              <div className="d-flex flex-wrap gap-2 mt-3">
                {["All", "Internship", "Full-time", "Part-time", "Remote"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`btn btn-sm rounded-pill ${
                      typeFilter === t ? "btn-primary" : "btn-outline-primary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Tiny trust line (not too many badges) */}
              <div className="text-muted small mt-3">
                Role-based dashboards • Secure CRUD • Company approval flow
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h6 className="mb-0">Snapshot</h6>
                    <span className="badge text-bg-light border">
                      {profile?.role || "guest"}
                    </span>
                  </div>

                  <div className="row g-3 mt-1">
                    <Metric title="Open jobs" value={openJobsCount} />
                    <Metric title="Results" value={filtered.length} />
                    <Metric title="website" value="hirefind.idcare19.me" />
                  </div>

                  <div className="mt-4 p-3 rounded-3 bg-light border">
                    <div className="fw-semibold">Become a Company</div>
                    <div className="small text-muted">
                      Submit your company request. Admin can approve or reject anytime.
                    </div>
                    <div className="d-grid mt-3">
                      <Link className="btn btn-outline-dark" to="/become-company">
                        Request Access
                      </Link>
                    </div>
                  </div>

                  <div className="small text-muted mt-3">
                    Add 2–3 demo jobs so the landing feels alive for internship reviewers.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured categories: keep but make them simpler + less noisy */}
          <div className="row g-3 mt-4">
            <CategoryCard title="Engineering" subtitle="Frontend • Backend • Full Stack" />
            <CategoryCard title="Design" subtitle="UI/UX • Product • Branding" />
            <CategoryCard title="Marketing" subtitle="Growth • Content • SEO" />
          </div>
        </div>
      </div>

      {/* JOB LIST */}
      <div className="container py-5" id="jobs">
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-3">
          <div>
            <h5 className="mb-1">Latest jobs</h5>
            <div className="text-muted small">
              Showing <b>{filtered.length}</b> result(s)
              {typeFilter !== "All" ? ` • Filter: ${typeFilter}` : ""}
            </div>
          </div>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              setQ("");
              setTypeFilter("All");
            }}
          >
            Reset
          </button>
        </div>

        {loading ? (
          <div className="text-muted">Loading jobs...</div>
        ) : (
          <div className="d-grid gap-3">
            {filtered.map((job) => (
              <JobCard key={job.$id} job={job} />
            ))}
            {filtered.length === 0 && (
              <div className="text-muted">
                No jobs found. (Company/Admin can post jobs.)
              </div>
            )}
          </div>
        )}

        <div className="text-center text-muted small mt-5">
          HireFind • Built by IDCARE19 • React + Appwrite
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="col-6">
      <div className="p-3 rounded-3 border bg-white">
        <div className="text-muted small">{title}</div>
        <div className="fw-semibold text-truncate">{String(value)}</div>
      </div>
    </div>
  );
}

function CategoryCard({ title, subtitle }) {
  return (
    <div className="col-md-4">
      <div className="p-4 bg-white rounded-4 shadow-sm border h-100">
        <div className="fw-semibold">{title}</div>
        <div className="small text-muted">{subtitle}</div>
      </div>
    </div>
  );
}