import { useState, useEffect } from 'react';
import { useParent } from '../../context/ParentContext';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { Wallet, Download } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070',
};

const fmt = (n) => (n === null || n === undefined ? '—' : `${n.toLocaleString('fr-FR')} FCFA`);

export default function ParentPaiements() {
  const { children, selectedChildId } = useParent();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    setLoading(true);
    fetchWithAuth(`/parent/payments?childId=${selectedChildId}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedChildId]);

  const downloadRecu = async (recuNumber) => {
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

  if (children.length === 0) {
    return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Aucun enfant rattaché à votre compte.</div>;
  }

  if (loading && !data) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Chargement...</div>;

  const { fraisTotal = 0, totalPaye = 0, resteAPayer = 0, versements = [], classe } = data || {};
  const pct = fraisTotal > 0 ? Math.min(100, (totalPaye / fraisTotal) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Paiements</div>
          <div style={{ fontSize: 12, color: T.muted }}>
            {classe ? `Classe ${classe}` : ''} · Année {data?.anneeScolaire || ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <Card label="Frais scolaires" value={fmt(fraisTotal)} color={T.blue} />
        <Card label="Déjà payé" value={fmt(totalPaye)} color={T.green} />
        <Card label="Reste à payer" value={fmt(resteAPayer)} color={resteAPayer > 0 ? T.red : T.green} />
      </div>

      {fraisTotal > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.muted, marginBottom: 8 }}>
            <span>Progression des paiements</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div style={{ height: 10, borderRadius: 6, background: T.border, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: resteAPayer > 0 ? T.accent : T.green }} />
          </div>
        </div>
      )}

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Historique des paiements</div>
        {versements.length === 0 && <div style={{ fontSize: 12, color: T.muted }}>Aucun paiement enregistré.</div>}
        {versements.map((v) => (
          <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Tranche {v.tranche}</div>
              <div style={{ fontSize: 11, color: T.muted }}>
                {new Date(v.datePaiement).toLocaleDateString('fr-FR')} · {v.modePaiement} · {v.recuNumber}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>{fmt(v.montantPaye)}</div>
              {v.reduction > 0 && <div style={{ fontSize: 10, color: T.muted }}>Réduction : {fmt(v.reduction)}</div>}
              <button
                onClick={() => downloadRecu(v.recuNumber)}
                title={`Reçu ${v.recuNumber}`}
                style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', color: T.accent, cursor: 'pointer', fontSize: 11 }}
              >
                <Download size={12} /> Reçu
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ label, value, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: '1 1 180px' }}>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}
