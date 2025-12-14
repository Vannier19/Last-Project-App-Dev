import React, { useState } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signUp } from '@/services/firebase';
import api from '@/services/api';

export default function RegisterScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Register to Firebase
            const { user, token } = await signUp(email, password);
            console.log('✅ Firebase registration success:', user.email);

            // 2. Sync with Backend (will create user in Firestore)
            await api.syncUser(token);
            console.log('✅ Backend sync success');

            // 3. Navigate to main app
            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/main') }
            ]);
        } catch (error: any) {
            console.error('❌ Registration error:', error);
            Alert.alert('Registration Failed', error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
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
