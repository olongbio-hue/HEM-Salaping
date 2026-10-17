import { doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const CHUNK = 400;
const VALID_ID = /^(\d{12}|P_[A-Z0-9]{5,20})$/;

export function registerHemSyncListener() {
  const handler = async (e) => {
    if (e.source !== window || e.origin !== window.location.origin) return;
    const m = e.data;
    if (!m || m.source !== "hem-extension" || m.type !== "HEM_SYNC") return;

    const reply = (ok, message, count = 0) =>
      window.postMessage(
        { source: "hem-dashboard", type: "HEM_SYNC_RESULT", id: m.id, ok, message, count },
        window.location.origin
      );

    try {
      if (!db) return reply(false, "Pangkalan data Firestore belum dimulakan.");
      const user = auth?.currentUser || (typeof window !== "undefined" && localStorage.getItem("hem_salaping_auth_uid") ? { uid: localStorage.getItem("hem_salaping_auth_uid") } : null);
      if (!user) return reply(false, "Sila log masuk dashboard dahulu.");

      const { mode, date, records } = m.payload || {};
      if (!Array.isArray(records) || !records.length) return reply(false, "Tiada rekod diterima.");
      if (mode === "attendance" && !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return reply(false, "Tarikh tidak sah.");

      let saved = 0;
      for (let i = 0; i < records.length; i += CHUNK) {
        const batch = writeBatch(db);
        for (const r of records.slice(i, i + CHUNK)) {
          if (!VALID_ID.test(r.idKey || "")) continue;
          const base = {
            id: r.idKey,
            idKey: r.idKey,
            nokp: r.nokp,
            noKP: r.nokp,
            jenisId: r.jenisId === "ic" ? "ic" : "lain",
            nama: r.nama,
            kelas: r.kelas,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
          };
          if (mode === "students") {
            batch.set(doc(db, "students", r.idKey), base, { merge: true });
          } else if (mode === "attendance") {
            batch.set(
              doc(db, "attendance", `${date}_${r.idKey}`),
              { ...base, tarikh: date, status: r.status, statusAsal: r.statusAsal || "" },
              { merge: true }
            );
          } else continue;
          saved++;
        }
        await batch.commit();
      }

      // Cetuskan event sekiranya ada paparan yang ingin mengemas kini data secara langsung
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("hem-data-synced", { detail: { mode, date, count: saved } }));
      }

      reply(true, `Berjaya: ${saved} rekod ${mode === "students" ? "murid" : "kehadiran"} disimpan.`, saved);
    } catch (err) {
      reply(false, "Ralat Firestore: " + err.message);
    }
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}
