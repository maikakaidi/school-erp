import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';

const AcademicYearContext = createContext();

export function AcademicYearProvider({ children }) {
  const [years, setYears] = useState([]);
  const [currentYear, setCurrentYearState] = useState(() => {
    return localStorage.getItem('currentYearName') || null;
  });
  const [loading, setLoading] = useState(true);

  const fetchYears = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/academic-years');
      setYears(data || []);
      const current = data?.find((y) => y.isCurrent);
      if (current) {
        setCurrentYearState(current.name);
        localStorage.setItem('currentYearName', current.name);
      } else if (data?.length > 0) {
        setCurrentYearState(data[0].name);
        localStorage.setItem('currentYearName', data[0].name);
      } else {
        setCurrentYearState(null);
        localStorage.removeItem('currentYearName');
      }
    } catch {
      // keep saved value from localStorage
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const setCurrentYear = useCallback(async (yearId) => {
    await fetchWithAuth('/academic-years/set-current', {
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
