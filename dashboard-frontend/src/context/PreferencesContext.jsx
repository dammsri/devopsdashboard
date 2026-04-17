import { createContext, useContext, useState, useEffect } from "react";

const PreferencesContext = createContext();

export function PreferencesProvider({ children }) {
  const [layoutStyle, setLayoutStyle] = useState(() => {
    return localStorage.getItem("devops_copilot_layout") || "honeycomb";
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("devops_copilot_theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("devops_copilot_layout", layoutStyle);
  }, [layoutStyle]);

  useEffect(() => {
    localStorage.setItem("devops_copilot_theme", darkMode ? "dark" : "light");
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <PreferencesContext.Provider value={{ layoutStyle, setLayoutStyle, darkMode, setDarkMode }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
