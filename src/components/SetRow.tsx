import React from "react";
import { View, StyleSheet } from "react-native";
import {
  TextInput,
  Text,
  IconButton,
  Checkbox,
  useTheme,
} from "react-native-paper";
import { SetEntry } from "../types";

interface SetRowProps {
  set: SetEntry;
  index: number;
  lastSet?: { weight: number; reps: number; rpe?: number };
  onUpdate: (updates: Partial<SetEntry>) => void;
  onRemove: () => void;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  index,
  lastSet,
  onUpdate,
  onRemove,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.setHeader}>
        <Text style={styles.setNumber}>Set {index}</Text>
        {lastSet && (
          <Text style={styles.lastTime}>
            Last: {lastSet.weight}×{lastSet.reps}
            {lastSet.rpe && ` @RPE${lastSet.rpe}`}
          </Text>
        )}
      </View>

      <View style={styles.inputsRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weight</Text>
          <TextInput
            mode="outlined"
            dense
            keyboardType="numeric"
            value={set.weight.toString()}
            onChangeText={(text) => onUpdate({ weight: parseFloat(text) || 0 })}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reps</Text>
          <TextInput
            mode="outlined"
            dense
            keyboardType="numeric"
            value={set.reps.toString()}
            onChangeText={(text) => onUpdate({ reps: parseInt(text) || 0 })}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>RPE</Text>
          <TextInput
            mode="outlined"
            dense
            keyboardType="numeric"
            value={set.rpe?.toString() || ""}
            onChangeText={(text) =>
              onUpdate({ rpe: text ? parseInt(text) : null })
            }
            style={styles.input}
            placeholder="8"
          />
        </View>

        <View style={styles.checkboxGroup}>
          <Checkbox
            status={set.isWarmup ? "checked" : "unchecked"}
            onPress={() => onUpdate({ isWarmup: !set.isWarmup })}
          />
          <Text style={styles.label}>Warmup</Text>
        </View>

        <IconButton
          icon="delete"
          size={20}
          onPress={onRemove}
          style={styles.deleteButton}
        />
      </View>

      <TextInput
        mode="outlined"
        dense
        label="Note"
        value={set.note || ""}
        onChangeText={(text) => onUpdate({ note: text || null })}
        style={styles.noteInput}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  setHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  lastTime: {
    fontSize: 12,
    color: "#B0B0B0",
    fontStyle: "italic",
  },
  inputsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputGroup: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    color: "#B0B0B0",
  },
  input: {
    height: 44,
  },
  checkboxGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  deleteButton: {
    margin: 0,
  },
  noteInput: {
    height: 44,
  },
});
