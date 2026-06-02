import dynamic from 'next/dynamic';
import EntityDetail from '@/components/EntityDetail';
import AlertsPanel from '@/components/AlertsPanel';
import StatsPanel from '@/components/StatsPanel';

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false });

export default function Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <Globe />
      <EntityDetail />
      <AlertsPanel />
      <StatsPanel />
    </div>
  );
}
