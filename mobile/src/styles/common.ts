import { StyleSheet } from 'react-native-unistyles';
import { sp } from './unistyles';

/**
 * Shared styles used across multiple screens/components.
 * Import and compose with local styles: style={[common.card, localStyles.myCard]}
 */
export const common = StyleSheet.create(theme => ({
  // Layout
  screen: {
    flex: 1,
    backgroundColor: theme.backgroundApp,
  },
  screenPadded: {
    flex: 1,
    backgroundColor: theme.backgroundApp,
    paddingHorizontal: sp.xl,
  },

  // Cards
  card: {
    backgroundColor: theme.surfaceCard,
    borderRadius: sp.radiusMd,
    padding: sp.cardPadding,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },

  // Section header inside screens
  sectionHeader: {
    paddingHorizontal: sp.xl,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.onSurfaceVariant,
    backgroundColor: theme.surfaceHigh,
    borderRadius: sp.radiusFull,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },

  // Screen title (inside screen, below header)
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.screenTitleColor,
  },
  screenSubtitle: {
    fontSize: 14,
    color: theme.onSurfaceVariant,
    marginTop: 2,
  },

  // Top section container (title + selector)
  topSection: {
    paddingHorizontal: sp.xl,
    paddingVertical: sp.md,
    backgroundColor: theme.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant,
    gap: 6,
  },

  // Text
  textPrimary: {
    color: theme.onSurface,
  },
  textSecondary: {
    color: theme.onSurfaceVariant,
  },
  textError: {
    color: theme.error,
  },

  // Inputs
  input: {
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.outline,
    borderRadius: sp.radius,
    paddingHorizontal: 12,
    minHeight: 42,
    color: theme.inputText,
    fontSize: 15,
  },

  // Chip row
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: sp.radiusFull,
    borderWidth: 1,
    borderColor: theme.outline,
    backgroundColor: theme.surfaceLow,
  },
  chipActive: {
    backgroundColor: theme.primaryContainer,
    borderColor: theme.primaryContainer,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.onSurfaceVariant,
  },
  chipTextActive: {
    color: theme.onPrimary,
  },

  // Menu item (settings-like row)
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.outlineVariant,
  },
  menuItemText: {
    fontSize: 15,
    color: theme.onSurface,
    flex: 1,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  // Alert banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryContainer,
    paddingVertical: 12,
    paddingHorizontal: sp.xl,
    gap: 8,
  },
  alertBannerUrgent: {
    backgroundColor: theme.error,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.onPrimary,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sp.xl,
  },

  // List content
  listContent: {
    paddingHorizontal: sp.xl,
    paddingBottom: 80,
  },
}));
