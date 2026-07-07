import React, { useState, useEffect } from "react";
import { StatusBar, SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { theme } from "./src/theme";
import AuthScreens from "./src/screens/AuthScreens";
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";

const SCREENS = { AUTH: "AUTH", HOME: "HOME", SEARCH: "SEARCH", PRODUCT_DETAIL: "PRODUCT_DETAIL" };

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.AUTH);
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (token) setCurrentScreen(SCREENS.HOME);
  }, [token]);

  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    setCurrentScreen(SCREENS.PRODUCT_DETAIL);
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setCurrentScreen(SCREENS.SEARCH);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.AUTH:
        return <AuthScreens onLoginSuccess={(t, email) => { setToken(t); setUserEmail(email); }} />;

      case SCREENS.HOME:
        return (
          <HomeScreen
            onSelectProduct={handleSelectProduct}
            onSelectCategory={handleSelectCategory}
          />
        );

      case SCREENS.SEARCH:
        return (
          <SearchScreen
            initialCategory={selectedCategory}
            onSelectProduct={handleSelectProduct}
          />
        );

      case SCREENS.PRODUCT_DETAIL:
        return (
          <ProductDetailScreen
            productId={selectedProductId}
            token={token}
            onBack={() => setCurrentScreen(SCREENS.HOME)}
          />
        );

      default:
        return <AuthScreens onLoginSuccess={(t, email) => { setToken(t); setUserEmail(email); }} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Top Navigation Bar - hidden on auth screen */}
      {currentScreen !== SCREENS.AUTH && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setCurrentScreen(SCREENS.HOME)}>
            <Text style={styles.logo}>PriceFlow</Text>
          </TouchableOpacity>

          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, currentScreen === SCREENS.HOME && styles.navBtnActive]}
              onPress={() => setCurrentScreen(SCREENS.HOME)}
            >
              <Text style={[styles.navBtnText, currentScreen === SCREENS.HOME && styles.navBtnTextActive]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, currentScreen === SCREENS.SEARCH && styles.navBtnActive]}
              onPress={() => { setSelectedCategory(null); setCurrentScreen(SCREENS.SEARCH); }}
            >
              <Text style={[styles.navBtnText, currentScreen === SCREENS.SEARCH && styles.navBtnTextActive]}>Search</Text>
            </TouchableOpacity>

            {token && (
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => { setToken(null); setCurrentScreen(SCREENS.AUTH); }}
              >
                <Text style={styles.navBtnText}>Logout</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.cardBg,
    borderBottomColor: theme.colors.cardBorder,
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  navRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  navBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  navBtnActive: {
    backgroundColor: theme.colors.primary + "20",
  },
  navBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  navBtnTextActive: {
    color: theme.colors.primary,
  },
  screenContainer: {
    flex: 1,
  },
});
