import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signIn } from '@/services/firebase';
import api from '@/services/api';

export default function LoginScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // 1. Login to Firebase
            const { user, token } = await signIn(email, password);
            console.log('✅ Firebase login success:', user.email);

            // 2. Sync with Backend
            await api.syncUser(token);
            console.log('✅ Backend sync success');

            // 3. Navigate to main app
            router.replace('/(tabs)/main');
        } catch (error: any) {
            console.error('❌ Login error:', error);
            Alert.alert('Login Failed', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={[styles.title, isDark && styles.textDark]}>Virtual Physics Lab</Text>
                        <Text style={[styles.subtitle, isDark && styles.textSecondaryDark]}>Sign in to continue</Text>
                    </View>

                    <Card style={styles.formCard}>
                        <Input
                            label="Email"
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                        <Button
                            title={loading ? "Signing in..." : "Sign In"}
                            onPress={handleLogin}
                            disabled={loading}
                            style={{ marginTop: 16 }}
                        />
                    </Card>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, isDark && styles.textSecondaryDark]}>
                            Don't have an account?
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                            <Text style={styles.linkText}>Register</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    containerDark: {
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.icon,
    },
    textDark: {
        color: Colors.dark.text,
    },
    textSecondaryDark: {
        color: Colors.dark.icon,
    },
    formCard: {
        padding: 24,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        gap: 8,
    },
    footerText: {
        fontSize: 14,
        color: Colors.light.icon,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.tint,
    },
});
