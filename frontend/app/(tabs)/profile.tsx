import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { auth, signOut, getCurrentUser } from '@/services/firebase';
import { api } from '@/services/api';

interface QuizRecord {
    key: string;
    topic: string;
    score: number;
    total: number;
    date: string;
}

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [userEmail, setUserEmail] = useState<string>('');
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setUserEmail(user.email || 'No email');
            setUserName(user.displayName || user.email?.split('@')[0] || 'User');
        }
    }, []);

    const loadHistory = useCallback(async () => {
        // Load from local AsyncStorage first (for offline support)
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
            console.log('Failed to load local history', e);
        }

        // Also fetch from backend to get server-side progress
        try {
            const response = await api.getProgress();
            if (response.data?.quizScores) {
                console.log('Backend progress:', response.data.quizScores);
                // Backend quiz scores are available for future integration
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

    const handleLogout = async () => {
        try {
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

                {/* Logout Button */}
                <Button
                    title="Log Out"
                    variant="secondary"
                    onPress={handleLogout}
                    style={{ marginTop: 24 }}
                />
            </ScrollView>
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
    }
});
