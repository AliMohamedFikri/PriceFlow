export const theme = {
  colors: {
    // Premium Slate Dark Mode Palette
    background: "#090D16",      // Ultra dark deep space blue
    cardBg: "#151C2C",          // Semi-transparent deep card
    cardBorder: "#232F4A",      // Subtle border for glassmorphism
    textPrimary: "#FFFFFF",     // Pure white high contrast headers
    textSecondary: "#94A3B8",   // Cool slate secondary text
    textMuted: "#64748B",       // Cool gray captions
    
    // Theme Accents
    primary: "#6366F1",         // Royal Indigo
    primaryHover: "#4F46E5",
    accent: "#F59E0B",          // Amber
    
    // Semantic States
    success: "#10B981",         // Emerald for cheapest price deal
    danger: "#EF4444",          // Rose red for high price / delete alert
    info: "#3B82F6",            // Blue
    
    // Platform Specific Colors (Matching official branding)
    platforms: {
      amazon: "#FF9900",        // Amazon Orange
      jumia: "#F68B1E",         // Jumia Orange / Teal
      noon: "#0073EC",          // Noon Blue
    }
  },
  
  shadows: {
    premium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    }
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  }
};
