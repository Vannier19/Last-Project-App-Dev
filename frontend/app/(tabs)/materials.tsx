import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';

type TopicKey = 'glb' | 'glbb' | 'vertikal' | 'parabola';

const materialsData: Record<TopicKey, { title: string; subtitle: string; formulas: string[]; description: string }> = {
    glb: {
        title: "Gerak Lurus Beraturan (GLB)",
        subtitle: "Uniform Linear Motion",
        formulas: ["s = v × t", "v = s / t", "t = s / v"],
        description: "GLB is motion in a straight line with constant velocity. There is no acceleration (a = 0). The distance traveled is directly proportional to time."
    },
    glbb: {
        title: "Gerak Lurus Berubah Beraturan (GLBB)",
        subtitle: "Uniformly Accelerated Motion",
        formulas: ["v = v₀ + at", "s = v₀t + ½at²", "v² = v₀² + 2as"],
        description: "GLBB is motion in a straight line with constant acceleration. Examples include braking cars and falling objects."
    },
    vertikal: {
        title: "Gerak Vertikal",
        subtitle: "Vertical Motion",
        formulas: ["h = v₀t - ½gt²", "v = v₀ - gt", "h_max = v₀²/2g", "t_up = v₀/g"],
        description: "Vertical motion includes free fall and upward throws. Gravity (g ≈ 9.8 m/s²) acts as constant downward acceleration."
    },
    parabola: {
        title: "Gerak Parabola",
        subtitle: "Projectile Motion",
        formulas: ["x = v₀ cos(θ) × t", "y = v₀ sin(θ) × t - ½gt²", "R = v₀² sin(2θ) / g"],
        description: "Projectile motion is a combination of horizontal (GLB) and vertical (GLBB) motion. Maximum range is achieved at 45°."
    }
};

const TopicCard = ({ topicKey, data, isDark, onPress, isExpanded }: any) => (
    <Card style={[styles.topicCard, isDark && styles.topicCardDark]}>
        <TouchableOpacity onPress={onPress} style={styles.cardHeader}>
            <View>
                <Text style={[styles.topicTitle, isDark && styles.textDark]}>{data.title}</Text>
                <Text style={[styles.topicSubtitle, isDark && styles.textSecondaryDark]}>{data.subtitle}</Text>
            </View>
            <IconSymbol
                name={isExpanded ? "chevron.up" : "chevron.down"}
                size={20}
                color={isDark ? Colors.dark.icon : Colors.light.icon}
            />
        </TouchableOpacity>

        {isExpanded && (
            <View style={styles.expandedContent}>
                <Text style={[styles.sectionHeader, isDark && styles.textDark]}>Formulas</Text>
                {data.formulas.map((f: string, i: number) => (
                    <View key={i} style={styles.formulaRow}>
                        <Text style={[styles.formulaText, isDark && styles.textDark]}>{f}</Text>
                    </View>
                ))}

                <Text style={[styles.sectionHeader, isDark && styles.textDark, { marginTop: 16 }]}>Description</Text>
                <Text style={[styles.descriptionText, isDark && styles.textSecondaryDark]}>{data.description}</Text>
            </View>
        )}
    </Card>
);

export default function MaterialsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [expandedTopic, setExpandedTopic] = useState<TopicKey | null>(null);

    const toggleTopic = (topic: TopicKey) => {
        setExpandedTopic(prev => prev === topic ? null : topic);
    };

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, isDark && styles.textDark]}>Learning Materials</Text>
                    <Text style={[styles.subtitle, isDark && styles.textSecondaryDark]}>Explore physics concepts</Text>
                </View>

                {(Object.keys(materialsData) as TopicKey[]).map(key => (
                    <TopicCard
                        key={key}
                        topicKey={key}
                        data={materialsData[key]}
                        isDark={isDark}
                        onPress={() => toggleTopic(key)}
                        isExpanded={expandedTopic === key}
                    />
                ))}
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
    topicCard: {
        marginBottom: 16,
    },
    topicCardDark: {
        backgroundColor: Colors.dark.card,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    topicTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.text,
    },
    topicSubtitle: {
        fontSize: 13,
        color: Colors.light.icon,
        marginTop: 2,
    },
    expandedContent: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    formulaRow: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    formulaText: {
        fontSize: 16,
        fontFamily: 'monospace',
        color: Colors.light.tint,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.light.icon,
    }
});
