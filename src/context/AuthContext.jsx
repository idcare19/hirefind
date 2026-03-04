import React, { createContext, useContext, useEffect, useState } from "react";
import { ID } from "appwrite";
import { account } from "../services/appwrite";
import { ensureProfile, getCurrentUser, getMyProfile } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const u = await getCurrentUser();
    setUser(u);
    if (u) {
      const p = (await getMyProfile(u.$id)) || (await ensureProfile(u));
      setProfile(p);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function signup(email, password, name) {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    await refresh();
  }

  async function login(email, password) {
    await account.createEmailPasswordSession(email, password);
    await refresh();
  }

  async function logout() {
    await account.deleteSession("current");
    await refresh();
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refresh, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}