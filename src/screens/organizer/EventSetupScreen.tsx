import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EventVisibility, EventPalette } from '../../types';
import { useEventStore } from '../../store/eventStore';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import type { MainStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface ColorOption {
  label: string;
  palette: EventPalette;
}

const COLOR_PRESETS: ColorOption[] = [
  {
    label: 'Indigo / Pink',
    palette: {
      primary: '#4F46E5',
      accent: '#EC4899',
      background: '#111827',
    } as EventPalette,
  },
  {
    label: 'Emerald / Amber',
    palette: {
      primary: '#10B981',
      accent: '#F59E0B',
      background: '#111827',
    } as EventPalette,
  },
  {
    label: 'Sky / Rose',
    palette: {
      primary: '#0EA5E9',
      accent: '#F43F5E',
      background: '#111827',
    } as EventPalette,
  },
];

export const EventSetupScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [joinCode, setJoinCode] = useState('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date(Date.now() + 3 * 60 * 60 * 1000));
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { userId } = useAuth();
  const createEvent = useEventStore(state => state.createEvent);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const handleStartChange = (_event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartTime(selectedDate);
    }
  };

  const handleEndChange = (_event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  };

  const isFormValid = () => {
    if (!name.trim()) return false;
    if (startTime >= endTime) return false;
    if (visibility === 'private' && joinCode.trim().length !== 6) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to create an event');
      return;
    }

    if (!isFormValid()) {
      Alert.alert('Invalid', 'Please fill all fields correctly');
      return;
    }

    setSubmitting(true);
    const palette = COLOR_PRESETS[paletteIndex].palette;

    const success = await createEvent({
      name: name.trim(),
      visibility,
      joinCode: visibility === 'private' ? joinCode.trim() : null,
      startTime,
      endTime,
      hostUid: userId,
      palette,
      assets: [],
    });

    setSubmitting(false);

    if (success) {
      // Navigate to main tabs (will be replaced with EventFeed after implementation)
      navigation.navigate('MainTabs', { screen: 'Home' });
    } else {
      Alert.alert('Error', 'Failed to create event. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className='flex-1 bg-black'
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className='text-2xl font-bold text-white mb-6'>Create New Event</Text>

        {/* Event Name */}
        <Input
          label='Event Name'
          placeholder='e.g. ReactConf 2025'
          value={name}
          onChangeText={setName}
        />

        {/* Visibility Toggle */}
        <Text className='text-white font-medium mb-2'>Visibility</Text>
        <View className='flex-row mb-4'>
          {(['public', 'private'] as EventVisibility[]).map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setVisibility(option)}
              className={`flex-1 py-3 rounded-l-lg justify-center items-center border border-snap-light-gray ${
                visibility === option ? 'bg-snap-yellow' : 'bg-snap-gray'
              } ${option === 'private' ? 'rounded-r-lg ml-2' : ''}`}
            >
              <Text
                className={`font-semibold ${
                  visibility === option ? 'text-snap-dark' : 'text-white'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Join Code (if private) */}
        {visibility === 'private' && (
          <Input
            label='Join Code (6 digits)'
            placeholder='123456'
            value={joinCode}
            onChangeText={setJoinCode}
            keyboardType='numeric'
            maxLength={6}
          />
        )}

        {/* Start & End Time */}
        <Text className='text-white font-medium mb-2'>Start Time</Text>
        <TouchableOpacity
          onPress={() => setShowStartPicker(true)}
          className='bg-snap-gray border border-snap-light-gray rounded-lg px-4 py-3 mb-4'
        >
          <Text className='text-white'>{startTime.toLocaleString()}</Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startTime}
            mode='datetime'
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartChange}
          />
        )}

        <Text className='text-white font-medium mb-2'>End Time</Text>
        <TouchableOpacity
          onPress={() => setShowEndPicker(true)}
          className='bg-snap-gray border border-snap-light-gray rounded-lg px-4 py-3 mb-4'
        >
          <Text className='text-white'>{endTime.toLocaleString()}</Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endTime}
            mode='datetime'
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndChange}
          />
        )}

        {/* Palette Picker */}
        <Text className='text-white font-medium mb-2'>Color Palette</Text>
        <View className='flex-row mb-6'>
          {COLOR_PRESETS.map((preset, index) => (
            <TouchableOpacity
              key={preset.label}
              onPress={() => setPaletteIndex(index)}
              className={`flex-1 px-2 ${index !== 0 ? 'ml-2' : ''}`}
            >
              <View
                className={`rounded-lg border-2 p-4 ${
                  paletteIndex === index ? 'border-snap-yellow' : 'border-transparent'
                }`}
                style={{ backgroundColor: preset.palette.primary }}
              >
                <View
                  className='w-full h-2 rounded'
                  style={{ backgroundColor: preset.palette.accent }}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <Button
          title='Create Event'
          onPress={handleSubmit}
          disabled={!isFormValid() || submitting}
          loading={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EventSetupScreen; 