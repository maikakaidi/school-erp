import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';

const EnseignantContext = createContext();

export function EnseignantProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [affectations, setAffectations] = useState([]);
  const [anneeScolaire, setAnneeScolaire] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/prof/affectations');
      setAffectations(data.affectations || []);
      setAnneeScolaire(data.anneeScolaire || null);
    } catch { /* silent */ }
    try {
      const me = await fetchWithAuth('/prof/me');
      setProfile(me);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const classes = [...new Map(affectations.map((a) => [a.classe.id, a.classe])).values()];

  return (
    <EnseignantContext.Provider value={{
      profile,
      affectations,
      classes,
      anneeScolaire,
      refresh,
      loading,
    }}>
      {children}
    </EnseignantContext.Provider>
  );
}

export function useEnseignant() {
  return useContext(EnseignantContext);
}
