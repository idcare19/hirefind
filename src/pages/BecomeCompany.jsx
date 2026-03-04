import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createCompanyRequest, getMyCompanyRequest } from "../services/api";

export default function BecomeCompany() {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [existing, setExisting] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const req = await getMyCompanyRequest(user.$id);
      setExisting(req);
    })();
  }, [user?.$id]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    try {
      // user_id MUST be auth user id
      const req = await createCompanyRequest({
        user_id: user.$id,
        companyName,
        website,
      });

      setExisting(req);
      setMsg("Request submitted ✅ Waiting for admin approval.");
    } catch (e) {
      setMsg(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h4 className="mb-2">Become a Company</h4>
          <p className="text-muted small mb-3">
            Submit your company details. Admin will approve and your role becomes <b>company</b>.
          </p>

          {existing ? (
            <div className="alert alert-info mb-0">
              <div><b>Status:</b> {existing.status}</div>
              <div><b>Company:</b> {existing.companyName}</div>
              <div><b>Website:</b> {existing.website}</div>
              {existing.status === "approved" && (
                <div className="mt-2 small">
                  Approved ✅ Go to <b>/company</b> dashboard.
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="d-grid gap-2">
              <input
                className="form-control"
                placeholder="Company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <input
                className="form-control"
                placeholder="Website (https://...)"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                required
              />
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          )}

          {msg && <div className="alert alert-light border mt-3 mb-0">{msg}</div>}
        </div>
      </div>
    </div>
  );
}