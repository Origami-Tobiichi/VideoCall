import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { getIdToken } from 'firebase/auth';
import { auth } from '../firebase/client';

interface User {
  id: string;
  email: string;
  name: string | null;
  gender: string | null;
  age: number | null;
  country: string | null;
  banned: boolean;
  createdAt: string;
}

interface OnlineUser {
  uid: string;
  email: string;
  displayName: string;
  online: boolean;
  timestamp: number;
}

interface Log {
  id: number;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, banned, active
  const [search, setSearch] = useState('');

  // Cek admin
  useEffect(() => {
    if (!loading && user) {
      if (user.email !== 'itsukakotori790@gmail.com') {
        router.push('/');
      } else {
        fetchAllData();
        // Refresh data setiap 10 detik
        const interval = setInterval(fetchOnlineUsers, 10000);
        return () => clearInterval(interval);
      }
    }
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading]);

  const fetchAllData = async () => {
    await Promise.all([fetchUsers(), fetchOnlineUsers(), fetchLogs()]);
    setLoadingData(false);
  };

  const fetchUsers = async () => {
    try {
      const token = await getIdToken(auth.currentUser!);
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal ambil users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const token = await getIdToken(auth.currentUser!);
      const res = await fetch('/api/admin/online', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOnlineUsers(data);
      }
    } catch (err) {
      console.warn('Gagal ambil online users:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const token = await getIdToken(auth.currentUser!);
      const res = await fetch('/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.warn('Gagal ambil logs:', err);
    }
  };

  const handleBan = async (userId: string, action: 'ban' | 'unban', reason?: string) => {
    try {
      const token = await getIdToken(auth.currentUser!);
      const res = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action, reason: reason || '' }),
      });
      if (!res.ok) throw new Error('Gagal update ban');
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, banned: action === 'ban' } : u
        )
      );
      
      // Refresh logs
      await fetchLogs();
      
      alert(`User berhasil ${action === 'ban' ? 'di-ban' : 'di-unban'}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'banned' && !u.banned) return false;
    if (filter === 'active' && u.banned) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.email.toLowerCase().includes(q) || 
             (u.name && u.name.toLowerCase().includes(q));
    }
    return true;
  });

  if (loading || loadingData) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  const totalUsers = users.length;
  const bannedCount = users.filter(u => u.banned).length;
  const onlineCount = onlineUsers.length;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total User</div>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Online</div>
            <div className="text-2xl font-bold text-green-600">{onlineCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Banned</div>
            <div className="text-2xl font-bold text-red-600">{bannedCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-bold text-blue-600">{totalUsers - bannedCount}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daftar User */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Daftar User</h2>
              <div className="flex gap-2 flex-wrap">
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  className="p-1 border rounded"
                >
                  <option value="all">Semua</option>
                  <option value="active">Aktif</option>
                  <option value="banned">Banned</option>
                </select>
                <input
                  type="text"
                  placeholder="Cari..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="p-1 border rounded"
                />
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2">Email</th>
                    <th className="p-2">Nama</th>
                    <th className="p-2">Gender</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.name || '-'}</td>
                      <td className="p-2">{u.gender || '-'}</td>
                      <td className="p-2">
                        {u.banned ? (
                          <span className="text-red-600 font-semibold">Banned</span>
                        ) : (
                          <span className="text-green-600 font-semibold">Active</span>
                        )}
                      </td>
                      <td className="p-2">
                        {u.banned ? (
                          <button
                            onClick={() => handleBan(u.id, 'unban')}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const reason = prompt('Alasan ban (opsional):');
                              handleBan(u.id, 'ban', reason || undefined);
                            }}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs"
                          >
                            Ban
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-gray-500">
                        Tidak ada user
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar: Online Users & Logs */}
          <div className="space-y-4">
            {/* Online Users */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-2">
                Online ({onlineCount})
              </h2>
              <div className="max-h-[200px] overflow-y-auto">
                {onlineUsers.length === 0 ? (
                  <p className="text-gray-500 text-sm">Tidak ada user online</p>
                ) : (
                  <ul className="space-y-1">
                    {onlineUsers.map((u) => (
                      <li key={u.uid} className="flex items-center gap-2 text-sm border-b py-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                        <span className="font-medium">{u.displayName || u.email || u.uid}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(u.timestamp).toLocaleTimeString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Logs */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-2">Log Aktivitas</h2>
              <div className="max-h-[300px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-sm">Belum ada log</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {logs.slice(0, 20).map((log) => (
                      <li key={log.id} className="border-b py-1">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          {log.details}
                        </span>
                        <span className="text-gray-400 text-xs block">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
