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
  }, [user, loading]);

  const fetchUsers = async () => {
    try {
      const token = await getIdToken(auth.currentUser!);
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal ambil users');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleBan = async (userId: string, action: 'ban' | 'unban') => {
    try {
      const token = await getIdToken(auth.currentUser!);
      const res = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) throw new Error('Gagal update ban');
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, banned: action === 'ban' } : u
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading || loadingData) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Daftar User ({users.length})</h2>
            <button
              onClick={fetchUsers}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
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
                  <tr key={u.id} className="border-t">
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
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBan(u.id, 'ban')}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Ban
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center p-4 text-gray-500">
                      Belum ada user terdaftar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
