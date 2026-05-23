import React, { memo } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import glyphMap from 'react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json';

// Preload font once
MaterialCommunityIcons.loadFont?.();

// Fallback icon
const FALLBACK_ICON = 'help-circle-outline';
const warnedInvalidIcons = new Set();

const AppIcon = ({ 
  name, 
  size = 24, 
  color = '#1a6edb', 
  style 
}) => {
  // Safety check for icon name
  const hasIcon = Boolean(name && glyphMap[name]);
  const iconName = hasIcon ? name : FALLBACK_ICON;

  if (__DEV__ && !hasIcon && name && !warnedInvalidIcons.has(name)) {
    warnedInvalidIcons.add(name);
    console.warn(`AppIcon fallback used: invalid icon name "${name}"`);
  }

  return (
    <MaterialCommunityIcons 
      name={iconName} 
      size={size} 
      color={color} 
      style={style} 
    />
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(AppIcon);
