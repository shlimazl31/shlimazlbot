'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Giriş Hatası</h1>
        <p className="text-red-400 mb-6">
          {error === 'OAuthCallback'
            ? 'Discord ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.'
            : 'Bir hata oluştu. Lütfen tekrar deneyin.'}
        </p>
        <Link
          href="/auth/signin"
          className="inline-block bg-[#5865F2] text-white px-6 py-3 rounded-md hover:bg-[#4752C4] transition-colors"
        >
          Tekrar Dene
        </Link>
      </div>
    </div>
  );
} 