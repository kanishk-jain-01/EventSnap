import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

type RegisterScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Register'
>;

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  navigation,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [displayNameError, setDisplayNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, isLoading, error, clearError } = useAuth();

  // Clear field errors when user starts typing
  useEffect(() => {
    if (displayNameError) setDisplayNameError('');
  }, [displayName]);

  useEffect(() => {
    if (emailError) setEmailError('');
  }, [email]);

  useEffect(() => {
    if (passwordError) setPasswordError('');
  }, [password]);

  useEffect(() => {
    if (confirmPasswordError) setConfirmPasswordError('');
  }, [confirmPassword]);

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setDisplayNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate display name
    if (!displayName.trim()) {
      setDisplayNameError('Display name is required');
      isValid = false;
    } else if (displayName.trim().length < 2) {
      setDisplayNameError('Display name must be at least 2 characters');
      isValid = false;
    } else if (displayName.trim().length > 30) {
      setDisplayNameError('Display name must be less than 30 characters');
      isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    // Validate password confirmation
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register(email.trim().toLowerCase(), password, displayName.trim());
    } catch {
      // Error is handled by the auth store
    }
  };

  const isFormValid = () => {
    return (
      displayName.trim().length >= 2 &&
      email.trim().length > 0 &&
      password.trim().length >= 6 &&
      confirmPassword.trim().length > 0
    );
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
              <Text className='text-text-primary text-lg'>
                Create your account
              </Text>
            </View>

            {/* Form */}
            <View>
              <Input
                label='Display Name'
                placeholder='Enter your display name'
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize='words'
                error={displayNameError}
                maxLength={50}
              />

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
                <View className='pr-16'>
                  <Input
                    label='Password'
                    placeholder='Enter your password (min 6 characters)'
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    error={passwordError}
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

              <View className='relative'>
                <View className='pr-16'>
                  <Input
                    label='Confirm Password'
                    placeholder='Confirm your password'
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    error={confirmPasswordError}
                  />
                </View>
                <TouchableOpacity
                  className='absolute right-3'
                  style={{ top: 42 }}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text className='text-primary text-sm font-medium'>
                    {showConfirmPassword ? 'Hide' : 'Show'}
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

              {/* Register Button */}
              <Button
                title='Create Account'
                onPress={handleRegister}
                loading={isLoading}
                disabled={!isFormValid()}
              />

              {/* Terms and Privacy */}
              <View className='mt-4 px-4'>
                <Text className='text-text-tertiary text-xs text-center leading-4'>
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy. This is a demo app for internal testing only.
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View className='mt-8'>
              <View className='flex-row items-center justify-center'>
                <Text className='text-text-secondary text-base'>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity
                  disabled={isLoading}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text className='text-primary text-base font-semibold'>
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
