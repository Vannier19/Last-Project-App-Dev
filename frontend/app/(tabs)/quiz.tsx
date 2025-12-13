import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { quizData } from '@/constants/quizData';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TopicKey = keyof typeof quizData;
type QuizMode = 'selection' | 'active' | 'result';

interface QuizState {
    topic: TopicKey;
    currentIndex: number;
    score: number;
    answers: (string | null)[];
}

// Topic Selection Component
const TopicItem = ({ title, subtitle, icon, onPress, isDark }: any) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.topicItem, isDark && styles.topicItemDark]}>
        <View style={styles.topicIcon}>
            <IconSymbol name={icon} size={28} color={isDark ? Colors.dark.tint : Colors.light.tint} />
        </View>
        <View style={styles.topicTextContainer}>
            <Text style={[styles.topicTitle, isDark && styles.textDark]}>{title}</Text>
            <Text style={[styles.topicSubtitle, isDark && styles.textSecondaryDark]}>{subtitle}</Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={isDark ? '#666' : '#999'} />
    </TouchableOpacity>
);

export default function QuizScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

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

        // Save score locally (for later backend sync)
        try {
            const key = `quiz_${quizState.topic}_${Date.now()}`;
            const scoreData = {
                topic: quizState.topic,
                score: quizState.score + (selectedOption === quizData[quizState.topic][quizState.currentIndex].answer ? 1 : 0),
                total: quizData[quizState.topic].length,
                date: new Date().toISOString()
            };
            await AsyncStorage.setItem(key, JSON.stringify(scoreData));
        } catch (e) {
            console.log('Failed to save score locally', e);
        }
    };

    const resetQuiz = () => {
        setMode('selection');
        setQuizState({ topic: 'glb', currentIndex: 0, score: 0, answers: [] });
        setSelectedOption(null);
    };

    // ---- Render Methods ----

    const renderTopicSelection = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={[styles.title, isDark && styles.textDark]}>Quizzes</Text>
                <Text style={[styles.subtitle, isDark && styles.textSecondaryDark]}>Test your physics knowledge</Text>
            </View>

            <TopicItem title="GLB" subtitle="10 Questions" icon="speedometer" onPress={() => startQuiz('glb')} isDark={isDark} />
            <TopicItem title="GLBB" subtitle="10 Questions" icon="bolt.car" onPress={() => startQuiz('glbb')} isDark={isDark} />
            <TopicItem title="Vertical Motion" subtitle="10 Questions" icon="arrow.up.circle" onPress={() => startQuiz('vertikal')} isDark={isDark} />
            <TopicItem title="Projectile Motion" subtitle="10 Questions" icon="trajectory" onPress={() => startQuiz('parabola')} isDark={isDark} />
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
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.icon,
        marginTop: 4,
    },
    textDark: {
        color: Colors.dark.text,
    },
    textSecondaryDark: {
        color: Colors.dark.icon,
    },
    topicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.light.card,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: Colors.light.border,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    topicItemDark: {
        backgroundColor: Colors.dark.card,
    },
    topicIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    topicTextContainer: {
        flex: 1,
    },
    topicTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.light.text,
    },
    topicSubtitle: {
        fontSize: 13,
        color: Colors.light.icon,
        marginTop: 2,
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
