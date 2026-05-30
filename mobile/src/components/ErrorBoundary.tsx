import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary — catches unhandled JS errors and shows a fallback UI.
 * Class component is required because React doesn't have a hook equivalent for error boundaries.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😵</Text>
          <Text style={styles.title}>Algo deu errado</Text>
          <Text style={styles.message}>
            Ocorreu um erro inesperado. Tente recarregar o aplicativo.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.debug}>{this.state.error.message}</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleReload}>
            <Text style={styles.buttonText}>Recarregar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundApp,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: theme.onSurface, marginBottom: 8 },
  message: { fontSize: 15, color: theme.onSurfaceVariant, textAlign: 'center', marginBottom: 24 },
  debug: { fontSize: 12, color: theme.error, textAlign: 'center', marginBottom: 16, fontFamily: 'monospace' },
  button: {
    backgroundColor: theme.primaryContainer,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: { fontSize: 15, fontWeight: '600', color: theme.onPrimary },
}));
