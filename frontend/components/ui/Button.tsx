import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'small' | 'medium' | 'large';
    isLoading?: boolean;
    textStyle?: TextStyle;
}

export function Button({
    title,
    variant = 'primary',
    size = 'medium',
    isLoading = false,
    style,
    disabled,
    textStyle,
    ...props
}: ButtonProps) {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';

    const getBackgroundColor = () => {
        if (disabled) return isDark ? '#333' : '#ccc';
        switch (variant) {
            case 'primary': return Colors[theme].tint;
            case 'secondary': return isDark ? '#333' : '#f0f0f0';
            case 'outline': return 'transparent';
            case 'danger': return '#ff3b30';
            default: return Colors[theme].tint;
        }
    };

    const getTextColor = () => {
        if (disabled) return '#888';
        switch (variant) {
            case 'primary': return '#fff';
            case 'secondary': return isDark ? '#fff' : '#000';
            case 'outline': return Colors[theme].tint;
            case 'danger': return '#fff';
            default: return '#fff';
        }
    };

    const getHeight = () => {
        switch (size) {
            case 'small': return 36;
            case 'medium': return 50;
            case 'large': return 60;
            default: return 50;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    height: getHeight(),
                    borderColor: variant === 'outline' ? Colors[theme].tint : 'transparent',
                    borderWidth: variant === 'outline' ? 1 : 0,
                },
                style
            ]}
            disabled={disabled || isLoading}
            activeOpacity={0.7}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[
                    styles.text,
                    {
                        color: getTextColor(),
                        fontSize: size === 'small' ? 14 : 16,
                    },
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 15, // Neu radius
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 16,
        // Shadow for button
        shadowColor: "#a3b1c6",
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
});
