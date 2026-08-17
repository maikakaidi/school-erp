import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { DollarSign, Printer } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

export default function Salaires() {
  const { t } = useTranslation();
  const [salaires, setSalaires] = useState([]);
  const [avances, setAvances] = useState([]);
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avanceForm, setAvanceForm] = useState({ enseignantId: '', montant: '', remarque: '' });
  const [showAvanceModal, setShowAvanceModal] = useState(false);

  useEffect(() => {
    loadSalaires();
    loadAvances();
    loadEnseignants();
  }, [mois, annee]);

  const loadSalaires = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/salaires?mois=${mois}&annee=${annee}`);
      setSalaires(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadAvances = async () => {
    try {
      const data = await fetchWithAuth('/salaires/avances');
      setAvances(data);
    } catch (err) { console.error(err); }
  };

  const loadEnseignants = async () => {
    try {
      const data = await fetchWithAuth('/enseignants?limit=500');
      setEnseignants(data.enseignants || []);
    } catch (err) { console.error(err); }
  };

  const calculerSalaires = async () => {
    try {
      await fetchWithAuth('/salaires/calculer', { method: 'POST', body: JSON.stringify({ mois, annee }) });
      alert(t('salaires.calculated'));
      loadSalaires();
    } catch (err) { alert(err.message); }
  };

  const payer = async (id) => {
    try {
      await fetchWithAuth(`/salaires/${id}/payer`, { method: 'PATCH' });
      loadSalaires();
    } catch (err) { alert(err.message); }
  };

  const telechargerReçu = (id) => {
    window.open(`/api/salaires/recu/${id}`, '_blank');
  };

  const creerAvance = async () => {
    try {
      await fetchWithAuth('/salaires/avances', { method: 'POST', body: JSON.stringify(avanceForm) });
      setShowAvanceModal(false);
      setAvanceForm({ enseignantId: '', montant: '', remarque: '' });
      loadAvances();
      loadSalaires(); // pour recalculer les salaires après avance
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-up">
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text }}>{t('salaires.title')}</h1>
      <p style={{ marginBottom: 24, color: T.muted }}>{t('salaires.subtitle')}</p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <label style={{ color: T.muted }}>{t('salaires.mois')}</label>
          <select value={mois} onChange={e => setMois(parseInt(e.target.value))} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px', color: T.text }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: T.muted }}>{t('salaires.annee')}</label>
          <select value={annee} onChange={e => setAnnee(parseInt(e.target.value))} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px', color: T.text }}>
            <option>{new Date().getFullYear()}</option>
            <option>{new Date().getFullYear() + 1}</option>
          </select>
        </div>
        <button onClick={calculerSalaires} style={{ background: T.blue, border: 'none', borderRadius: 8, padding: '6px 16px', color: '#fff', cursor: 'pointer' }}>{t('salaires.calculer')}</button>
        <button onClick={() => setShowAvanceModal(true)} style={{ background: T.accent, border: 'none', borderRadius: 8, padding: '6px 16px', color: '#fff', cursor: 'pointer' }}>{t('salaires.nouvelleAvance')}</button>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
        <h3 style={{ padding: 16, margin: 0, borderBottom: `1px solid ${T.border}`, color: T.text }}>{t('salaires.listSalaires')}</h3>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('common.loading')}</div>
        ) : salaires.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('salaires.noSalaire')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a1624' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>{t('salaires.headers.enseignant')}</th>
                <th style={{ padding: 12, textAlign: 'left' }}>{t('salaires.headers.base')}</th>
                <th style={{ padding: 12, textAlign: 'left' }}>{t('salaires.headers.prime')}</th>
                <th style={{ padding: 12, textAlign: 'left' }}>{t('salaires.headers.total')}</th>
                <th style={{ padding: 12, textAlign: 'left' }}>{t('salaires.headers.statut')}</th>
                <th style={{ padding: 12 }}>{t('salaires.headers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {salaires.map(s => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}30` }}>
                  <td style={{ padding: 12 }}>{s.enseignant?.nom} {s.enseignant?.prenom}</td>
                  <td style={{ padding: 12 }}>{s.base?.toLocaleString()}</td>
                  <td style={{ padding: 12 }}>{s.primeAnciennete?.toLocaleString() || '0'}</td>
                  <td style={{ padding: 12 }}>{s.total.toLocaleString()}</td>
                  <td style={{ padding: 12 }}>{s.isPaid ? t('salaires.paye') : t('salaires.enAttente')}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    {!s.isPaid && <button onClick={() => payer(s.id)} style={{ background: T.green, border: 'none', borderRadius: 6, padding: '4px 8px', marginRight: 6, cursor: 'pointer' }}><DollarSign size={12} color="#fff" /> {t('salaires.payer')}</button>}
                    <button onClick={() => telechargerReçu(s.id)} style={{ background: T.accent, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}><Printer size={12} /> {t('salaires.recu')}</button>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <h3 style={{ padding: 16, margin: 0, borderBottom: `1px solid ${T.border}`, color: T.text }}>{t('salaires.avancesTitle')}</h3>
        {avances.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('salaires.noAvance')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a1624' }}>
                <th style={{ padding: 12 }}>{t('salaires.headers.enseignant')}</th>
                <th style={{ padding: 12 }}>{t('salaires.avanceHeaders.montant')}</th>
                <th style={{ padding: 12 }}>{t('salaires.avanceHeaders.date')}</th>
                <th style={{ padding: 12 }}>{t('salaires.avanceHeaders.remarque')}</th>
              </tr>
            </thead>
            <tbody>
              {avances.map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}30` }}>
                  <td style={{ padding: 12 }}>{a.enseignant?.nom} {a.enseignant?.prenom}</td>
                  <td style={{ padding: 12 }}>{a.montant.toLocaleString()}</td>
                  <td style={{ padding: 12 }}>{new Date(a.demandeDate).toLocaleDateString()}</td>
                  <td style={{ padding: 12 }}>{a.remarque}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal avance */}
      {showAvanceModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', zIndex: 200, overflow: 'auto', padding: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: 400, margin: 'auto' }}>
            <h2 style={{ marginBottom: 16, color: T.text }}>{t('salaires.nouvelleAvanceTitle')}</h2>
            <select value={avanceForm.enseignantId} onChange={e => setAvanceForm({ ...avanceForm, enseignantId: e.target.value })} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }}>
              <option value="">{t('salaires.selectEnseignant')}</option>
              {enseignants.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
            </select>
            <input type="number" placeholder={t('salaires.montantFCFA')} value={avanceForm.montant} onChange={e => setAvanceForm({ ...avanceForm, montant: e.target.value })} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
            <input placeholder={t('salaires.remarque')} value={avanceForm.remarque} onChange={e => setAvanceForm({ ...avanceForm, remarque: e.target.value })} style={{ width: '100%', marginBottom: 20, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAvanceModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, cursor: 'pointer' }}>{t('common.cancel')}</button>
              <button onClick={creerAvance} style={{ padding: '8px 16px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
