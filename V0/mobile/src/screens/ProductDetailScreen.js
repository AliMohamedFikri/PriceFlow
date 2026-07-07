import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  Linking 
} from "react-native";
import { theme } from "../theme";

export default function ProductDetailScreen({ productId, token, onBack }) {
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Alert & Wishlist States
  const [targetPrice, setTargetPrice] = useState("");
  const [alertSuccess, setAlertSuccess] = useState("");
  const [wishlistSuccess, setWishlistSuccess] = useState("");
  const [settingAlert, setSettingAlert] = useState(false);
  const [addingWishlist, setAddingWishlist] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch product details
      const pRes = await fetch(`http://localhost:8000/api/products/${productId}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProduct(pData);
        // Default target price to 5% below minimum current price
        if (pData.prices && pData.prices.length > 0) {
          const minPrice = Math.min(...pData.prices.map(pr => pr.price));
          setTargetPrice(Math.round(minPrice * 0.95).toString());
        }
      }
      
      // 2. Fetch price history
      const hRes = await fetch(`http://localhost:8000/api/products/${productId}/price-history`);
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(hData);
      }
    } catch (err) {
      console.log("Error loading product detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [productId]);

  const handleSetAlert = async () => {
    if (!token) {
      setAlertSuccess("Please log in to set alerts!");
      return;
    }
    
    setSettingAlert(true);
    setAlertSuccess("");
    try {
      const response = await fetch("http://localhost:8000/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          target_price: parseFloat(targetPrice)
        })
      });
      if (response.ok) {
        setAlertSuccess("✓ Price alert activated!");
        setTimeout(() => setAlertSuccess(""), 4000);
      }
    } catch (err) {
      console.log("Alert save error:", err);
    } finally {
      setSettingAlert(false);
    }
  };

  const handleAddWishlist = async () => {
    if (!token) {
      setWishlistSuccess("Please log in first!");
      return;
    }
    
    setAddingWishlist(true);
    setWishlistSuccess("");
    try {
      const response = await fetch("http://localhost:8000/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId })
      });
      if (response.ok) {
        setWishlistSuccess("✓ Added to Wishlist!");
        setTimeout(() => setWishlistSuccess(""), 4000);
      }
    } catch (err) {
      console.log("Wishlist save error:", err);
    } finally {
      setAddingWishlist(false);
    }
  };

  // Determine the absolute cheapest price entry to attach the Emerald ribbon
  const getCheapestPlatform = () => {
    if (!product || !product.prices || product.prices.length === 0) return null;
    let cheapest = product.prices[0];
    for (let pr of product.prices) {
      if (pr.price < cheapest.price) {
        cheapest = pr;
      }
    }
    return cheapest.platform;
  };

  const cheapestPlatform = getCheapestPlatform();

  // Custom coordinate calculation algorithm for rendering SVG chart sparklines
  const renderPriceChart = () => {
    if (history.length < 2) return null;
    
    // Determine bounds
    const allPrices = [];
    history.forEach(pt => {
      Object.keys(pt).forEach(key => {
        if (key !== "date") allPrices.push(pt[key]);
      });
    });
    
    const minVal = Math.min(...allPrices) * 0.98; // add 2% margin below
    const maxVal = Math.max(...allPrices) * 1.02; // add 2% margin above
    const valRange = maxVal - minVal;
    
    const chartWidth = 320;
    const chartHeight = 120;
    
    // Render lines for each available platform in the dataset
    const platforms = ["amazon", "jumia", "noon"].filter(p => history[0][p] !== undefined);
    
    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartYAxis}>
          <Text style={styles.axisLabel}>EGP {Math.round(maxVal).toLocaleString()}</Text>
          <Text style={styles.axisLabel}>EGP {Math.round((maxVal + minVal) / 2).toLocaleString()}</Text>
          <Text style={styles.axisLabel}>EGP {Math.round(minVal).toLocaleString()}</Text>
        </View>
        
        {/* Render standard browser SVG element directly */}
        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ flex: 1 }}>
          <defs>
            {platforms.map(plat => (
              <linearGradient key={plat} id={`grad-${plat}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.colors.platforms[plat]} stopOpacity="0.25" />
                <stop offset="100%" stopColor={theme.colors.platforms[plat]} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>
          
          {/* Grid lines */}
          <line x1="0" y1="10" x2={chartWidth} y2="10" stroke={theme.colors.cardBorder} strokeWidth="1" strokeDasharray="4" />
          <line x1="0" y1="60" x2={chartWidth} y2="60" stroke={theme.colors.cardBorder} strokeWidth="1" strokeDasharray="4" />
          <line x1="0" y1="110" x2={chartWidth} y2="110" stroke={theme.colors.cardBorder} strokeWidth="1" strokeDasharray="4" />
          
          {platforms.map(plat => {
            // Map coordinates
            const points = history.map((pt, idx) => {
              const val = pt[plat] || minVal;
              const x = (idx / (history.length - 1)) * chartWidth;
              const y = chartHeight - ((val - minVal) / valRange) * (chartHeight - 20) - 10;
              return { x, y };
            });
            
            const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
            const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
            
            return (
              <g key={plat}>
                {/* Gradient area */}
                <path d={areaPath} fill={`url(#grad-${plat})`} />
                {/* Stroke line */}
                <path 
                  d={linePath} 
                  stroke={theme.colors.platforms[plat]} 
                  strokeWidth="2.5" 
                  fill="none" 
                />
                {/* End point circle */}
                {points.length > 0 && (
                  <circle 
                    cx={points[points.length - 1].x} 
                    cy={points[points.length - 1].y} 
                    r="4" 
                    fill={theme.colors.platforms[plat]} 
                  />
                )}
              </g>
            );
          })}
        </svg>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.centerText}>Aggregating prices dynamically...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.centerText}>Product could not be loaded.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backLink} onPress={onBack}>
          <Text style={styles.backLinkText}>← BACK TO CATALOG</Text>
        </TouchableOpacity>
      </View>

      {/* Main product display */}
      <View style={styles.detailCard}>
        <View style={styles.imgWrapper}>
          <Image 
            source={{ uri: product.image_url || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300" }} 
            style={styles.productImg}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.productTitle}>{product.title}</Text>
        <View style={styles.attributesRow}>
          {product.brand && (
            <View style={styles.attrBadge}>
              <Text style={styles.attrText}>Brand: {product.brand.toUpperCase()}</Text>
            </View>
          )}
          {product.category && (
            <View style={styles.attrBadge}>
              <Text style={styles.attrText}>Category: {product.category.toUpperCase()}</Text>
            </View>
          )}
        </View>
        
        {/* Wishlist triggers */}
        <TouchableOpacity 
          style={styles.wishlistBtn}
          onPress={handleAddWishlist}
          disabled={addingWishlist}
        >
          <Text style={styles.wishlistBtnText}>
            {addingWishlist ? "BOOKMARKING..." : "❤️ ADD TO WISHLIST"}
          </Text>
        </TouchableOpacity>
        
        {wishlistSuccess ? (
          <Text style={styles.toastText}>{wishlistSuccess}</Text>
        ) : null}
      </View>

      {/* Side-by-Side Comparison Container */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>⚖ Side-by-Side Platform Pricing</Text>
        
        <View style={styles.comparisonTable}>
          {product.prices.map(pr => {
            const isCheapest = pr.platform === cheapestPlatform;
            
            return (
              <View 
                key={pr.id} 
                style={[
                  styles.priceRow,
                  isCheapest && styles.priceRowCheapest
                ]}
              >
                {/* Platform Label with Badge */}
                <View style={styles.platInfoCol}>
                  <View 
                    style={[
                      styles.platColorCircle, 
                      { backgroundColor: theme.colors.platforms[pr.platform] }
                    ]} 
                  />
                  <Text style={styles.platNameText}>
                    {pr.platform.toUpperCase()}
                  </Text>
                  
                  {isCheapest && (
                    <View style={styles.cheapestRibbon}>
                      <Text style={styles.cheapestRibbonText}>BEST DEAL</Text>
                    </View>
                  )}
                </View>

                {/* Price Display */}
                <View style={styles.priceCol}>
                  <Text style={[
                    styles.priceValueText,
                    isCheapest && styles.priceValueTextCheapest
                  ]}>
                    EGP {pr.price.toLocaleString()}
                  </Text>
                </View>

                {/* Action Link Column */}
                <View style={styles.actionCol}>
                  <TouchableOpacity 
                    style={[
                      styles.buyBtn,
                      { backgroundColor: theme.colors.platforms[pr.platform] }
                    ]}
                    onPress={() => Linking.openURL(pr.source_url)}
                  >
                    <Text style={styles.buyBtnText}>BUY ↗</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Dynamic Price History Chart */}
      {history && history.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📈 14-Day Price History Trends</Text>
          <View style={styles.chartKeyRow}>
            {Object.keys(history[0]).filter(k => k !== "date").map(plat => (
              <View key={plat} style={styles.chartKeyItem}>
                <View style={[styles.keyDot, { backgroundColor: theme.colors.platforms[plat] }]} />
                <Text style={styles.keyText}>{plat.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          {renderPriceChart()}
        </View>
      )}

      {/* Set Price Drop Alert Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🔔 Configure Price Drop Alert</Text>
        <Text style={styles.alertDescription}>
          Specify your threshold price and we will alert you immediately via notifications when any platform drops below it.
        </Text>
        
        <View style={styles.alertInputRow}>
          <Text style={styles.alertCurrency}>EGP</Text>
          <TextInput
            style={styles.alertInput}
            value={targetPrice}
            onChangeText={setTargetPrice}
            keyboardType="numeric"
            placeholder="Target price..."
            placeholderTextColor={theme.colors.textMuted}
          />
          <TouchableOpacity 
            style={styles.alertSetBtn}
            onPress={handleSetAlert}
            disabled={settingAlert}
          >
            <Text style={styles.alertSetBtnText}>
              {settingAlert ? "SAVING..." : "SET ALERT"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {alertSuccess ? (
          <Text style={styles.toastText}>{alertSuccess}</Text>
        ) : null}
      </View>
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
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  centerText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    marginBottom: theme.spacing.md,
  },
  backBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  backBtnText: {
    color: "#FFF",
    fontWeight: "700",
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.cardBg,
    borderBottomColor: theme.colors.cardBorder,
    borderBottomWidth: 1,
  },
  backLink: {
    paddingVertical: 4,
  },
  backLinkText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  detailCard: {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderBottomWidth: 1,
    padding: theme.spacing.lg,
    alignItems: "center",
    ...theme.shadows.premium,
  },
  imgWrapper: {
    backgroundColor: "#FFF",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: "100%",
    maxWidth: 240,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  productImg: {
    width: "100%",
    height: "100%",
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
    lineHeight: 28,
  },
  attributesRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.md,
  },
  attrBadge: {
    backgroundColor: "#0F1420",
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attrText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },
  wishlistBtn: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    width: "100%",
    maxWidth: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  wishlistBtnText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  toastText: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: "600",
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    ...theme.shadows.premium,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  comparisonTable: {
    gap: theme.spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0F1420",
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  priceRowCheapest: {
    borderColor: theme.colors.success,
    backgroundColor: "rgba(16, 185, 129, 0.05)",
  },
  platInfoCol: {
    flexDirection: "row",
    alignItems: "center",
    width: "45%",
    flexWrap: "wrap",
    gap: 6,
  },
  platColorCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  platNameText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  cheapestRibbon: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cheapestRibbonText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
  },
  priceCol: {
    width: "35%",
    alignItems: "flex-end",
  },
  priceValueText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: "700",
  },
  priceValueTextCheapest: {
    color: theme.colors.success,
    fontSize: 16,
    fontWeight: "800",
  },
  actionCol: {
    width: "20%",
    alignItems: "flex-end",
  },
  buyBtn: {
    borderRadius: theme.borderRadius.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  buyBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
  },
  chartKeyRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  chartKeyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  keyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  keyText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },
  chartWrapper: {
    flexDirection: "row",
    height: 120,
    alignItems: "stretch",
    marginTop: theme.spacing.sm,
  },
  chartYAxis: {
    justifyContent: "space-between",
    paddingRight: 8,
    borderRightColor: theme.colors.cardBorder,
    borderRightWidth: 1,
    height: "100%",
  },
  axisLabel: {
    color: theme.colors.textMuted,
    fontSize: 9,
    fontWeight: "600",
  },
  alertDescription: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  alertInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F1420",
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  alertCurrency: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    marginRight: theme.spacing.xs,
  },
  alertInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  alertSetBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  alertSetBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 12,
  }
});
