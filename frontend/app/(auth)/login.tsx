import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signIn, auth, GoogleAuthProvider, signInWithPopup, signInWithCredential } from '@/services/firebase';
import api from '@/services/api';

// Complete auth session for web
if (Platform.OS === 'web') {
    // No need for WebBrowser on web
} else {
    WebBrowser.maybeCompleteAuthSession();
}

export default function LoginScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // For native (iOS/Android) Google Sign-In
    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });

    // Handle native Google auth response
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            if (id_token) {
                const credential = GoogleAuthProvider.credential(id_token);
                handleNativeGoogleSignIn(credential);
            } else if (response.authentication?.idToken) {
                const credential = GoogleAuthProvider.credential(response.authentication.idToken);
                handleNativeGoogleSignIn(credential);
            } else {
                Alert.alert('Error', 'Could not get ID token from Google');
            }
        }
    }, [response]);

    // Native (iOS/Android) Google Sign-In handler
    const handleNativeGoogleSignIn = async (credential: any) => {
        setLoading(true);
        try {
            const userCredential = await signInWithCredential(auth, credential);
            const token = await userCredential.user.getIdToken();
            console.log('✅ Google Firebase login success:', userCredential.user.email);

            await api.syncUser(token);
            console.log('✅ Backend sync success');

            router.replace('/(tabs)/main');
        } catch (error: any) {
            console.error('❌ Google Login error:', error);
            Alert.alert('Google Login Failed', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Platform-specific Google Sign-In
    const handleGoogleSignIn = async () => {
        if (Platform.OS === 'web') {
            // Web: Use signInWithPopup
            setLoading(true);
            try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const token = await result.user.getIdToken();
                console.log('✅ Google Firebase login success:', result.user.email);

                await api.syncUser(token);
                console.log('✅ Backend sync success');

                router.replace('/(tabs)/main');
            } catch (error: any) {
                console.error('❌ Google Login error:', error);
                Alert.alert('Google Login Failed', error.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        } else {
            // Native (iOS/Android): Use expo-auth-session
            promptAsync();
        }
    };

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
    },
});
