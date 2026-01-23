/**
 * This file contains the color palette used in the app.
 */

const tintColorLight = '#ff758c';
const tintColorDark = '#ace0f9';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ffffff',
    background: '#09090b', // Matte Black
    tint: '#ffffff',
    icon: '#a1a1aa',
    tabIconDefault: '#52525b',
    tabIconSelected: '#ffffff',
    surface: '#18181b', // Dark Grey Surface
    surfaceHighlight: '#27272a',
    border: '#27272a',
    primary: '#ffffff',
    secondary: '#a1a1aa',
    accent: '#8b5cf6', // Keep violet as brand, or change if needed. Image implies monochrome + specific accents.
  },
};
