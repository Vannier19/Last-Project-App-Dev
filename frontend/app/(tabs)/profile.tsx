import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
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

interface QuizAnswer {
    questionNumber: number;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

interface QuizRecord {
    key: string;
    topic: string;
    score: number;
    total: number;
    date: string;
    answers?: QuizAnswer[];
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
    const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);

    const loadHistory = useCallback(async () => {
        // Fetch all history from backend (Firestore)
        try {
            const response = await api.getProgress();
            const data = response.data;

            // Process quiz results from Firestore
            if (data?.quizResults && Object.keys(data.quizResults).length > 0) {
                const quizRecords: QuizRecord[] = Object.entries(data.quizResults).map(([topic, result]: [string, any]) => {
                    // Parse Firestore timestamp for quiz
                    let quizDateStr = new Date().toISOString();
                    if (result.submittedAt) {
                        if (result.submittedAt._seconds) {
                            quizDateStr = new Date(result.submittedAt._seconds * 1000).toISOString();
                        } else if (typeof result.submittedAt === 'string') {
                            quizDateStr = result.submittedAt;
                        } else if (result.submittedAt.toDate) {
                            quizDateStr = result.submittedAt.toDate().toISOString();
                        }
                    }
                    return {
                        key: `quiz_${topic}`,
                        topic: topic,
                        score: result.correctAnswers || 0,
                        total: result.totalQuestions || 0,
                        percentage: result.score || 0,
                        answers: result.answers || [],
                        date: quizDateStr,
                    };
                });
                setQuizHistory(quizRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            }

            // Process lab history from Firestore
            console.log('🔍 Processing Lab History. Raw data:', JSON.stringify(data?.labHistory, null, 2));

            if (data?.labHistory) {
                const labRecords: LabRecord[] = [];
                Object.entries(data.labHistory).forEach(([labId, entries]: [string, any]) => {
                    if (Array.isArray(entries)) {
                        entries.forEach((entry: any, index: number) => {
                            // Parse Firestore timestamp
                            let dateStr = new Date().toISOString();
                            if (entry.completedAt) {
                                if (entry.completedAt._seconds) {
                                    dateStr = new Date(entry.completedAt._seconds * 1000).toISOString();
                                } else if (typeof entry.completedAt === 'string') {
                                    dateStr = entry.completedAt;
                                } else if (entry.completedAt.toDate) {
                                    dateStr = entry.completedAt.toDate().toISOString();
                                }
                            }

                            // Filter out metadata fields from parameters
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { completedAt, userId, labId: _labId, timestamp, ...cleanParams } = entry;

                            // Map internal IDs to display names (handle case insensitivity etc)
                            const topicMap: Record<string, string> = {
                                'glb': 'GLB',
                                'glbb': 'GLBB',
                                'vertikal': 'Vertical Motion',
                                'parabola': 'Projectile Motion',
                                'vertical': 'Vertical Motion',
                                'projectile': 'Projectile Motion'
                            };

                            // Normalize type string: remove '-lab', ' simulation', convert to lowercase
                            let type = labId.toLowerCase()
                                .replace('-lab', '')
                                .replace(' simulation', '')
                                .trim();

                            // Fallback if type is still messy
                            if (type.includes('vertikal')) type = 'vertikal';
                            if (type.includes('parabola')) type = 'parabola';

                            labRecords.push({
                                key: `lab_${labId}_${index}`,
                                type: type,
                                topic: topicMap[type] || type.toUpperCase(),
                                parameters: cleanParams,
                                results: cleanParams,
                                date: dateStr,
                            });
                        });
                    }
                });
                setLabHistory(labRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            }

            console.log('✅ History loaded from Firestore');
        } catch (e) {
            console.log('Failed to fetch history from backend (offline mode):', e);
        }
    }, []);

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setUserEmail(user.email || 'No email');
            setUserName(user.displayName || user.email?.split('@')[0] || 'User');
            loadHistory();
        }
    }, [loadHistory]);

    // Listen for auth state changes to load history when user becomes available after page reload
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserEmail(user.email || 'No email');
                setUserName(user.displayName || user.email?.split('@')[0] || 'User');
                loadHistory();
            }
        });
        return () => unsubscribe();
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
        <View style={[styles.container, isDark && styles.containerDark]}>
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
                    quizHistory.slice(0, 10).map((record, index) => {
                        const isExpanded = expandedQuiz === record.key;
                        return (
                            <TouchableOpacity
                                key={record.key || index}
                                onPress={() => setExpandedQuiz(isExpanded ? null : record.key)}
                                activeOpacity={0.7}
                            >
                                <Card style={styles.historyCard}>
                                    <View style={styles.historyRow}>
                                        <View style={{ flex: 1 }}>
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
                                        <IconSymbol
                                            name={isExpanded ? "chevron.up" : "chevron.down"}
                                            size={20}
                                            color={isDark ? '#888' : '#666'}
                                        />
                                    </View>
                                    {/* Expanded Answer Details */}
                                    {isExpanded && record.answers && (
                                        <View style={styles.answersContainer}>
                                            {record.answers.map((ans, i) => (
                                                <View key={i} style={[styles.answerRow, ans.isCorrect ? styles.answerCorrect : styles.answerWrong]}>
                                                    <View style={styles.answerLeft}>
                                                        <Text style={[styles.answerQ, isDark && styles.textDark]}>Q{ans.questionNumber}</Text>
                                                        <IconSymbol
                                                            name={ans.isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill"}
                                                            size={18}
                                                            color={ans.isCorrect ? '#48bb78' : '#f56565'}
                                                        />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.answerText, isDark && styles.textSecondaryDark]} numberOfLines={1}>
                                                            {ans.question}
                                                        </Text>
                                                        {!ans.isCorrect && (
                                                            <Text style={styles.correctAnswerText}>
                                                                Correct: {ans.correctAnswer}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </Card>
                            </TouchableOpacity>
                        );
                    })
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
                    labHistory.slice(0, 10).map((record, index) => {
                        // Format parameter name for display
                        const formatParamName = (key: string) => {
                            const names: Record<string, string> = {
                                'initialVelocity': 'v₀',
                                'velocity': 'v',
                                'acceleration': 'a',
                                'maxHeight': 'h_max',
                                'distance': 's',
                                'time': 't',
                                'angle': 'θ',
                                'finalVelocity': 'v_f',
                            };
                            return names[key] || key;
                        };

                        // Format value (round to 2 decimals)
                        const formatValue = (val: any) => {
                            if (typeof val === 'number') {
                                return val.toFixed(2);
                            }
                            return String(val);
                        };

                        const paramString = Object.entries(record.parameters || {})
                            .filter(([k]) => k !== 'completedAt')
                            .map(([k, v]) => `${formatParamName(k)}=${formatValue(v)}`)
                            .join('  ');

                        return (
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
                                            {paramString}
                                        </Text>
                                    </View>
                                    <View style={styles.labResultBadge}>
                                        <Text style={styles.labResultText}>
                                            t={record.results?.time?.toFixed(1) || 0}s
                                        </Text>
                                    </View>
                                </View>
                            </Card>
                        );
                    })
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
        </View>
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
    // Answer Review Styles
    answersContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },
    answerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 8,
        marginBottom: 6,
        borderRadius: 8,
        borderLeftWidth: 3,
    },
    answerCorrect: {
        backgroundColor: 'rgba(72, 187, 120, 0.08)',
        borderLeftColor: '#48bb78',
    },
    answerWrong: {
        backgroundColor: 'rgba(245, 101, 101, 0.08)',
        borderLeftColor: '#f56565',
    },
    answerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        width: 50,
    },
    answerQ: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.tint,
    },
    answerText: {
        fontSize: 13,
        color: Colors.light.text,
    },
    correctAnswerText: {
        fontSize: 12,
        color: '#48bb78',
        marginTop: 2,
    },
});
