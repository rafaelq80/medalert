import React from 'react'
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	ActivityIndicator,
} from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { AuthStackParamList } from '../../navigation/AppNavigator'
import { FormInput } from '../../components/FormInput'
import { Toast } from '../../components/Toast'
import { useLogin } from '../../hooks/useLogin'

type LoginNavigationProp = NativeStackNavigationProp<
	AuthStackParamList,
	'Login'
>

export function LoginScreen() {
	const navigation = useNavigation<LoginNavigationProp>()
	const { control, handleSubmit, loading, error, clearError, onSubmit } =
		useLogin()

	return (
		<View style={styles.container}>
			<Toast
				visible={!!error}
				message={error ?? ''}
				type="error"
				onDismiss={clearError}
			/>
			<View style={styles.header}>
				<Image
					source={require('../../../assets/images/logo.png')}
					style={styles.logo}
					resizeMode="contain"
					accessibilityLabel="Logo MedAlert"
				/>
				<Text style={styles.subtitle}>
					Controle de medicamentos
				</Text>
			</View>

			<View style={styles.form}>
				<FormInput
					control={control}
					name="email"
					label="E-mail"
					placeholder="seu@email.com"
					keyboardType="email-address"
					autoCapitalize="none"
				/>

				<FormInput
					control={control}
					name="senha"
					label="Senha"
					placeholder="Sua senha"
					secureTextEntry
					autoCapitalize="none"
				/>

				<TouchableOpacity
					style={[
						styles.button,
						loading && styles.buttonDisabled,
					]}
					onPress={handleSubmit(onSubmit)}
					disabled={loading}
					accessibilityLabel="Entrar"
					accessibilityRole="button"
				>
					{loading ? (
						<ActivityIndicator
							color={
								styles.onPrimaryColor
									.color
							}
						/>
					) : (
						<Text style={styles.buttonText}>
							Entrar
						</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.registerLink}
					onPress={() =>
						navigation.navigate('Register')
					}
					accessibilityLabel="Criar conta"
					accessibilityRole="button"
				>
					<Text style={styles.registerText}>
						Não tem conta? Cadastre-se
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.backgroundApp,
		paddingHorizontal: 20,
		justifyContent: 'center',
	},
	header: {
		alignItems: 'center',
		marginBottom: 40,
	},
	logo: {
		width: 160,
		height: 160,
		marginBottom: 16,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: '400',
		lineHeight: 20,
		color: theme.onSurfaceVariant,
		marginTop: 8,
	},
	form: {
		gap: 16,
	},
	button: {
		backgroundColor: theme.primaryContainer,
		borderRadius: 8,
		minHeight: 48,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 8,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		fontSize: 14,
		fontWeight: '600',
		lineHeight: 20,
		color: theme.onPrimary,
	},
	registerLink: {
		alignItems: 'center',
		minHeight: 48,
		justifyContent: 'center',
	},
	registerText: {
		fontSize: 14,
		fontWeight: '400',
		lineHeight: 20,
		color: theme.primaryContainer,
	},
	onPrimaryColor: {
		color: theme.onPrimary,
	},
}))
