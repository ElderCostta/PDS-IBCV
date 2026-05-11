import { useState, useEffect } from "react";
import PresenterView from "./components/Presenter";
import RemoteView from "./components/Remote";

export default function App() {
  const [role, setRole] = useState<"presenter" | "remote" | null>(null);
  const [presentationId, setPresentationId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    const idParam = params.get("id");

    if (roleParam === "remote" && idParam) {
      setRole("remote");
      setPresentationId(idParam);
    } else {
      setRole("presenter");
      // Use existing ID if in URL, otherwise check localStorage, otherwise generate
      const existingId = idParam || localStorage.getItem("presentationId") || Math.random().toString(36).substring(2, 9);
      setPresentationId(existingId);
      if (!idParam) {
        // Update URL without reloading to include the ID
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("id", existingId);
        window.history.replaceState({}, "", newUrl.toString());
      }
      localStorage.setItem("presentationId", existingId);
    }
  }, []);

  if (!role || !presentationId) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-sans">
      <div className="animate-pulse">Loading Slide Remote...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-rose-500/30">
      {role === "presenter" ? (
        <PresenterView presentationId={presentationId} />
      ) : (
        <RemoteView presentationId={presentationId} />
      )}
    </div>
  );
}
