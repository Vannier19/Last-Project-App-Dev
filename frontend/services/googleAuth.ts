// Google Auth service - handles native Google Sign-In
// This file is only imported when not in Expo Go

import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = (webClientId: string) => {
    if (Platform.OS !== 'web') {
        GoogleSignin.configure({
            webClientId,
        });
    }
};

export const signInWithGoogle = async () => {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    return response;
};

export { statusCodes };
