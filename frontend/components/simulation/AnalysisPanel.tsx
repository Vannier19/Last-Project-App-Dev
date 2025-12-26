import React from 'react';
import { StyleSheet, View, Text, TextInput, ViewStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedProps, SharedValue } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnalysisItemProps {
    label: string;
    unit: string;
    value: SharedValue<number> | SharedValue<string>;
    fractionDigits?: number;
    isDark: boolean;
}

const AnalysisItem = ({ label, unit, value, fractionDigits = 2, isDark }: AnalysisItemProps) => {
    const animatedProps = useAnimatedProps(() => {
        const val = typeof value.value === 'number'
            ? value.value.toFixed(fractionDigits)
            : value.value;
        return {
            text: `${val} ${unit}`,
            value: `${val} ${unit}`
        } as any;
    });

    return (
        <View style={styles.itemContainer}>
            <Text style={[styles.itemLabel, isDark && styles.textSecondaryDark]}>{label}</Text>
            <AnimatedTextInput
                underlineColorAndroid="transparent"
                editable={false}
                value="0.00"
                style={[styles.itemValue, isDark && styles.textDark]}
                animatedProps={animatedProps}
            />
        </View>
    );
};

export interface AnalysisPanelProps {
    time: SharedValue<number>;
    posX: SharedValue<number>;
    posY: SharedValue<number>;
    velX: SharedValue<number>;
    velY: SharedValue<number>;
    style?: StyleProp<ViewStyle>;
    forcedMode?: 'light' | 'dark';
}

export function AnalysisPanel({ time, posX, posY, velX, velY, style, forcedMode }: AnalysisPanelProps) {
    const colorScheme = useColorScheme();
    const isDark = forcedMode ? forcedMode === 'dark' : colorScheme === 'dark';

    return (
        <View style={[styles.container, isDark && styles.containerDark, style]}>
            <Text style={[styles.title, isDark && styles.textDark]}>Real-time Analysis</Text>
            <View style={styles.grid}>
                <AnalysisItem label="Time" unit="s" value={time} isDark={isDark} />
                <AnalysisItem label="Pos X" unit="m" value={posX} isDark={isDark} />
                <AnalysisItem label="Pos Y" unit="m" value={posY} isDark={isDark} />
                <AnalysisItem label="Vel X" unit="m/s" value={velX} isDark={isDark} />
                <AnalysisItem label="Vel Y" unit="m/s" value={velY} isDark={isDark} />
                {/* Derived total velocity could be added here too */}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        padding: 16,
        backgroundColor: Colors.light.card,
        borderRadius: 16,
        shadowColor: Colors.light.border,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    containerDark: {
        backgroundColor: Colors.dark.card,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: Colors.light.text,
    },
    textDark: {
        color: Colors.dark.text,
    },
    textSecondaryDark: {
        color: Colors.dark.icon,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    itemContainer: {
        width: '30%',
        marginBottom: 8,
    },
    itemLabel: {
        fontSize: 12,
        color: Colors.light.icon,
        marginBottom: 2,
    },
    itemValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        padding: 0,
    }
});
