'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem('wiom_token');
    localStorage.removeItem('wiom_user');
    localStorage.removeItem('wiom_profile_complete');
    localStorage.removeItem('wiom_pending_payment');
    router.replace('/login');
  }, [router]);

  return null;
}
