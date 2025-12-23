import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HoverableCard } from '@/components/ui/HoverableCard';
import { quizData } from '@/constants/quizData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';

type TopicKey = keyof typeof quizData;
type QuizMode = 'selection' | 'active' | 'result';

interface QuizState {
    topic: TopicKey;
    currentIndex: number;
    score: number;
    answers: (string | null)[];
}

// Quiz topics data - matching Home style
const quizTopics = [
    {
        key: 'glb',
        title: 'GLB Quiz',
        subtitle: 'Uniform Linear Motion',
        description: 'Test your understanding of motion with constant velocity. 10 multiple choice questions.',
        icon: 'speedometer',
        color: '#6366f1',
        bgColor: 'rgba(99, 102, 241, 0.15)',
    },
    {
        key: 'glbb',
        title: 'GLBB Quiz',
        subtitle: 'Accelerated Motion',
        description: 'Challenge yourself on uniformly accelerated motion concepts. 10 questions to test your knowledge.',
        icon: 'bolt.car',
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.15)',
    },
    {
        key: 'vertikal',
        title: 'Vertical Motion Quiz',
        subtitle: 'Free Fall & Upward Throw',
        description: 'Answer questions about vertical motion, gravity, and projectile physics.',
        icon: 'arrow.up.circle',
        color: '#ec4899',
        bgColor: 'rgba(236, 72, 153, 0.15)',
    },
    {
        key: 'parabola',
        title: 'Projectile Motion Quiz',
        subtitle: 'Parabolic Trajectory',
        description: 'Test your mastery of projectile motion with angle and velocity calculations.',
        icon: 'scope',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.15)',
    },
];

// Feature Card Component - matching Home style
const FeatureCard = ({ topic, isDark, isWide, onPress }: any) => (
    <HoverableCard
        style={[styles.featureCard, isDark && styles.featureCardDark, isWide && styles.featureCardWide]}
        onPress={onPress}
    >
        <View style={[styles.iconContainer, { backgroundColor: topic.bgColor }]}>
            <IconSymbol name={topic.icon} size={isWide ? 40 : 32} color={topic.color} />
        </View>
        <Text style={[styles.featureTitle, isDark && styles.textDark, isWide && styles.featureTitleWide]}>
            {topic.title}
        </Text>
        <Text style={[styles.featureDesc, isDark && styles.textSecondaryDark, isWide && styles.featureDescWide]}>
            {topic.description}
        </Text>
        <View style={styles.cardArrow}>
            <IconSymbol name="chevron.right" size={20} color={isDark ? '#888' : '#999'} />
        </View>
    </HoverableCard>
);

