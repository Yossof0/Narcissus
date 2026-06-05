import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeId = "1" | "2" | "3" | "4" | "5" | "6" | "7";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  nameAr: string;
  preview: string[];
  vars: Record<string, string>;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "1",
    name: "Strawberry Bloom",
    nameAr: "إزهار الفراولة",
    preview: ["#fadde1", "#ff5d8f", "#ffa6c1"],
    vars: {
      "--background": "#fadde1",
      "--foreground": "#3d0a18",
      "--card": "#ffc4d6",
      "--card-foreground": "#3d0a18",
      "--popover": "#ffc4d6",
      "--popover-foreground": "#3d0a18",
      "--primary": "#ff5d8f",
      "--primary-foreground": "#ffffff",
      "--secondary": "#ffcad4",
      "--secondary-foreground": "#3d0a18",
      "--muted": "#ffcad4",
      "--muted-foreground": "#9a4060",
      "--accent": "#ff87ab",
      "--accent-foreground": "#ffffff",
      "--border": "#ffa6c1",
      "--input": "#ffc4d6",
      "--ring": "#ff5d8f",
      "--destructive": "#e53935",
      "--destructive-foreground": "#ffffff",
    },
  },
  {
    id: "2",
    name: "Powder Petal",
    nameAr: "بتلة ناعمة",
    preview: ["#fff1e6", "#eddcd2", "#99c1de"],
    vars: {
      "--background": "#fff1e6",
      "--foreground": "#2c1f16",
      "--card": "#fde2e4",
      "--card-foreground": "#2c1f16",
      "--popover": "#f0efeb",
      "--popover-foreground": "#2c1f16",
      "--primary": "#99c1de",
      "--primary-foreground": "#0d1f2a",
      "--secondary": "#eddcd2",
      "--secondary-foreground": "#2c1f16",
      "--muted": "#f0efeb",
      "--muted-foreground": "#7a6658",
      "--accent": "#bcd4e6",
      "--accent-foreground": "#0d1f2a",
      "--border": "#dbe7e4",
      "--input": "#fad2e1",
      "--ring": "#99c1de",
      "--destructive": "#e53935",
      "--destructive-foreground": "#ffffff",
    },
  },
  {
    id: "3",
    name: "Night Bordeaux",
    nameAr: "بوردو الليل",
    preview: ["#461220", "#b23a48", "#fed0bb"],
    vars: {
      "--background": "#461220",
      "--foreground": "#fed0bb",
      "--card": "#8c2f39",
      "--card-foreground": "#fed0bb",
      "--popover": "#8c2f39",
      "--popover-foreground": "#fed0bb",
      "--primary": "#fcb9b2",
      "--primary-foreground": "#461220",
      "--secondary": "#b23a48",
      "--secondary-foreground": "#fed0bb",
      "--muted": "#8c2f39",
      "--muted-foreground": "#fcb9b2",
      "--accent": "#fed0bb",
      "--accent-foreground": "#461220",
      "--border": "#b23a48",
      "--input": "#8c2f39",
      "--ring": "#fcb9b2",
      "--destructive": "#ff5252",
      "--destructive-foreground": "#ffffff",
    },
  },
  {
    id: "4",
    name: "Periwinkle Mist",
    nameAr: "ضباب البيريوينكل",
    preview: ["#edf2fb", "#abc4ff", "#ccdbfd"],
    vars: {
      "--background": "#edf2fb",
      "--foreground": "#0d1b4a",
      "--card": "#d7e3fc",
      "--card-foreground": "#0d1b4a",
      "--popover": "#e2eafc",
      "--popover-foreground": "#0d1b4a",
      "--primary": "#abc4ff",
      "--primary-foreground": "#0d1b4a",
      "--secondary": "#ccdbfd",
      "--secondary-foreground": "#0d1b4a",
      "--muted": "#d7e3fc",
      "--muted-foreground": "#3a4a8a",
      "--accent": "#b6ccfe",
      "--accent-foreground": "#0d1b4a",
      "--border": "#c1d3fe",
      "--input": "#d7e3fc",
      "--ring": "#abc4ff",
      "--destructive": "#e53935",
      "--destructive-foreground": "#ffffff",
    },
  },
  {
    id: "5",
    name: "Dark Teal",
    nameAr: "الفيروزي الداكن",
    preview: ["#01161e", "#598392", "#eff6e0"],
    vars: {
      "--background": "#01161e",
      "--foreground": "#eff6e0",
      "--card": "#124559",
      "--card-foreground": "#eff6e0",
      "--popover": "#124559",
      "--popover-foreground": "#eff6e0",
      "--primary": "#598392",
      "--primary-foreground": "#eff6e0",
      "--secondary": "#124559",
      "--secondary-foreground": "#aec3b0",
      "--muted": "#124559",
      "--muted-foreground": "#aec3b0",
      "--accent": "#aec3b0",
      "--accent-foreground": "#01161e",
      "--border": "#598392",
      "--input": "#124559",
      "--ring": "#598392",
      "--destructive": "#ff5252",
      "--destructive-foreground": "#ffffff",
    },
  },
  {
    id: "6",
    name: "Ruby Noir",
    nameAr: "الياقوت الأسود",
    preview: ["#580c1f", "#a51c30", "#c52233"],
    vars: {
      "--background": "#580c1f",
      "--foreground": "#f5e6e8",
      "--card": "#74121d",
      "--card-foreground": "#f5e6e8",
      "--popover": "#74121d",
      "--popover-foreground": "#f5e6e8",
      "--primary": "#c52233",
      "--primary-foreground": "#f5e6e8",
      "--secondary": "#a7333f",
      "--secondary-foreground": "#f5e6e8",
      "--muted": "#a51c30",
      "--muted-foreground": "#d4a0a8",
      "--accent": "#c52233",
      "--accent-foreground": "#f5e6e8",
      "--border": "#a7333f",
      "--input": "#74121d",
      "--ring": "#c52233",
      "--destructive": "#ff5252",
      "--destructive-foreground": "#ffffff",
    },
  },
  {
    id: "7",
    name: "Almond Silk",
    nameAr: "حرير اللوز",
    preview: ["#f5ebe0", "#e3d5ca", "#d5bdaf"],
    vars: {
      "--background": "#f5ebe0",
      "--foreground": "#2c1f14",
      "--card": "#edede9",
      "--card-foreground": "#2c1f14",
      "--popover": "#edede9",
      "--popover-foreground": "#2c1f14",
      "--primary": "#d5bdaf",
      "--primary-foreground": "#2c1f14",
      "--secondary": "#e3d5ca",
      "--secondary-foreground": "#2c1f14",
      "--muted": "#d6ccc2",
      "--muted-foreground": "#7a6655",
      "--accent": "#d5bdaf",
      "--accent-foreground": "#2c1f14",
      "--border": "#d6ccc2",
      "--input": "#e3d5ca",
      "--ring": "#d5bdaf",
      "--destructive": "#e53935",
      "--destructive-foreground": "#ffffff",
    },
  },
];

const ALL_THEME_VARS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--border",
  "--input",
  "--ring",
  "--destructive",
  "--destructive-foreground",
];

interface ThemeContextType {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  theme: ThemeDefinition;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    return (localStorage.getItem("narcissus-theme") as ThemeId) || "1";
  });

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  const setTheme = (id: ThemeId) => {
    setThemeId(id);
    localStorage.setItem("narcissus-theme", id);
  };

  useEffect(() => {
    const root = document.documentElement;
    ALL_THEME_VARS.forEach(key => root.style.removeProperty(key));
    Object.entries(theme.vars).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ themeId, setTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
