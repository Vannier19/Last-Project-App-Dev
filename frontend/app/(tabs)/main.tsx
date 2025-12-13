import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Import screens as components (we'll render them based on active tab)
import LabScreen from './index';
import MaterialsScreen from './materials';
import QuizScreen from './quiz';
import ProfileScreen from './profile';

type TabKey = 'welcome' | 'lab' | 'materials' | 'quiz' | 'profile';

const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'welcome', label: 'Home', icon: 'house.fill' },
    { key: 'materials', label: 'Materials', icon: 'book.fill' },
    { key: 'lab', label: 'Virtual Lab', icon: 'flask.fill' },
    { key: 'quiz', label: 'Quiz', icon: 'questionmark.circle.fill' },
    { key: 'profile', label: 'Profile', icon: 'person.fill' },
];

// Welcome/Dashboard Screen Content with improved visuals
const WelcomeContent = ({ isDark, onNavigate, isWide }: { isDark: boolean; onNavigate: (tab: TabKey) => void; isWide: boolean }) => (
    <ScrollView contentContainerStyle={[styles.welcomeContent, isWide && styles.welcomeContentWide]}>
        {/* Hero Section */}
        <View style={[styles.heroSection, isDark && styles.heroSectionDark]}>
            <Text style={[styles.welcomeTitle, isDark && styles.textDark, isWide && styles.welcomeTitleWide]}>
                Welcome to Virtual Physics Laboratory!
            </Text>
            <Text style={[styles.welcomeSubtitle, isDark && styles.textSecondaryDark, isWide && styles.welcomeSubtitleWide]}>
                An interactive platform to learn basic Physics concepts through simulations and challenging quizzes.
            </Text>
        </View>

        {/* Feature Cards */}
        <View style={[styles.featuresGrid, isWide && styles.featuresGridWide]}>
            <TouchableOpacity
                style={[styles.featureCard, isDark && styles.featureCardDark, isWide && styles.featureCardWide]}
                onPress={() => onNavigate('materials')}
                activeOpacity={0.8}
            >
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <IconSymbol name="book.fill" size={isWide ? 40 : 32} color="#6366f1" />
                </View>
                <Text style={[styles.featureTitle, isDark && styles.textDark, isWide && styles.featureTitleWide]}>
                    Interactive Materials
                </Text>
                <Text style={[styles.featureDesc, isDark && styles.textSecondaryDark, isWide && styles.featureDescWide]}>
                    Learn summaries and important formulas from each basic Physics topic, from Uniform Linear Motion to Projectile Motion.
                </Text>
                <View style={styles.cardArrow}>
                    <IconSymbol name="chevron.right" size={20} color={isDark ? '#888' : '#999'} />
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.featureCard, isDark && styles.featureCardDark, isWide && styles.featureCardWide]}
                onPress={() => onNavigate('lab')}
                activeOpacity={0.8}
            >
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <IconSymbol name="flask.fill" size={isWide ? 40 : 32} color="#10b981" />
                </View>
                <Text style={[styles.featureTitle, isDark && styles.textDark, isWide && styles.featureTitleWide]}>
                    Virtual Simulation
                </Text>
                <Text style={[styles.featureDesc, isDark && styles.textSecondaryDark, isWide && styles.featureDescWide]}>
                    Experience physics concepts directly with interactive simulations. Change variables like velocity and angle, then see the results in real-time!
                </Text>
                <View style={styles.cardArrow}>
                    <IconSymbol name="chevron.right" size={20} color={isDark ? '#888' : '#999'} />
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.featureCard, isDark && styles.featureCardDark, isWide && styles.featureCardWide]}
                onPress={() => onNavigate('quiz')}
                activeOpacity={0.8}
            >
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <IconSymbol name="questionmark.circle.fill" size={isWide ? 40 : 32} color="#f59e0b" />
                </View>
                <Text style={[styles.featureTitle, isDark && styles.textDark, isWide && styles.featureTitleWide]}>
                    Interactive Quiz
                </Text>
                <Text style={[styles.featureDesc, isDark && styles.textSecondaryDark, isWide && styles.featureDescWide]}>
                    Test your understanding by taking quizzes for each topic. View your scores and track your learning progress.
                </Text>
                <View style={styles.cardArrow}>
                    <IconSymbol name="chevron.right" size={20} color={isDark ? '#888' : '#999'} />
                </View>
            </TouchableOpacity>
        </View>
    </ScrollView>
);

