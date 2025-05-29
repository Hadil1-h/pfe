import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const Profil = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <h2>Profil Utilisateur</h2>
      {user ? (
        <div>
          <p>Email: {user.email}</p>
          <p>Rôle: {user.role}</p>
          <button onClick={logout}>Se déconnecter</button>
        </div>
      ) : (
        <p>Aucun utilisateur connecté</p>
      )}
    </div>
  );
};

export default Profil;
