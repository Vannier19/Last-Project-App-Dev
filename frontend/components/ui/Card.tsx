import React from 'react';
import { StyleSheet, View, ViewProps, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export function Card({ style, children, ...props }: ViewProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View style={[styles.card, isDark && styles.cardDark, style]} {...props}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.light.card, // Neumorphism BG
        borderRadius: 20, // Larger radius
        padding: 24,
        // Neumorphism Shadow: Light Mode
        shadowColor: Colors.light.border,
        shadowOffset: {
            width: 8,
            height: 8,
        },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 5,
    },
    cardDark: {
        backgroundColor: Colors.dark.card,
        shadowColor: '#000',
        shadowOffset: {
            width: 6,
            height: 6,
        },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 0,
    },
});
