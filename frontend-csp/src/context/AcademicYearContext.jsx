import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';

const AcademicYearContext = createContext();

export function AcademicYearProvider({ children }) {
  const [years, setYears] = useState([]);
  const [currentYear, setCurrentYearState] = useState(() => {
    const saved = localStorage.getItem('currentYearName');
    return saved || '2025-2026';
  });
  const [loading, setLoading] = useState(true);

  const fetchYears = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/api/academic-years');
      setYears(data || []);
      const current = data?.find((y) => y.isCurrent);
      if (current) {
        setCurrentYearState(current.name);
        localStorage.setItem('currentYearName', current.name);
      }
    } catch {
      // En cas d'erreur, garde la valeur par défaut
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const setCurrentYear = useCallback(async (yearId) => {
    await fetchWithAuth('/api/academic-years/set-current', {
      method: 'POST',
      body: JSON.stringify({ yearId }),
    });
    await fetchYears();
  }, [fetchYears]);

  return (
    <AcademicYearContext.Provider value={{ years, currentYear, setCurrentYear, loading, refresh: fetchYears }}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  return useContext(AcademicYearContext);
}
