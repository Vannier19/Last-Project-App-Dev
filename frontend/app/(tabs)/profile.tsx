import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { auth, signOut, getCurrentUser, updateUserProfile, updateUserPassword } from '@/services/firebase';
import { api } from '@/services/api';

interface QuizRecord {
    key: string;
    topic: string;
    score: number;
    total: number;
    date: string;
}

interface LabRecord {
    key: string;
    type: string;
    topic: string;
    parameters: Record<string, number>;
    results: Record<string, number>;
    date: string;
}

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([]);
    const [labHistory, setLabHistory] = useState<LabRecord[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [userEmail, setUserEmail] = useState<string>('');
    const [userName, setUserName] = useState<string>('');

    // Edit states
    const [isEditingName, setIsEditingName] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setUserEmail(user.email || 'No email');
            setUserName(user.displayName || user.email?.split('@')[0] || 'User');
        }
    }, []);

    const loadHistory = useCallback(async () => {
        // Load quiz history from AsyncStorage
        try {
            const keys = await AsyncStorage.getAllKeys();
            const quizKeys = keys.filter(k => k.startsWith('quiz_'));
            const items = await AsyncStorage.multiGet(quizKeys);

            const records: QuizRecord[] = items.map(([key, value]) => {
                const data = value ? JSON.parse(value) : {};
                return { key, ...data };
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setQuizHistory(records);
        } catch (e) {
            console.log('Failed to load quiz history', e);
        }

        // Load lab/simulation history from AsyncStorage
        try {
            const keys = await AsyncStorage.getAllKeys();
            const labKeys = keys.filter(k => k.startsWith('lab_'));
            const items = await AsyncStorage.multiGet(labKeys);

            const records: LabRecord[] = items.map(([key, value]) => {
                const data = value ? JSON.parse(value) : {};
                return { key, ...data };
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setLabHistory(records);
        } catch (e) {
            console.log('Failed to load lab history', e);
        }

        // Also fetch from backend to get server-side progress
        try {
            const response = await api.getProgress();
            if (response.data?.quizScores) {
                console.log('Backend progress:', response.data.quizScores);
            }
        } catch (e) {
            console.log('Failed to fetch backend progress (offline mode)', e);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadHistory();
        setRefreshing(false);
    }, [loadHistory]);

    const handleSaveName = async () => {
        if (!newDisplayName.trim()) {
            Alert.alert('Error', 'Please enter a display name');
            return;
        }
        setIsSaving(true);
        try {
            await updateUserProfile(newDisplayName.trim());
            setUserName(newDisplayName.trim());
            setIsEditingName(false);
            setNewDisplayName('');
            Alert.alert('Success', 'Display name updated!');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update name');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters');
            return;
        }
        setIsSaving(true);
        try {
            await updateUserPassword(currentPassword, newPassword);
            setIsEditingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            Alert.alert('Success', 'Password updated successfully!');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update password');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Clear quiz and lab history from AsyncStorage to prevent data leaking to other accounts
            const keys = await AsyncStorage.getAllKeys();
            const historyKeys = keys.filter(k => k.startsWith('quiz_') || k.startsWith('lab_'));
            if (historyKeys.length > 0) {
                await AsyncStorage.multiRemove(historyKeys);
                console.log('✅ Cleared quiz and lab history on logout');
            }

            await signOut();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout error:', error);
            router.replace('/(auth)/login');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getTopicLabel = (topic: string) => {
        switch (topic) {
            case 'glb': return 'GLB';
            case 'glbb': return 'GLBB';
            case 'vertikal': return 'Vertical';
            case 'parabola': return 'Parabola';
            default: return topic.toUpperCase();
        }
    };

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, isDark && styles.textDark]}>Profile</Text>
                </View>

                {/* User Info Card */}
                <Card style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        <IconSymbol name="person.circle.fill" size={60} color={Colors[colorScheme ?? 'light'].tint} />
                    </View>
                    <Text style={[styles.userName, isDark && styles.textDark]}>{userName || 'User'}</Text>
                    <Text style={[styles.userEmail, isDark && styles.textSecondaryDark]}>{userEmail || 'No email'}</Text>
                </Card>

                {/* Edit Profile Section */}
                <Card style={styles.editCard}>
                    <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Edit Profile</Text>

                    {/* Edit Display Name */}
                    {!isEditingName ? (
                        <TouchableOpacity
                            style={styles.editRow}
                            onPress={() => { setIsEditingName(true); setNewDisplayName(userName); }}
                        >
                            <View>
                                <Text style={[styles.editLabel, isDark && styles.textSecondaryDark]}>Display Name</Text>
                                <Text style={[styles.editValue, isDark && styles.textDark]}>{userName}</Text>
                            </View>
                            <IconSymbol name="chevron.right" size={20} color={isDark ? '#888' : '#666'} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.editRowHeader}
                            onPress={() => { setIsEditingName(false); setNewDisplayName(''); }}
                        >
                            <View>
                                <Text style={[styles.editLabel, isDark && styles.textSecondaryDark]}>Display Name</Text>
                                <Text style={[styles.editValue, isDark && styles.textDark]}>{userName}</Text>
                            </View>
                            <IconSymbol name="chevron.down" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                        </TouchableOpacity>
                    )}
                    {isEditingName && (
                        <View style={styles.editInputSection}>
                            <Input
                                label="New Display Name"
                                placeholder="Enter new name"
                                value={newDisplayName}
                                onChangeText={setNewDisplayName}
                            />
                            <View style={styles.editButtons}>
                                <Button
                                    title="Cancel"
                                    variant="secondary"
                                    onPress={() => { setIsEditingName(false); setNewDisplayName(''); }}
                                    style={{ flex: 1, marginRight: 8 }}
                                />
                                <Button
                                    title={isSaving ? "Saving..." : "Save"}
                                    onPress={handleSaveName}
                                    disabled={isSaving}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>
                    )}

                    {/* Edit Password */}
                    {!isEditingPassword ? (
                        <TouchableOpacity
                            style={[styles.editRow, { marginTop: 16 }]}
                            onPress={() => setIsEditingPassword(true)}
                        >
                            <View>
                                <Text style={[styles.editLabel, isDark && styles.textSecondaryDark]}>Password</Text>
                                <Text style={[styles.editValue, isDark && styles.textDark]}>••••••••</Text>
                            </View>
                            <IconSymbol name="chevron.right" size={20} color={isDark ? '#888' : '#666'} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.editRowHeader, { marginTop: 16 }]}
                            onPress={() => {
                                setIsEditingPassword(false);
                                setCurrentPassword('');
                                setNewPassword('');
                                setConfirmPassword('');
                            }}
                        >
                            <View>
                                <Text style={[styles.editLabel, isDark && styles.textSecondaryDark]}>Password</Text>
                                <Text style={[styles.editValue, isDark && styles.textDark]}>••••••••</Text>
                            </View>
                            <IconSymbol name="chevron.down" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                        </TouchableOpacity>
                    )}
                    {isEditingPassword && (
                        <View style={styles.editInputSection}>
                            <Input
                                label="Current Password"
                                placeholder="Enter current password"
                                secureTextEntry
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                            <Input
                                label="New Password"
                                placeholder="Min 6 characters"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <Input
                                label="Confirm New Password"
                                placeholder="Confirm new password"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <View style={styles.editButtons}>
                                <Button
                                    title="Cancel"
                                    variant="secondary"
                                    onPress={() => {
                                        setIsEditingPassword(false);
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                    style={{ flex: 1, marginRight: 8 }}
                                />
                                <Button
                                    title={isSaving ? "Saving..." : "Save"}
                                    onPress={handleSavePassword}
                                    disabled={isSaving}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>
                    )}
                </Card>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Text style={[styles.statNumber, isDark && styles.textDark]}>{quizHistory.length}</Text>
                        <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Quizzes Taken</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={[styles.statNumber, isDark && styles.textDark]}>
                            {quizHistory.length > 0
                                ? Math.round(quizHistory.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / quizHistory.length)
                                : 0}%
                        </Text>
                        <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Avg. Score</Text>
                    </Card>
                </View>

                {/* Quiz History */}
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Recent Activity</Text>
                {quizHistory.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Text style={[styles.emptyText, isDark && styles.textSecondaryDark]}>
                            No quiz history yet. Take a quiz to see your progress!
                        </Text>
                    </Card>
                ) : (
                    quizHistory.slice(0, 10).map((record, index) => (
                        <Card key={record.key || index} style={styles.historyCard}>
                            <View style={styles.historyRow}>
                                <View>
                                    <Text style={[styles.historyTopic, isDark && styles.textDark]}>
                                        {getTopicLabel(record.topic)} Quiz
                                    </Text>
                                    <Text style={[styles.historyDate, isDark && styles.textSecondaryDark]}>
                                        {formatDate(record.date)}
                                    </Text>
                                </View>
                                <View style={styles.historyScore}>
                                    <Text style={[styles.scoreText, { color: (record.score / record.total) >= 0.7 ? '#48bb78' : '#f56565' }]}>
                                        {record.score}/{record.total}
                                    </Text>
                                </View>
                            </View>
                        </Card>
                    ))
                )}

                {/* Lab History */}
                <Text style={[styles.sectionTitle, isDark && styles.textDark, { marginTop: 20 }]}>Simulation History</Text>
                {labHistory.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Text style={[styles.emptyText, isDark && styles.textSecondaryDark]}>
                            No simulation history yet. Run a simulation to see your experiments!
                        </Text>
                    </Card>
                ) : (
                    labHistory.slice(0, 10).map((record, index) => (
                        <Card key={record.key || index} style={styles.historyCard}>
                            <View style={styles.historyRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.historyTopic, isDark && styles.textDark]}>
                                        {record.topic} Simulation
                                    </Text>
                                    <Text style={[styles.historyDate, isDark && styles.textSecondaryDark]}>
                                        {formatDate(record.date)}
                                    </Text>
                                    <Text style={[styles.historyParams, isDark && styles.textSecondaryDark]}>
                                        {Object.entries(record.parameters || {}).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                    </Text>
                                </View>
                                <View style={styles.labResultBadge}>
                                    <Text style={styles.labResultText}>
                                        t={record.results?.time?.toFixed(1) || 0}s
                                    </Text>
                                </View>
                            </View>
                        </Card>
                    ))
                )}

                {/* Logout Button */}
                <Button
                    title="Log Out"
                    variant="secondary"
                    onPress={handleLogout}
                    style={{ marginTop: 24, backgroundColor: '#EF4444' }}
                    textStyle={{ color: '#FFFFFF' }}
                />
            </ScrollView>
        </SafeAreaView >
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
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    textDark: {
        color: Colors.dark.text,
    },
    textSecondaryDark: {
        color: Colors.dark.icon,
    },
    userCard: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarContainer: {
        marginBottom: 12,
    },
    userName: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.text,
    },
    userEmail: {
        fontSize: 14,
        color: Colors.light.icon,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.light.icon,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.text,
        marginTop: 28,
        marginBottom: 12,
    },
    emptyCard: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.light.icon,
        textAlign: 'center',
    },
    historyCard: {
        marginBottom: 10,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyTopic: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.text,
    },
    historyDate: {
        fontSize: 12,
        color: Colors.light.icon,
        marginTop: 2,
    },
    historyScore: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    scoreText: {
        fontSize: 16,
        fontWeight: '600',
    },
    historyParams: {
        fontSize: 11,
        color: Colors.light.icon,
        marginTop: 4,
    },
    labResultBadge: {
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    labResultText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6366f1',
    },
    // Edit Profile Styles
    editCard: {
        marginTop: 20,
    },
    editRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    editLabel: {
        fontSize: 12,
        color: Colors.light.icon,
        marginBottom: 2,
    },
    editValue: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.text,
    },
    editInputSection: {
        gap: 12,
        paddingTop: 8,
    },
    editButtons: {
        flexDirection: 'row',
        marginTop: 8,
    },
    editRowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(99, 102, 241, 0.3)',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        marginHorizontal: -24,
        paddingHorizontal: 24,
    },
});
