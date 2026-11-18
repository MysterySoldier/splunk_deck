import { useState, useEffect, useCallback } from "react";
import type { MasteryState, UserAccount, MasteredSide } from "../data/types";

const LOCAL_STORAGE_KEY = "splunk_deck_mastery_v1";
const LOCAL_USER_KEY = "splunk_deck_user_v1";
const LOCAL_SIDE_KEY = "splunk_deck_mastered_side";

const defaultMastery: MasteryState = {
  examMastered: {},
  studyMastered: {},
  masteredSide: "left",
  updatedAt: 0,
};

export function loadLocalSide(): MasteredSide {
  if (typeof window === "undefined") return "left";
  try {
    const raw = localStorage.getItem(LOCAL_SIDE_KEY);
    if (raw === "right") return "right";
    return "left";
  } catch {
    return "left";
  }
}

export function saveLocalSide(side: MasteredSide) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_SIDE_KEY, side);
  } catch {
    // ignore
  }
}

export function loadLocalMastery(): MasteryState {
  if (typeof window === "undefined") return defaultMastery;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const side = loadLocalSide();
    if (!raw) return { ...defaultMastery, masteredSide: side };
    const parsed = JSON.parse(raw);
    return {
      examMastered: parsed.examMastered || {},
      studyMastered: parsed.studyMastered || {},
      masteredSide: parsed.masteredSide || side || "left",
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
    if (state.masteredSide) {
      saveLocalSide(state.masteredSide);
    }
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

/** Merges two mastery states (union of mastered cards + latest side) */
export function mergeMastery(a: MasteryState, b: MasteryState): MasteryState {
  const examMastered: Record<number, boolean> = { ...a.examMastered, ...b.examMastered };
  const studyMastered: Record<number, boolean> = { ...a.studyMastered, ...b.studyMastered };
  const masteredSide: MasteredSide = b.masteredSide || a.masteredSide || "left";
  return {
    examMastered,
    studyMastered,
    masteredSide,
    updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0, Date.now()),
  };
}

export function useMastery() {
  const [mastery, setMasteryState] = useState<MasteryState>(loadLocalMastery);
  const [masteredSide, setMasteredSideState] = useState<MasteredSide>(() => {
    return loadLocalSide();
  });
  const [user, setUserState] = useState<UserAccount | null>(loadLocalUser);
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync side state with mastery state
  useEffect(() => {
    if (mastery.masteredSide && mastery.masteredSide !== masteredSide) {
      setMasteredSideState(mastery.masteredSide);
      saveLocalSide(mastery.masteredSide);
    }
  }, [mastery.masteredSide, masteredSide]);

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
          if (merged.masteredSide) {
            setMasteredSideState(merged.masteredSide);
            saveLocalSide(merged.masteredSide);
          }
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
          if (merged.masteredSide) {
            setMasteredSideState(merged.masteredSide);
            saveLocalSide(merged.masteredSide);
          }
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

  const setMasteredSide = useCallback((side: MasteredSide) => {
    setMasteredSideState(side);
    saveLocalSide(side);
    setMasteryState((prev) => {
      const next: MasteryState = {
        ...prev,
        masteredSide: side,
        updatedAt: Date.now(),
      };
      saveLocalMastery(next);
      if (user) {
        syncToCloud(next, user);
      }
      return next;
    });
  }, [user, syncToCloud]);

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
        masteredSide: prev.masteredSide || masteredSide,
        updatedAt: Date.now(),
      };
      saveLocalMastery(next);
      if (user) {
        syncToCloud(next, user);
      }
      return next;
    });
  }, [user, syncToCloud, masteredSide]);

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
        masteredSide: prev.masteredSide || masteredSide,
        updatedAt: Date.now(),
      };
      saveLocalMastery(next);
      if (user) {
        syncToCloud(next, user);
      }
      return next;
    });
  }, [user, syncToCloud, masteredSide]);

  return {
    mastery,
    masteredSide,
    setMasteredSide,
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
