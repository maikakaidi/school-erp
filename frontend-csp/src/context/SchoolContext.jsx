
import { createContext, useContext, useState, useEffect } from "react";

const SchoolContext = createContext();

export function SchoolProvider({ children }) {
  const [school, setSchool] = useState(() => {
    const saved = localStorage.getItem("school-config");

    return saved
      ? JSON.parse(saved)
      : {
          name: "API-SCHOOL",
          slogan: "Excellence et Discipline",
          primaryColor: "#d4921a",
          secondaryColor: "#06101a",
          trialDays: 15,
          subscriptionStatus: "trial"
        };
  });

  useEffect(() => {
    localStorage.setItem("school-config", JSON.stringify(school));
  }, [school]);

  return (
    <SchoolContext.Provider value={{ school, setSchool }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  return useContext(SchoolContext);
}
