import { useState, useEffect } from 'react';
import { Search, FileText, Award, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

export default function Bulletins() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [annee, setAnnee] = useState('2025-2026');
  const [semestre, setSemestre] = useState(1);
  const [eleve, setEleve] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [classement, setClassement] = useState([]);
  const [loadingClassement, setLoadingClassement] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  useEffect(() => {
    fetchWithAuth('/classes?limit=100').then(data => setClasses(data.classes || [])).catch(console.error);
  }, []);

  const searchEleve = async () => {
    if (!searchTerm.trim()) return;
    try {
      const data = await fetchWithAuth(`/eleves?search=${encodeURIComponent(searchTerm)}&limit=1`);
      if (data.eleves && data.eleves.length > 0) {
        setEleve(data.eleves[0]);
      } else {
        alert(t('bulletins.noStudentFound'));
        setEleve(null);
      }
    } catch (err) { alert(err.message); }
  };

  const generateBulletin = async () => {
    if (!eleve) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/bulletins/generate?eleveId=${eleve.id}&semestre=${semestre}&anneeScolaire=${annee}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        },
      });
      if (!response.ok) throw new Error('Erreur génération PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletin_${eleve.matricule || eleve.id}_S${semestre}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const generateAllBulletins = async () => {
    if (!selectedClasse) {
      alert(t('bulletins.selectClass'));
      return;
    }
    setGeneratingAll(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/bulletins/classe/${selectedClasse}?semestre=${semestre}&anneeScolaire=${annee}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erreur génération des bulletins');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletins_classe_${selectedClasse}_S${semestre}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setGeneratingAll(false);
    }
  };

  const loadClassement = async () => {
    if (!selectedClasse) return;
    setLoadingClassement(true);
    try {
      const data = await fetchWithAuth(`/bulletins/classement?classeId=${selectedClasse}&semestre=${semestre}&anneeScolaire=${annee}`);
      setClassement(data);
    } catch (err) { console.error(err); }
    finally { setLoadingClassement(false); }
  };

  return (
    <div className="fade-up">
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text }}>{t('bulletins.title')}</h1>
      <p style={{ marginBottom: 24, color: T.muted }}>{t('bulletins.subtitle')}</p>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 30 }}>
        {/* Génération par élève */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, flex: 2 }}>
          <h3 style={{ marginBottom: 12, color: T.text }}>{t('bulletins.individualBulletin')}</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 11, color: T.muted }}>{t('bulletins.nomPrenomMatricule')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('bulletins.searchPlaceholder')} style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px', color: T.text }} />
                <button onClick={searchEleve} style={{ background: T.accent, border: 'none', borderRadius: 8, padding: '0 16px', color: '#fff', cursor: 'pointer' }}><Search size={16} /></button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.muted }}>Semestre</label>
              <select value={semestre} onChange={e => setSemestre(parseInt(e.target.value))} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px', color: T.text }}>
                <option value={1}>{t('notes.semestre1')}</option><option value={2}>{t('notes.semestre2')}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.muted }}>{t('common.year')}</label>
              <select value={annee} onChange={e => setAnnee(e.target.value)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px', color: T.text }}>
                <option>2024-2025</option><option>2025-2026</option><option>2026-2027</option>
              </select>
            </div>
            <button onClick={generateBulletin} disabled={!eleve} style={{ background: T.green, border: 'none', borderRadius: 8, padding: '8px 20px', color: '#fff', cursor: eleve ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} /> {t('bulletins.generatePDF')}
            </button>
          </div>
          {eleve && <div style={{ marginTop: 12, fontSize: 12, color: T.muted }}>{t('bulletins.selectedStudent')} : {eleve.nom} {eleve.prenom} ({eleve.matricule})</div>}
        </div>

        {/* Classement par classe */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, flex: 1.5 }}>
          <h3 style={{ marginBottom: 12, color: T.text }}>{t('bulletins.classRanking')}</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <select value={selectedClasse} onChange={e => setSelectedClasse(e.target.value)} style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px', color: T.text }}>
              <option value="">{t('bulletins.selectClass')}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <button onClick={loadClassement} style={{ background: T.accent, border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer' }}><Award size={16} style={{ marginRight: 6 }} /> {t('bulletins.viewRanking')}</button>
          </div>
          {loadingClassement && <div style={{ marginTop: 12, color: T.muted }}>{t('common.loading')}</div>}
          {classement.length > 0 && (
            <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
              <thead>
                <tr><th style={{ textAlign: 'left', padding: '6px 0', fontSize: 11, color: T.muted }}>{t('bulletins.headers.rang')}</th><th style={{ textAlign: 'left', padding: '6px 0', fontSize: 11, color: T.muted }}>{t('bulletins.headers.eleve')}</th><th style={{ textAlign: 'left', padding: '6px 0', fontSize: 11, color: T.muted }}>{t('bulletins.headers.moyenne')}</th></tr>
              </thead>
              <tbody>
                {classement.map((c, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${T.border}30` }}>
                    <td style={{ padding: '6px 0', fontSize: 12, fontWeight: idx < 3 ? 'bold' : 'normal', color: idx === 0 ? T.accent : T.text }}>{idx + 1}</td>
                    <td style={{ padding: '6px 0', fontSize: 12, color: T.text }}>{c.eleve}</td>
                    <td style={{ padding: '6px 0', fontSize: 12, color: T.accent }}>{c.moyenne.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            onClick={generateAllBulletins}
            disabled={!selectedClasse || generatingAll}
            style={{ marginTop: 16, background: T.blue, border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: selectedClasse ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
          >
            <Download size={16} /> {generatingAll ? t('bulletins.exporting') : t('bulletins.exportAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
