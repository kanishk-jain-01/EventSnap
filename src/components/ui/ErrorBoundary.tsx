import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Here you could log to a crash reporting service like Crashlytics
    // crashlytics().recordError(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View className='flex-1 bg-snap-dark items-center justify-center px-6'>
          <View className='items-center'>
            <Text className='text-6xl mb-4'>😵</Text>
            <Text className='text-white text-xl font-bold text-center mb-2'>
              Oops! Something went wrong
            </Text>
            <Text className='text-gray-400 text-base text-center mb-6 leading-6'>
              We encountered an unexpected error. Don't worry, it's not your
              fault!
            </Text>

            {__DEV__ && this.state.error && (
              <View className='bg-snap-gray rounded-lg p-4 mb-6 w-full'>
                <Text className='text-red-400 text-sm font-mono'>
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <Button
              title='Try Again'
              onPress={this.handleRetry}
              variant='primary'
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
