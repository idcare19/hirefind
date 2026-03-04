import { useEffect, useState } from "react";

export default function JobForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState({
    title: "",
    location: "",
    type: "Internship",
    status: "open",
    description: "",
    requirements: "",
  });

  useEffect(() => {
    if (initial) setForm((p) => ({ ...p, ...initial }));
  }, [initial]);

  function set(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function submit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={submit} className="card border-0 shadow-sm">
      <div className="card-body">
        <h6 className="mb-3">{initial ? "Update Job" : "Post a Job"}</h6>

        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label small">Job Title</label>
            <input className="form-control" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="col-md-6">
            <label className="form-label small">Location</label>
            <input className="form-control" value={form.location} onChange={(e) => set("location", e.target.value)} required />
          </div>

          <div className="col-md-4">
            <label className="form-label small">Type</label>
            <select className="form-select" value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option>Internship</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Remote</option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label small">Status</label>
            <select className="form-select" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="open">open</option>
              <option value="closed">closed</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label small">Description</label>
            <textarea className="form-control" rows="3" value={form.description} onChange={(e) => set("description", e.target.value)} required />
          </div>

          <div className="col-12">
            <label className="form-label small">Requirements</label>
            <textarea className="form-control" rows="3" value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
          </div>
        </div>

        <div className="mt-3 d-flex gap-2">
          <button disabled={submitting} className="btn btn-primary">
            {submitting ? "Saving..." : initial ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}