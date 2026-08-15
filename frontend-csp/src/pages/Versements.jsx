import { useState, useEffect } from 'react';
import { Search, DollarSign, Printer, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { downloadExcel } from '../api/downloadExcel';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

export default function Versements() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [anneeScolaire, setAnneeScolaire] = useState('2025-2026');
  const [eleve, setEleve] = useState(null);
  const [situation, setSituation] = useState(null);
  const [versements, setVersements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ tranche: 1, montant: '', modePaiement: 'cash', reduction: 0, commentaire: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Récupère le montant total des frais pour un élève (selon sa classe et l'année)
  const getFraisForEleve = async (eleveId, annee) => {
    try {
      // 1. Récupérer l'inscription de l'élève pour l'année
      const inscriptions = await fetchWithAuth(`/inscriptions?anneeScolaire=${annee}`);
      const inscription = inscriptions.find(i => i.eleveId === eleveId);
      if (!inscription) return 300000; // valeur par défaut si pas d'inscription
      // 2. Récupérer les frais pour cette classe
      const frais = await fetchWithAuth(`/frais/classe?classeId=${inscription.classeId}&anneeScolaire=${annee}`);
      return frais ? frais.total : 300000;
    } catch (err) {
      console.error('Erreur chargement frais', err);
      return 300000;
    }
  };

  const searchEleve = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchWithAuth(`/eleves?search=${encodeURIComponent(searchTerm)}&limit=5`);
      if (data.eleves && data.eleves.length > 0) {
        const found = data.eleves[0];
        setEleve(found);
        await loadVersements(found.id);
        await loadSituation(found.id);
      } else {
        setError(t('versements.noStudentFound'));
        setEleve(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVersements = async (eleveId) => {
    try {
      const data = await fetchWithAuth(`/versements/eleve?eleveId=${eleveId}&anneeScolaire=${anneeScolaire}`);
      setVersements(data || []);
    } catch (err) { console.error(err); }
  };

  const loadSituation = async (eleveId) => {
    try {
      const fraisTotal = await getFraisForEleve(eleveId, anneeScolaire);
      const data = await fetchWithAuth(`/versements/situation?eleveId=${eleveId}&anneeScolaire=${anneeScolaire}&fraisTotal=${fraisTotal}`);
      setSituation(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eleve) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        eleveId: eleve.id,
        anneeScolaire,
        tranche: form.tranche,
        montant: parseFloat(form.montant),
        reduction: parseFloat(form.reduction) || 0,
        modePaiement: form.modePaiement,
        commentaire: form.commentaire,
      };
      const result = await fetchWithAuth('/versements', { method: 'POST', body: JSON.stringify(payload) });
      setSuccess(`${t('versements.recordSaved')}: ${result.versement.recuNumber}`);
      await loadVersements(eleve.id);
      await loadSituation(eleve.id);
      setForm({ ...form, montant: '', reduction: 0, commentaire: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async (recuNumber) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/versements/recu/${recuNumber}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
      });
      if (!response.ok) throw new Error('Erreur génération du reçu');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu_${recuNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };
return (
  <div className="fade-up">
    <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text }}>{t('versements.title')}</h1>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <p style={{ color: T.muted }}>{t('versements.subtitle')}</p>
      <button onClick={() => downloadExcel(`/versements/export?anneeScolaire=${anneeScolaire}`, 'versements.xlsx')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', color: T.muted, cursor: 'pointer', fontSize: 12 }}>
        <Download size={14} /> Excel
      </button>
    </div>

    {/* Recherche élève */}
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 2 }}>
          <label style={{ fontSize: 11, color: T.muted }}>{t('bulletins.nomPrenomMatricule')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('versements.searchPlaceholder')}
              style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px', color: T.text }}
            />
            <button onClick={searchEleve} style={{ background: T.accent, border: 'none', borderRadius: 8, padding: '0 18px', color: '#fff', cursor: 'pointer' }}>
              <Search size={16} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: T.muted }}>{t('notes.anneeScolaire')}</label>
          <select
            value={anneeScolaire}
            onChange={(e) => setAnneeScolaire(e.target.value)}
            style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px', color: T.text }}
          >
            <option>2024-2025</option>
            <option>2025-2026</option>
            <option>2026-2027</option>
          </select>
        </div>
      </div>
    </div>

    {/* Fiche élève + situation */}
    {eleve && (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ color: T.text }}>{eleve.nom} {eleve.prenom}</h3>
            <p style={{ fontSize: 12, color: T.muted }}>Matricule: {eleve.matricule}</p>
          </div>
          {situation && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: T.muted }}>{t('versements.fraisTotal')}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.accent }}>{situation.fraisTotal.toLocaleString()} FCFA</div>
              <div style={{ fontSize: 12, color: T.green }}>{t('versements.paye')}: {situation.totalPaye.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: T.red }}>{t('versements.reste')}: {situation.resteAPayer.toLocaleString()}</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, color: T.muted }}>{t('versements.tranche')}</label>
            <select
              value={form.tranche}
              onChange={(e) => setForm({ ...form, tranche: parseInt(e.target.value) })}
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px' }}
            >
              <option value={1}>{t('versements.tranche1')}</option>
              <option value={2}>{t('versements.tranche2')}</option>
              <option value={3}>{t('versements.tranche3')}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.muted }}>{t('versements.montantFCFA')}</label>
            <input
              type="number"
              value={form.montant}
              onChange={(e) => setForm({ ...form, montant: e.target.value })}
              required
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px', color: T.text }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.muted }}>{t('versements.reduction')}</label>
            <input
              type="number"
              step="0.1"
              value={form.reduction}
              onChange={(e) => setForm({ ...form, reduction: e.target.value })}
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px', color: T.text }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.muted }}>{t('versements.modePaiement')}</label>
            <select
              value={form.modePaiement}
              onChange={(e) => setForm({ ...form, modePaiement: e.target.value })}
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px' }}
            >
              <option value="cash">{t('versements.especes')}</option>
              <option value="bank">{t('versements.virement')}</option>
              <option value="mobile">{t('versements.mobileMoney')}</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <label style={{ fontSize: 11, color: T.muted }}>{t('versements.commentaire')}</label>
            <input
              value={form.commentaire}
              onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px', color: T.text }}
            />
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <button type="submit" disabled={loading} style={{ background: T.green, border: 'none', borderRadius: 8, padding: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              <DollarSign size={16} style={{ display: 'inline', marginRight: 8 }} /> {t('versements.enregistrerPaiement')}
            </button>
          </div>
        </form>

        {success && <div style={{ background: T.green + '20', borderLeft: `4px solid ${T.green}`, padding: 10, marginBottom: 16, fontSize: 12, color: T.green }}>{success}</div>}
        {error && <div style={{ background: T.red + '20', borderLeft: `4px solid ${T.red}`, padding: 10, marginBottom: 16, fontSize: 12, color: T.red }}>{error}</div>}

        {/* Historique des versements */}
        <div>
          <h4 style={{ fontSize: 14, color: T.text, marginBottom: 12 }}>{t('versements.history')}</h4>
          {versements.length === 0 ? (
            <p style={{ fontSize: 12, color: T.muted }}>{t('versements.noVersement')}</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[t('versements.headers.date'), t('versements.headers.tranche'), t('versements.headers.montant'), t('versements.headers.mode'), t('versements.headers.recu')].map((h, idx) => (
                    <th key={idx} style={{ textAlign: 'left', padding: '8px 0', fontSize: 11, color: T.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {versements.map((v) => (
                  <tr key={v.id}>
                    <td style={{ padding: '8px 0', fontSize: 12 }}>{new Date(v.datePaiement).toLocaleDateString()}</td>
                    <td style={{ padding: '8px 0', fontSize: 12 }}>{v.tranche}</td>
                    <td style={{ padding: '8px 0', fontSize: 12 }}>{v.montantPaye.toLocaleString()} FCFA</td>
                    <td style={{ padding: '8px 0', fontSize: 12 }}>{v.modePaiement}</td>
                    <td style={{ padding: '8px 0' }}>
                      <button onClick={() => handlePrintReceipt(v.recuNumber)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent }}>
                        <Printer size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )}
  </div>
);
}