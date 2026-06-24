if (__DEV__) {
  require("./ReactotronConfig");
}
import './ReactotronConfig'; 

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios'; 
import { ScrollView } from 'react-native';

export default function App() {
  const [imagesList, setImagesList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
 
  const onRefresh = () => {
    setRefreshing(true);
    setImagesList([]);
    setRefreshing(false); 
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false, 
      quality: 1,
      base64: true,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset, index) => ({
        id: Date.now().toString() + index, 
        uri: asset.uri,
        base64: asset.base64,
        loading: true,
        products: [], 
        avgOriginal: null, 
        avgDiscounted: null, 
        error: null
      }));

      setImagesList(selectedImages);

      selectedImages.forEach((imgObj) => {
        sendToGeminiWithAxios(imgObj.id, imgObj.base64);
      });
    }
  };

  const sendToGeminiWithAxios = async (id, base64Data) => {
  try {
    const response = await axios.post(
      "https://todo-api-production-62fa.up.railway.app/analyze",
      {
        image: base64Data,
      }
    );

    // Backend-dən (server.js) birbaşa gələn təmiz data
    const data = response.data; 

    // Əgər server.js Gemini-dən gələn text-i birbaşa obyekt kimi yox, 
    // string kimi qaytarırsa, onu obyektə çeviririk
    let parsedData = data;
    if (typeof data === 'string') {
      // Əgər daxildə markdown (```json) qalıbsa təmizləyirik
      let cleanedText = data.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/```json|```/g, "").trim();
      }
      parsedData = JSON.parse(cleanedText);
    }

    // İndi məlumatları yoxlayıb state-ə yazırıq
    if (parsedData && Array.isArray(parsedData.products)) {
      updateImageState(id, {
        products: parsedData.products,
        avgOriginal: parsedData.avg_original
          ? Number(parsedData.avg_original).toFixed(2)
          : "0.00",
        avgDiscounted: parsedData.avg_discounted
          ? Number(parsedData.avg_discounted).toFixed(2)
          : "0.00",
        loading: false,
      });
    } else {
      updateImageState(id, {
        error: "Məlumat düzgün formatda deyil",
        loading: false,
      });
    }
  } catch (error) {
    console.log("Axios Error:", error);
    updateImageState(id, {
      error: "Server bağlantı xətası",
      loading: false,
    });
  }
};

  const updateImageState = (id, updatedFields) => {
    setImagesList(prevList => 
      prevList.map(item => item.id === id ? { ...item, ...updatedFields } : item)
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        refreshControl = {
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} color="#10B981" />
        }
      >
        <Text style={styles.title}>Check Analysis App</Text>

        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>

        {imagesList.map((item) => (
          <View key={item.id} style={styles.imageCard}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            
            {item.loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.loadingText}>Scanning receipt...</Text>
              </View>
            )}

            {item.error && !item.loading && (
              <Text style={styles.errorText}>Error: {item.error}</Text>
            )}

            {!item.loading && item.products.length > 0 && (
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCellCode}>Code</Text>
                  <Text style={styles.headerCellName}>Product</Text>
                  <Text style={styles.headerCellPrice}>Price</Text>
                  <Text style={styles.headerCellDiscount}>D/P</Text>
                </View>
                
                {item.products.map((prod, pIndex) => (
                  <View key={pIndex} style={styles.tableRow}>
                    <Text style={styles.cellCode} numberOfLines={1} adjustsFontSizeToFit>{prod.code}</Text>
                    <Text style={styles.cellName} numberOfLines={1}>{prod.name}</Text>
                    <Text style={styles.cellOriginalPrice}>${prod.original_price}</Text>
                    <Text style={styles.cellDiscountedPrice}>${prod.discounted_price}</Text>
                  </View>
                ))}
                
                <View style={styles.resultContainer}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultText}>Orginial prices avg:</Text>
                    <Text style={styles.resultValueOriginal}>$ {item.avgOriginal}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultText}>Discount price avg:</Text>
                    <Text style={styles.resultValueDiscounted}>$ {item.avgDiscounted}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: { 
    paddingVertical: 50,
    backgroundColor: '#121212', 
    alignItems: 'center', 
    padding: 16,
    flexGrow: 1,
  },
  title: { 
    fontSize: 26, 
    fontWeight: '800', 
    marginBottom: 28, 
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  button: { 
    backgroundColor: '#6366F1', 
    paddingVertical: 16, 
    borderRadius: 12, 
    marginBottom: 30, 
    width: '95%', 
    alignItems: 'center',
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: 0.3
  },
  imageCard: {
    backgroundColor: '#1E1E1E', 
    borderRadius: 16,
    padding: 16,
    marginBottom: 25,
    width: '100%',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderLeftColor: '#6366F1',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 2,
  },
  image: { 
    width: '100%', 
    height: 220, 
    resizeMode: 'contain', 
    borderRadius: 12, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#333333',
    backgroundColor: '#262626'
  },
  loadingContainer: { 
    flexDirection: 'row',
    alignItems: 'center', 
    marginVertical: 20,
    backgroundColor: '#2A2A2A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20
  },
  loadingText: { 
    marginLeft: 10, 
    color: '#E5E7EB', 
    fontSize: 14,
    fontWeight: '500'
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '600',
    marginVertical: 12,
    fontSize: 14
  },
  tableContainer: {
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#2D2D2D',
    paddingBottom: 10,
    marginBottom: 10,
    gap: 10
  },
  headerCellCode: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#9CA3AF', 
    flex: 1,
  },
  headerCellName: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#9CA3AF', 
    flex: 1
  },
  headerCellPrice: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#9CA3AF', 
    flex: 1, 
  },
  headerCellDiscount: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#9CA3AF', 
    flex: 1,   
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
    alignItems: 'center',
    gap: 10,
  },
  cellCode: { 
    fontSize: 13, 
    color: '#6B7280', 
    flex: 1, 
  },
  cellName: { 
    fontSize: 13, 
    color: '#E5E7EB', 
    fontWeight: '500', 
    flex: 1, 
  },
  cellOriginalPrice: { 
    fontSize: 13, 
    flex: 1,  
    color: '#6B7280', 
    textDecorationLine: 'line-through',
  },
  cellDiscountedPrice: { 
    fontSize: 14, 
    flex: 1, 
    color: '#10B981', 
    fontWeight: '700' 
  },
  resultContainer: { 
    marginTop: 20, 
    backgroundColor: '#262626', 
    padding: 16, 
    borderRadius: 12, 
    width: '100%',
    borderWidth: 1,
    borderColor: '#333333'
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6
  },
  resultText: { 
    fontSize: 14, 
    color: '#D1D5DB', 
    fontWeight: '600' 
  },
  resultValueOriginal: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#6B7280', 
  },
  resultValueDiscounted: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#10B981', 
  }
});
