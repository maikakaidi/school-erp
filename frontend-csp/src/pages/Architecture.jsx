import { useState } from "react";
import {
  Users, BookOpen, DollarSign, Award, Briefcase, Settings,
  BarChart2, FileText, UserCheck, ClipboardList, GraduationCap,
  Home, Shield, Database, Layers, GitBranch, Zap, Check,
  ArrowRight, ChevronRight, Star, AlertTriangle
} from "lucide-react";

/* ─── THEME ──────────────────────────────────────────────────── */
const T = {
  bg:       "#06101a",
  sidebar:  "#091522",
  card:     "#0c1c2c",
  cardB:    "#132638",
  border:   "#1a3050",
  accent:   "#d4921a",
  blue:     "#2878c8",
  green:    "#1d9468",
  red:      "#b83838",
  purple:   "#7848c8",
  teal:     "#1890a0",
  text:     "#ddd0b8",
  muted:    "#486070",
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:${T.bg};color:${T.text};}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:${T.bg};}
  ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
  .fade-up{animation:fadeUp 0.4s ease forwards;}
`;

/* ─── DATA ───────────────────────────────────────────────────── */
const MODULES = [
  {
    key: "dashboard", icon: Home, color: T.accent, cat: "Principal",
    titre: "Tableau de bord",
    desc: "Vue d'ensemble en temps réel de toute l'activité scolaire.",
    fonctions: ["Statistiques élèves & finances", "Graphiques versements par classe", "Inscriptions récentes", "Examens à venir", "Accès rapide à tous les modules"],
    tables: ["(toutes les tables en lecture)"],
    roles: ["Administrateur"],
  },
  {
    key: "eleves", icon: Users, color: T.blue, cat: "Scolarité",
    titre: "Élèves",
    desc: "Gestion complète du dossier de chaque élève et de ses parents.",
    fonctions: ["Fiche élève (Nom, Prénom, Sexe, Naissance, Nationalité)", "Détail parent (Nom, Adresse, Téléphone)", "Recherche multicritères", "Historique scolaire", "355 élèves actuels"],
    tables: ["Table_Eleve"],
    roles: ["Administrateur"],
  },
  {
    key: "inscriptions", icon: UserCheck, color: T.teal, cat: "Scolarité",
    titre: "Inscriptions",
    desc: "Inscription annuelle des élèves dans les classes avec gestion du matricule.",
    fonctions: ["Inscription par année & classe", "Attribution matricule", "Type: Ordinaire / Redoublant", "Réduction sur frais", "Basculement vers nouvelle année", "Certificat de scolarité", "Export Excel & Liste"],
    tables: ["Table_Inscription", "Table_Eleve", "Table_Classe"],
    roles: ["Administrateur"],
  },
  {
    key: "versements", icon: DollarSign, color: T.green, cat: "Finances",
    titre: "Versements",
    desc: "Suivi détaillé des paiements en 3 tranches par élève et par classe.",
    fonctions: ["Frais en 3 versements (Vers1, Vers2, Vers3)", "Montant attendu / perçu / reste", "Réductions personnalisées", "Recherche élève par classe", "Génération de reçu", "Convocation pour impayés", "Situation financière globale", "Tranche: 1er / 2ème / 3ème versement"],
    tables: ["Table_Versement", "Table_Inscription", "Frais_S"],
    roles: ["Administrateur", "Comptabilité"],
  },
  {
    key: "notes", icon: BookOpen, color: T.purple, cat: "Pédagogie",
    titre: "Notes & Évaluation",
    desc: "Saisie des notes par matière, classe et semestre avec calcul automatique.",
    fonctions: ["Moy_Cl (Moyenne classe = devoirs)", "Compo (note de composition)", "Par Semestre: 1er / 2ème", "Filtre Année / Classe / Matière", "19 matières configurables", "Relever de notes", "Fiche note individuelle"],
    tables: ["Table_Evaluer", "Table_Devoirs", "Table_Matiere", "Table_Coefficients"],
    roles: ["Administrateur", "Info_Bulletin"],
  },
  {
    key: "devoirs", icon: ClipboardList, color: "#c07830", cat: "Pédagogie",
    titre: "Gestion Devoirs",
    desc: "Saisie des notes de devoirs (2 devoirs par semestre) séparément.",
    fonctions: ["1er Devoir 1er Semestre", "2ème Devoir 1er Semestre", "1er Devoir 2ème Semestre", "2ème Devoir 2ème Semestre", "Saisie par classe & matière", "Fiche Note individuelle"],
    tables: ["Table_Devoirs", "Table_Matiere", "Table_Coefficients"],
    roles: ["Administrateur", "Info_Bulletin"],
  },
  {
    key: "bulletins", icon: FileText, color: "#a04888", cat: "Pédagogie",
    titre: "Bulletins",
    desc: "Génération automatique des bulletins semestriels avec moyennes pondérées.",
    fonctions: ["Calcul: (Moy_Cl + Compo) × Coeff", "Moyenne générale pondérée", "Rang dans la classe", "Appréciation par matière", "Impression & Export PDF", "Par semestre et par élève"],
    tables: ["Table_Evaluer", "Table_Devoirs", "Table_Coefficients", "Table_Inscription"],
    roles: ["Administrateur", "Info_Bulletin"],
  },
  {
    key: "examens", icon: Award, color: T.accent, cat: "Examens",
    titre: "Gestion Examens",
    desc: "Organisation complète des examens blancs (BECP et BAC).",
    fonctions: ["Répartition des élèves par salle", "Paramétrage salles (A, B, C)", "Types: BECP Blanc N°1-3, BAC Blanc N°1-2", "Saisie de notes d'examen", "Résultats et classements", "Niveaux: 3ème, Tle A, Tle D"],
    tables: ["GE_Para", "GE_Inscription", "Table_Evaluer"],
    roles: ["Administrateur"],
  },
  {
    key: "salaires", icon: Briefcase, color: "#388060", cat: "Finances",
    titre: "Gestion Salaires",
    desc: "Gestion complète de la paie du personnel et des enseignants.",
    fonctions: ["Fiche Personnel / Enseignants", "Calcul salaire mensuel", "Ancienneté", "Vacation (enseignants vacataires)", "Programme d'enseignement", "Statistiques RH"],
    tables: ["Table_Personnel", "Table_Salaire", "Table_Vacation"],
    roles: ["Administrateur"],
  },
  {
    key: "depenses", icon: AlertTriangle, color: T.red, cat: "Finances",
    titre: "Dépenses",
    desc: "Suivi de toutes les dépenses de l'établissement par rubrique.",
    fonctions: ["Libellé & montant de chaque dépense", "Caisse (mode de paiement)", "Date d'enregistrement", "Rubriques de dépenses", "Filtre Année / Mois / Rubrique", "Rapport Mensuel/Rubrique"],
    tables: ["GFTable_Depenses", "Table_Rubriques"],
    roles: ["Administrateur", "Comptabilité"],
  },
  {
    key: "stats", icon: BarChart2, color: "#288898", cat: "Rapports",
    titre: "Statistiques",
    desc: "Tableaux de bord et rapports analytiques sur toute l'activité.",
    fonctions: ["Statistiques d'inscription par classe", "Taux de réussite aux examens", "Analyse financière globale", "Évolution par année scolaire", "Export des rapports"],
    tables: ["(toutes les tables en lecture)"],
    roles: ["Administrateur"],
  },
  {
    key: "parametres", icon: Settings, color: "#608098", cat: "Configuration",
    titre: "Paramètres",
    desc: "Configuration de toute la structure pédagogique de l'établissement.",
    fonctions: [
      "Années scolaires (ex: 2025-2026)",
      "17 Classes: 6ème A/B, 5ème A/B, 4ème A/B, 3ème A/B, 2nde A/C, 1ère A/D, Tle A/D",
      "19 Matières (Maths, Français, SVT, Phys-Chimie…)",
      "Type matière: Scientifique / Littéraire / Autre",
      "330 Coefficients (Niveau × Matière × Année)",
      "Frais scolaires par niveau et par année",
    ],
    tables: ["Table_Annee", "Table_Classe", "Table_Matiere", "Table_Coefficients", "Frais_S"],
    roles: ["Administrateur"],
  },
  {
    key: "users", icon: Shield, color: "#7858a8", cat: "Sécurité",
    titre: "Utilisateurs",
    desc: "Gestion des comptes, rôles et accès au système.",
    fonctions: ["Création / modification de comptes", "3 rôles: Administrateur (#$), Info_Bulletin (#I), Comptabilité (#C)", "Blocage / Déblocage de comptes", "Changement de mot de passe", "Historique des connexions"],
    tables: ["Admin"],
    roles: ["Administrateur"],
  },
];

const ENTITIES = [
  {
    name: "Table_Eleve", color: T.blue,
    desc: "Dossier complet de l'élève",
    fields: [
      { name: "NumID", type: "PK", note: "Matricule unique" },
      { name: "Nom", type: "TEXT", note: "" },
      { name: "Prénom", type: "TEXT", note: "" },
      { name: "Sexe", type: "ENUM", note: "M / F" },
      { name: "DateNaissance", type: "DATE", note: "" },
      { name: "LieuNaissance", type: "TEXT", note: "" },
      { name: "Nationalité", type: "TEXT", note: "Nigérienne par défaut" },
      { name: "Téléphone", type: "TEXT", note: "" },
      { name: "NomParent", type: "TEXT", note: "Détail parent" },
      { name: "AdresseParent", type: "TEXT", note: "" },
      { name: "TelParent", type: "TEXT", note: "" },
    ]
  },
  {
    name: "Table_Inscription", color: T.teal,
    desc: "Inscription annuelle par classe",
    fields: [
      { name: "ID", type: "PK", note: "" },
      { name: "EleveID", type: "FK", note: "→ Table_Eleve" },
      { name: "AnnéeScolaire", type: "TEXT", note: "ex: 2025-2026" },
      { name: "ClasseID", type: "FK", note: "→ Table_Classe" },
      { name: "Type", type: "ENUM", note: "Ordinaire / Redoublant" },
      { name: "Réduction", type: "NUMBER", note: "En %" },
    ]
  },
  {
    name: "Frais_S", color: T.green,
    desc: "Frais scolaires par niveau/année",
    fields: [
      { name: "ID", type: "PK", note: "" },
      { name: "Niveau", type: "FK", note: "→ Table_Classe" },
      { name: "AnnéeScolaire", type: "TEXT", note: "" },
      { name: "Versement1", type: "NUMBER", note: "1ère tranche" },
      { name: "Versement2", type: "NUMBER", note: "2ème tranche" },
      { name: "Versement3", type: "NUMBER", note: "3ème tranche" },
      { name: "Montant", type: "NUMBER", note: "Total = V1+V2+V3" },
    ]
  },
  {
    name: "Table_Versement", color: "#1d8a50",
    desc: "Paiements effectués par élève",
    fields: [
      { name: "ID", type: "PK", note: "" },
      { name: "InscriptionID", type: "FK", note: "→ Table_Inscription" },
      { name: "Montant", type: "NUMBER", note: "Montant payé" },
      { name: "Réduction", type: "NUMBER", note: "%" },
      { name: "Tranche", type: "ENUM", note: "1er/2ème/3ème" },
      { name: "Date", type: "DATE", note: "" },
      { name: "Heure", type: "TIME", note: "" },
    ]
  },
  {
    name: "Table_Evaluer", color: T.purple,
    desc: "Notes de semestre (Moy_Cl + Compo)",
    fields: [
      { name: "ID", type: "PK", note: "" },
      { name: "EleveID", type: "FK", note: "→ Table_Eleve" },
      { name: "MatiereID", type: "FK", note: "→ Table_Matiere" },
      { name: "Moy_Cl", type: "DECIMAL", note: "Moyenne des devoirs" },
      { name: "Compo", type: "DECIMAL", note: "Note de composition" },
      { name: "Semestre", type: "ENUM", note: "1er / 2ème" },
      { name: "AnnéeScolaire", type: "TEXT", note: "" },
      { name: "Classe", type: "FK", note: "→ Table_Classe" },
    ]
  },
  {
    name: "Table_Devoirs", color: "#b06830",
    desc: "Notes de devoirs (x2 par semestre)",
    fields: [
      { name: "ID", type: "PK", note: "" },
      { name: "EleveID", type: "FK", note: "→ Table_Eleve" },
      { name: "MatiereID", type: "FK", note: "→ Table_Matiere" },
      { name: "Note", type: "DECIMAL", note: "/20" },
      { name: "Semestre", type: "ENUM", note: "1er D1 / 1er D2 / 2ème D1 / 2ème D2" },
      { name: "AnnéeScolaire", type: "TEXT", note: "" },
      { name: "Classe", type: "FK", note: "→ Table_Classe" },
    ]
  },
  {
    name: "Table_Coefficients", color: "#906040",
    desc: "Coefficients par matière et niveau (330 enreg.)",
    fields: [
      { name: "ID", type: "PK", note: "" },
      { name: "Niveau", type: "FK", note: "→ Table_Classe" },
      { name: "MatiereID", type: "FK", note: "→ Table_Matiere" },
      { name: "Coeff", type: "NUMBER", note: "1 à 4" },
      { name: "Position", type: "NUMBER", note: "Ordre affichage bulletin" },
      { name: "AnnéeScolaire", type: "TEXT", note: "" },
    ]
  },
  {
    name: "Table_Matiere", color: "#487870",
    desc: "19 matières de l'établissement",
    fields: [
      { name: "ID", type: "PK", note: "" },
      { name: "Libellé", type: "TEXT", note: "ex: Mathématiques" },
      { name: "Type", type: "ENUM", note: "0=Littéraire / 1=Scientifique / 2=Autre" },
    ]
  },
  {
    name: "Table_Classe", color: "#386888",
    desc: "17 classes de l'établissement",
    fields: [
      { name: "ID", type: "PK", note: "" },
      { name: "Niveau", type: "TEXT", note: "ex: 1ère A" },
      { name: "Classe", type: "TEXT", note: "ex: 1ère A" },
    ]
  },
  {
    name: "GFTable_Depenses", color: T.red,
    desc: "Dépenses de l'établissement",
    fields: [
      { name: "ID", type: "PK", note: "" },
      { name: "Libellé", type: "TEXT", note: "" },
      { name: "Montant", type: "NUMBER", note: "FCFA" },
      { name: "Eta", type: "ENUM", note: "Caisse / Banque" },
      { name: "DateV", type: "DATE", note: "" },
      { name: "Rubrique", type: "FK", note: "" },
    ]
  },
  {
    name: "Admin", color: "#6858a8",
    desc: "Comptes utilisateurs du système",
    fields: [
      { name: "Login", type: "PK", note: "Identifiant unique" },
      { name: "MotDePasse", type: "TEXT", note: "À hasher (amélioration)" },
      { name: "Service", type: "ENUM", note: "#$=Admin / #I=Info_Bulletin / #C=Comptabilité" },
      { name: "Bloqué", type: "BOOL", note: "Oui / Non" },
    ]
  },
];

const FLUX = [
  {
    titre: "Inscription d'un élève", color: T.teal, icon: UserCheck,
    etapes: [
      { n: 1, action: "Créer / sélectionner la fiche élève", module: "Élèves" },
      { n: 2, action: "Choisir année scolaire & classe", module: "Inscriptions" },
      { n: 3, action: "Saisir matricule & type (Ordinaire/Redoublant)", module: "Inscriptions" },
      { n: 4, action: "Appliquer réduction éventuelle", module: "Inscriptions" },
      { n: 5, action: "Valider → fiche inscription créée", module: "Inscriptions" },
      { n: 6, action: "Générer certificat de scolarité", module: "Inscriptions" },
    ]
  },
  {
    titre: "Suivi paiement & reçu", color: T.green, icon: DollarSign,
    etapes: [
      { n: 1, action: "Rechercher l'élève par classe", module: "Versements" },
      { n: 2, action: "Consulter: Frais total / Payé / Reste", module: "Versements" },
      { n: 3, action: "Saisir montant et tranche (1er/2ème/3ème)", module: "Versements" },
      { n: 4, action: "Appliquer réduction si applicable", module: "Versements" },
      { n: 5, action: "Valider → versement enregistré", module: "Versements" },
      { n: 6, action: "Imprimer reçu de paiement", module: "Versements" },
      { n: 7, action: "En cas d'impayé: générer convocation parent", module: "Versements" },
    ]
  },
  {
    titre: "Calcul du bulletin", color: T.purple, icon: FileText,
    etapes: [
      { n: 1, action: "Saisir notes de devoirs (D1 + D2)", module: "Gestion Devoirs" },
      { n: 2, action: "Calculer Moy_Cl = (D1 + D2) / 2", module: "Notes" },
      { n: 3, action: "Saisir note de composition (Compo)", module: "Notes" },
      { n: 4, action: "Valider notes par classe/matière/semestre", module: "Notes" },
      { n: 5, action: "Récupérer coefficients par niveau/matière", module: "Paramètres" },
      { n: 6, action: "Calcul: Moy_matière = (Moy_Cl + Compo) × Coeff", module: "Bulletins" },
      { n: 7, action: "Calcul moyenne générale pondérée", module: "Bulletins" },
      { n: 8, action: "Générer & imprimer le bulletin", module: "Bulletins" },
    ]
  },
  {
    titre: "Organisation d'un examen", color: T.accent, icon: Award,
    etapes: [
      { n: 1, action: "Configurer les salles (A, B, C)", module: "Gestion Examens" },
      { n: 2, action: "Définir l'examen (BECP/BAC Blanc + niveau)", module: "Gestion Examens" },
      { n: 3, action: "Répartir automatiquement les élèves par salle", module: "Gestion Examens" },
      { n: 4, action: "Imprimer listes de répartition", module: "Gestion Examens" },
      { n: 5, action: "Saisir les notes de l'examen", module: "Gestion Examens" },
      { n: 6, action: "Calculer et publier les résultats", module: "Gestion Examens" },
    ]
  },
];

const AMELIORATIONS = [
  { aspect: "Accès", access: "Application bureau uniquement (PC avec Access)", web: "Navigateur web — PC, tablette, mobile", gain: "Mobilité totale" },
  { aspect: "Multi-utilisateurs", access: "1 utilisateur à la fois (mono-poste)", web: "Simultané — plusieurs sessions en parallèle", gain: "Efficacité ×10" },
  { aspect: "Interface", access: "Fenêtres Access vieillissantes", web: "Dashboard moderne, sombre, interactif", gain: "Expérience premium" },
  { aspect: "Bulletins PDF", access: "Impression directe Access", web: "Export PDF soigné & envoi par email", gain: "Professionnalisme" },
  { aspect: "Sécurité", access: "Mots de passe Access non hachés", web: "Auth sécurisée, sessions JWT", gain: "Sécurité renforcée" },
  { aspect: "Sauvegardes", access: "Fichier .accdb manuel", web: "Backup automatique cloud", gain: "Zéro perte de données" },
  { aspect: "Statistiques", access: "Limitées, peu visuelles", web: "Graphiques interactifs temps réel", gain: "Décisions éclairées" },
  { aspect: "Notifications", access: "Aucune", web: "Alertes impayés, examens, résultats", gain: "Proactivité" },
  { aspect: "Export", access: "Excel basique", web: "PDF, Excel, CSV, impression", gain: "Flexibilité" },
  { aspect: "Déploiement", access: "Installation sur chaque PC", web: "URL unique — aucune installation", gain: "Simplicité maximale" },
];

const CATS = ["Tous", "Principal", "Scolarité", "Pédagogie", "Finances", "Examens", "Rapports", "Configuration", "Sécurité"];

/* ─── SMALL COMPONENTS ───────────────────────────────────────── */
function Badge({ text, color }) {
  return (
    <span style={{
      fontSize: 10, padding: "2px 8px", borderRadius: 20,
      background: color + "20", color, border: `1px solid ${color}40`,
      fontWeight: 600, letterSpacing: "0.04em",
    }}>{text}</span>
  );
}

function Field({ name, type, note }) {
  const typeColors = { PK: T.accent, FK: T.teal, TEXT: T.muted, NUMBER: T.blue, DATE: T.green, ENUM: T.purple, BOOL: "#808080", DECIMAL: "#6090c0", TIME: T.green };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${T.border}20` }}>
      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: (typeColors[type] || T.muted) + "20", color: typeColors[type] || T.muted, minWidth: 46, textAlign: "center", fontWeight: 600 }}>{type}</span>
      <span style={{ fontSize: 12, color: T.text, fontWeight: 500, flex: 1 }}>{name}</span>
      {note && <span style={{ fontSize: 10, color: T.muted, fontStyle: "italic" }}>{note}</span>}
    </div>
  );
}

