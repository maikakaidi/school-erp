import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';

const ParentContext = createContext();

export function ParentProvider({ children: childrenNode }) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshChildren = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/parent/children');
      setChildren(data);
      setSelectedChildId((prev) => {
        if (prev && data.some((c) => c.id === prev)) return prev;
        return data[0]?.id || null;
      });
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshChildren();
  }, [refreshChildren]);

  const selectedChild = children.find((c) => c.id === selectedChildId) || null;

  return (
    <ParentContext.Provider value={{ children, selectedChildId, selectedChild, setSelectedChildId, refreshChildren, loading }}>
      {childrenNode}
    </ParentContext.Provider>
  );
}

export function useParent() {
  return useContext(ParentContext);
}
