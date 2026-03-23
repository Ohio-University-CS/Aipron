import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, borderRadius, typography, shadows } from "../src/constants/DesignTokens";
import { useThemeColors } from "../src/hooks/useThemeColors";

const faqs = [
  {
    question: "How does AI recipe generation work?",
    answer:
      "AIpron uses advanced AI to create personalized recipes based on your preferences, dietary restrictions, and available ingredients. Simply describe what you'd like to cook, and our AI will generate a complete recipe with ingredients and step-by-step instructions.",
  },
  {
    question: "Can I save recipes for later?",
    answer:
      "Yes! Tap the heart icon on any recipe to save it to your favorites. You can access all saved recipes from the Saved tab in the bottom navigation.",
  },
  {
    question: "How do I manage my pantry?",
    answer:
      "Go to the Pantry section to add ingredients you have at home. AIpron can then suggest recipes based on what's already in your pantry, reducing food waste and saving you trips to the store.",
  },
  {
    question: "What dietary preferences are supported?",
    answer:
      "AIpron supports vegetarian, vegan, gluten-free, dairy-free, nut-free, halal, keto, and low-carb dietary preferences. You can set these in Settings > Dietary Preferences.",
  },
  {
    question: "How does the cooking timer work?",
    answer:
      "During step-by-step cooking mode, timers are automatically set based on each step's duration. You'll receive audio and visual notifications when a timer completes.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Absolutely. All data is encrypted and stored securely using Supabase. We never sell your personal information. You can review our full privacy policy in Settings.",
  },
];

interface HelpScreenProps {
  onBack?: () => void;
}

export default function HelpScreen({ onBack }: HelpScreenProps = {}) {
  const c = useThemeColors();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim()) {
      Alert.alert("Empty Message", "Please write a message before sending.");
      return;
    }
    setMessageSent(true);
    setContactMessage("");
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
          <Text style={[styles.backText, { color: c.text }]}>Back</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.title, { color: c.text }]}>Help & Support</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionHeader, { color: c.textSecondary }]}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={[styles.card, { ...shadows.sm }]}>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.faqRow,
                { backgroundColor: c.surface, borderBottomColor: c.border },
                index === faqs.length - 1 && { borderBottomWidth: 0 },
              ]}
              activeOpacity={0.7}
              onPress={() => toggleFaq(index)}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: c.text }]}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === index ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={c.textSecondary}
                />
              </View>
              {expandedFaq === index && (
                <Text style={[styles.faqAnswer, { color: c.textSecondary }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionHeader, { color: c.textSecondary }]}>CONTACT US</Text>
        <View style={[styles.card, { ...shadows.sm }]}>
          <View style={[styles.contactRow, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
            <View style={[styles.contactIconWrap, { backgroundColor: "#2196F3" + "18" }]}>
              <Ionicons name="mail-outline" size={18} color="#2196F3" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactLabel, { color: c.text }]}>Email</Text>
              <Text style={[styles.contactValue, { color: c.textSecondary }]}>support@aipron.app</Text>
            </View>
          </View>
          <View style={[styles.contactRow, { backgroundColor: c.surface, borderBottomColor: c.border, borderBottomWidth: 0 }]}>
            <View style={[styles.contactIconWrap, { backgroundColor: "#10B981" + "18" }]}>
              <Ionicons name="chatbubble-outline" size={18} color="#10B981" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactLabel, { color: c.text }]}>Response Time</Text>
              <Text style={[styles.contactValue, { color: c.textSecondary }]}>Usually within 24 hours</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionHeader, { color: c.textSecondary }]}>SEND US A MESSAGE</Text>
        {messageSent ? (
          <View style={[styles.sentCard, { backgroundColor: c.surface, ...shadows.sm }]}>
            <View style={[styles.sentIconWrap, { backgroundColor: "#10B981" + "18" }]}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
            </View>
            <Text style={[styles.sentTitle, { color: c.text }]}>Message Sent!</Text>
            <Text style={[styles.sentDescription, { color: c.textSecondary }]}>
              Thanks for reaching out. We'll get back to you as soon as possible.
            </Text>
            <TouchableOpacity
              style={[styles.sendAnother, { borderColor: c.primary }]}
              onPress={() => setMessageSent(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sendAnotherText, { color: c.primary }]}>Send Another Message</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.messageCard, { backgroundColor: c.surface, ...shadows.sm }]}>
            <TextInput
              style={[styles.messageInput, { backgroundColor: c.background, color: c.text, borderColor: c.border }]}
              placeholder="Describe your issue or question..."
              placeholderTextColor={c.textSecondary}
              value={contactMessage}
              onChangeText={setContactMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: c.primary }]}
              onPress={handleSendMessage}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  backText: {
    ...typography.body,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  faqRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    ...typography.body,
    fontWeight: "500",
    flex: 1,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    ...typography.caption,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    ...typography.body,
    fontWeight: "500",
  },
  contactValue: {
    ...typography.caption,
    marginTop: 2,
  },
  messageCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  messageInput: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 100,
    marginBottom: spacing.md,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  sendButtonText: {
    ...typography.body,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  sentCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
  },
  sentIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  sentTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  sentDescription: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  sendAnother: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sendAnotherText: {
    ...typography.caption,
    fontWeight: "600",
  },
});
