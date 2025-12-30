import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signIn, auth, GoogleAuthProvider, signInWithPopup, signInWithCredential } from '@/services/firebase';
import api from '@/services/api';

// Import Google Sign-In Native Library
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Hardcoded Web Client ID to ensure no environment variable issues during build
    // Matches the ID in google-services.json (client_type: 3)
    const WEB_CLIENT_ID = '796874701938-i3g9ia6aoki6ravsa2qm018nmhatg6jg.apps.googleusercontent.com';

    // Configure Google Sign-In
    useEffect(() => {
        if (Platform.OS !== 'web') {
            GoogleSignin.configure({
                webClientId: WEB_CLIENT_ID,
            });
        }
    }, []);

    // Platform-specific Google Sign-In
    const handleGoogleSignIn = async () => {
        if (Platform.OS === 'web') {
            // Web: Use signInWithPopup
            setLoading(true);
            try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const token = await result.user.getIdToken();
                console.log('✅ Google Firebase login success (Web):', result.user.email);

                await api.syncUser(token);
                console.log('✅ Backend sync success');

                router.replace('/');
            } catch (error: any) {
                console.error('❌ Google Login error:', error);
                Alert.alert('Google Login Failed', error.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        } else {
            // Native (iOS/Android): Use @react-native-google-signin
            setLoading(true);
            try {
                await GoogleSignin.hasPlayServices();
                const response = await GoogleSignin.signIn();

                if (response.type === 'success' && response.data?.idToken) {
                    const idToken = response.data.idToken;
                    const credential = GoogleAuthProvider.credential(idToken);

                    // Sign in to Firebase
                    const userCredential = await signInWithCredential(auth, credential);
                    const token = await userCredential.user.getIdToken();
                    console.log('✅ Google Firebase login success (Native):', userCredential.user.email);

                    await api.syncUser(token);
                    console.log('✅ Backend sync success');

                    router.replace('/');
                } else {
                    // Handle cancellation or no token
                    console.log('Google Sign-In was cancelled or failed to return ID token');
                }
            } catch (error: any) {
                if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                    console.log('User cancelled the login flow');
                } else if (error.code === statusCodes.IN_PROGRESS) {
                    console.log('Sign in is in progress already');
                } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                    Alert.alert('Error', 'Google Play Services not available');
                } else {
                    console.error('❌ Google Login error:', error);
                    Alert.alert('Google Login Failed', error.message || 'An error occurred');
                }
            } finally {
                setLoading(false);
            }
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setErrorMessage('Mohon isi semua field');
            return;
        }

        setLoading(true);
        setErrorMessage(''); // Clear previous error
        try {
            console.log('🔐 Starting login...');
            // 1. Login to Firebase
            const { user, token } = await signIn(email, password);
            console.log('✅ Firebase login success:', user.email);

            // 2. Sync with Backend
            const syncResponse = await api.syncUser(token);
            console.log('✅ Backend sync success:', syncResponse);

            // 3. Small delay to ensure auth state is updated
            await new Promise(resolve => setTimeout(resolve, 500));

            // 4. Navigate to main app
            router.replace('/');
        } catch (error: any) {
            console.error('❌ Login error:', error);
            console.log('🔍 Error details:', {
                message: error.message,
                code: error.code,
                name: error.name
            });

            // Show error message in UI
            const errorMsg = error.message || 'Terjadi kesalahan saat login';
            setErrorMessage(errorMsg);
            console.log('🚨 Error message set:', errorMsg);

            // Also show Alert for mobile (won't work on web but that's ok)
            if (Platform.OS !== 'web') {
                Alert.alert(
                    '⚠️ Login Gagal',
                    errorMsg,
                    [{ text: 'OK', style: 'cancel' }],
                    { cancelable: true }
                );
            }
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
                        {errorMessage ? (
                            <View style={[styles.errorContainer, isDark && styles.errorContainerDark]}>
                                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                            </View>
                        ) : null}

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

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                            <View style={{ flex: 1, height: 1, backgroundColor: isDark ? '#444' : '#ccc' }} />
                            <Text style={{ marginHorizontal: 10, color: isDark ? '#888' : '#666' }}>OR</Text>
                            <View style={{ flex: 1, height: 1, backgroundColor: isDark ? '#444' : '#ccc' }} />
                        </View>

                        <Button
                            title="Sign in with Google"
                            onPress={handleGoogleSignIn}
                            disabled={loading}
                            style={{ backgroundColor: '#DB4437' }} // Google Red
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
        backgroundColor: 'transparent',
    },
    errorContainer: {
        backgroundColor: '#fee',
        borderLeftWidth: 4,
        borderLeftColor: '#f44',
        padding: 12,
        marginBottom: 16,
        borderRadius: 8,
    },
    errorContainerDark: {
        backgroundColor: '#422',
        borderLeftColor: '#f66',
    },
    errorText: {
        color: '#c00',
        fontSize: 14,
        fontWeight: '500',
    },
});