export default function QuizScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { width } = useWindowDimensions();
    const isWide = width > 768;

    const [mode, setMode] = useState<QuizMode>('selection');
    const [quizState, setQuizState] = useState<QuizState>({
        topic: 'glb',
        currentIndex: 0,
        score: 0,
        answers: []
    });
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const startQuiz = (topic: TopicKey) => {
        setQuizState({
            topic,
            currentIndex: 0,
            score: 0,
            answers: new Array(quizData[topic].length).fill(null)
        });
        setSelectedOption(null);
        setMode('active');
    };

    const handleAnswer = (option: string) => {
        setSelectedOption(option);
    };

    const confirmAnswer = () => {
        if (!selectedOption) return;

        const currentQ = quizData[quizState.topic][quizState.currentIndex];
        const isCorrect = selectedOption === currentQ.answer;

        const newAnswers = [...quizState.answers];
        newAnswers[quizState.currentIndex] = selectedOption;

        setQuizState(prev => ({
            ...prev,
            score: isCorrect ? prev.score + 1 : prev.score,
            answers: newAnswers
        }));

        // Move to next question or finish
        if (quizState.currentIndex < quizData[quizState.topic].length - 1) {
            setQuizState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
            setSelectedOption(null);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setMode('result');

        const finalScore = quizState.score + (selectedOption === quizData[quizState.topic][quizState.currentIndex].answer ? 1 : 0);
        const total = quizData[quizState.topic].length;
        const percentage = Math.round((finalScore / total) * 100);

        // Save to AsyncStorage (local backup)
        try {
            const key = `quiz_${quizState.topic}_${Date.now()}`;
            const scoreData = {
                topic: quizState.topic,
                score: finalScore,
                total: total,
                date: new Date().toISOString()
            };
            await AsyncStorage.setItem(key, JSON.stringify(scoreData));
        } catch (e) {
            console.log('Failed to save score locally', e);
        }

        // Save to Express backend (server persistence)
        try {
            await api.saveQuizProgress({
                materialId: quizState.topic,
                score: percentage,
            });
            console.log('Quiz score saved to backend');
        } catch (e) {
            console.log('Failed to save score to backend (will sync later)', e);
        }
    };

    const resetQuiz = () => {
        setMode('selection');
        setQuizState({ topic: 'glb', currentIndex: 0, score: 0, answers: [] });
        setSelectedOption(null);
    };

    // ---- Render Methods ----

    const renderTopicSelection = () => (
        <ScrollView contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}>
            {/* Header Section - matching Home */}
            <View style={[styles.headerSection, isDark && styles.headerSectionDark]}>
                <Text style={[styles.title, isDark && styles.textDark, isWide && styles.titleWide]}>
                    Interactive Quizzes
                </Text>
                <Text style={[styles.subtitle, isDark && styles.textSecondaryDark, isWide && styles.subtitleWide]}>
                    Test your understanding of physics concepts. Choose a topic and challenge yourself!
                </Text>
            </View>

            {/* Cards Grid - matching Home */}
            <View style={[styles.cardsGrid, isWide && styles.cardsGridWide]}>
                {quizTopics.map((topic) => (
                    <FeatureCard
                        key={topic.key}
                        topic={topic}
                        isDark={isDark}
                        isWide={isWide}
                        onPress={() => startQuiz(topic.key as TopicKey)}
                    />
                ))}
            </View>
        </ScrollView>
    );

    const renderActiveQuiz = () => {
        const questions = quizData[quizState.topic];
        const currentQ = questions[quizState.currentIndex];
        const progress = ((quizState.currentIndex + 1) / questions.length) * 100;

        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.quizHeader}>
                    <TouchableOpacity onPress={resetQuiz} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                        <Text style={[styles.backText, { color: Colors[colorScheme ?? 'light'].tint }]}>Quit</Text>
                    </TouchableOpacity>
                    <Text style={[styles.progressText, isDark && styles.textSecondaryDark]}>
                        {quizState.currentIndex + 1} / {questions.length}
                    </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>

                <Card style={styles.questionCard}>
                    <Text style={[styles.questionText, isDark && styles.textDark]}>{currentQ.question}</Text>
                </Card>

                <View style={styles.optionsContainer}>
                    {currentQ.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                isDark && styles.optionButtonDark,
                                selectedOption === option && styles.optionSelected
                            ]}
                            onPress={() => handleAnswer(option)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.optionText,
                                isDark && styles.textDark,
                                selectedOption === option && styles.optionTextSelected
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Button
                    title={quizState.currentIndex === questions.length - 1 ? "Finish" : "Next"}
                    onPress={confirmAnswer}
                    disabled={!selectedOption}
                    style={{ marginTop: 20 }}
                />
            </ScrollView>
        );
    };

    const renderResult = () => {
        const total = quizData[quizState.topic].length;
        const finalScore = quizState.score + (selectedOption === quizData[quizState.topic][quizState.currentIndex]?.answer ? 1 : 0);
        const percentage = Math.round((finalScore / total) * 100);

        return (
            <View style={styles.resultContainer}>
                <Card style={styles.resultCard}>
                    <IconSymbol
                        name={percentage >= 70 ? "checkmark.circle.fill" : "xmark.circle.fill"}
                        size={80}
                        color={percentage >= 70 ? '#48bb78' : '#f56565'}
                    />
                    <Text style={[styles.resultTitle, isDark && styles.textDark]}>
                        {percentage >= 70 ? 'Great Job!' : 'Keep Practicing!'}
                    </Text>
                    <Text style={[styles.resultScore, isDark && styles.textDark]}>
                        {finalScore} / {total}
                    </Text>
                    <Text style={[styles.resultPercentage, isDark && styles.textSecondaryDark]}>
                        {percentage}% Correct
                    </Text>
                </Card>

                <Button title="Try Another Quiz" onPress={resetQuiz} style={{ marginTop: 24 }} />
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
            {mode === 'selection' && renderTopicSelection()}
            {mode === 'active' && renderActiveQuiz()}
            {mode === 'result' && renderResult()}
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
    scrollContentWide: {
        padding: 40,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
    },
    // Header - matching Home
    headerSection: {
        marginBottom: 32,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    headerSectionDark: {
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 12,
        lineHeight: 34,
    },
    titleWide: {
        fontSize: 36,
        lineHeight: 46,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.icon,
        lineHeight: 24,
    },
    subtitleWide: {
        fontSize: 20,
        lineHeight: 30,
    },
    textDark: {
        color: Colors.dark.text,
    },
    textSecondaryDark: {
        color: Colors.dark.icon,
    },
    // Cards Grid - matching Home
    cardsGrid: {
        gap: 20,
    },
    cardsGridWide: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    // Feature Card - matching Home
    featureCard: {
        backgroundColor: Colors.light.card,
        borderRadius: 20,
        padding: 24,
        // Enhanced Neumorphism shadows
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        position: 'relative',
    },
    featureCardDark: {
        backgroundColor: Colors.dark.card,
        shadowColor: '#000',
        shadowOpacity: 0.5,
    },
    featureCardWide: {
        flex: 1,
        minWidth: 300,
        maxWidth: '48%',
        padding: 32,
    },
    // Icon Container - matching Home
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    // Feature Title - matching Home
    featureTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 10,
    },
    featureTitleWide: {
        fontSize: 22,
    },
    // Feature Description - matching Home
    featureDesc: {
        fontSize: 15,
        color: Colors.light.icon,
        lineHeight: 22,
        paddingRight: 30,
    },
    featureDescWide: {
        fontSize: 17,
        lineHeight: 26,
    },
    // Card Arrow - matching Home
    cardArrow: {
        position: 'absolute',
        right: 20,
        top: '50%',
        marginTop: -10,
    },
    // Active Quiz Styles
    quizHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: 16,
        marginLeft: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.icon,
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        marginBottom: 24,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.light.tint,
        borderRadius: 3,
    },
    questionCard: {
        marginBottom: 20,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '500',
        lineHeight: 26,
        color: Colors.light.text,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        padding: 16,
        backgroundColor: Colors.light.card,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionButtonDark: {
        backgroundColor: Colors.dark.card,
    },
    optionSelected: {
        borderColor: Colors.light.tint,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    optionText: {
        fontSize: 15,
        color: Colors.light.text,
    },
    optionTextSelected: {
        fontWeight: '600',
        color: Colors.light.tint,
    },
    // Result Styles
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    resultCard: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 32,
        width: '100%',
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        color: Colors.light.text,
    },
    resultScore: {
        fontSize: 48,
        fontWeight: 'bold',
        marginTop: 12,
        color: Colors.light.text,
    },
    resultPercentage: {
        fontSize: 18,
        marginTop: 8,
        color: Colors.light.icon,
    }
});
