import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:8080/api/utilisateurs", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }

      const users = await response.json();
      const foundUser = users.find(
        (u) => u.email === email && u.motDePasseUtilisateur === password
      );

      if (!foundUser) {
        throw new Error("Invalid credentials");
      }

      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        typeUtilisateur: foundUser.typeUtilisateur,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      switch (foundUser.typeUtilisateur) {
        case "agent":
          navigate("/dashboardAgent");
          break;
        case "contact":
          navigate("/dashboardContact");
          break;
        case "admin":
          navigate("/dashboardAdmin");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error.message);
      throw new Error(error.message === "Invalid credentials" ? "Email ou mot de passe incorrect !" : "Erreur de connexion au serveur. Veuillez réessayer.");
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
