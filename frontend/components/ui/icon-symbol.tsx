// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle, Platform } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * SF Symbol to Material Icons mapping.
 * Add your SF Symbols to Material Icons mappings here.
 */
const MAPPING: Record<string, MaterialIconName> = {
  // Navigation
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.up': 'expand-less',
  'chevron.down': 'expand-more',
  // Tabs & Features
  'book.fill': 'menu-book',
  'flask.fill': 'science',
  'questionmark.circle.fill': 'help',
  'questionmark.circle': 'help-outline',
  'person.fill': 'person',
  'person.circle': 'account-circle',
  'person.circle.fill': 'account-circle',
  // Actions
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  // Lab icons
  'speedometer': 'speed',
  'bolt.car': 'directions-car',
  'arrow.up.circle': 'arrow-upward',
  'trajectory': 'timeline',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: any;
}) {
  const materialName = MAPPING[name] || 'help-outline';
  return <MaterialIcons color={color} size={size} name={materialName} style={style} />;
}
