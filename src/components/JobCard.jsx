import { Link } from "react-router-dom";

export default function JobCard({ job, rightSlot }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between gap-3">
          <div>
            <h6 className="mb-1">{job.title}</h6>
            <div className="small text-muted">
              {job.location} • {job.type} • <span className="badge text-bg-light">{job.status}</span>
            </div>
          </div>
          <div className="d-flex align-items-start gap-2">
            <Link className="btn btn-outline-secondary btn-sm" to={`/job/${job.$id}`}>
              View
            </Link>
            {rightSlot}
          </div>
        </div>
        <p className="mt-3 mb-0 small text-muted" style={{ maxHeight: 40, overflow: "hidden" }}>
          {job.description}
        </p>
      </div>
    </div>
  );
}