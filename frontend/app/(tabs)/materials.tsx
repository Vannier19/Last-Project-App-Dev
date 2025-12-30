import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Modal, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button } from '@/components/ui/Button';
import { HoverableCard } from '@/components/ui/HoverableCard';

// Lazy load YouTube player only on native platforms to avoid web bundling issues
const YoutubePlayer = Platform.OS !== 'web'
    ? require('react-native-youtube-iframe').default
    : null;

type TopicKey = 'glb' | 'glbb' | 'vertikal' | 'parabola';

interface TopicData {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    bgColor: string;
    formulas: string[];
    description: string;
    videoId: string;
}

const materialsData: Record<TopicKey, TopicData> = {
    glb: {
        title: "Gerak Lurus Beraturan (GLB)",
        subtitle: "Uniform Linear Motion - Motion with constant velocity",
        icon: "arrow.right",
        color: "#6366f1",
        bgColor: "rgba(99, 102, 241, 0.15)",
        formulas: ["s = v × t", "v = s / t", "t = s / v"],
        description: "GLB is motion in a straight line with constant velocity. There is no acceleration (a = 0). The distance traveled is directly proportional to time.",
        videoId: "dHjWVlfNraM"
    },
    glbb: {
        title: "Gerak Lurus Berubah Beraturan (GLBB)",
        subtitle: "Uniformly Accelerated Motion - Motion with constant acceleration",
        icon: "arrow.up.right",
        color: "#8b5cf6",
        bgColor: "rgba(139, 92, 246, 0.15)",
        formulas: ["v = v₀ + at", "s = v₀t + ½at²", "v² = v₀² + 2as"],
        description: "GLBB is motion in a straight line with constant acceleration. Examples include braking cars and falling objects.",
        videoId: "dHjWVlfNraM"
    },
    vertikal: {
        title: "Gerak Vertikal",
        subtitle: "Vertical Motion - Free fall and upward throws",
        icon: "arrow.up",
        color: "#ec4899",
        bgColor: "rgba(236, 72, 153, 0.15)",
        formulas: ["h = v₀t - ½gt²", "v = v₀ - gt", "h_max = v₀²/2g", "t_up = v₀/g"],
        description: "Vertical motion includes free fall and upward throws. Gravity (g ≈ 9.8 m/s²) acts as constant downward acceleration.",
        videoId: "BVgemK1Y2wA"
    },
    parabola: {
        title: "Gerak Parabola",
        subtitle: "Projectile Motion - Combination of horizontal and vertical motion",
        icon: "arrow.up.forward",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.15)",
        formulas: ["x = v₀ cos(θ) × t", "y = v₀ sin(θ) × t - ½gt²", "R = v₀² sin(2θ) / g"],
        description: "Projectile motion is a combination of horizontal (GLB) and vertical (GLBB) motion. Maximum range is achieved at 45°.",
        videoId: "8NLzuURxFwY"
    }
};

interface TopicCardProps {
    data: TopicData;
    isDark: boolean;
    isWide: boolean;
    onPress: () => void;
}

const TopicCard = ({ data, isDark, isWide, onPress }: TopicCardProps) => (
    <HoverableCard
        style={[
            styles.featureCard,
            isDark && styles.featureCardDark,
            isWide && styles.featureCardWide
        ]}
        onPress={onPress}
    >
        <View style={[styles.iconContainer, { backgroundColor: data.bgColor }]}>
            <IconSymbol name={data.icon as any} size={isWide ? 40 : 32} color={data.color} />
        </View>
        <Text style={[styles.featureTitle, isDark && styles.textDark, isWide && styles.featureTitleWide]}>
            {data.title}
        </Text>
        <Text style={[styles.featureDesc, isDark && styles.textSecondaryDark, isWide && styles.featureDescWide]}>
            {data.subtitle}
        </Text>
        <View style={styles.cardArrow}>
            <IconSymbol name="chevron.right" size={20} color={isDark ? '#888' : '#999'} />
        </View>
    </HoverableCard>
);

interface DetailModalProps {
    visible: boolean;
    data: TopicData | null;
    isDark: boolean;
    onClose: () => void;
}

