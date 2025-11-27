

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { SiteSettings, HeroSlide } from "../types";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "global";
const LOCAL_STORAGE_KEY = "vision_perfumes_settings";

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    title: "A Essência da Elegância",
    subtitle: "Descubra fragrâncias exclusivas das marcas mais prestigiadas do mundo.",
    buttonText: "Explorar Catálogo",
    image: "https://images.unsplash.com/photo-1585120040315-2241b774ad0f?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 'slide-2',
    title: "Novas Coleções de Verão",
    subtitle: "Refrescância e sofisticação para os dias mais quentes do ano.",
    buttonText: "Ver Novidades",
    image: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=2070&auto=format&fit=crop"
  }
];

const DEFAULT_SETTINGS: SiteSettings = {
  topBarText: "✨ Frete Grátis para compras acima de R$ 300 | Até 3x sem juros no cartão",
  slides: DEFAULT_SLIDES,
  originZip: "01001-000", // Default generic SP zip
  frenetToken: "AB341B5DR56D1R438AR905ER61598F036D68", // Token fornecido
  pagarmePublicKey: "pk_MR0m686Tv6INVzgK", // Chave Pagar.me fornecida
  apiBaseUrl: "", // URL vazia por padrão (ativa modo simulação)
  freeShippingThreshold: 300 // Padrão R$ 300,00
};

export const getSiteSettings = async (): Promise<SiteSettings> => {
  // Start with defaults
  let settings = { ...DEFAULT_SETTINGS };

  // 1. Try to load from Firestore (Source of Truth)
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Handle migration from old single fields to slides array if necessary
      let loadedSlides = data.slides;
      if (!loadedSlides || !Array.isArray(loadedSlides) || loadedSlides.length === 0) {
        // If no slides but old fields exist, convert to a slide
        if (data.heroTitle) {
          loadedSlides = [{
            id: 'legacy-slide',
            title: data.heroTitle,
            subtitle: data.heroSubtitle || DEFAULT_SLIDES[0].subtitle,
            buttonText: data.heroButtonText || DEFAULT_SLIDES[0].buttonText,
            image: data.heroBackgroundImage || DEFAULT_SLIDES[0].image
          }];
        } else {
          loadedSlides = DEFAULT_SLIDES;
        }
      }

      settings = {
        topBarText: data.topBarText ?? settings.topBarText,
        originZip: data.originZip ?? settings.originZip,
        frenetToken: data.frenetToken ?? settings.frenetToken,
        pagarmePublicKey: data.pagarmePublicKey ?? settings.pagarmePublicKey,
        apiBaseUrl: data.apiBaseUrl ?? settings.apiBaseUrl,
        freeShippingThreshold: data.freeShippingThreshold ?? settings.freeShippingThreshold,
        slides: loadedSlides
      };
    }
  } catch (error) {
    console.warn("Could not fetch settings from Firestore. Falling back to defaults/local.", error);
  }

  // 2. Try to load from Local Storage
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      const parsed = JSON.parse(localData);
      
      // Ensure compatibility with local storage data
      if (!parsed.slides && parsed.heroTitle) {
         parsed.slides = [{
            id: 'legacy-local',
            title: parsed.heroTitle,
            subtitle: parsed.heroSubtitle,
            buttonText: parsed.heroButtonText,
            image: parsed.heroBackgroundImage
         }];
      }

      settings = { ...settings, ...parsed };
      
      // Extra safety check for slides array
      if (!settings.slides || settings.slides.length === 0) {
          settings.slides = DEFAULT_SLIDES;
      }
    }
  } catch (e) {
    console.warn("Error reading settings from localStorage", e);
  }

  return settings;
};

export const updateSiteSettings = async (settings: SiteSettings): Promise<void> => {
  const cleanSettings: SiteSettings = {
    topBarText: settings.topBarText || "",
    originZip: settings.originZip || "",
    frenetToken: settings.frenetToken || "",
    pagarmePublicKey: settings.pagarmePublicKey || "",
    apiBaseUrl: settings.apiBaseUrl || "",
    freeShippingThreshold: Number(settings.freeShippingThreshold) || 0,
    slides: settings.slides.map(s => ({
        id: s.id || Math.random().toString(36).substr(2, 9),
        title: s.title || "",
        subtitle: s.subtitle || "",
        buttonText: s.buttonText || "",
        image: s.image || "",
        ctaLink: s.ctaLink || ""
    }))
  };

  // 1. Always save to LocalStorage
  try {
     localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanSettings));
  } catch (e) {
      console.error("Error saving settings to localStorage", e);
  }

  // 2. Try to save to Firestore
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), cleanSettings);
  } catch (error: any) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        console.warn("Firestore permission denied. Settings saved locally only.");
        return; 
    }
    console.error("Error updating settings in Firestore:", error);
  }
};