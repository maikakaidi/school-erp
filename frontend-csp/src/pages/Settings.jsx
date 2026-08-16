import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { useAcademicYear } from '../context/AcademicYearContext';
import { Clock, Archive, Copy, Plus, ChevronRight } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

export default function Settings() {
  const { t } = useTranslation();
  const { years, currentYear, setCurrentYear, refresh: refreshYears } = useAcademicYear();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [message, setMessage] = useState('');
  const [newYearName, setNewYearName] = useState('');
  const [creatingYear, setCreatingYear] = useState(false);
  const [closingYear, setClosingYear] = useState(null);
  const [copyingYear, setCopyingYear] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchWithAuth('/settings');
      setSettings(data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchWithAuth('/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      setMessage(t('settings.saved'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    const formData = new FormData();
    formData.append('logo', logoFile);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error(t('common.error'));
      const res = await response.json();
      setSettings({ ...settings, logoUrl: res.logoUrl });
      setLogoFile(null);
      setMessage(t('settings.saved'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Erreur upload : ' + err.message);
    }
  };

  const handleCreateYear = async () => {
    if (!newYearName.trim()) return;
    setCreatingYear(true);
    try {
      await fetchWithAuth('/api/academic-years', { method: 'POST', body: JSON.stringify({ name: newYearName.trim() }) });
      setNewYearName('');
      await refreshYears();
      setMessage('Année scolaire créée');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.message); }
    finally { setCreatingYear(false); }
  };

  const handleSetCurrent = async (yearId) => {
    try {
      await setCurrentYear(yearId);
      setMessage('Année courante mise à jour');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.message); }
  };

  const handleCloseYear = async (yearId) => {
    if (!confirm('Clôturer cette année ? Les écritures seront bloquées.')) return;
    setClosingYear(yearId);
    try {
      await fetchWithAuth(`/api/academic-years/${yearId}/close`, { method: 'POST' });
      await refreshYears();
      setMessage('Année clôturée');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.message); }
    finally { setClosingYear(null); }
  };

  const handleCopyYear = async (yearId, name) => {
    if (!confirm(`Copier les données vers l'année "${name}" ?`)) return;
    setCopyingYear(yearId);
    try {
      const res = await fetchWithAuth(`/api/academic-years/${yearId}/copy`, { method: 'POST', body: JSON.stringify({ targetYearId: yearId }) });
      await refreshYears();
      setMessage(`Données copiées (${res?.copied || 0} inscriptions)`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.message); }
    finally { setCopyingYear(null); }
  };

  if (loading) return <div style={{ color: T.text }}>{t('common.loading')}</div>;

  return (
    <div className="fade-up">
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text }}>{t('settings.title')}</h1>
      <p style={{ marginBottom: 24, color: T.muted }}>{t('settings.subtitle')}</p>

      {message && <div style={{ background: T.green + '20', padding: 10, borderRadius: 8, marginBottom: 20, color: T.green }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Colonne gauche */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ marginBottom: 16, color: T.text }}>{t('settings.generalInfo')}</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: T.muted, display: 'block', marginBottom: 4 }}>{t('settings.schoolName')}</label>
            <input name="schoolName" value={settings.schoolName || ''} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: T.muted, display: 'block', marginBottom: 4 }}>{t('settings.slogan')}</label>
            <input name="slogan" value={settings.slogan || ''} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: T.muted, display: 'block', marginBottom: 4 }}>{t('settings.phone')}</label>
            <input name="phone" value={settings.phone || ''} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: T.muted, display: 'block', marginBottom: 4 }}>{t('settings.address')}</label>
            <input name="address" value={settings.address || ''} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: T.muted, display: 'block', marginBottom: 4 }}>{t('settings.email')}</label>
            <input name="email" value={settings.email || ''} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: T.muted, display: 'block', marginBottom: 4 }}>{t('settings.signature')}</label>
            <input name="signature" value={settings.signature || ''} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }} />
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ marginBottom: 16, color: T.text }}>{t('settings.visualCustomization')}</h3>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: T.muted, display: 'block', marginBottom: 4 }}>{t('settings.logoUpload')}</label>
            {settings.logoUrl && (
              <div style={{ marginBottom: 10 }}>
                <img src={settings.logoUrl} alt="Logo" style={{ maxWidth: 150, maxHeight: 80, background: '#fff', padding: 4 }} />
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
            <button onClick={handleLogoUpload} disabled={!logoFile} style={{ marginTop: 8, background: T.accent, border: 'none', borderRadius: 6, padding: '4px 12px', color: '#fff', cursor: logoFile ? 'pointer' : 'not-allowed' }}>{t('settings.uploadLogo')}</button>
            <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>{t('settings.logoFormats')}</p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: T.muted, display: 'block', marginBottom: 4 }}>{t('settings.primaryColor')}</label>
            <input name="primaryColor" value={settings.primaryColor || ''} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: T.muted, display: 'block', marginBottom: 4 }}>{t('settings.secondaryColor')}</label>
            <input name="secondaryColor" value={settings.secondaryColor || ''} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: T.muted, display: 'block', marginBottom: 4 }}>{t('settings.bulletinFormat')}</label>
            <select name="bulletinFormat" value={settings.bulletinFormat || 'standard'} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }}>
              <option value="standard">{t('settings.standard')}</option>
              <option value="detaille">{t('settings.detailed')}</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} disabled={saving} style={{ background: T.green, border: 'none', borderRadius: 8, padding: '10px 24px', color: '#fff', cursor: 'pointer' }}>
          {saving ? t('common.loading') : t('settings.saveChanges')}
        </button>
      </div>

      {/* Comptes bancaires */}
      <div style={{ marginTop: 24, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <h3 style={{ marginBottom: 16, color: T.text }}>{t('settings.bankAccountsTitle')}</h3>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>{t('settings.bankAccountsDesc')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, borderRadius: 10, background: T.green + '10', border: `1px solid ${T.green}30` }}>
            <div style={{ fontSize: 11, color: T.green, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>{t('settings.nita')}</div>
            <div style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 900, color: T.text, letterSpacing: '0.05em' }}>99293329</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{t('settings.nitaAccount')}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 10, background: T.blue + '10', border: `1px solid ${T.blue}30` }}>
            <div style={{ fontSize: 11, color: T.blue, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>{t('settings.amanata')}</div>
            <div style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 900, color: T.text, letterSpacing: '0.05em' }}>92666942</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{t('settings.amanataAccount')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}