export default function MainAppWithTopNav() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [activeTab, setActiveTab] = useState<TabKey>('welcome');
    const { width } = useWindowDimensions();
    const isWide = width > 768; // iPad/Desktop

    const renderContent = () => {
        switch (activeTab) {
            case 'welcome':
                return <WelcomeContent isDark={isDark} onNavigate={setActiveTab} isWide={isWide} />;
            case 'lab':
                return <LabScreen />;
            case 'materials':
                return <MaterialsScreen />;
            case 'quiz':
                return <QuizScreen />;
            case 'profile':
                return <ProfileScreen />;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header with gradient accent */}
            <View style={[styles.header, isDark && styles.headerDark]}>
                <View style={styles.headerAccent} />
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, isDark && styles.textDark, isWide && styles.headerTitleWide]}>
                        Virtual Physics Lab
                    </Text>
                    <TouchableOpacity onPress={() => setActiveTab('profile')} style={styles.userButton}>
                        <IconSymbol name="person.circle" size={28} color={isDark ? Colors.dark.tint : Colors.light.tint} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Navigation Tabs */}
            <View style={[styles.navContainer, isDark && styles.navContainerDark]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.navScroll, isWide && styles.navScrollWide]}
                >
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.navTab,
                                isWide && styles.navTabWide,
                                activeTab === tab.key && styles.navTabActive,
                                activeTab === tab.key && isDark && styles.navTabActiveDark
                            ]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <IconSymbol
                                name={tab.icon}
                                size={isWide ? 22 : 18}
                                color={activeTab === tab.key ? (isDark ? Colors.dark.tint : Colors.light.tint) : (isDark ? Colors.dark.icon : Colors.light.icon)}
                            />
                            <Text style={[
                                styles.navTabText,
                                isWide && styles.navTabTextWide,
                                isDark && styles.textSecondaryDark,
                                activeTab === tab.key && styles.navTabTextActive,
                                activeTab === tab.key && { color: isDark ? Colors.dark.tint : Colors.light.tint }
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {renderContent()}
            </View>
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
    // Header
    header: {
        backgroundColor: Colors.light.card,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden',
    },
    headerDark: {
        backgroundColor: Colors.dark.card,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: Colors.light.tint,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    headerTitleWide: {
        fontSize: 26,
    },
    userButton: {
        padding: 4,
    },
    textDark: {
        color: Colors.dark.text,
    },
    textSecondaryDark: {
        color: Colors.dark.icon,
    },
    // Nav Tabs
    navContainer: {
        backgroundColor: Colors.light.card,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    navContainerDark: {
        backgroundColor: Colors.dark.card,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    navScroll: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    navScrollWide: {
        paddingHorizontal: 24,
        gap: 12,
    },
    navTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        gap: 8,
        backgroundColor: 'transparent',
    },
    navTabWide: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    navTabActive: {
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
    },
    navTabActiveDark: {
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
    },
    navTabText: {
        fontSize: 15,
        color: Colors.light.icon,
    },
    navTabTextWide: {
        fontSize: 17,
    },
    navTabTextActive: {
        fontWeight: '600',
    },
    // Content
    contentArea: {
        flex: 1,
    },
    // Welcome Screen
    welcomeContent: {
        padding: 20,
        paddingBottom: 60,
    },
    welcomeContentWide: {
        padding: 40,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
    },
    heroSection: {
        marginBottom: 32,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    heroSectionDark: {
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    welcomeTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 12,
        lineHeight: 34,
    },
    welcomeTitleWide: {
        fontSize: 36,
        lineHeight: 46,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: Colors.light.icon,
        lineHeight: 24,
    },
    welcomeSubtitleWide: {
        fontSize: 20,
        lineHeight: 30,
    },
    featuresGrid: {
        gap: 20,
    },
    featuresGridWide: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    featureCard: {
        backgroundColor: Colors.light.card,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        position: 'relative',
    },
    featureCardDark: {
        backgroundColor: Colors.dark.card,
        shadowColor: '#000',
        shadowOpacity: 0.3,
    },
    featureCardWide: {
        flex: 1,
        minWidth: 300,
        padding: 32,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 10,
    },
    featureTitleWide: {
        fontSize: 22,
    },
    featureDesc: {
        fontSize: 15,
        color: Colors.light.icon,
        lineHeight: 22,
    },
    featureDescWide: {
        fontSize: 17,
        lineHeight: 26,
    },
    cardArrow: {
        position: 'absolute',
        right: 20,
        top: '50%',
        marginTop: -10,
    },
});
