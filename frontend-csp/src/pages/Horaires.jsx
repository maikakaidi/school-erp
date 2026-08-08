import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function Horaires() {
  const { t } = useTranslation();
  const [horaires, setHoraires] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ enseignantId: '', classeId: '', matiereId: '', jour: 'Lundi', heureDebut: '08:00', heureFin: '09:00', mois, annee });

  useEffect(() => {
    loadData();
  }, [mois, annee]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [horairesData, ensData, classesData, matieresData] = await Promise.all([
        fetchWithAuth(`/horaires?mois=${mois}&annee=${annee}`),
        fetchWithAuth('/enseignants?limit=500'),
        fetchWithAuth('/classes?limit=100'),
        fetchWithAuth('/matieres'),
      ]);
      setHoraires(horairesData || []);
      setEnseignants(ensData.enseignants || []);
      setClasses(classesData.classes || []);
      setMatieres(matieresData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm({ enseignantId: '', classeId: '', matiereId: '', jour: 'Lundi', heureDebut: '08:00', heureFin: '09:00', mois, annee });
    setModal('add');
  };

  const openEdit = (h) => {
    setForm({ id: h.id, enseignantId: h.enseignantId, classeId: h.classeId, matiereId: h.matiereId, jour: h.jour, heureDebut: h.heureDebut, heureFin: h.heureFin, mois: h.mois, annee: h.annee });
    setModal({ id: h.id });
  };

  const closeModal = () => setModal(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async () => {
  // Vérifier que tous les champs requis sont remplis
  if (!form.enseignantId || !form.classeId || !form.matiereId || !form.jour || !form.heureDebut || !form.heureFin) {
    alert(t('horaires.fillAll'));
    return;
  }
  try {
    const payload = { ...form, mois: parseInt(form.mois), annee: parseInt(form.annee) };
    let url = '/horaires';
    let method = 'POST';
    if (modal !== 'add') {
      url = `/horaires/${modal.id}`;
      method = 'PUT';
    }
    await fetchWithAuth(url, { method, body: JSON.stringify(payload) });
    closeModal();
    loadData();
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
};

  const remove = async (id) => {
    if (!confirm(t('horaires.deleteConfirm'))) return;
    try {
      await fetchWithAuth(`/horaires/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

return (
  <div className="fade-up" style={{ paddingTop: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text, marginTop: 0 }}>{t('horaires.title')}</h1>
      <button onClick={openAdd} style={{ background: T.accent, border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', cursor: 'pointer' }}>
        <Plus size={15} /> {t('horaires.addHour')}
      </button>
    </div>



      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={{ color: T.muted }}>{t('horaires.mois')}</label>
          <select value={mois} onChange={e => setMois(parseInt(e.target.value))} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px', color: T.text }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: T.muted }}>{t('horaires.annee')}</label>
          <select value={annee} onChange={e => setAnnee(parseInt(e.target.value))} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px', color: T.text }}>
            <option>{new Date().getFullYear()}</option>
            <option>{new Date().getFullYear() + 1}</option>
          </select>
        </div>
        <button onClick={loadData} style={{ background: T.blue, border: 'none', borderRadius: 8, padding: '6px 16px', color: '#fff', cursor: 'pointer' }}>{t('common.refresh')}</button>
      </div>
<div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
  {loading ? (
    <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('common.loading')}</div>
  ) : horaires.length === 0 ? (
    <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('horaires.noData')}</div>
  ) : (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#0a1624' }}>
          <th style={{ padding: 12, textAlign: 'left' }}>{t('horaires.enseignant')}</th>
          <th style={{ padding: 12, textAlign: 'left' }}>{t('horaires.classe')}</th>
          <th style={{ padding: 12, textAlign: 'left' }}>{t('horaires.matiere')}</th>
          <th style={{ padding: 12, textAlign: 'left' }}>{t('horaires.jour')}</th>
          <th style={{ padding: 12, textAlign: 'left' }}>{t('horaires.heureDebut')}</th>
          <th style={{ padding: 12, textAlign: 'left' }}>{t('horaires.heureFin')}</th>
          <th style={{ padding: 12 }}>{t('eleves.headers.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {horaires.map((h, idx) => (
          <tr key={h.id} style={{ borderBottom: `1px solid ${T.border}30`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
            <td style={{ padding: 12 }}>{h.enseignant?.nom} {h.enseignant?.prenom}</td>
            <td style={{ padding: 12 }}>{h.classe?.nom}</td>
            <td style={{ padding: 12 }}>{h.matiere?.libelle}</td>
            <td style={{ padding: 12 }}>{h.jour}</td>
            <td style={{ padding: 12 }}>{h.heureDebut}</td>
            <td style={{ padding: 12 }}>{h.heureFin}</td>
            <td style={{ padding: 12, textAlign: 'center' }}>
              <button onClick={() => openEdit(h)} style={{ background: T.accent + '20', border: 'none', borderRadius: 6, padding: '4px 8px', marginRight: 6, cursor: 'pointer' }}>
                <Edit2 size={12} color={T.accent} />
              </button>
              <button onClick={() => remove(h.id)} style={{ background: T.red + '20', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                <Trash2 size={12} color={T.red} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

      {/* Modal Ajout/Modification */}
{modal && (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: '#000000a0',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 9999,
      overflowY: 'auto',
      paddingTop: 60,
      paddingBottom: 40,
    }}
  >
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 24,
        width: 500,
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: T.text,
          }}
        >
          {modal === 'add'
            ? t('horaires.addHour')
            : t('horaires.editHour')}
        </h2>

        <button
          onClick={closeModal}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: T.text,
          }}
        >
          <X size={20} />
        </button>
      </div>

      <select
        name="enseignantId"
        value={form.enseignantId}
        onChange={handleChange}
        required
        style={{
          width: '100%',
          marginBottom: 12,
          padding: 8,
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          color: T.text,
        }}
      >
        <option value="">{t('horaires.enseignant')}</option>
        {enseignants
          .filter(e => e.estVacataire)
          .map(e => (
            <option key={e.id} value={e.id}>
              {e.nom} {e.prenom}
            </option>
          ))}
      </select>

      <select
        name="classeId"
        value={form.classeId}
        onChange={handleChange}
        required
        style={{
          width: '100%',
          marginBottom: 12,
          padding: 8,
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          color: T.text,
        }}
      >
        <option value="">{t('horaires.classe')}</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>
            {c.nom}
          </option>
        ))}
      </select>

      <select
        name="matiereId"
        value={form.matiereId}
        onChange={handleChange}
        required
        style={{
          width: '100%',
          marginBottom: 12,
          padding: 8,
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          color: T.text,
        }}
      >
        <option value="">{t('horaires.matiere')}</option>
        {matieres.map(m => (
          <option key={m.id} value={m.id}>
            {m.libelle}
          </option>
        ))}
      </select>

      <select
        name="jour"
        value={form.jour}
        onChange={handleChange}
        style={{
          width: '100%',
          marginBottom: 12,
          padding: 8,
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          color: T.text,
        }}
      >
        {jours.map(j => (
          <option key={j} value={j}>
            {j}
          </option>
        ))}
      </select>

      <input
        name="heureDebut"
        type="time"
        value={form.heureDebut}
        onChange={handleChange}
        style={{
          width: '100%',
          marginBottom: 12,
          padding: 8,
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          color: T.text,
        }}
      />

      <input
        name="heureFin"
        type="time"
        value={form.heureFin}
        onChange={handleChange}
        style={{
          width: '100%',
          marginBottom: 12,
          padding: 8,
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          color: T.text,
        }}
      />

      <input
        name="mois"
        type="number"
        value={form.mois}
        onChange={handleChange}
        style={{
          width: '100%',
          marginBottom: 12,
          padding: 8,
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          color: T.text,
        }}
      />

      <input
        name="annee"
        type="number"
        value={form.annee}
        onChange={handleChange}
        style={{
          width: '100%',
          marginBottom: 20,
          padding: 8,
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          color: T.text,
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={closeModal}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            color: T.muted,
            cursor: 'pointer',
          }}
        >
          {t('common.cancel')}
        </button>

        <button
          onClick={save}
          style={{
            padding: '8px 16px',
            background: T.accent,
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <Check size={14} style={{ marginRight: 6 }} />
          {t('common.validate')}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
