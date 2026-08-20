import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { Plus, Edit2, Trash2, X, Check, Award, FileText, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAcademicYear } from '../context/AcademicYearContext';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

export default function Examens() {
  const { t } = useTranslation();
  const { years, currentYear } = useAcademicYear();
  const [examens, setExamens] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'addExamen' or { examenId, type: 'addSalle' } or { examenId, type: 'results' }
  const [form, setForm] = useState({ nom: '', dateDebut: '', dateFin: '', classeId: '', anneeScolaire: currentYear });
  const [salleForm, setSalleForm] = useState({ nomSalle: '', capacite: '' });
  const [selectedExamen, setSelectedExamen] = useState(null);
  const [repartition, setRepartition] = useState([]);
  
  // États pour la gestion des résultats
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [elevesNotes, setElevesNotes] = useState([]); // [{ eleveId, nom, note }]
  const [classement, setClassement] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    loadClasses();
    loadMatieres();
    loadExamens();
  }, [currentYear]);

  const loadClasses = async () => {
    try {
      const data = await fetchWithAuth('/classes?limit=100');
      setClasses(data.classes || []);
    } catch (err) { console.error(err); }
  };

  const loadMatieres = async () => {
    try {
      const data = await fetchWithAuth('/matieres');
      setMatieres(data || []);
    } catch (err) { console.error(err); }
  };

  const loadExamens = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/examens?anneeScolaire=${currentYear}`);
      setExamens(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openAddExamen = () => {
    setForm({ nom: '', dateDebut: '', dateFin: '', classeId: '', anneeScolaire: currentYear });
    setModal('addExamen');
  };

  const openAddSalle = (examenId) => {
    setSalleForm({ nomSalle: '', capacite: '' });
    setModal({ examenId, type: 'addSalle' });
  };

  const openResults = async (examen) => {
    setSelectedExamen(examen);
    setSelectedMatiere('');
    setElevesNotes([]);
    setClassement([]);
    // Récupérer la répartition pour avoir la liste des élèves
    try {
      const rep = await fetchWithAuth(`/examens/${examen.id}/repartition`);
      setRepartition(rep);
      const allEleves = rep.flatMap(r => r.eleves.map(e => ({ eleveId: e.id, nom: e.nom, note: '' })));
      setElevesNotes(allEleves);
      // Charger les résultats existants pour cet examen
      await loadExistingResults(examen.id);
      // Charger le classement
      await loadClassement(examen.id);
      setModal({ examenId: examen.id, type: 'results' });
    } catch (err) { alert(err.message); }
  };

  const loadExistingResults = async (examenId) => {
    try {
      const results = await fetchWithAuth(`/examens/${examenId}/resultats`);
      // Mettre à jour les notes dans elevesNotes
      setElevesNotes(prev => prev.map(e => {
        const result = results.find(r => r.eleveId === e.eleveId && r.matiereId === selectedMatiere);
        if (result) return { ...e, note: result.note.toString() };
        return e;
      }));
    } catch (err) { console.error(err); }
  };

  const loadClassement = async (examenId) => {
    try {
      const data = await fetchWithAuth(`/examens/${examenId}/classement`);
      setClassement(data);
    } catch (err) { console.error(err); }
  };

  const saveNote = async (eleveId, note) => {
    if (!selectedMatiere) {
      alert(t('examens.noMatiereSelected'));
      return;
    }
    try {
      await fetchWithAuth(`/examens/${selectedExamen.id}/resultats`, {
        method: 'POST',
        body: JSON.stringify({
          eleveId,
          matiereId: selectedMatiere,
          note: parseFloat(note) || 0,
        }),
      });
      // Recharger les résultats et le classement
      await loadExistingResults(selectedExamen.id);
      await loadClassement(selectedExamen.id);
    } catch (err) { alert(err.message); }
  };

  const exportClassementPDF = async () => {
  if (!selectedExamen) return;
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/examens/${selectedExamen.id}/export-pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Erreur serveur');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classement_${selectedExamen.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Erreur export PDF : ' + err.message);
  }
};

  const closeModal = () => setModal(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSalleChange = (e) => setSalleForm({ ...salleForm, [e.target.name]: e.target.value });

  const saveExamen = async () => {
    try {
      await fetchWithAuth('/examens', { method: 'POST', body: JSON.stringify(form) });
      closeModal();
      loadExamens();
    } catch (err) { alert(err.message); }
  };

  const saveSalle = async () => {
    if (!modal.examenId) return;
    try {
      await fetchWithAuth(`/examens/${modal.examenId}/salles`, {
        method: 'POST',
        body: JSON.stringify({ nomSalle: salleForm.nomSalle, capacite: parseInt(salleForm.capacite) }),
      });
      closeModal();
      loadExamens();
    } catch (err) { alert(err.message); }
  };

  const deleteExamen = async (id) => {
    if (!confirm(t('examens.deleteExamen'))) return;
    try {
      await fetchWithAuth(`/examens/${id}`, { method: 'DELETE' });
      loadExamens();
    } catch (err) { alert(err.message); }
  };

  const viewRepartition = async (examenId) => {
    try {
      const data = await fetchWithAuth(`/examens/${examenId}/repartition`);
      setRepartition(data);
      setSelectedExamen(examenId);
      setModal({ examenId, type: 'repartition' });
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text }}>{t('examens.title')}</h1>
        <button onClick={openAddExamen} style={{ background: T.accent, border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', cursor: 'pointer' }}>
          <Plus size={15} style={{ marginRight: 6 }} /> {t('examens.newExamen')}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: T.muted }}>{t('common.loading')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {examens.map(ex => (
            <div key={ex.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ color: T.text }}>{ex.nom}</h3>
                  <p style={{ fontSize: 12, color: T.muted }}>Classe: {ex.classe?.nom} | {new Date(ex.dateDebut).toLocaleDateString()} - {new Date(ex.dateFin).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openAddSalle(ex.id)} style={{ background: T.green, border: 'none', borderRadius: 6, padding: '4px 12px', color: '#fff', cursor: 'pointer' }}>{t('examens.addSalle')}</button>
                  <button onClick={() => viewRepartition(ex.id)} style={{ background: T.blue, border: 'none', borderRadius: 6, padding: '4px 12px', color: '#fff', cursor: 'pointer' }}>{t('examens.viewRepartition')}</button>
                  <button onClick={() => openResults(ex)} style={{ background: T.accent, border: 'none', borderRadius: 6, padding: '4px 12px', color: '#fff', cursor: 'pointer' }}>{t('examens.manageResults')}</button>
                  <button onClick={() => deleteExamen(ex.id)} style={{ background: T.red, border: 'none', borderRadius: 6, padding: '4px 12px', color: '#fff', cursor: 'pointer' }}>{t('common.delete')}</button>
                </div>
              </div>
              {ex.salles?.length > 0 && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                  <strong style={{ fontSize: 12, color: T.muted }}>{t('examens.salles')} :</strong>
                  <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                    {ex.salles.map(s => <span key={s.id} style={{ background: T.bg, padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>{s.nomSalle} (cap. {s.capacite})</span>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajout Examen */}
      {modal === 'addExamen' && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', zIndex: 200, overflow: 'auto', padding: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: 500, margin: 'auto' }}>
            <h2 style={{ marginBottom: 16, color: T.text }}>{t('examens.newExamen')}</h2>
            <input name="nom" value={form.nom} onChange={handleChange} placeholder={t('matieres.libelle')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
            <input name="dateDebut" type="date" value={form.dateDebut} onChange={handleChange} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
            <input name="dateFin" type="date" value={form.dateFin} onChange={handleChange} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
            <select name="classeId" value={form.classeId} onChange={handleChange} style={{ width: '100%', marginBottom: 20, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }}>
              <option value="">{t('eleves.selectClasse')}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted }}>{t('common.cancel')}</button>
              <button onClick={saveExamen} style={{ padding: '8px 16px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff' }}>{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout Salle */}
      {modal && modal.type === 'addSalle' && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', zIndex: 200, overflow: 'auto', padding: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: 400, margin: 'auto' }}>
            <h2 style={{ marginBottom: 16, color: T.text }}>{t('examens.addSalle')}</h2>
            <input name="nomSalle" value={salleForm.nomSalle} onChange={handleSalleChange} placeholder={t('examens.salleNom')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
            <input name="capacite" type="number" value={salleForm.capacite} onChange={handleSalleChange} placeholder={t('examens.capacite')} style={{ width: '100%', marginBottom: 20, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted }}>{t('common.cancel')}</button>
              <button onClick={saveSalle} style={{ padding: '8px 16px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff' }}>{t('common.add')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Répartition */}
      {modal && modal.type === 'repartition' && repartition.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', zIndex: 200, overflow: 'auto', padding: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: 600, maxHeight: 'none', margin: 'auto' }}>
            <h2 style={{ marginBottom: 16, color: T.text }}>{t('examens.repartitionSalles')}</h2>
            {repartition.map((r, i) => (
              <div key={i} style={{ marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 10 }}>
                <div style={{ fontWeight: 'bold', color: T.accent }}>{r.salle} (capacité {r.capacite})</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 5 }}>{r.eleves.map(e => e.nom).join(', ')}</div>
              </div>
            ))}
            <button onClick={closeModal} style={{ marginTop: 10, background: T.accent, border: 'none', borderRadius: 6, padding: '6px 12px', color: '#fff', cursor: 'pointer' }}>{t('common.close')}</button>
          </div>
        </div>
      )}

      {/* Modal Gestion des résultats */}
      {modal && modal.type === 'results' && selectedExamen && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', zIndex: 200, overflow: 'auto', padding: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: 700, maxHeight: 'none', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ color: T.text }}>{t('examens.resultsTitle')} - {selectedExamen.nom}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ color: T.muted, marginRight: 10 }}>{t('examens.matiere')} :</label>
              <select value={selectedMatiere} onChange={e => { setSelectedMatiere(e.target.value); loadExistingResults(selectedExamen.id); }} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 6, color: T.text }}>
                <option value="">{t('examens.selectMatiere')}</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
              </select>
            </div>

            {selectedMatiere && (
              <>
                <h3 style={{ marginBottom: 12, color: T.text }}>{t('examens.saisieNotes')}</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#0a1624' }}>
                        <th style={{ padding: 8, textAlign: 'left' }}>{t('examens.headers.eleve')}</th>
                        <th style={{ padding: 8, textAlign: 'center' }}>{t('examens.headers.note')}</th>
                        <th style={{ padding: 8, textAlign: 'center' }}>{t('examens.headers.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {elevesNotes.map(e => (
                        <tr key={e.eleveId} style={{ borderBottom: `1px solid ${T.border}30` }}>
                          <td style={{ padding: 8 }}>{e.nom}</td>
                          <td style={{ padding: 8, textAlign: 'center' }}>
                            <input type="number" step="0.25" value={e.note} onChange={ev => {
                              const newNotes = elevesNotes.map(el => el.eleveId === e.eleveId ? { ...el, note: ev.target.value } : el);
                              setElevesNotes(newNotes);
                            }} style={{ width: 80, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 4, textAlign: 'center', color: T.text }} />
                          </td>
                          <td style={{ padding: 8, textAlign: 'center' }}>
                            <button onClick={() => saveNote(e.eleveId, e.note)} style={{ background: T.accent, border: 'none', borderRadius: 6, padding: '4px 8px', color: '#fff', cursor: 'pointer' }}><Save size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 30 }}>
                  <h3 style={{ marginBottom: 12, color: T.text }}>{t('examens.classementGeneral')}</h3>
                  {classement.length === 0 ? (
                    <p style={{ color: T.muted }}>{t('examens.noNoteSaisie')}</p>
                  ) : (
                    <>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                        <thead>
                          <tr style={{ background: '#0a1624' }}>
                            <th style={{ padding: 8, textAlign: 'left' }}>{t('examens.headers.rang')}</th>
                            <th style={{ padding: 8, textAlign: 'left' }}>{t('examens.headers.eleve')}</th>
                            <th style={{ padding: 8, textAlign: 'center' }}>{t('examens.headers.moyenne')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classement.map((c, idx) => (
                            <tr key={c.eleveId} style={{ borderBottom: `1px solid ${T.border}30` }}>
                              <td style={{ padding: 8 }}>{idx + 1}</td>
                              <td style={{ padding: 8 }}>{c.nom}</td>
                              <td style={{ padding: 8, textAlign: 'center', fontWeight: 'bold', color: T.accent }}>{c.moyenne.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={exportClassementPDF} style={{ background: T.green, border: 'none', borderRadius: 6, padding: '6px 12px', color: '#fff', cursor: 'pointer' }}><FileText size={14} style={{ marginRight: 6 }} /> {t('examens.exportPDF')}</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}