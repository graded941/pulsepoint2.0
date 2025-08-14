import { useEffect, useState } from "react";

function getPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem("pp_" + key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

function setPref<T>(key: string, value: T) {
  try {
    localStorage.setItem("pp_" + key, JSON.stringify(value));
  } catch {}
}

const btn = "w-9 h-9 grid place-items-center rounded-md border bg-card hover:bg-accent/10 transition-colors";

const AccessibilityDock = () => {
  const [fontLevel, setFontLevel] = useState<number>(() => getPref("fontLevel", 0));
  const [dark, setDark] = useState<boolean>(() => getPref("dark", false));
  const [contrast, setContrast] = useState<boolean>(() => getPref("contrast", false));
  const [dyslexic, setDyslexic] = useState<boolean>(() => getPref("dyslexic", false));
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => getPref("reducedMotion", false));
  const [lightFont, setLightFont] = useState<boolean>(() => getPref("lightFont", false));

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 + fontLevel}px`;
    setPref("fontLevel", fontLevel);
  }, [fontLevel]);

  useEffect(() => {
    setPref("dark", dark);
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    setPref("contrast", contrast);
    if (contrast) {
      document.documentElement.style.setProperty("--text", "#0B1226");
      document.documentElement.style.setProperty("--bg", "#FFFFFF");
    } else {
      document.documentElement.style.removeProperty("--text");
      document.documentElement.style.removeProperty("--bg");
    }
  }, [contrast]);

  useEffect(() => {
    setPref("dyslexic", dyslexic);
    document.body.style.fontFamily = dyslexic ? "'OpenDyslexic', Inter, system-ui" : "";
  }, [dyslexic]);

  useEffect(() => {
    setPref("reducedMotion", reducedMotion);
    if (reducedMotion) {
      document.documentElement.style.setProperty("scroll-behavior", "auto");
    } else {
      document.documentElement.style.removeProperty("scroll-behavior");
    }
  }, [reducedMotion]);

  useEffect(() => {
    setPref("lightFont", lightFont);
    document.body.style.fontWeight = lightFont ? "300" : "";
  }, [lightFont]);

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 grid gap-2 p-2 border rounded-xl bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70 shadow-sm">
      <button className={btn} title="Decrease font size" aria-label="Decrease font size" onClick={() => setFontLevel((v) => Math.max(-1, v - 1))}>A−</button>
      <button className={btn} title="Increase font size" aria-label="Increase font size" onClick={() => setFontLevel((v) => Math.min(3, v + 1))}>A+</button>
      <button className={btn} title="Toggle dark theme" aria-label="Toggle dark theme" onClick={() => setDark((v) => !v)}>{dark ? "🌙" : "☀️"}</button>
      <button className={btn} title="High contrast" aria-label="High contrast" onClick={() => setContrast((v) => !v)}>◐</button>
      <button className={btn} title="Dyslexic font" aria-label="Dyslexic font" onClick={() => setDyslexic((v) => !v)}>𝑓</button>
      <button className={btn} title="Light font weight" aria-label="Light font weight" onClick={() => setLightFont((v) => !v)}>Lt</button>
      <button className={btn} title="Reduce motion" aria-label="Reduce motion" onClick={() => setReducedMotion((v) => !v)}>⏸</button>
    </div>
  );
};

export default AccessibilityDock;







