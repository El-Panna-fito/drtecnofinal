import React, { createContext, useContext, useState, useEffect } from "react";

interface RouterContextType {
  path: string;
  navigate: (newPath: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const Router: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState(null, "", newPath);
    // Extract only the pathname portion for local route matching
    const pathname = newPath.split("?")[0].split("#")[0];
    setPath(pathname);
    // Scroll smoothly to top on navigation
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useNavigate = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useNavigate must be used within a Router provider");
  }
  return context;
};
