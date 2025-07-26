// 🎯 EINHEITLICHES DESIGN-SYSTEM mit korrekter Markenfarbe
// Markenfarbe: #FE5B25 (nicht orange-500!)
// Heller Hintergrund für Outline-Buttons: #FFE1D7

export const brandColors = {
  primary: "#FE5B25",        // Markenfarbe
  primaryLight: "#FFE1D7",   // Heller Hintergrund für Buttons/Actions
  primaryHover: "#E5501F",   // Hover-State für gefüllte Buttons
  primaryLightHover: "#FFD4C4", // Hover für Outline-Buttons
  infoLight: "#FEF5F1",      // SEHR heller orange Touch für Info-Flächen (fast weiß)
};

export const buttonStyles = {
  // 1. CREATE/ADD BUTTONS (Voll in Markenfarbe)
  create: {
    default: "px-4 py-2 bg-[#FE5B25] text-white text-sm font-medium rounded-md hover:bg-[#E5501F] transition-colors flex items-center space-x-2",
    large: "px-6 py-3 bg-[#FE5B25] text-white text-base font-medium rounded-md hover:bg-[#E5501F] transition-colors flex items-center space-x-2",
  },

  // 2. PRIMARY BUTTONS (Nur oranger Rand + weißer Hintergrund für Aktions-Buttons)
  primary: {
    default: "px-4 py-2 border border-[#FE5B25] bg-white text-[#FE5B25] text-sm font-medium rounded-md hover:bg-[#FFE1D7] transition-colors flex items-center space-x-2",
    large: "px-6 py-3 border border-[#FE5B25] bg-white text-[#FE5B25] text-base font-medium rounded-md hover:bg-[#FFE1D7] transition-colors flex items-center space-x-2",
    fullWidth: "w-full px-4 py-2 border border-[#FE5B25] bg-white text-[#FE5B25] text-sm font-medium rounded-md hover:bg-[#FFE1D7] transition-colors flex items-center justify-center",
  },

  // 3. HIGHLIGHT AREAS (Seichter orange Touch OHNE Rand für Pläne/Cards)
  highlight: {
    card: "p-4 bg-[#FFE1D7] rounded-lg border border-gray-200", // Seichter orange Hintergrund + neutraler Rand
    subtle: "bg-[#FFE1D7] text-[#FE5B25]", // Nur Hintergrund + Text für table cells etc
    button: "px-4 py-2 bg-[#FFE1D7] text-[#FE5B25] text-sm font-medium rounded-md hover:bg-[#FFD4C4] transition-colors flex items-center space-x-2", // Button ohne orangen Rand
  },

  // 4. INFO AREAS (Sehr heller orange Touch für Informationsflächen - fast weiß)
  info: {
    card: "p-4 bg-[#FEF5F1] rounded-lg", // SEHR heller Hintergrund, KEIN Rand
    subtle: "bg-[#FEF5F1]", // Nur Hintergrund für Zellen etc
    panel: "bg-[#FEF5F1] rounded-lg p-6", // Für größere Info-Bereiche
  },

  // 5. SECONDARY BUTTONS (Grau Outline)
  secondary: {
    default: "px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2",
    large: "px-6 py-3 border border-gray-300 bg-white text-gray-700 text-base font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2",
    fullWidth: "w-full px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center",
  },

  // 6. CARD ACTION BUTTONS
  cardAction: {
    statusActive: "px-3 py-2 border-2 border-green-200 bg-green-50 text-green-600 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-2",
    statusPaused: "px-3 py-2 border-2 border-yellow-200 bg-yellow-50 text-yellow-600 text-sm font-medium rounded-lg hover:bg-yellow-100 transition-colors flex items-center space-x-2",
    icon: "p-2 border-2 border-gray-200 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors",
    iconDelete: "p-2 border-2 border-red-200 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors",
  },

  // 7. NAVIGATION BUTTONS
  navigation: {
    back: "px-3 py-2 border border-gray-300 bg-white text-gray-600 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2",
  },

  // 8. DIALOG BUTTONS
  dialog: {
    cancel: "px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors",
    destructive: "px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors",
    confirm: "px-4 py-2 bg-[#FE5B25] text-white text-sm font-medium rounded-md hover:bg-[#E5501F] transition-colors",
  }
};

// EINHEITLICHE TYPOGRAPHY & SPACING
export const layoutStyles = {
  // Page Layout (ÜBERALL gleich!)
  pageContainer: "space-y-6",
  pageHeader: "flex items-center justify-between mb-6",
  
  // Card Layout
  cardGrid: "grid gap-6 md:grid-cols-2",
  cardContent: "space-y-4",
};

export const textStyles = {
  // Page Headers (EXAKT gleiche Größen und Abstände)
  pageTitle: "text-2xl font-bold text-gray-900 leading-tight",
  pageSubtitle: "text-sm font-medium text-gray-500 mt-1",
  
  // Section Headers  
  sectionTitle: "text-xl font-semibold text-gray-900 leading-tight",
  sectionSubtitle: "text-sm font-medium text-gray-500 mt-1",
  
  // Card Content
  cardTitle: "text-lg font-semibold text-gray-900 leading-tight",
  cardSubtitle: "text-sm font-medium text-gray-500",
  
  // Metrics
  metric: "text-lg font-semibold text-gray-900",
  metricLabel: "text-xs font-medium text-gray-500 uppercase tracking-wide",
  
  // Button Text (immer konsistent)
  buttonText: "text-sm font-medium",
  buttonTextLarge: "text-base font-medium",
};

export const spacingStyles = {
  // Standardabstände (ÜBERALL verwenden!)
  pageSpacing: "space-y-6",           // Zwischen Page-Sections
  cardSpacing: "space-y-4",           // Innerhalb Cards
  buttonSpacing: "space-x-2",         // Zwischen Buttons
  iconSpacing: "space-x-2",           // Icon + Text
  
  // Margins
  headerMargin: "mb-6",               // Nach Page Headers
  sectionMargin: "mb-4",              // Nach Section Headers
  cardMargin: "mb-4",                 // Nach Cards
};

export const iconSizes = {
  small: "h-4 w-4",      // Standard für Buttons
  medium: "h-5 w-5",     // Größere Buttons
  large: "h-6 w-6",      // Card Headers
  xlarge: "h-8 w-8",     // Page Headers
};

// KOMPLETTE PAGE TEMPLATES (für absolute Konsistenz)
export const pageTemplates = {
  standardPage: `${layoutStyles.pageContainer}`,
  pageHeaderWithAction: `${layoutStyles.pageHeader}`,
  cardGrid: `${layoutStyles.cardGrid}`,
}; 