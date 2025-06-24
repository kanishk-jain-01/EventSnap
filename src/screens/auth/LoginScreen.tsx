import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { validateEmail, validatePassword } from '../../utils/validation';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error, clearError } = useAuth();

  // Clear errors when user starts typing
  useEffect(() => {
    if (emailError) setEmailError('');
  }, [email]);

  useEffect(() => {
    if (passwordError) setPasswordError('');
  }, [password]);

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'Invalid email');
      isValid = false;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || 'Invalid password');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      // Error is handled by the auth store
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert(
        'Email Required',
        'Please enter your email address first, then tap "Forgot Password" again.',
      );
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send password reset email to ${email.trim()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            // TODO: Implement password reset in next task
            Alert.alert(
              'Coming Soon',
              'Password reset will be implemented soon.',
            );
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-snap-dark'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style='light' />
      <ScrollView
        className='flex-1'
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps='handled'
      >
        <View className='flex-1 px-6 pt-20 pb-8'>
          {/* Header */}
          <View className='items-center mb-12'>
            <Text className='text-snap-yellow text-4xl font-bold mb-2'>
              Snapchat
            </Text>
            <Text className='text-white text-lg'>Welcome back!</Text>
          </View>

          {/* Form */}
          <View className='flex-1 justify-center'>
            <Input
              label='Email'
              placeholder='Enter your email'
              value={email}
              onChangeText={setEmail}
              keyboardType='email-address'
              autoCapitalize='none'
              error={emailError}
            />

            <View className='relative'>
              <Input
                label='Password'
                placeholder='Enter your password'
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                error={passwordError}
              />
              <TouchableOpacity
                className='absolute right-4 top-9'
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text className='text-snap-yellow text-sm'>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Auth Error */}
            {error && (
              <View className='bg-snap-red/20 border border-snap-red rounded-lg p-3 mb-4'>
                <Text className='text-snap-red text-sm text-center'>
                  {error}
                </Text>
              </View>
            )}

            {/* Login Button */}
            <Button
              title='Log In'
              onPress={handleLogin}
              loading={isLoading}
              disabled={!email.trim() || !password.trim()}
              size='large'
            />

            {/* Forgot Password */}
            <TouchableOpacity
              className='mt-4'
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text className='text-snap-yellow text-center text-base'>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className='mt-8'>
            <View className='flex-row items-center justify-center'>
              <Text className='text-white text-base'>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity disabled={isLoading}>
                <Text className='text-snap-yellow text-base font-semibold'>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
