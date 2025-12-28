import React from 'react';
import { StyleSheet, View, Text, TextInput, TextInputProps, useColorScheme, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    labelStyle?: TextStyle;
}

export function Input({ label, error, style, containerStyle, labelStyle, ...props }: InputProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, isDark && styles.labelDark, labelStyle]}>
                    {label}
                </Text>
            )}
            <TextInput
                style={[
                    styles.input,
                    isDark && styles.inputDark,
                    error ? styles.inputError : null,
                    style
                ]}
                placeholderTextColor={isDark ? '#666' : '#999'}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    labelDark: {
        color: Colors.dark.text,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: Colors.light.background,
        color: Colors.light.text,
        // Enhanced neumorphism shadows
        shadowColor: "#a3b1c6",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    inputDark: {
        backgroundColor: Colors.dark.card,
        color: Colors.dark.text,
        shadowColor: "#000",
        shadowOpacity: 0.3,
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#ff3b30',
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});
