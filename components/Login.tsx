import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from 'firebase/auth';
import { auth } from '../firebase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmResult, setConfirmResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const syncUser = async (user: any) => {
    try {
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName || '',
        }),
      });
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await syncUser(cred.user);
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') alert('Email tidak ditemukan.');
      else if (error.code === 'auth/wrong-password') alert('Password salah.');
      else alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await syncUser(cred.user);
      router.push('/');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phone || phone.length < 10) {
      alert('Masukkan nomor telepon yang valid.');
      return;
    }
    let phoneNumber = phone;
    if (!phone.startsWith('+')) phoneNumber = '+62' + phone.replace(/^0+/, '');

    setLoading(true);
    try {
      const container = document.getElementById('recaptcha-container');
      if (!container) {
        alert('Elemen reCAPTCHA tidak ditemukan.');
        setLoading(false);
        return;
      }
      const verifier = new RecaptchaVerifier(
        'recaptcha-container',
        { size: 'invisible' },
        auth
      );
      await verifier.render();

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmResult(confirmation);
      alert('Kode verifikasi dikirim ke ' + phoneNumber);
    } catch (error: any) {
      alert(error.message || 'Gagal mengirim kode.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      alert('Masukkan kode 6 digit.');
      return;
    }
    setLoading(true);
    try {
      const result = await confirmResult.confirm(verificationCode);
      await syncUser(result.user);
      router.push('/');
    } catch (error: any) {
      alert('Kode verifikasi salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Login</h2>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Login dengan Email'}
        </button>
      </form>

      <hr className="my-4" />

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition disabled:opacity-50"
      >
        Login dengan Google
      </button>

      <hr className="my-4" />

      <div className="space-y-2">
        <input
          type="tel"
          placeholder="Nomor Telepon (misal 8123456789)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handlePhoneLogin}
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition disabled:opacity-50"
        >
          {loading ? 'Mengirim...' : 'Kirim Kode'}
        </button>

        {confirmResult && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Kode Verifikasi (6 digit)"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full p-2 border rounded"
              maxLength={6}
            />
            <button
              onClick={handleVerifyCode}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded mt-2 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi'}
            </button>
          </div>
        )}
      </div>

      <div id="recaptcha-container" className="mt-4"></div>

      <p className="mt-4 text-center">
        Belum punya akun? <Link href="/register" className="text-blue-600 hover:underline">Daftar</Link>
      </p>
    </div>
  );
}
