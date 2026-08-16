import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { FileText, Download, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAcademicYear } from '../context/AcademicYearContext';

const T = {
  bg: '#06101a', card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  text: '#ddd0b8', muted: '#486070', green: '#1d9468', red: '#b83838',
};

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const download = async (url) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE}${url}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Échec du téléchargement');
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    const disp = res.headers.get('Content-Disposition') || '';
    const m = disp.match(/filename="?([^"]+)"?/);
    a.download = m ? m[1] : 'rapport.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  } catch (e) {
    window.alert(e.message || 'Téléchargement impossible');
  }
};

const btn = (label, icon, onClick, color = T.accent) => (
  <button key={label} onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 6, background: color + '18',
    border: `1px solid ${color}50`, color, borderRadius: 8,
    padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
  }}>
    {icon} {label}
  </button>
);

export default function Rapports() {
  const { years, currentYear } = useAcademicYear();
  const [assiduite, setAssiduite] = useState(null);
  const [paiements, setPaiements] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee] = useState(currentYear);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [a, p, c] = await Promise.all([
        fetchWithAuth(`/rapports/assiduite?anneeScolaire=${annee}${classeId ? `&classeId=${classeId}` : ''}`),
        fetchWithAuth(`/rapports/paiements-en-retard?anneeScolaire=${annee}`),
        fetchWithAuth('/classes?limit=100'),
      ]);
      setAssiduite(a);
      setPaiements(p);
      setClasses(c.classes || []);
    } catch (e) { /* noop */ }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [annee, classeId]);

  const Cell = ({ children, strong }) => (
    <td style={{
      padding: '8px 12px', fontSize: 13, color: strong ? T.text : T.muted,
      borderBottom: `1px solid ${T.border}`, textAlign: 'left',
    }}>{children}</td>
  );

  return (
    <div style={{ padding: '28px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900 }}>Rapports</div>
          <div style={{ fontSize: 12, color: T.muted }}>Assiduité par classe et paiements en retard</div>
        </div>
        <div style={{ flex: 1 }} />
        <select
          value={annee}
          onChange={(e) => setAnnee(e.target.value)}
          style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
        >
          {years.map(y => <option key={y.name} value={y.name}>{y.name}</option>)}
        </select>
        <button onClick={loadAll} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
          border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12,
        }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Assiduité */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={16} color={T.green} />
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 900 }}>Assiduité par classe</div>
              <div style={{ fontSize: 11, color: T.muted }}>Année {annee}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              style={{ background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 12 }}
            >
              <option value="">Toutes les classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            {btn('Excel', <Download size={13} />, () => download(`/rapports/assiduite/export?anneeScolaire=${annee}${classeId ? `&classeId=${classeId}` : ''}`), T.green)}
            {btn('PDF', <Download size={13} />, () => download(`/rapports/assiduite/pdf?anneeScolaire=${annee}${classeId ? `&classeId=${classeId}` : ''}`))}
          </div>
        </div>

        {loading ? (
          <div style={{ color: T.muted, fontSize: 13, padding: 30, textAlign: 'center' }}>Chargement...</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: T.muted, fontSize: 11 }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>CLASSE</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>EFFECTIF</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>ABSENCES</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>RETARDS</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>Taux abs./élève</th>
                </tr>
              </thead>
              <tbody>
                {assiduite?.rows?.map((r, i) => (
                  <tr key={i}>
                    <Cell strong>{r.classe}</Cell>
                    <td style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` }}>{r.effectif}</td>
                    <td style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: r.absences > 0 ? T.red : T.text, borderBottom: `1px solid ${T.border}` }}>{r.absences}</td>
                    <td style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` }}>{r.retards}</td>
                    <td style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{r.tauxAbsence}</td>
                  </tr>
                ))}
                {(!assiduite?.rows || assiduite.rows.length === 0) && (
                  <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Aucune donnée pour cette période.</td></tr>
                )}
              </tbody>
            </table>
            {assiduite?.total && (
              <div style={{ marginTop: 10, fontSize: 12, color: T.muted }}>
                Total : <b style={{ color: T.text }}>{assiduite.total.effectif}</b> élèves, <b style={{ color: T.red }}>{assiduite.total.absences}</b> absences, <b style={{ color: T.text }}>{assiduite.total.retards}</b> retards
              </div>
            )}
          </>
        )}
      </div>

      {/* Paiements en retard */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color={T.red} />
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 900 }}>Paiements en retard</div>
              <div style={{ fontSize: 11, color: T.muted }}>Année {annee} — {paiements?.total || 0} élève(s), {Number(paiements?.totalReste || 0).toLocaleString('fr-FR')} FCFA à recouvrer</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {btn('Excel', <Download size={13} />, () => download(`/rapports/paiements-en-retard/export?anneeScolaire=${annee}`), T.green)}
            {btn('PDF', <Download size={13} />, () => download(`/rapports/paiements-en-retard/pdf?anneeScolaire=${annee}`), T.red)}
          </div>
        </div>

        {loading ? (
          <div style={{ color: T.muted, fontSize: 13, padding: 30, textAlign: 'center' }}>Chargement...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: T.muted, fontSize: 11 }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>MATRICULE</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>ÉLÈVE</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>CLASSE</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>FRAIS</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>PAYÉ</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>RESTE</th>
              </tr>
            </thead>
            <tbody>
              {paiements?.rows?.map((r, i) => (
                <tr key={i}>
                  <Cell>{r.matricule}</Cell>
                  <Cell strong>{r.eleve}</Cell>
                  <Cell>{r.classe}</Cell>
                  <td style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{Number(r.fraisTotal).toLocaleString('fr-FR')}</td>
                  <td style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: T.green, borderBottom: `1px solid ${T.border}` }}>{Number(r.totalPaye).toLocaleString('fr-FR')}</td>
                  <td style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: T.red, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{Number(r.reste).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
              {(!paiements?.rows || paiements.rows.length === 0) && (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Aucun élève en retard de paiement. Bravo !</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