/* ─── TABS ───────────────────────────────────────────────────── */
const TABS = [
  { key: "overview", label: "Vue d'ensemble", icon: Layers },
  { key: "modules", label: "Modules (13)", icon: GitBranch },
  { key: "data", label: "Base de données", icon: Database },
  { key: "flux", label: "Flux métier", icon: Zap },
  { key: "upgrade", label: "Améliorations web", icon: Star },
];

/* ─── PAGES ──────────────────────────────────────────────────── */
function Overview() {
  const catColors = { "Principal": T.accent, "Scolarité": T.blue, "Pédagogie": T.purple, "Finances": T.green, "Examens": T.accent, "Rapports": T.teal, "Configuration": T.muted, "Sécurité": "#8060b0" };
  const grouped = CATS.filter(c => c !== "Tous").map(cat => ({
    cat, color: catColors[cat], count: MODULES.filter(m => m.cat === cat).length,
    modules: MODULES.filter(m => m.cat === cat),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Modules", value: "13", icon: Layers, color: T.accent },
          { label: "Tables DB", value: "11+", icon: Database, color: T.blue },
          { label: "Élèves", value: "355", icon: Users, color: T.green },
          { label: "Classes", value: "17", icon: GraduationCap, color: T.purple },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontFamily: "'Fraunces', serif", fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Module map */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 20 }}>Carte des modules</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {grouped.map(g => (
            <div key={g.cat}>
              <div style={{ fontSize: 10, color: g.color, letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>{g.cat}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {g.modules.map(m => (
                  <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 8, background: g.color + "12", border: `1px solid ${g.color}25` }}>
                    <m.icon size={13} color={g.color} />
                    <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{m.titre}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 20 }}>Rôles utilisateurs</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { role: "Administrateur", code: "#$", color: T.accent, access: "Accès complet à tous les modules", modules: "13 / 13" },
            { role: "Info_Bulletin", code: "#I", color: T.blue, access: "Notes, Devoirs, Bulletins uniquement", modules: "3 / 13" },
            { role: "Comptabilité", code: "#C", color: T.green, access: "Versements et Dépenses uniquement", modules: "2 / 13" },
          ].map(r => (
            <div key={r.role} style={{ padding: 18, borderRadius: 12, background: r.color + "10", border: `1px solid ${r.color}30` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: r.color + "25", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={16} color={r.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{r.role}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>Code: {r.code}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{r.access}</div>
              <div style={{ fontSize: 11, color: r.color, marginTop: 8, fontWeight: 600 }}>{r.modules} modules</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack prévu */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 20 }}>Stack technique prévu (web)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { layer: "Frontend", tech: "React.js", detail: "Interface utilisateur", color: T.blue },
            { layer: "Style", tech: "CSS + Tailwind", detail: "Design système", color: T.purple },
            { layer: "Backend", tech: "Node.js / Express", detail: "API REST", color: T.green },
            { layer: "Base de données", tech: "PostgreSQL", detail: "Données relationnelles", color: T.accent },
          ].map(t => (
            <div key={t.layer} style={{ padding: 14, borderRadius: 10, background: t.color + "10", border: `1px solid ${t.color}30` }}>
              <div style={{ fontSize: 10, color: t.color, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>{t.layer.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{t.tech}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{t.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModulesPage() {
  const [activeCat, setActiveCat] = useState("Tous");
  const [expanded, setExpanded] = useState(null);
  const filtered = activeCat === "Tous" ? MODULES : MODULES.filter(m => m.cat === activeCat);

  return (
    <div>
      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setActiveCat(c)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer",
            background: activeCat === c ? T.accent + "20" : "transparent",
            border: activeCat === c ? `1px solid ${T.accent}50` : `1px solid ${T.border}`,
            color: activeCat === c ? T.accent : T.muted,
            fontWeight: activeCat === c ? 600 : 400,
          }}>{c}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {filtered.map(m => {
          const isOpen = expanded === m.key;
          return (
            <div key={m.key} style={{
              background: T.card, border: `1px solid ${isOpen ? m.color + "60" : T.border}`,
              borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s",
            }}>
              <div
                onClick={() => setExpanded(isOpen ? null : m.key)}
                style={{ padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 14 }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: m.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <m.icon size={18} color={m.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: T.text }}>{m.titre}</span>
                    <Badge text={m.cat} color={m.color} />
                  </div>
                  <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{m.desc}</p>
                </div>
                <ChevronRight size={14} color={T.muted} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 4 }} />
              </div>

              {isOpen && (
                <div style={{ padding: "0 20px 18px", display: "flex", gap: 20, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ flex: 1, paddingTop: 14 }}>
                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>FONCTIONNALITÉS</div>
                    {m.fonctions.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 5 }}>
                        <Check size={11} color={m.color} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: T.text }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ width: 180, paddingTop: 14 }}>
                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>TABLES</div>
                    {m.tables.map((t, i) => (
                      <div key={i} style={{ fontSize: 11, color: m.color, padding: "3px 8px", background: m.color + "10", borderRadius: 5, marginBottom: 4, fontFamily: "monospace" }}>{t}</div>
                    ))}
                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8, marginTop: 12 }}>RÔLES</div>
                    {m.roles.map((r, i) => <Badge key={i} text={r} color={T.muted} />)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataPage() {
  const [selected, setSelected] = useState("Table_Eleve");
  const entity = ENTITIES.find(e => e.name === selected);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
      {/* Entity list */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 12, height: "fit-content" }}>
        <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 10, padding: "0 6px" }}>TABLES ({ENTITIES.length})</div>
        {ENTITIES.map(e => (
          <button key={e.name} onClick={() => setSelected(e.name)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
            borderRadius: 8, cursor: "pointer", marginBottom: 2, textAlign: "left",
            background: selected === e.name ? e.color + "18" : "transparent",
            border: selected === e.name ? `1px solid ${e.color}40` : "1px solid transparent",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: selected === e.name ? T.text : T.muted, fontFamily: "monospace" }}>{e.name}</span>
          </button>
        ))}
      </div>

      {/* Entity detail */}
      {entity && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: entity.color }} />
           <h3 style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 18, color: entity.color }}>{entity.name}</h3>
            <span style={{ fontSize: 12, color: T.muted }}>— {entity.desc}</span>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 140px 1fr", gap: 0 }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, padding: "0 0 8px", letterSpacing: "0.07em" }}>TYPE</div>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, padding: "0 0 8px", letterSpacing: "0.07em" }}>CHAMP</div>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, padding: "0 0 8px", letterSpacing: "0.07em" }}>NOTE</div>
            </div>
            {entity.fields.map(f => <Field key={f.name} {...f} />)}
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: T.muted }}>
            {entity.fields.filter(f => f.type === "FK").length} clé(s) étrangère(s) · {entity.fields.length} champs total
          </div>
        </div>
      )}
    </div>
  );
}

