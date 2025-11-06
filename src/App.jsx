import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

// Use env var in production; fall back to local dev API
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const App = () => {
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      try {
        await axios.delete(`${API_BASE}/logs`);
        refreshAll();
      } catch (err2) {
        console.error(err2);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Email Warm-Up
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Automated email reputation management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                status.schedulerActive 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-1 ${
                  status.schedulerActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`}></span>
                {status.schedulerActive ? 'Active' : 'Stopped'}
              </div>
              
              <button 
                onClick={refreshAll}
                className="inline-flex items-center p-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline ml-2">Refresh</span>
              </button>

              {/* Mobile menu button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden inline-flex items-center p-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile status */}
          <div className={`sm:hidden pb-3 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              status.schedulerActive 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1 ${
                status.schedulerActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></span>
              Status: {status.schedulerActive ? 'Warm-Up Active' : 'Stopped'}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:flex space-x-8 overflow-x-auto`}>
            {['overview', 'accounts', 'settings', 'logs'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                }}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-lg bg-blue-50">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Accounts</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{status.accountCount ?? 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-lg bg-green-50">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Daily Volume</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{status.dailyVolume ?? '-'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-lg bg-purple-50">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Max Volume</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{status.maxVolume ?? '-'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-lg bg-orange-50">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Status</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {status.schedulerActive ? 'Active' : 'Stopped'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Warm-Up Control</h2>
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-gray-600">
                    {canStart 
                      ? 'Ready to start warm-up process with your email accounts.'
                      : 'Add at least 2 email accounts to start warm-up process.'
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={startWarmup}
                      disabled={!canStart}
                      className={`flex-1 inline-flex justify-center items-center px-4 py-2 sm:py-3 border border-transparent rounded-lg text-sm font-medium text-white transition-all duration-200 ${
                        canStart
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm'
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start Warm-Up
                    </button>
                    <button
                      onClick={stopWarmup}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      Stop Warm-Up
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Settings</h2>
                <form onSubmit={updateSettings} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Daily Volume</label>
                      <input
                        type="number"
                        min={1}
                        value={settings.dailyVolume}
                        onChange={(e) => setSettings(s => ({ ...s, dailyVolume: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Max Volume</label>
                      <input
                        type="number"
                        min={1}
                        value={settings.maxVolume}
                        onChange={(e) => setSettings(s => ({ ...s, maxVolume: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all duration-200"
                  >
                    Save Settings
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Add Account Form */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Add New Account</h2>
                  <form onSubmit={addAccount} className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        value={form.email}
                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                        placeholder="user@domain.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">SMTP Settings</h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Host</label>
                          <input
                            value={form.smtp_host}
                            onChange={(e) => setForm(f => ({ ...f, smtp_host: e.target.value }))}
                            className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-xs sm:text-sm"
                            placeholder="smtp.domain.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
                          <input
                            type="number"
                            value={form.smtp_port}
                            onChange={(e) => setForm(f => ({ ...f, smtp_port: Number(e.target.value) }))}
                            className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">IMAP Settings</h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Host</label>
                          <input
                            value={form.imap_host}
                            onChange={(e) => setForm(f => ({ ...f, imap_host: e.target.value }))}
                            className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-xs sm:text-sm"
                            placeholder="imap.domain.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
                          <input
                            type="number"
                            value={form.imap_port}
                            onChange={(e) => setForm(f => ({ ...f, imap_port: Number(e.target.value) }))}
                            className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex justify-center items-center px-4 py-2 sm:py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Account
                    </button>
                  </form>
                </div>
              </div>

              {/* Accounts List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Email Accounts</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {accounts.length} account(s) configured
                    </p>
                  </div>
                  
                  {accounts.length === 0 ? (
                    <div className="p-6 sm:p-12 text-center">
                      <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No accounts yet</h3>
                      <p className="text-xs sm:text-gray-600">Add at least two email accounts to start warm-up process</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {accounts.map((account) => (
                        <div key={account.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-150">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-xs sm:text-sm">
                                  {account.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm sm:font-medium text-gray-900 truncate">{account.email}</h3>
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-1">
                                  <span className="text-xs text-gray-500 truncate">
                                    SMTP: {account.smtp_host || 'Not set'}:{account.smtp_port || 'Not set'}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate">
                                    IMAP: {account.imap_host || 'Not set'}:{account.imap_port || 'Not set'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteAccount(account.id)}
                              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 self-start sm:self-auto"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Warm-Up Configuration</h2>
              <form onSubmit={updateSettings} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Daily Volume</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={settings.dailyVolume}
                        onChange={(e) => setSettings(s => ({ ...s, dailyVolume: Number(e.target.value) }))}
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 sm:mt-2">Number of emails to send per day per account</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Max Volume</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={settings.maxVolume}
                        onChange={(e) => setSettings(s => ({ ...s, maxVolume: Number(e.target.value) }))}
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 sm:mt-2">Maximum emails to send per account</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 sm:pt-6">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all duration-200"
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Activity Logs</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Real-time warm-up activity monitoring</p>
                  </div>
                  <button
                    onClick={clearLogs}
                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Logs
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {logs.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No logs yet</h3>
                    <p className="text-xs sm:text-gray-600">Activity logs will appear here once warm-up starts</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2 sm:space-y-0"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                            log.status === 'sent' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                              <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">{log.sender}</span>
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                              <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">{log.receiver}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(log.timestamp || Date.now()).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
                          log.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed bottom-4 right-4 px-3 py-2 bg-gray-900 text-white rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs sm:text-sm font-medium">Updating...</span>
        </div>
      )}
    </div>
  );
};

export default App;