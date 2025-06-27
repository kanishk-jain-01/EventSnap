import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      // Error is handled by the auth store
    }
  };

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-bg-primary'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style='dark' />
      <ScrollView
        className='flex-1'
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps='handled'
      >
        <View className='flex-1 px-6 pt-8 pb-8'>
          {/* Centered Content Container */}
          <View className='flex-1 justify-center'>
            {/* Header */}
            <View className='items-center mb-8'>
              <Text className='text-primary text-4xl font-bold mb-2'>
                EventSnap
              </Text>
              <Text className='text-text-primary text-lg'>Welcome back!</Text>
            </View>

            {/* Form */}
            <View>
              <Input
                label='Email'
                placeholder='Enter your email'
                value={email}
                onChangeText={setEmail}
                keyboardType='email-address'
                autoCapitalize='none'
              />

              <View className='relative'>
                <View className='pr-16'>
                  <Input
                    label='Password'
                    placeholder='Enter your password'
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
                <TouchableOpacity
                  className='absolute right-3'
                  style={{ top: 42 }}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text className='text-primary text-sm font-medium'>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Auth Error */}
              {error && (
                <View className='bg-error/10 border border-error rounded-lg p-4 mb-4'>
                  <Text className='text-error text-base text-center font-medium'>
                    {error}
                  </Text>
                </View>
              )}

              {/* Login Button */}
              <Button
                title='Login'
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
              />

              {/* Register Link */}
              <View className='items-center mt-6'>
                <Text className='text-text-secondary text-center text-base'>
                  Don't have an account?{' '}
                  <Text
                    className='text-primary text-base font-semibold'
                    onPress={() => navigation.navigate('Register')}
                  >
                    Sign up
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
