import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { theme } from "../theme";

export default function AuthScreens({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");
    
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      // We point to our local API host. On standard emulators/expo web, http://localhost:8000 is perfect.
      const url = `http://localhost:8000${endpoint}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const resData = await response.json();
      
      if (!response.ok) {
        throw new Error(resData.detail || "Authentication failed.");
      }
      
      if (isLogin) {
        onLoginSuccess(resData.access_token, email);
      } else {
        // Automatically switch to login on registration success
        setIsLogin(true);
        setErrorMsg("Account registered! Please log in.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Network error. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.glassCard}>
        <Text style={styles.brandTitle}>PriceFlow</Text>
        <Text style={styles.brandSubtitle}>
          {isLogin ? "Log in to your comparison vault" : "Create a new price-tracking account"}
        </Text>
        
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="test@example.com"
            placeholderTextColor={theme.colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="password123"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>{isLogin ? "LOG IN" : "SIGN UP"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toggleBtn} 
          onPress={() => {
            setIsLogin(!isLogin);
            setErrorMsg("");
          }}
        >
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  glassCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.premium,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: theme.colors.danger,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#0F1420",
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    ...theme.shadows.premium,
  },
  submitBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 1,
  },
  toggleBtn: {
    marginTop: theme.spacing.md,
    alignItems: "center",
  },
  toggleText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  }
});
