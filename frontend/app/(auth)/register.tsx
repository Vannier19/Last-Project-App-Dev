import React, { useState } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function RegisterScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            console.log('Register attempt:', name, email, password);
            setIsLoading(false);
            // Navigate to tabs mainly for demo purposes, or back to login
            router.replace('/(tabs)');
        }, 1000);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, isDark && styles.containerDark]}
        >
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, isDark && styles.textDark]}>Create Account</Text>
                    <Text style={[styles.subtitle, isDark && styles.textSecondaryDark]}>Join the Virtual Lab today</Text>
                </View>

                <Card style={styles.formCard}>
                    <Input
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={name}
                        onChangeText={setName}
                    />

                    <Input
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Input
                        label="Password"
                        placeholder="Create a strong password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        textContentType="newPassword"
                    />

                    <Button
                        title="Sign Up"
                        onPress={handleRegister}
                        isLoading={isLoading}
                        variant="primary"
                        style={styles.signUpButton}
                    />

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, isDark && styles.textDark]}>Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <Button variant="outline" size="small" title="Sign In" />
                        </Link>
                    </View>
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    containerDark: {
        backgroundColor: '#121212',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    textDark: {
        color: '#fff',
    },
    textSecondaryDark: {
        color: '#aaa',
    },
    formCard: {
        padding: 24,
    },
    signUpButton: {
        marginTop: 8,
        backgroundColor: '#34C759', // Override for Green
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        flexWrap: 'wrap',
        gap: 8,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
});
