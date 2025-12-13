import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/theme';
import { Button } from './Button';
import { Input } from './Input';
import { CalendarService } from '@/services/CalendarService';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ScheduleModalProps {
    visible: boolean;
    onClose: () => void;
}

export function ScheduleModal({ visible, onClose }: ScheduleModalProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [title, setTitle] = useState('Physics Study Session');
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false); // For Android
    const [loading, setLoading] = useState(false);

    const handleSchedule = async () => {
        setLoading(true);
        // End date is 1 hour later by default
        const endDate = new Date(date.getTime() + 60 * 60 * 1000);

        await CalendarService.addEventToCalendar(title, date, endDate);
        setLoading(false);
        onClose();
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={[styles.modalView, isDark && styles.modalViewDark]}>
                    <Text style={[styles.modalTitle, isDark && styles.textDark]}>Schedule Session</Text>

                    <Input
                        label="Event Title"
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Study Mechanics"
                    />

                    <Text style={[styles.label, isDark && styles.textDark]}>Date & Time</Text>

                    {Platform.OS === 'android' && (
                        <TouchableOpacity
                            style={[styles.dateButton, isDark && styles.dateButtonDark]}
                            onPress={() => setShowPicker(true)}
                        >
                            <Text style={[styles.dateText, isDark && styles.textDark]}>
                                {date.toLocaleString()}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {(showPicker || Platform.OS === 'ios') && (
                        <DateTimePicker
                            value={date}
                            mode="datetime"
                            display="default"
                            onChange={onChangeDate}
                            style={styles.datePicker}
                            themeVariant={isDark ? 'dark' : 'light'}
                        />
                    )}

                    <View style={styles.buttonRow}>
                        <Button
                            title="Cancel"
                            variant="secondary"
                            onPress={onClose}
                            style={{ flex: 1, marginRight: 8 }}
                        />
                        <Button
                            title="Add to Calendar"
                            onPress={handleSchedule}
                            isLoading={loading}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
    },
    modalView: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalViewDark: {
        backgroundColor: Colors.dark.card,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: Colors.light.text,
    },
    textDark: {
        color: Colors.dark.text,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    dateButton: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        marginBottom: 20,
        alignItems: 'center',
    },
    dateButtonDark: {
        backgroundColor: '#333',
    },
    dateText: {
        fontSize: 16,
        color: '#000',
    },
    datePicker: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 10,
    }
});
