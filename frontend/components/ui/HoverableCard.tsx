import React, { useState } from 'react';
import { TouchableOpacity, TouchableOpacityProps, Platform, StyleSheet, ViewStyle, StyleProp, Animated } from 'react-native';

interface HoverableCardProps extends Omit<TouchableOpacityProps, 'style'> {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

/**
 * A card component that supports smooth hover effects on web
 * Applies a subtle lift effect on hover
 */
export const HoverableCard: React.FC<HoverableCardProps> = ({
    children,
    style,
    ...props
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const webHoverProps = Platform.OS === 'web' ? {
        // @ts-ignore - web-only props
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
    } : {};

    return (
        <TouchableOpacity
            {...props}
            {...webHoverProps}
            style={[
                style,
                Platform.OS === 'web' && styles.webBase,
                Platform.OS === 'web' && isHovered && styles.webHovered,
            ]}
            activeOpacity={0.85}
        >
            {children}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    webBase: {
        // @ts-ignore - web-only style
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
    },
    webHovered: {
        // @ts-ignore - web-only styles
        transform: [{ translateY: -2 }],
        // Enhanced shadow on hover
        shadowOffset: { width: 8, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
});
