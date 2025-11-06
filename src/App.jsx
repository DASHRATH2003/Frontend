import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

// Use env var in production; fall back to local dev API
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const App = () => {
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    smtp_host: '',
    smtp_port: 587,
    imap_host: '',
    imap_port: 993,
    use_tls: true,
  });

  const [settings, setSettings] = useState({ dailyVolume: 2, maxVolume: 20 });

  const canStart = useMemo(() => accounts.length >= 2, [accounts]);

  async function refreshAll() {
    setLoading(true);
    try {
      const [accRes, logRes, statRes] = await Promise.all([
        axios.get(`${API_BASE}/accounts`),
        axios.get(`${API_BASE}/logs`),
        axios.get(`${API_BASE}/status`),
      ]);
      setAccounts(accRes.data || []);
      setLogs(logRes.data || []);
      setStatus(statRes.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
    const id = setInterval(refreshAll, 5000);
    return () => clearInterval(id);
  }, []);

  async function addAccount(e) {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/accounts`, form);
      setForm({ email: '', password: '', smtp_host: '', smtp_port: 587, imap_host: '', imap_port: 993, use_tls: true });
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteAccount(id) {
    try {
      await axios.delete(`${API_BASE}/accounts/${id}`);
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  }

  async function updateSettings(e) {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/settings`, settings);
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  }

  async function startWarmup() {
    try {
      await axios.post(`${API_BASE}/warmup/start`);
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  }

  async function stopWarmup() {
    try {
      await axios.post(`${API_BASE}/warmup/stop`);
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  }

  async function clearLogs() {
    try {
      await axios.post(`${API_BASE}/logs/clear`);
      refreshAll();
    } catch (err) {
      // Fallback to RESTful DELETE if POST /clear is unavailable
      try {
        await axios.delete(`${API_BASE}/logs`);
        refreshAll();
      } catch (err2) {
        console.error(err2);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Email Warm-Up Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-sm ${status.schedulerActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {status.schedulerActive ? 'Active' : 'Stopped'}
            </span>
            <button onClick={refreshAll} className="px-3 py-1 border rounded">Refresh</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status card */}
        <section className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="font-medium mb-3">Status</h2>
          <div className="space-y-1 text-sm">
            <div>Accounts: <span className="font-semibold">{status.accountCount ?? 0}</span></div>
            <div>Daily Volume: <span className="font-semibold">{status.dailyVolume ?? '-'}</span></div>
            <div>Max Volume: <span className="font-semibold">{status.maxVolume ?? '-'}</span></div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={startWarmup} disabled={!canStart} className={`px-3 py-2 rounded text-sm ${canStart ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Start</button>
            <button onClick={stopWarmup} className="px-3 py-2 rounded text-sm bg-red-600 text-white">Stop</button>
          </div>
        </section>

        {/* Settings */}
        <section className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="font-medium mb-3">Warm-Up Settings</h2>
          <form onSubmit={updateSettings} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Daily Volume</label>
              <input type="number" min={1} value={settings.dailyVolume}
                     onChange={(e) => setSettings(s => ({ ...s, dailyVolume: Number(e.target.value) }))}
                     className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Max Volume</label>
              <input type="number" min={1} value={settings.maxVolume}
                     onChange={(e) => setSettings(s => ({ ...s, maxVolume: Number(e.target.value) }))}
                     className="w-full border rounded px-3 py-2" />
            </div>
            <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Save</button>
          </form>
        </section>

        {/* Add account */}
        <section className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="font-medium mb-3">Add Account</h2>
          <form onSubmit={addAccount} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                     className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                     className="w-full border rounded px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">SMTP Host</label>
                <input value={form.smtp_host} onChange={(e) => setForm(f => ({ ...f, smtp_host: e.target.value }))}
                       className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">SMTP Port</label>
                <input type="number" value={form.smtp_port} onChange={(e) => setForm(f => ({ ...f, smtp_port: Number(e.target.value) }))}
                       className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">IMAP Host</label>
                <input value={form.imap_host} onChange={(e) => setForm(f => ({ ...f, imap_host: e.target.value }))}
                       className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">IMAP Port</label>
                <input type="number" value={form.imap_port} onChange={(e) => setForm(f => ({ ...f, imap_port: Number(e.target.value) }))}
                       className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <button type="submit" className="px-3 py-2 rounded bg-green-600 text-white text-sm">Add</button>
          </form>
        </section>

        {/* Accounts list */}
        <section className="col-span-2 bg-white rounded-lg shadow p-4">
          <h2 className="font-medium mb-3">Accounts</h2>
          {accounts.length === 0 ? (
            <div className="text-sm text-gray-600">No accounts yet. Add at least two to start warm-up.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Email</th>
                  <th className="py-2">SMTP</th>
                  <th className="py-2">IMAP</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(a => (
                  <tr key={a.id} className="border-b">
                    <td className="py-2">{a.email}</td>
                    <td className="py-2">{a.smtp_host || '-'}:{a.smtp_port || '-'}</td>
                    <td className="py-2">{a.imap_host || '-'}:{a.imap_port || '-'}</td>
                    <td className="py-2">
                      <button onClick={() => deleteAccount(a.id)} className="px-2 py-1 border rounded">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Logs */}
        <section className="col-span-1 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Recent Logs</h2>
            <button onClick={clearLogs} className="px-2 py-1 border rounded text-sm">Clear Logs</button>
          </div>
          <div className="max-h-80 overflow-auto text-sm space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{l.sender}</span>
                  <span className="mx-1">→</span>
                  <span>{l.receiver}</span>
                </div>
                <div className={`text-xs ${l.status === 'sent' ? 'text-green-600' : 'text-red-600'}`}>{l.status}</div>
              </div>
            ))}
            {logs.length === 0 && <div className="text-gray-600">No logs yet.</div>}
          </div>
        </section>
      </main>

      {loading && (
        <div className="fixed bottom-4 right-4 px-3 py-2 bg-black text-white rounded">Loading…</div>
      )}
    </div>
  );
};

export default App;