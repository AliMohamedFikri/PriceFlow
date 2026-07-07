import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions 
} from "react-native";
import { theme } from "../theme";

const { width } = Dimensions.get("window");

export default function HomeScreen({ onSelectProduct, onSelectCategory }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (err) {
      console.log("Error loading dashboard catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const triggerScraper = async () => {
    setScraping(true);
    setSuccessMsg("");
    try {
      const response = await fetch("http://localhost:8000/api/scraper/trigger?local_mode=true", {
        method: "POST"
      });
      if (response.ok) {
        setSuccessMsg("Catalog updated successfully!");
        fetchDashboardData();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.log("Error running scraper:", err);
    } finally {
      setScraping(false);
    }
  };

  // Dynamically calculate "Top Deals" based on largest price delta across platforms
  const getTopDeals = () => {
    return products
      .map(p => {
        if (!p.prices || p.prices.length < 2) return null;
        const pricesList = p.prices.map(pr => pr.price);
        const minPrice = Math.min(...pricesList);
        const maxPrice = Math.max(...pricesList);
        const delta = maxPrice - minPrice;
        const percentage = Math.round((delta / maxPrice) * 100);
        return { ...p, minPrice, maxPrice, delta, percentage };
      })
      .filter(p => p !== null && p.delta > 50)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  };

  const topDeals = getTopDeals();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Dynamic Header */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>PriceFlow</Text>
        <Text style={styles.heroSubtitle}>
          Aggregation & real-time side-by-side comparison across major platforms.
        </Text>
        
        {/* Scraper Trigger Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.scraperBtn, scraping && styles.scraperBtnDisabled]} 
            onPress={triggerScraper}
            disabled={scraping}
          >
            {scraping ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.scraperBtnText}>🔄 RE-INDEX CATALOG</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {successMsg ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ {successMsg}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Ingesting matching catalog products...</Text>
        </View>
      ) : (
        <>
          {/* Top Deals Horizontal Scroller */}
          {topDeals && topDeals.length > 0 ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>🔥 Highest Savings Deals</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContainer}
              >
                {topDeals.map(deal => (
                  <TouchableOpacity 
                    key={deal.id} 
                    style={styles.dealCard}
                    onPress={() => onSelectProduct(deal.id)}
                  >
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>SAVE {deal.percentage}%</Text>
                    </View>
                    <Image 
                      source={{ uri: deal.image_url || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200" }} 
                      style={styles.dealImg}
                      resizeMode="contain"
                    />
                    <Text style={styles.dealName} numberOfLines={2}>{deal.title}</Text>
                    <View style={styles.dealPricingRow}>
                      <Text style={styles.dealMinPrice}>EGP {deal.minPrice.toLocaleString()}</Text>
                      <Text style={styles.dealMaxPrice}>EGP {deal.maxPrice.toLocaleString()}</Text>
                    </View>
                    <Text style={styles.dealCompareLabel}>
                      Compare {deal.prices.length} platforms
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Category Quick Grids */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📦 Browse Categories</Text>
            <View style={styles.categoryGrid}>
              {[
                { name: "Laptops", label: "💻 Laptops", category: "lenovo" }, // we seed brands as category
                { name: "Tablets", label: "📱 Tablets", category: "xiaomi" },
                { name: "Storage", label: "💾 Storage", category: "sandisk" },
                { name: "Accessories", label: "🔌 Accessories", category: "generic" }
              ].map(cat => (
                <TouchableOpacity 
                  key={cat.name} 
                  style={styles.categoryCard}
                  onPress={() => onSelectCategory(cat.category)}
                >
                  <Text style={styles.categoryCardText}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Products Grid */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>✨ Featured Listings</Text>
            <View style={styles.productGrid}>
              {products.slice(0, 8).map(prod => {
                const pricesList = prod.prices.map(p => p.price);
                const minPrice = pricesList.length > 0 ? Math.min(...pricesList) : 0;
                
                return (
                  <TouchableOpacity 
                    key={prod.id} 
                    style={styles.productCard}
                    onPress={() => onSelectProduct(prod.id)}
                  >
                    <Image 
                      source={{ uri: prod.image_url || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200" }} 
                      style={styles.prodImg}
                      resizeMode="contain"
                    />
                    <Text style={styles.prodName} numberOfLines={2}>{prod.title}</Text>
                    <Text style={styles.prodPrice}>
                      From <Text style={styles.prodPriceAccent}>EGP {minPrice.toLocaleString()}</Text>
                    </Text>
                    <Text style={styles.prodPlatformCount}>
                      Available on {prod.prices.length} platforms
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  heroSection: {
    backgroundColor: theme.colors.cardBg,
    borderBottomColor: theme.colors.cardBorder,
    borderBottomWidth: 1,
    padding: theme.spacing.lg,
    alignItems: "center",
    ...theme.shadows.premium,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: theme.colors.textPrimary,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    maxWidth: 500,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  scraperBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.premium,
  },
  scraperBtnDisabled: {
    backgroundColor: theme.colors.cardBorder,
  },
  scraperBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  successBanner: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: theme.colors.success,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  successText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: "600",
  },
  loaderContainer: {
    paddingVertical: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: theme.spacing.md,
  },
  sectionContainer: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    letterSpacing: 0.5,
  },
  carouselContainer: {
    paddingRight: theme.spacing.md,
    gap: theme.spacing.md,
  },
  dealCard: {
    width: 200,
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    position: "relative",
  },
  discountBadge: {
    position: "absolute",
    top: theme.spacing.xs,
    left: theme.spacing.xs,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 3,
    zIndex: 10,
  },
  discountText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  dealImg: {
    height: 110,
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  dealName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    height: 36,
    lineHeight: 18,
  },
  dealPricingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  dealMinPrice: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: "800",
  },
  dealMaxPrice: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  dealCompareLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: theme.spacing.xs,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  categoryCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCardText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  prodImg: {
    height: 120,
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  prodName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    height: 36,
    lineHeight: 18,
  },
  prodPrice: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  prodPriceAccent: {
    color: theme.colors.success,
    fontWeight: "800",
  },
  prodPlatformCount: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  }
});
