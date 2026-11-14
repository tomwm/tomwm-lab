'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import RiskDashboard from '@/components/results/RiskDashboard';

export default function ResultsPage() {
  const { wizardComplete, assessment, resetAll } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!wizardComplete) {
      router.replace('/wizard');
    }
  }, [wizardComplete, router]);

  if (!wizardComplete || !assessment) {
    return null;
  }

  function handleReset() {
    resetAll();
    router.push('/');
  }

  return <RiskDashboard assessment={assessment} onReset={handleReset} />;
}
