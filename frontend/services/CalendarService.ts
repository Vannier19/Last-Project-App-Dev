import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

export const CalendarService = {
    async requestPermissions() {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status === 'granted') {
            await Calendar.requestRemindersPermissionsAsync(); // often needed for iOS full access
        }
        return status === 'granted';
    },

    async getDefaultCalendarSource() {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendars = calendars.filter(each => each.source.name === 'Default');
        return defaultCalendars.length > 0 ? defaultCalendars[0].source : calendars[0].source;
    },

    async createCalendarAsync() {
        const defaultCalendarSource =
            Platform.OS === 'ios'
                ? await this.getDefaultCalendarSource()
                : { isLocalAccount: true, name: 'Virtual Physics Lab', type: Calendar.SourceType.LOCAL };

        // For Android, we need to create a source first contextually or use existing
        // Simplifying for Android: use existing default or create local
        // Note: Production apps usually find the primary account calendar.

        // This is a simplified approach for Android to create a new calendar
        // detailed implementation varies by device manufacturer quirks
        const newCalendarID = await Calendar.createCalendarAsync({
            title: 'Virtual Physics Lab',
            color: '#6366f1',
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: (defaultCalendarSource as any).id,
            source: defaultCalendarSource,
            name: 'internalCalendarName',
            ownerAccount: 'personal',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });

        return newCalendarID;
    },

    async addEventToCalendar(title: string, startDate: Date, endDate: Date, notes: string = '') {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                Alert.alert('Permission denied', 'Cannot access calendar.');
                return;
            }

            // Find accessible calendars
            const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
            let calendarId;

            // Try to find our app's calendar or use default
            const appCalendar = calendars.find(c => c.title === 'Virtual Physics Lab');

            if (appCalendar) {
                calendarId = appCalendar.id;
            } else {
                // Determine primary calendar for the device
                const primaryCalendar = calendars.find(c => c.isPrimary) || calendars[0];
                // If on iOS and no proprietary calendar, creating one is optional, easier to use default
                // But creating custom is nice. Let's try to just use default for simplicity first
                // to avoid "source" complexity on Android.
                if (Platform.OS === 'ios') {
                    // On iOS it is safer to write to the default calendar or ask user?
                    // Let's create one for the app to keep things organized
                    calendarId = await this.createCalendarAsync();
                } else {
                    // Android
                    calendarId = primaryCalendar?.id;
                }
            }

            if (!calendarId) {
                Alert.alert('Error', 'Could not find a suitable calendar.');
                return;
            }

            await Calendar.createEventAsync(calendarId, {
                title,
                startDate,
                endDate,
                notes,
                timeZone: 'GMT', // or specific timezone
            });

            Alert.alert('Success', 'Event added to your calendar!');
            return true;
        } catch (e) {
            console.log(e);
            Alert.alert('Error', 'Failed to add event to calendar.');
            return false;
        }
    }
};
