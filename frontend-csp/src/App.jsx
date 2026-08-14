import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ParentProvider } from './context/ParentContext';
import { NotificationProvider } from './context/NotificationContext';
import { useTranslation } from 'react-i18next';
import Sidebar from './components/Sidebar';
import OfflineBanner from './components/OfflineBanner';
import Dashboard from './pages/Dashboard';
import Eleves from './pages/Eleves';
import Parents from './pages/Parents';
import Absences from './pages/Absences';
import Annonces from './pages/Annonces';
import ComingSoon from './pages/ComingSoon';
import Architecture from './pages/Architecture';
import Login from './pages/auth/Login';
import RegisterSchool from './pages/auth/RegisterSchool';
import Inscriptions from './pages/Inscriptions';
import Bulletins from './pages/Bulletins';
import Versements from './pages/Versements';
import FraisScolaires from './pages/FraisScolaires';
import Matieres from './pages/Matieres';
import Coefficients from './pages/Coefficients';
import Notes from './pages/Notes';
import Examens from './pages/Examens';
import Settings from './pages/Settings';
import Enseignants from './pages/Enseignants';
import Horaires from './pages/Horaires';
import Salaires from './pages/Salaires';
import Depenses from './pages/Depenses';
import Statistiques from './pages/Statistiques';
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import ParentLayout from './components/ParentLayout';
import ParentDashboard from './pages/parent/ParentDashboard';
import ParentNotes from './pages/parent/ParentNotes';
import ParentPaiements from './pages/parent/ParentPaiements';
import ParentAbsences from './pages/parent/ParentAbsences';
import ParentAnnonces from './pages/parent/ParentAnnonces';
import ParentNotifications from './pages/parent/ParentNotifications';
import ParentProfil from './pages/parent/ParentProfil';



// Layout pour les pages protégées (avec sidebar)
function ProtectedLayout({ children }) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#06101a', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: isRtl ? 0 : 255, marginRight: isRtl ? 255 : 0, padding: '0 36px', overflowY: 'auto', height: '100vh' }}>
        {children}
      </div>
    </div>
  );
}
// Routes protégées (authentification requise)
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ color: 'white', padding: 20 }}>Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.actorType === 'parent') {
    return (
      <ParentProvider>
        <ParentLayout>
          <Routes>
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/notes" element={<ParentNotes />} />
            <Route path="/parent/absences" element={<ParentAbsences />} />
            <Route path="/parent/annonces" element={<ParentAnnonces />} />
            <Route path="/parent/notifications" element={<ParentNotifications />} />
            <Route path="/parent/paiements" element={<ParentPaiements />} />
            <Route path="/parent/profil" element={<ParentProfil />} />
            <Route path="*" element={<Navigate to="/parent" replace />} />
          </Routes>
        </ParentLayout>
      </ParentProvider>
    );
  }

  return (
    <Routes>
  <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
  <Route path="/eleves" element={<ProtectedLayout><Eleves /></ProtectedLayout>} />
  <Route path="/parents" element={<ProtectedLayout><Parents /></ProtectedLayout>} />
  <Route path="/absences" element={<ProtectedLayout><Absences /></ProtectedLayout>} />
  <Route path="/annonces" element={<ProtectedLayout><Annonces /></ProtectedLayout>} />
  <Route path="/inscriptions" element={<ProtectedLayout><Inscriptions /></ProtectedLayout>} />
      <Route path="/notes" element={<ProtectedLayout><Notes /></ProtectedLayout>} />
      <Route path="/bulletins" element={<ProtectedLayout><Bulletins /></ProtectedLayout>} />
      <Route path="/examens" element={<ProtectedLayout><Examens /></ProtectedLayout>} />
      <Route path="/versements" element={<ProtectedLayout><Versements /></ProtectedLayout>} />
      <Route path="/depenses" element={<ProtectedLayout><Depenses /></ProtectedLayout>} />
      <Route path="/statistiques" element={<ProtectedLayout><Statistiques /></ProtectedLayout>} />
      <Route path="/frais" element={<ProtectedLayout><FraisScolaires /></ProtectedLayout>} />
      <Route path="/matieres" element={<ProtectedLayout><Matieres /></ProtectedLayout>} />
      <Route path="/coefficients" element={<ProtectedLayout><Coefficients /></ProtectedLayout>} />
      <Route path="/parametres" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="/enseignants" element={<ProtectedLayout><Enseignants /></ProtectedLayout>} />
      <Route path="/horaires" element={<ProtectedLayout><Horaires /></ProtectedLayout>} />
      <Route path="/salaires" element={<ProtectedLayout><Salaires /></ProtectedLayout>} />
      <Route path="/architecture" element={<ProtectedLayout><Architecture /></ProtectedLayout>} />
      <Route path="/super-admin" element={<ProtectedLayout><SuperAdminDashboard /></ProtectedLayout>} />
      <Route path="/users" element={<ProtectedLayout><ComingSoon page="users" /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <OfflineBanner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterSchool />} />
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}