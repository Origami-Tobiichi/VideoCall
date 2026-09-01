import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/client';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'itsukakotori790@gmail.com';
  const [bannedCount, setBannedCount] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/admin/users')
        .then(res => res.json())
        .then(data => {
          const banned = data.filter((u: any) => u.banned).length;
          setBannedCount(banned);
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center flex-wrap">
      <Link href="/" className="text-xl font-bold text-blue-600">📹 RandomCall</Link>
      <div className="flex gap-4 items-center flex-wrap">
        {user ? (
          <>
            <Link href="/profile" className="text-gray-700 hover:text-blue-600">Profil</Link>
            {isAdmin && (
              <Link href="/admin" className="text-gray-700 hover:text-blue-600 relative">
                Admin
                {bannedCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {bannedCount}
                  </span>
                )}
              </Link>
            )}
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-md">Logout</button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
            <Link href="/register" className="text-gray-700 hover:text-blue-600">Registrasi</Link>
          </>
        )}
      </div>
    </nav>
  );
}
