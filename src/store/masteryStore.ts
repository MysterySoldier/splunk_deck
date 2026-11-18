import { useState, useEffect, useCallback } from "react";
import type { MasteryState, UserAccount } from "../data/types";

const LOCAL_STORAGE_KEY = "splunk_deck_mastery_v1";
const LOCAL_USER_KEY = "splunk_deck_user_v1";

const defaultMastery: MasteryState = {
  examMastered: {},
  studyMastered: {},
  updatedAt: 0,
};

export function loadLocalMastery(): MasteryState {
  if (typeof window === "undefined") return defaultMastery;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return defaultMastery;
    const parsed = JSON.parse(raw);
    return {
      examMastered: parsed.examMastered || {},
      studyMastered: parsed.studyMastered || {},
      updatedAt: parsed.updatedAt || 0,
    };
  } catch {
    return defaultMastery;
  }
}

export function saveLocalMastery(state: MasteryState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function loadLocalUser(): UserAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalUser(user: UserAccount | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch {
    // ignore
  }
}

/** Merges two mastery states (union of mastered cards) */
export function mergeMastery(a: MasteryState, b: MasteryState): MasteryState {
  const examMastered: Record<number, boolean> = { ...a.examMastered, ...b.examMastered };
  const studyMastered: Record<number, boolean> = { ...a.studyMastered, ...b.studyMastered };
  return {
    examMastered,
    studyMastered,
    updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0, Date.now()),
  };
}

export function useMastery() {
  const [mastery, setMasteryState] = useState<MasteryState>(loadLocalMastery);
  const [user, setUserState] = useState<UserAccount | null>(loadLocalUser);
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Fetch /api/auth/config on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchConfig() {
      try {
        const res = await fetch("/splunk_deck/api/auth/config");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.googleClientId) {
            setGoogleClientId(data.googleClientId);
          }
          if (!cancelled && typeof data.cloudSyncEnabled === "boolean") {
            setCloudSyncEnabled(data.cloudSyncEnabled);
          }
        }
      } catch {
        // Fallback default
        if (!cancelled) {
          setGoogleClientId("878162796773-a8mdqnl3d5mco0dor0j1v93ftd9fjspi.apps.googleusercontent.com");
        }
      }
    }
    fetchConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync to Cloud
  const syncToCloud = useCallback(async (stateToSync: MasteryState, currentUser: UserAccount | null) => {
    if (!currentUser || !currentUser.googleId) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/splunk_deck/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId: currentUser.googleId,
          displayName: currentUser.displayName,
          email: currentUser.email || "",
          mastery: stateToSync,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.account?.mastery) {
          const merged = mergeMastery(stateToSync, data.account.mastery);
          saveLocalMastery(merged);
          setMasteryState(merged);
        }
      }
    } catch (e) {
      console.warn("Could not sync mastery to cloud:", e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Fetch Cloud Mastery on login
  const fetchCloudMastery = useCallback(async (currentUser: UserAccount) => {
    if (!currentUser.googleId) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/splunk_deck/api/sync?googleId=${encodeURIComponent(currentUser.googleId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.account?.mastery) {
          const local = loadLocalMastery();
          const merged = mergeMastery(local, data.account.mastery);
          saveLocalMastery(merged);
          setMasteryState(merged);
          // Push merged state back to cloud
          await syncToCloud(merged, currentUser);
        }
      }
    } catch (e) {
      console.warn("Could not fetch cloud mastery:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [syncToCloud]);

  const setUser = useCallback((newUser: UserAccount | null) => {
    saveLocalUser(newUser);
    setUserState(newUser);
    if (newUser) {
      fetchCloudMastery(newUser);
    }
  }, [fetchCloudMastery]);

  const markMastered = useCallback((bank: "exam" | "study", cardId: number) => {
    setMasteryState((prev) => {
      const next: MasteryState = {
        ...prev,
        examMastered: bank === "exam" ? { ...prev.examMastered, [cardId]: true } : prev.examMastered,
        studyMastered: bank === "study" ? { ...prev.studyMastered, [cardId]: true } : prev.studyMastered,
        updatedAt: Date.now(),
      };
      saveLocalMastery(next);
      if (user) {
        syncToCloud(next, user);
      }
      return next;
    });
  }, [user, syncToCloud]);

  const unmarkMastered = useCallback((bank: "exam" | "study", cardId: number) => {
    setMasteryState((prev) => {
      const nextExam = { ...prev.examMastered };
      const nextStudy = { ...prev.studyMastered };
      if (bank === "exam") delete nextExam[cardId];
      if (bank === "study") delete nextStudy[cardId];
      const next: MasteryState = {
        examMastered: nextExam,
        studyMastered: nextStudy,
        updatedAt: Date.now(),
      };
      saveLocalMastery(next);
      if (user) {
        syncToCloud(next, user);
      }
      return next;
    });
  }, [user, syncToCloud]);

  const resetBankMastery = useCallback((bank: "exam" | "study", topic?: string, cardIds?: number[]) => {
    setMasteryState((prev) => {
      const nextExam = { ...prev.examMastered };
      const nextStudy = { ...prev.studyMastered };
      if (cardIds && cardIds.length > 0) {
        for (const id of cardIds) {
          if (bank === "exam") delete nextExam[id];
          if (bank === "study") delete nextStudy[id];
        }
      } else {
        if (bank === "exam") {
          return { ...prev, examMastered: {}, updatedAt: Date.now() };
        } else {
          return { ...prev, studyMastered: {}, updatedAt: Date.now() };
        }
      }
      const next: MasteryState = {
        examMastered: nextExam,
        studyMastered: nextStudy,
        updatedAt: Date.now(),
      };
      saveLocalMastery(next);
      if (user) {
        syncToCloud(next, user);
      }
      return next;
    });
  }, [user, syncToCloud]);

  return {
    mastery,
    user,
    googleClientId,
    cloudSyncEnabled,
    isSyncing,
    setUser,
    markMastered,
    unmarkMastered,
    resetBankMastery,
  };
}
