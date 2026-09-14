import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

function registrationRules(email: string, password: string, confirmPassword: string) {
  const normalizedEmail = normalizeEmail(email);
  const localPart = normalizedEmail.split("@")[0] ?? "";
  return [
    { label: "Valid email address", ok: /^\S+@\S+\.\S+$/.test(normalizedEmail) },
    { label: "At least 12 characters", ok: password.length >= 12 },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(password) },
    {
      label: "Password does not contain your email name",
      ok: !localPart || localPart.length < 4 || !password.toLowerCase().includes(localPart),
    },
    { label: "Passwords match", ok: password.length > 0 && password === confirmPassword },
  ];
}

export default function Register() {
  const auth = useAuth();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const destination = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/my-space";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rules = useMemo(
    () => registrationRules(email, password, confirmPassword),
    [email, password, confirmPassword]
  );
  const formValid = rules.every((rule) => rule.ok);

  const submit = async () => {
    const normalizedEmail = normalizeEmail(email);
    const failedRules = registrationRules(normalizedEmail, password, confirmPassword).filter((rule) => !rule.ok);
    if (failedRules.length) {
      setError(`Please fix: ${failedRules.map((rule) => rule.label).join(", ")}.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await auth.register(normalizedEmail, password);
      router.replace({ pathname: "/verify-email", params: { email: normalizedEmail, message: result.message ?? "", next: destination } } as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to register");
    } finally {
      setBusy(false);
    }
  };

  const passwordField = (value: string, onChangeText: (v: string) => void, placeholder: string) => (
    <View style={s.passwordRow}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        placeholder={placeholder}
        style={s.passwordInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable onPress={() => setShowPassword((v) => !v)} style={s.eye} accessibilityLabel="Show or hide password">
        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color="#475569" />
      </Pressable>
    </View>
  );

  return (
    <>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <SafeAreaView style={s.screen}>
        <View style={s.card}>
          <Text style={s.brand}>Yaposan</Text>
          <Text style={s.title}>Create your free account</Text>
          <Text style={s.copy}>Create your account, verify your email, then sign in and create your AI Page.</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            onBlur={() => setEmail((value) => normalizeEmail(value))}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email address"
            style={s.input}
          />
          {passwordField(password, setPassword, "Strong password")}
          {passwordField(confirmPassword, setConfirmPassword, "Confirm new password")}
          <View style={s.rules}>
            {rules.map((rule) => (
              <Text key={rule.label} style={rule.ok ? s.ruleOk : s.rulePending}>
                {rule.ok ? "✓" : "○"} {rule.label}
              </Text>
            ))}
          </View>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Pressable onPress={() => void submit()} disabled={busy || !formValid} style={[s.button, (busy || !formValid) && s.buttonDisabled]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Create Free Account</Text>}
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: "/sign-in", params: { next: destination } } as never)}><Text style={s.link}>Already have an account? Sign in</Text></Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#061321", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 460, backgroundColor: "#fff", padding: 28, borderRadius: 22 },
  brand: { fontSize: 18, fontWeight: "900", color: "#0f766e" },
  title: { fontSize: 30, fontWeight: "900", color: "#0f172a", marginTop: 10 },
  copy: { color: "#475569", marginTop: 8, lineHeight: 21 },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, marginTop: 14 },
  passwordRow: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, marginTop: 14, flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, padding: 14 },
  eye: { padding: 14 },
  rules: { marginTop: 10, gap: 3 },
  ruleOk: { fontSize: 12, color: "#047857", fontWeight: "700" },
  rulePending: { fontSize: 12, color: "#64748b" },
  error: { color: "#b91c1c", fontWeight: "700", marginTop: 10, lineHeight: 19 },
  button: { backgroundColor: "#6d28d9", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 18 },
  buttonDisabled: { opacity: 0.48 },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  link: { textAlign: "center", color: "#5b21b6", fontWeight: "800", marginTop: 18 },
});
