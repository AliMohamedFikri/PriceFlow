import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator 
} from "react-native";
import { theme } from "../theme";

export default function SearchScreen({ initialCategory = null, onSelectProduct }) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtering States
  const [selectedBrand, setSelectedBrand] = useState(initialCategory || null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [sortBy, setSortBy] = useState("best"); // 'best', 'price_asc', 'savings'

  const executeSearch = async () => {
    setLoading(true);
    try {
      let url = "http://localhost:8000/api/products?";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (selectedBrand) url += `brand=${selectedBrand}&`;
      if (selectedPlatform) url += `platform=${selectedPlatform}&`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (err) {
      console.log("Search API error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [search, selectedBrand, selectedPlatform]);

  // Apply sorting clientside on the matched product list
  const getSortedProducts = () => {
    let list = [...products];
    if (sortBy === "price_asc") {
      list.sort((a, b) => {
        const pA = a.prices.length > 0 ? Math.min(...a.prices.map(p => p.price)) : 0;
        const pB = b.prices.length > 0 ? Math.min(...b.prices.map(p => p.price)) : 0;
        return pA - pB;
      });
    } else if (sortBy === "savings") {
      list.sort((a, b) => {
        const deltaA = a.prices.length > 1 ? Math.max(...a.prices.map(p => p.price)) - Math.min(...a.prices.map(p => p.price)) : 0;
        const deltaB = b.prices.length > 1 ? Math.max(...b.prices.map(p => p.price)) - Math.min(...b.prices.map(p => p.price)) : 0;
        return deltaB - deltaA;
      });
    }
    return list;
  };

  const sortedProducts = getSortedProducts();

  return (
    <View style={styles.container}>
      {/* Search Input Box */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, brands, models..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Row */}
      <View style={styles.filtersWrapper}>
        {/* Brand/Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Text style={styles.filterLabel}>BRAND:</Text>
          <TouchableOpacity 
            style={[styles.pill, !selectedBrand && styles.pillActive]}
            onPress={() => setSelectedBrand(null)}
          >
            <Text style={[styles.pillText, !selectedBrand && styles.pillTextActive]}>All</Text>
          </TouchableOpacity>
          {["lenovo", "asus", "xiaomi", "samsung", "sandisk", "deli", "shein"].map(brand => (
            <TouchableOpacity 
              key={brand}
              style={[styles.pill, selectedBrand === brand && styles.pillActive]}
              onPress={() => setSelectedBrand(brand)}
            >
              <Text style={[styles.pillText, selectedBrand === brand && styles.pillTextActive]}>
                {brand.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Platform Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Text style={styles.filterLabel}>PLATFORM:</Text>
          <TouchableOpacity 
            style={[styles.pill, !selectedPlatform && styles.pillActive]}
            onPress={() => setSelectedPlatform(null)}
          >
            <Text style={[styles.pillText, !selectedPlatform && styles.pillTextActive]}>All</Text>
          </TouchableOpacity>
          {["amazon", "jumia", "noon"].map(plat => (
            <TouchableOpacity 
              key={plat}
              style={[
                styles.pill, 
                selectedPlatform === plat && styles.pillActive,
                selectedPlatform === plat && { borderColor: theme.colors.platforms[plat], backgroundColor: theme.colors.platforms[plat] + "20" }
              ]}
              onPress={() => setSelectedPlatform(plat)}
            >
              <Text style={[
                styles.pillText, 
                selectedPlatform === plat && { color: theme.colors.platforms[plat] }
              ]}>
                {plat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sorting Pills */}
        <View style={styles.sortContainer}>
          <Text style={styles.filterLabel}>SORT BY:</Text>
          <View style={styles.sortButtonRow}>
            {[
              { id: "best", label: "Best Match" },
              { id: "price_asc", label: "Lowest Price" },
              { id: "savings", label: "Highest Savings" }
            ].map(opt => (
              <TouchableOpacity 
                key={opt.id}
                style={[styles.sortPill, sortBy === opt.id && styles.sortPillActive]}
                onPress={() => setSortBy(opt.id)}
              >
                <Text style={[styles.sortPillText, sortBy === opt.id && styles.sortPillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
          {sortedProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matching products found.</Text>
              <Text style={styles.emptySubtext}>Try tweaking your keywords or category filters.</Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {sortedProducts.map(prod => {
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
                    
                    <View style={styles.platformIconRow}>
                      {prod.prices.map(pr => (
                        <View 
                          key={pr.id} 
                          style={[
                            styles.platformBadge, 
                            { backgroundColor: theme.colors.platforms[pr.platform] }
                          ]}
                        >
                          <Text style={styles.platformBadgeText}>{pr.platform[0].toUpperCase()}</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.prodPrice}>
                      From <Text style={styles.prodPriceAccent}>EGP {minPrice.toLocaleString()}</Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchBarContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.cardBg,
    borderBottomColor: theme.colors.cardBorder,
    borderBottomWidth: 1,
  },
  searchInput: {
    backgroundColor: "#0F1420",
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  filtersWrapper: {
    backgroundColor: theme.colors.cardBg,
    borderBottomColor: theme.colors.cardBorder,
    borderBottomWidth: 1,
    paddingVertical: theme.spacing.xs,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    marginVertical: 4,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textMuted,
    alignSelf: "center",
    marginRight: theme.spacing.sm,
    letterSpacing: 1,
  },
  pill: {
    backgroundColor: "transparent",
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 6,
  },
  pillActive: {
    backgroundColor: theme.colors.primary + "15",
    borderColor: theme.colors.primary,
  },
  pillText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  pillTextActive: {
    color: theme.colors.primary,
  },
  sortContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    marginVertical: 4,
    alignItems: "center",
  },
  sortButtonRow: {
    flexDirection: "row",
    gap: 6,
  },
  sortPill: {
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sortPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sortPillText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  sortPillTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    paddingVertical: 100,
    alignItems: "center",
  },
  emptyText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    color: theme.colors.textMuted,
    fontSize: 13,
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
  platformIconRow: {
    flexDirection: "row",
    gap: 4,
    marginVertical: 6,
  },
  platformBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  platformBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  prodPrice: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  prodPriceAccent: {
    color: theme.colors.success,
    fontWeight: "800",
  }
});