function FluxPage() {
  const [activeFlux, setActiveFlux] = useState(0);
  const flux = FLUX[activeFlux];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {FLUX.map((f, i) => (
          <button key={i} onClick={() => setActiveFlux(i)} style={{
            padding: "14px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
            background: activeFlux === i ? f.color + "18" : T.card,
            border: activeFlux === i ? `1px solid ${f.color}60` : `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <f.icon size={16} color={f.color} />
            <span style={{ fontSize: 12, color: activeFlux === i ? T.text : T.muted, fontWeight: activeFlux === i ? 600 : 400, lineHeight: 1.3 }}>{f.titre}</span>
          </button>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: flux.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <flux.icon size={20} color={flux.color} />
          </div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, color: T.text }}>{flux.titre}</h3>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {flux.etapes.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
              {/* Timeline */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: flux.color + "20", border: `2px solid ${flux.color}60`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: flux.color }}>{e.n}</span>
                </div>
                {i < flux.etapes.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: flux.color + "30", minHeight: 20 }} />
                )}
              </div>
              {/* Content */}
              <div style={{ flex: 1, paddingBottom: i < flux.etapes.length - 1 ? 16 : 0, paddingTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>{e.action}</span>
                  <Badge text={e.module} color={flux.color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UpgradePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: T.text, marginBottom: 6 }}>
          API-SCHOOL Access <ArrowRight size={16} style={{ verticalAlign: "middle", color: T.accent }} /> Application Web
        </h3>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Ce que la version web apporte par rapport au système Access actuel</p>

        <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr 130px", gap: 0 }}>
            {["Aspect", "Version Access (actuelle)", "Version Web (à construire)", "Bénéfice"].map((h, i) => (
              <div key={h} style={{ padding: "12px 16px", fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: "0.07em", background: T.cardB, borderBottom: `1px solid ${T.border}`, borderRight: i < 3 ? `1px solid ${T.border}` : "none" }}>
                {h.toUpperCase()}
              </div>
            ))}
          </div>
          {/* Rows */}
          {AMELIORATIONS.map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr 130px", background: i % 2 === 0 ? "transparent" : T.cardB + "50" }}>
              <div style={{ padding: "12px 16px", fontSize: 12, color: T.accent, fontWeight: 600, borderRight: `1px solid ${T.border}` }}>{r.aspect}</div>
              <div style={{ padding: "12px 16px", fontSize: 12, color: T.muted, borderRight: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={11} color={T.red} style={{ flexShrink: 0 }} />
                {r.access}
              </div>
              <div style={{ padding: "12px 16px", fontSize: 12, color: T.text, borderRight: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
                <Check size={11} color={T.green} style={{ flexShrink: 0 }} />
                {r.web}
              </div>
              <div style={{ padding: "12px 16px" }}>
                <Badge text={r.gain} color={T.green} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phases de développement */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 20 }}>Plan de développement suggéré</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[
            { phase: "Phase 1", titre: "Fondations", color: T.blue, modules: ["Tableau de bord", "Paramètres", "Utilisateurs"], duree: "Semaine 1-2" },
            { phase: "Phase 2", titre: "Scolarité", color: T.teal, modules: ["Élèves", "Inscriptions", "Versements"], duree: "Semaine 3-4" },
            { phase: "Phase 3", titre: "Pédagogie", color: T.purple, modules: ["Notes & Devoirs", "Bulletins", "Examens"], duree: "Semaine 5-6" },
            { phase: "Phase 4", titre: "Finances & RH", color: T.green, modules: ["Dépenses", "Salaires", "Statistiques"], duree: "Semaine 7-8" },
          ].map(p => (
            <div key={p.phase} style={{ padding: 18, borderRadius: 12, background: p.color + "10", border: `1px solid ${p.color}30` }}>
              <Badge text={p.phase} color={p.color} />
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 15, color: T.text, margin: "8px 0 4px" }}>{p.titre}</div>
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 12 }}>{p.duree}</div>
              {p.modules.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: p.color }} />
                  <span style={{ fontSize: 11, color: T.text }}>{m}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────── */
export default function Architecture() {
  const [activeTab, setActiveTab] = useState("overview");

  const pages = { overview: <Overview />, modules: <ModulesPage />, data: <DataPage />, flux: <FluxPage />, upgrade: <UpgradePage /> };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif", color: T.text }}>
      <style>{FONTS}</style>

      {/* HEADER */}
      <div style={{ padding: "28px 36px 0", borderBottom: `1px solid ${T.border}`, background: T.sidebar, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${T.accent}, #a06010)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 18, color: "#fff" }}>C</div>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, color: T.text }}>API-SCHOOL — Architecture Web</h1>
                <p style={{ fontSize: 12, color: T.muted }}>Analyse complète du système existant · Base pour la version web</p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Badge text="13 modules" color={T.accent} />
            <Badge text="11+ tables" color={T.blue} />
            <Badge text="355 élèves" color={T.green} />
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 2 }}>
          {TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
                background: "transparent", border: "none", cursor: "pointer",
                borderBottom: active ? `2px solid ${T.accent}` : "2px solid transparent",
                color: active ? T.accent : T.muted, fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
              }}>
                <t.icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "28px 36px", maxWidth: 1200, margin: "0 auto" }} className="fade-up">
        {pages[activeTab]}
      </div>
    </div>
  );
}
