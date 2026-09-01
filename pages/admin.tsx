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
  isOnline: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      if (user.email !== 'itsukakotori790@gmail.com') {
        router.push('/');
      } else {
        fetchUsers();
      }
    }
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, retryCount]);

  const fetchUsers = async () => {
    setLoadingData(true);
    setError('');
    try {
      const token = await getIdToken(auth.currentUser!, true);
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Coba ambil error message dari response
        let errorMsg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          errorMsg = errData.error || errData.message || errorMsg;
        } catch (e) {
          // Jika response bukan JSON, ambil text
          const text = await res.text();
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Fetch users error:', err);
      setError(err.message || 'Gagal mengambil data user. Periksa koneksi atau login ulang.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleBan = async (userId: string, action: 'ban' | 'unban') => {
    try {
      const token = await getIdToken(auth.currentUser!, true);
      const res = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal update ban');
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, banned: action === 'ban' } : u
        )
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status ban');
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-xl">Loading...</div>
            {error && <div className="text-red-500 mt-2">{error}</div>}
            {error && (
              <button
                onClick={() => setRetryCount((c) => c + 1)}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Coba Lagi
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <span className="font-bold">Error:</span> {error}
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Refresh
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Daftar User ({users.length})</h2>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            {users.length === 0 ? (
              <div className="text-center p-8 text-gray-500">Belum ada user terdaftar</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2">Email</th>
                    <th className="p-2">Nama</th>
                    <th className="p-2">Gender</th>
                    <th className="p-2">Usia</th>
                    <th className="p-2">Negara</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Online</th>
                    <th className="p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.name || '-'}</td>
                      <td className="p-2">{u.gender || '-'}</td>
                      <td className="p-2">{u.age || '-'}</td>
                      <td className="p-2">{u.country || '-'}</td>
                      <td className="p-2">
                        {u.banned ? (
                          <span className="text-red-600 font-semibold">Banned</span>
                        ) : (
                          <span className="text-green-600 font-semibold">Active</span>
                        )}
                      </td>
                      <td className="p-2">
                        {u.isOnline ? (
                          <span className="text-green-500">🟢 Online</span>
                        ) : (
                          <span className="text-gray-400">⚪ Offline</span>
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
                            onClick={() => handleBan(u.id, 'ban')}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs"
                          >
                            Ban
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
