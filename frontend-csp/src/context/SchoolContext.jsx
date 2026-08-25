
import { createContext, useContext, useState, useEffect } from "react";

const SchoolContext = createContext();

function loadSubscription() {
  try {
    const saved = localStorage.getItem("school-subscription");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

export function SchoolProvider({ children }) {
  const [school, setSchool] = useState(() => {
    const saved = localStorage.getItem("school-config");
    const sub = loadSubscription();
    const base = saved
      ? JSON.parse(saved)
      : {
          name: "API-SCHOOL",
          slogan: "Excellence et Discipline",
          primaryColor: "#d4921a",
          secondaryColor: "#06101a",
        };
    return { ...base, ...sub };
  });

  useEffect(() => {
    const { subscriptionStatus, subscriptionStart, subscriptionEnd, trialDays, createdAt, ...rest } = school;
    localStorage.setItem("school-config", JSON.stringify(rest));
  }, [school]);

  useEffect(() => {
    const handler = () => {
      const sub = loadSubscription();
      setSchool(prev => ({ ...prev, ...sub }));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <SchoolContext.Provider value={{ school, setSchool }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  return useContext(SchoolContext);
}
