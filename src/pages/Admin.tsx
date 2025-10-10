import AdminDashboard from '@/components/AdminDashboard';
import Navigation from '@/components/Navigation';

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation currentView="admin" onViewChange={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
