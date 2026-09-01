import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function Profile() {
  const { user } = useAuth();
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGender(data.gender || '');
          setAge(data.age || '');
          setCountry(data.country || '');
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError('Gagal memuat profil: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      alert('Silakan login terlebih dahulu.');
      return;
    }
    if (!gender) {
      alert('Pilih gender terlebih dahulu.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const docRef = doc(firestore, 'users', user.uid);
      await setDoc(
        docRef,
        {
          gender,
          age: age || '',
          country: country || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Sinkron ke Neon juga
      try {
        await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            gender,
            age: parseInt(age) || null,
            country,
          }),
        });
      } catch (syncErr) {
        console.warn('Sync to Neon failed:', syncErr);
      }

      alert('Profil berhasil disimpan!');
      router.push('/');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError('Gagal menyimpan profil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-10">Memuat profil...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Profil</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Pilih</option>
            <option value="Pria">👨 Pria</option>
            <option value="Wanita">👩 Wanita</option>
            <option value="Lainnya">⚧ Lainnya</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Usia</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Masukkan usia"
            className="w-full p-2 border rounded"
            min="1"
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Negara</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Pilih negara</option>
            <option value="Indonesia">🇮🇩 Indonesia</option>
            <option value="Malaysia">🇲🇾 Malaysia</option>
            <option value="Singapore">🇸🇬 Singapore</option>
            <option value="Thailand">🇹🇭 Thailand</option>
            <option value="Vietnam">🇻🇳 Vietnam</option>
            <option value="Philippines">🇵🇭 Philippines</option>
            <option value="United States">🇺🇸 United States</option>
            <option value="United Kingdom">🇬🇧 United Kingdom</option>
            <option value="Japan">🇯🇵 Japan</option>
            <option value="South Korea">🇰🇷 South Korea</option>
            <option value="China">🇨🇳 China</option>
            <option value="India">🇮🇳 India</option>
            <option value="Australia">🇦🇺 Australia</option>
            <option value="Germany">🇩🇪 Germany</option>
            <option value="France">🇫🇷 France</option>
            <option value="Brazil">🇧🇷 Brazil</option>
            <option value="Russia">🇷🇺 Russia</option>
            <option value="Other">🌍 Other</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}
