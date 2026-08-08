import { Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const T = { card:'#0c1c2c', border:'#1a3050', accent:'#d4921a', text:'#ddd0b8', muted:'#486070' };

export default function ComingSoon({ page }) {
  const { t } = useTranslation();
  const LABELS = {
    inscriptions: t('menu.inscriptions'),
    notes: t('menu.notes'),
    bulletins: t('menu.bulletins'),
    examens: t('menu.examens'),
    versements: t('menu.versements'),
    depenses: t('menu.depenses'),
    salaires: t('menu.salaires'),
    statistiques: t('menu.statistiques'),
    parametres: t('menu.parametres'),
    users: t('menu.utilisateurs'),
  };
  return (
    <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ width: 70, height: 70, borderRadius: 20, background: T.accent + '15', border: `1px solid ${T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Wrench size={30} color={T.accent} />
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, color: T.text, marginBottom: 10 }}>
          {LABELS[page] || page}
        </h2>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7 }}>
          {t('comingSoon.moduleEnDev')}<br />
          {t('comingSoon.disponible')}
        </p>
        <div style={{ marginTop: 20, padding: '10px 18px', borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, display: 'inline-block', fontSize: 12, color: T.muted }}>
          {t('comingSoon.modulePrevu')}
        </div>
      </div>
    </div>
  );
}
