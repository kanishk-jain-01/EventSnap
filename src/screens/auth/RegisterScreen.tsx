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
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  validateEmail,
  validatePassword,
  validateDisplayName,
} from '../../utils/validation';
import { AuthStackParamList } from '../../types';

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

    // Validate display name
    const displayNameValidation = validateDisplayName(displayName);
    if (!displayNameValidation.isValid) {
      setDisplayNameError(
        displayNameValidation.error || 'Invalid display name',
      );
      isValid = false;
    }

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

    // Validate password confirmation
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
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
          <View className='items-center mb-8'>
            <Text className='text-snap-yellow text-4xl font-bold mb-2'>
              Snapchat
            </Text>
            <Text className='text-white text-lg'>Create your account</Text>
          </View>

          {/* Form */}
          <View className='flex-1 justify-center'>
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
              <Input
                label='Password'
                placeholder='Enter your password (min 6 characters)'
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

            <View className='relative'>
              <Input
                label='Confirm Password'
                placeholder='Confirm your password'
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                error={confirmPasswordError}
              />
              <TouchableOpacity
                className='absolute right-4 top-9'
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text className='text-snap-yellow text-sm'>
                  {showConfirmPassword ? 'Hide' : 'Show'}
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

            {/* Register Button */}
            <Button
              title='Create Account'
              onPress={handleRegister}
              loading={isLoading}
              disabled={!isFormValid()}
              size='large'
            />

            {/* Terms and Privacy */}
            <View className='mt-4 px-4'>
              <Text className='text-gray-400 text-xs text-center leading-4'>
                By creating an account, you agree to our Terms of Service and
                Privacy Policy. This is a demo app for internal testing only.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View className='mt-8'>
            <View className='flex-row items-center justify-center'>
              <Text className='text-white text-base'>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity
                disabled={isLoading}
                onPress={() => navigation.navigate('Login')}
              >
                <Text className='text-snap-yellow text-base font-semibold'>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
