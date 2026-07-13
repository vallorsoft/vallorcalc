"use client";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Props {
  initialUsers: User[];
  currentUserId: string;
}

export function UsersManager({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function addUser() {
    setError("");
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    setBusy(false);
    if (res.ok) {
      const u = await res.json();
      setUsers([...users, u]);
      setName(""); setEmail(""); setPassword(""); setRole("VIEWER"); setAdding(false);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Hiba a mentés során.");
    }
  }

  async function changeRole(id: string, newRole: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) setUsers(users.map((u) => u.id === id ? { ...u, role: newRole } : u));
  }

  async function resetPassword(id: string) {
    const pw = prompt("Új jelszó (min. 6 karakter):");
    if (!pw) return;
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) alert("Jelszó frissítve.");
    else { const d = await res.json().catch(() => ({})); alert(d.error ?? "Hiba."); }
  }

  async function deleteUser(id: string) {
    if (!confirm("Biztosan törlöd ezt a felhasználót?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers(users.filter((u) => u.id !== id));
    else { const d = await res.json().catch(() => ({})); alert(d.error ?? "Hiba."); }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Felhasználók listája</h2>
          {!adding && (
            <button onClick={() => setAdding(true)} className="text-sm text-blue-700 hover:underline">+ Új felhasználó</button>
          )}
        </div>

        {adding && (
          <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-3 mb-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-gray-500">Név</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input text-sm" placeholder="Teljes név" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input text-sm" placeholder="email@ceg.ro" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Jelszó (min. 6)</label>
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="input text-sm" placeholder="jelszó" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Szerepkör</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="input text-sm">
                    <option value="VIEWER">Néző (VIEWER)</option>
                    <option value="ADMIN">Admin (ADMIN)</option>
                  </select>
                </div>
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button onClick={addUser} disabled={busy} className="btn-primary text-sm py-1.5 disabled:opacity-50">{busy ? "Mentés..." : "Hozzáadás"}</button>
              <button onClick={() => { setAdding(false); setError(""); }} className="btn-secondary text-sm py-1.5">Mégse</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 gap-2">
              <div className="min-w-0">
                <div className="font-medium text-gray-800 truncate">{u.name} {u.id === currentUserId && <span className="text-xs text-blue-600">(te)</span>}</div>
                <div className="text-xs text-gray-500 truncate">{u.email}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  disabled={u.id === currentUserId}
                  className="input text-xs py-1 w-24 disabled:opacity-60"
                >
                  <option value="VIEWER">Néző</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button onClick={() => resetPassword(u.id)} title="Jelszó módosítása" className="text-gray-400 hover:text-blue-600 text-sm">🔑</button>
                {u.id !== currentUserId && (
                  <button onClick={() => deleteUser(u.id)} title="Törlés" className="text-red-400 hover:text-red-600 text-lg">×</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        <b>Admin</b>: mindent lát és szerkeszt (járművek, beállítások, felhasználók). <b>Néző</b>: csak kalkulációkat készíthet és nézhet.
      </p>
    </div>
  );
}
