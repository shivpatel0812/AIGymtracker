import React, { useState } from "react";
import { View, Image, StyleSheet, Platform } from "react-native";
import { Text, Button, TextInput, Card, useTheme } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { uploadFoodImageAsync, saveFoodEntry } from "../services/food";

export const FoodLogScreen: React.FC = () => {
  const theme = useTheme();
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
  };

  const pickImage = async () => {
    await requestPermissions();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    await requestPermissions();
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!localImageUri) return;
    setIsSaving(true);
    try {
      const { url, path } = await uploadFoodImageAsync(localImageUri);
      const createdAtISO = new Date().toISOString();
      await saveFoodEntry({
        createdAtISO,
        imageUrl: url,
        imageStoragePath: path,
        description: description.trim() || null,
        macros: {
          calories: calories ? Number(calories) : null,
          protein: protein ? Number(protein) : null,
          carbs: carbs ? Number(carbs) : null,
          fat: fat ? Number(fat) : null,
        },
      });
      // reset form
      setLocalImageUri(null);
      setDescription("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
    } catch (e) {
      console.error("Failed to save food entry", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Food Photo
          </Text>
          {localImageUri ? (
            <Image source={{ uri: localImageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder} />
          )}
          <View style={styles.row}>
            <Button
              mode="outlined"
              icon="camera"
              onPress={takePhoto}
              style={styles.button}
            >
              Take Photo
            </Button>
            <Button
              mode="outlined"
              icon="image"
              onPress={pickImage}
              style={styles.button}
            >
              Upload
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Macros
          </Text>
          <TextInput
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
          />
          <View style={styles.row}>
            <TextInput
              label="Calories"
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              mode="outlined"
              style={styles.inputHalf}
            />
            <TextInput
              label="Protein (g)"
              value={protein}
              onChangeText={setProtein}
              keyboardType="numeric"
              mode="outlined"
              style={styles.inputHalf}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              label="Carbs (g)"
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="numeric"
              mode="outlined"
              style={styles.inputHalf}
            />
            <TextInput
              label="Fat (g)"
              value={fat}
              onChangeText={setFat}
              keyboardType="numeric"
              mode="outlined"
              style={styles.inputHalf}
            />
          </View>
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={!localImageUri || isSaving}
            loading={isSaving}
          >
            Save Entry
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 12, borderRadius: 16 },
  title: { marginBottom: 8 },
  image: {
    width: "100%",
    height: 240,
    borderRadius: 12,
    backgroundColor: "#111",
  },
  placeholder: {
    width: "100%",
    height: 240,
    borderRadius: 12,
    backgroundColor: "#222",
  },
  row: { flexDirection: "row", gap: 8, marginTop: 12, marginBottom: 8 },
  button: { flex: 1 },
  input: { marginBottom: 8 },
  inputHalf: { flex: 1 },
});
