import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface NavTabProps {
    label: string;
    icon: string;
    isActive: boolean;
    isDark: boolean;
    isWide: boolean;
    onPress: () => void;
    onHoverIn?: () => void;
    onHoverOut?: () => void;
    style?: StyleProp<ViewStyle>;
}

export const NavTab: React.FC<NavTabProps> = ({
    label,
    icon,
    isActive,
    isDark,
    isWide,
    onPress,
    onHoverIn,
    onHoverOut,
    style
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        onHoverIn?.();
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        onHoverOut?.();
    };

    const webHoverProps = Platform.OS === 'web' ? {
        // @ts-ignore - web-only props
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
    } : {};

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            {...webHoverProps}
            style={[
                styles.navTab,
                isWide && styles.navTabWide,
                // Active logic
                isActive && styles.navTabActive,
                isActive && isDark && styles.navTabActiveDark,
                // Hover logic (Web only)
                Platform.OS === 'web' && isHovered && !isActive && (isDark ? styles.navTabHoveredDark : styles.navTabHovered),
                Platform.OS === 'web' && styles.webBase,
                style
            ]}
        >
            <IconSymbol
                name={icon as any}
                size={isWide ? 22 : 18}
                color={isActive ? (isDark ? Colors.dark.tint : Colors.light.tint) : (isDark ? Colors.dark.icon : Colors.light.icon)}
            />
            <Text style={[
                styles.navTabText,
                isWide && styles.navTabTextWide,
                isDark && styles.textSecondaryDark,
                isActive && styles.navTabTextActive,
                isActive && { color: isDark ? Colors.dark.tint : Colors.light.tint }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    navTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        gap: 8,
        backgroundColor: 'transparent',
    },
    navTabWide: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    navTabActive: {
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
    },
    navTabActiveDark: {
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
    },
    // Hover styles
    navTabHovered: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        transform: [{ scale: 1.02 }]
    },
    navTabHoveredDark: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        transform: [{ scale: 1.02 }]
    },
    webBase: {
        // @ts-ignore
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
    },
    navTabText: {
        fontSize: 15,
        color: Colors.light.icon,
    },
    navTabTextWide: {
        fontSize: 17,
    },
    textSecondaryDark: {
        color: Colors.dark.icon,
    },
    navTabTextActive: {
        fontWeight: '600',
    },
});
