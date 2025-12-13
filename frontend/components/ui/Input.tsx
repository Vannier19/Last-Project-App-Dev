import React from 'react';
import { StyleSheet, View, Text, TextInput, TextInputProps, useColorScheme, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export function Input({ label, error, style, containerStyle, ...props }: InputProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, isDark && styles.labelDark]}>
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
        borderWidth: 0,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: Colors.light.background,
        color: Colors.light.text,
        shadowColor: "#a3b1c6",
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
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
