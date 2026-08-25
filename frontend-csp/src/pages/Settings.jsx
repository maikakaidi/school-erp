import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { useAcademicYear } from '../context/AcademicYearContext';
import { Clock, Archive, Copy, Plus, ChevronRight, Edit2, Trash2, X, Check, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

export default function Settings() {
  const { t } = useTranslation();
  const { years, currentYear, setCurrentYear, refresh: refreshYears } = useAcademicYear();
  const [settings, setSettings] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [message, setMessage] = useState('');
  const [newYearName, setNewYearName] = useState('');
  const [creatingYear, setCreatingYear] = useState(false);
  const [closingYear, setClosingYear] = useState(null);
  const [copyingYear, setCopyingYear] = useState(null);
  const [editingYear, setEditingYear] = useState(null);
  const [editYearName, setEditYearName] = useState('');
  const [deletingYear, setDeletingYear] = useState(null);

  useEffect(() => {
    loadSettings();
    loadSubscription();
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

  const loadSubscription = async () => {
    try {
      const profile = await fetchWithAuth('/schools/profile');
      if (profile) {
        setSubscription({
          subscriptionStatus: profile.subscriptionStatus,
          subscriptionStart: profile.subscriptionStart,
          subscriptionEnd: profile.subscriptionEnd,
          trialDays: profile.trialDays,
          createdAt: profile.createdAt,
        });
      }
    } catch (err) {
      console.error(err);
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
      await fetchWithAuth('/academic-years', { method: 'POST', body: JSON.stringify({ name: newYearName.trim() }) });
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
      await fetchWithAuth('/academic-years/close', { method: 'POST', body: JSON.stringify({ yearId }) });
      await refreshYears();
      setMessage('Année clôturée');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.message); }
    finally { setClosingYear(null); }
  };

  const handleCopyYear = async (yearId, name) => {
    const targetName = prompt(`Nom de l'année cible pour copier depuis "${name}" :`, '');
    if (!targetName || !targetName.trim()) return;
    setCopyingYear(yearId);
    try {
      await fetchWithAuth('/academic-years/copy', { method: 'POST', body: JSON.stringify({ sourceYearId: yearId, targetYearName: targetName.trim() }) });
      await refreshYears();
      setMessage(`Données copiées vers "${targetName.trim()}"`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.message); }
    finally { setCopyingYear(null); }
  };

  const handleEditYear = async (yearId) => {
    if (!editYearName.trim()) return;
    try {
      await fetchWithAuth(`/academic-years/${yearId}`, { method: 'PUT', body: JSON.stringify({ name: editYearName.trim() }) });
      setEditingYear(null);
      await refreshYears();
      setMessage('Année modifiée');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.message); }
  };

  const handleDeleteYear = async (yearId, name) => {
    if (!confirm(`Supprimer l'année "${name}" ? Cette action est irréversible.`)) return;
    setDeletingYear(yearId);
    try {
      await fetchWithAuth(`/academic-years/${yearId}`, { method: 'DELETE' });
      await refreshYears();
      setMessage('Année supprimée');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.message); }
    finally { setDeletingYear(null); }
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

      {/* Abonnement */}
      {(() => {
        const sub = subscription || {};
        const subStatus = sub.subscriptionStatus || 'trial';
        const now = new Date();
        let daysRemaining = 0;
        let startDate = null;
        let endDate = null;
        if (subStatus === 'active' && sub.subscriptionEnd) {
          endDate = new Date(sub.subscriptionEnd);
          daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
          startDate = sub.subscriptionStart ? new Date(sub.subscriptionStart) : null;
        } else if (subStatus === 'trial') {
          const created = sub.createdAt ? new Date(sub.createdAt) : now;
          const trialMs = (sub.trialDays || 15) * 24 * 60 * 60 * 1000;
          endDate = new Date(created.getTime() + trialMs);
          daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
          startDate = created;
        }
        const isExpired = subStatus === 'expired' || subStatus === 'suspended';
        const isLow = daysRemaining <= 7 && daysRemaining > 0 && !isExpired;
        const statusColor = subStatus === 'active' ? T.green : subStatus === 'trial' ? T.accent : T.red;
        const statusLabel = subStatus === 'active' ? t('common.active', 'Actif') : subStatus === 'trial' ? t('common.trial', 'Essai') : t('common.expired', 'Expiré');

        return (
          <div style={{ marginTop: 24, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: T.text, margin: 0 }}>
                <CreditCard size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                {t('settings.subscription', 'Abonnement')}
              </h3>
              <button onClick={loadSubscription} title={t('common.refresh', 'Actualiser')} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: T.muted + '15', border: `1px solid ${T.muted}30`, color: T.muted, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <RefreshCw size={12} /> {t('common.refresh', 'Actualiser')}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              <div style={{ padding: 14, borderRadius: 10, background: statusColor + '10', border: `1px solid ${statusColor}30` }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{t('common.subscriptionStatus', 'Statut')}</div>
                <span style={{
                  fontSize: 12, padding: '3px 10px', borderRadius: 20,
                  background: statusColor + '20', color: statusColor,
                  border: `1px solid ${statusColor}40`, fontWeight: 700,
                }}>{statusLabel}</span>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: T.bg, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{t('common.subscriptionStart', 'Date de début')}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{startDate ? startDate.toLocaleDateString('fr-FR') : '—'}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: T.bg, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{t('common.expiresAt', 'Expire le')}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{endDate ? endDate.toLocaleDateString('fr-FR') : '—'}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: isExpired ? T.red + '10' : isLow ? T.accent + '10' : T.bg, border: `1px solid ${isExpired ? T.red : isLow ? T.accent : T.border}30` }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{t('common.daysRemaining', 'Jours restants')}</div>
                <div style={{ fontSize: 18, fontFamily: "'Fraunces', serif", fontWeight: 900, color: isExpired ? T.red : isLow ? T.accent : T.text }}>{isExpired ? '0' : daysRemaining}</div>
              </div>
            </div>
            {isLow && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: T.accent + '15', border: `1px solid ${T.accent}30`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.accent }}>
                <AlertTriangle size={14} />
                {t('settings.subscriptionLow', `Il ne reste que ${daysRemaining} jour(s). Veuillez renouveler votre abonnement.`)}
              </div>
            )}
            {isExpired && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: T.red + '15', border: `1px solid ${T.red}30`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.red }}>
                <AlertTriangle size={14} />
                {t('settings.subscriptionExpired', 'Votre abonnement a expiré. Veuillez contacter le Super Admin pour le renouveler.')}
              </div>
            )}
          </div>
        );
      })()}

      {/* Années scolaires */}
      <div style={{ marginTop: 24, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <h3 style={{ marginBottom: 16, color: T.text }}>
          <Clock size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          {t('settings.academicYears', 'Années scolaires')}
        </h3>

        {/* Créer une année */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            value={newYearName}
            onChange={e => setNewYearName(e.target.value)}
            placeholder="2026-2027"
            onKeyDown={e => e.key === 'Enter' && handleCreateYear()}
            style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}
          />
          <button onClick={handleCreateYear} disabled={creatingYear || !newYearName.trim()} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: T.accent, border: 'none', borderRadius: 8, color: '#fff',
            cursor: newYearName.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13,
          }}>
            <Plus size={14} /> {creatingYear ? '...' : t('settings.createYear', 'Créer')}
          </button>
        </div>

        {/* Liste des années */}
        {years.length === 0 ? (
          <p style={{ color: T.muted, fontSize: 13 }}>Aucune année scolaire</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {years.map(y => (
              <div key={y.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: y.isCurrent ? T.accent + '15' : 'transparent',
                border: `1px solid ${y.isCurrent ? T.accent : T.border}30`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {editingYear === y.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input value={editYearName} onChange={e => setEditYearName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEditYear(y.id)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', color: T.text, fontSize: 13, width: 120 }} autoFocus />
                      <button onClick={() => handleEditYear(y.id)} style={{ padding: '2px 6px', borderRadius: 4, background: T.green, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11 }}><Check size={12} /></button>
                      <button onClick={() => setEditingYear(null)} style={{ padding: '2px 6px', borderRadius: 4, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, cursor: 'pointer', fontSize: 11 }}><X size={12} /></button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{y.name}</span>
                      {y.isCurrent && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: T.green + '20', color: T.green, fontWeight: 700 }}>
                          {t('settings.current', 'Courante')}
                        </span>
                      )}
                      {y.isArchived && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: T.muted + '20', color: T.muted, fontWeight: 700 }}>
                          {t('settings.archived', 'Archivée')}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {editingYear !== y.id && (
                    <button onClick={() => { setEditingYear(y.id); setEditYearName(y.name); }} title="Modifier" style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: T.muted + '15', border: `1px solid ${T.muted}30`, color: T.muted, cursor: 'pointer',
                    }}>
                      <Edit2 size={12} style={{ verticalAlign: 'middle' }} />
                    </button>
                  )}
                  {!y.isCurrent && !y.isArchived && (
                    <button onClick={() => handleSetCurrent(y.id)} title="Définir courante" style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: T.green + '15', border: `1px solid ${T.green}30`, color: T.green, cursor: 'pointer',
                    }}>
                      <ChevronRight size={12} style={{ verticalAlign: 'middle' }} /> {t('settings.setCurrent', 'Courante')}
                    </button>
                  )}
                  {!y.isArchived && (
                    <button onClick={() => handleCloseYear(y.id)} disabled={closingYear === y.id} title="Clôturer" style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: T.accent + '15', border: `1px solid ${T.accent}30`, color: T.accent, cursor: 'pointer',
                    }}>
                      <Archive size={12} style={{ verticalAlign: 'middle' }} /> {closingYear === y.id ? '...' : t('settings.close', 'Clôturer')}
                    </button>
                  )}
                  {!y.isArchived && (
                    <button onClick={() => handleCopyYear(y.id, y.name)} disabled={copyingYear === y.id} title="Copier inscriptions" style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: T.blue + '15', border: `1px solid ${T.blue}30`, color: T.blue, cursor: 'pointer',
                    }}>
                      <Copy size={12} style={{ verticalAlign: 'middle' }} /> {copyingYear === y.id ? '...' : t('settings.copy', 'Copier')}
                    </button>
                  )}
                  {!y.isCurrent && (
                    <button onClick={() => handleDeleteYear(y.id, y.name)} disabled={deletingYear === y.id} title="Supprimer" style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: '#b8383815', border: '1px solid #b8383830', color: '#b83838', cursor: 'pointer',
                    }}>
                      <Trash2 size={12} style={{ verticalAlign: 'middle' }} /> {deletingYear === y.id ? '...' : ''}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}