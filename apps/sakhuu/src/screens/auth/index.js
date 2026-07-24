import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';
import { COLORS } from '../../theme/colors';
import BackButton from '../../components/Navigation/BackButton';

const { width } = Dimensions.get('window');

export default function SignInScreen() {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSignIn = async () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 8) {
      Alert.alert(
        'Утасны дугаа оруулна уу',
        'Хамгийн багадаа 8 орон байх ёстой',
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+976${cleaned}`,
      });

      if (error) {
        Alert.alert('Нэвтрэхэд алдаа гарлаа', error.message);
      } else {
        navigation.navigate('Verification', {
          phoneNumber: `+976${cleaned}`,
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Нэвтрэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackButton />

      <View style={styles.content}>
        <Text style={styles.title}>Нэвтрэх</Text>
        <Text style={styles.subtitle}>
          Монгол морины өв соёлыг хадгалах нийгэмлэгтэй нэгдэцгээе
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Утасны дугаа</Text>
          <View style={styles.phoneInput}>
            <Text style={styles.countryCode}>🇲🇳 +976</Text>
            <TextInput
              style={styles.phoneField}
              placeholder="99112233"
              placeholderTextColor={COLORS.gray[400]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={8}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonLoading]}
            onPress={handlePhoneSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ЭСВЭЛ</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="logo-apple" size={22} color={COLORS.white} />
          <Text style={styles.socialButtonText}>Apple-ээр нэвтрэх</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[400],
    lineHeight: 24,
    marginBottom: 40,
    fontFamily: 'Inter-Regular',
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[300],
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.card,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  countryCode: {
    fontSize: 16,
    color: COLORS.white,
    marginRight: 12,
    fontFamily: 'Inter-Bold',
  },
  phoneField: {
    flex: 1,
    fontSize: 16,
    color: COLORS.white,
    fontFamily: 'Inter-Regular',
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoading: {
    opacity: 0.7,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.dark.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.gray[500],
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[900],
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    gap: 8,
  },
  socialButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
});