const DetailModal = ({ visible, data, isDark, onClose }: DetailModalProps) => {
    const { width } = useWindowDimensions();
    const [isPlaying, setIsPlaying] = useState(false);

    const onStateChange = useCallback((state: string) => {
        if (state === "ended") {
            setIsPlaying(false);
        }
    }, []);

    // Reset playing state when modal closes
    React.useEffect(() => {
        if (!visible) {
            setIsPlaying(false);
        }
    }, [visible]);

    if (!data) return null;

    const videoWidth = Math.min(width - 40, 560);
    const videoHeight = videoWidth * (9 / 16);

    const renderVideoPlayer = () => {
        if (Platform.OS === 'web') {
            return (
                <iframe
                    width="100%"
                    height={videoHeight}
                    src={`https://www.youtube.com/embed/${data.videoId}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ borderRadius: 12 }}
                />
            );
        }

        if (YoutubePlayer) {
            return (
                <YoutubePlayer
                    height={videoHeight}
                    width={videoWidth}
                    play={isPlaying}
                    videoId={data.videoId}
                    onChangeState={onStateChange}
                />
            );
        }

        return null;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
                <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
                    <View style={[styles.modalIconBadge, { backgroundColor: data.bgColor }]}>
                        <IconSymbol name={data.icon as any} size={28} color={data.color} />
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? Colors.dark.icon : Colors.light.icon} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <Text style={[styles.modalTitle, isDark && styles.textDark]}>{data.title}</Text>
                    <Text style={[styles.modalSubtitle, isDark && styles.textSecondaryDark]}>{data.subtitle}</Text>

                    {/* YouTube Video Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, isDark && styles.textDark]}>🎬 Learning Video</Text>
                        <View style={styles.videoContainer}>
                            {renderVideoPlayer()}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, isDark && styles.textDark]}>📐 Key Formulas</Text>
                        {data.formulas.map((f, i) => (
                            <View key={i} style={[styles.formulaRow, { borderLeftColor: data.color }]}>
                                <Text style={[styles.formulaText, { color: data.color }]}>{f}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, isDark && styles.textDark]}>📖 Description</Text>
                        <Text style={[styles.descriptionText, isDark && styles.textSecondaryDark]}>
                            {data.description}
                        </Text>
                    </View>
                </ScrollView>

                <View style={[styles.modalFooter, isDark && styles.modalFooterDark]}>
                    <Button title="Close" variant="secondary" onPress={onClose} />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default function MaterialsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { width } = useWindowDimensions();
    const isWide = width > 768;
    const [selectedTopic, setSelectedTopic] = useState<TopicKey | null>(null);

    const topics = Object.keys(materialsData) as TopicKey[];

    return (
        <ScrollView
            style={[styles.container, isDark && styles.containerDark]}
            contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
        >
            {/* Header Section */}
            <View style={[styles.headerSection, isDark && styles.headerSectionDark]}>
                <Text style={[styles.title, isDark && styles.textDark, isWide && styles.titleWide]}>
                    Learning Materials
                </Text>
                <Text style={[styles.subtitle, isDark && styles.textSecondaryDark, isWide && styles.subtitleWide]}>
                    Explore physics concepts with comprehensive explanations and formulas for each topic.
                </Text>
            </View>

            {/* Topic Cards Grid */}
            <View style={[styles.cardsGrid, isWide && styles.cardsGridWide]}>
                {topics.map((key) => (
                    <TopicCard
                        key={key}
                        data={materialsData[key]}
                        isDark={isDark}
                        isWide={isWide}
                        onPress={() => setSelectedTopic(key)}
                    />
                ))}
            </View>

            <DetailModal
                visible={selectedTopic !== null}
                data={selectedTopic ? materialsData[selectedTopic] : null}
                isDark={isDark}
                onClose={() => setSelectedTopic(null)}
            />
        </ScrollView>
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
    // Header - matching Home exactly
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
    // Cards Grid - matching Home exactly
    cardsGrid: {
        gap: 20,
    },
    cardsGridWide: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    // Feature Card - matching Home with enhanced neumorphism
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
    // Icon Container - matching Home exactly
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    // Feature Title - matching Home exactly
    featureTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 10,
    },
    featureTitleWide: {
        fontSize: 22,
    },
    // Feature Description - matching Home exactly
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
    // Card Arrow - matching Home exactly
    cardArrow: {
        position: 'absolute',
        right: 20,
        top: '50%',
        marginTop: -10,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    modalContainerDark: {
        backgroundColor: Colors.dark.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
        backgroundColor: Colors.light.card,
    },
    modalHeaderDark: {
        backgroundColor: Colors.dark.card,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    modalIconBadge: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 8,
        lineHeight: 36,
    },
    modalSubtitle: {
        fontSize: 16,
        color: Colors.light.icon,
        marginBottom: 28,
        lineHeight: 24,
    },
    section: {
        marginBottom: 28,
    },
    videoContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionHeader: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 14,
    },
    formulaRow: {
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 14,
        marginBottom: 10,
        borderLeftWidth: 4,
    },
    formulaText: {
        fontSize: 18,
        fontFamily: 'monospace',
        fontWeight: '600',
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 26,
        color: Colors.light.icon,
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
        backgroundColor: Colors.light.card,
    },
    modalFooterDark: {
        backgroundColor: Colors.dark.card,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
});
