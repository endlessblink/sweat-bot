import React, { useState } from 'react';
import { designTokens } from '../design-system/tokens';
import {
  Button,
  Card,
  Input,
  Avatar,
  Badge,
  IconButton,
} from '../design-system/components/base';
import {
  ChatMessage,
  ChatHistoryItem,
  StatisticsPanel,
} from '../design-system/components/modules';
import { DesignSystemIcon } from '../design-system/components/DesignSystemIcon';

type Tab = 'tokens' | 'base' | 'modules';

/**
 * Enhanced Design System Showcase
 *
 * Navigable design system with tabs, modules, and "Where to Use" guidance.
 * Click any code snippet to copy it to clipboard.
 */
export const DesignSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('tokens');
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleCode = (label: string) => {
    setExpandedCode(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const CodeBlock: React.FC<{ code: string; label: string }> = ({ code, label }) => {
    const isExpanded = expandedCode[label] || false;

    return (
      <div style={{ marginTop: designTokens.spacing[4] }}>
        <button
          onClick={() => toggleCode(label)}
          style={{
            width: '100%',
            padding: designTokens.spacing[3],
            backgroundColor: designTokens.colors.background.tertiary,
            border: `1px solid ${designTokens.colors.border.default}`,
            borderRadius: designTokens.borderRadius.md,
            color: designTokens.colors.text.secondary,
            fontSize: designTokens.typography.fontSize.sm,
            fontWeight: designTokens.typography.fontWeight.medium,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: `all ${designTokens.transitions.fast}`,
            fontFamily: designTokens.typography.fontFamily.primary,
          }}
        >
          <span>{isExpanded ? '▼' : '▶'} {isExpanded ? 'Hide' : 'Show'} Code</span>
          <span style={{ fontSize: designTokens.typography.fontSize.xs }}>
            {isExpanded ? 'Click code to copy' : 'Click to view'}
          </span>
        </button>

        {isExpanded && (
          <div
            onClick={() => copyToClipboard(code, label)}
            style={{
              padding: designTokens.spacing[4],
              backgroundColor: designTokens.colors.background.primary,
              border: `1px solid ${designTokens.colors.border.default}`,
              borderTop: 'none',
              borderRadius: `0 0 ${designTokens.borderRadius.md} ${designTokens.borderRadius.md}`,
              fontFamily: designTokens.typography.fontFamily.mono,
              fontSize: designTokens.typography.fontSize.sm,
              color: designTokens.colors.text.secondary,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'auto',
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{code}</pre>
            {copied === label && (
              <span
                style={{
                  position: 'absolute',
                  top: designTokens.spacing[2],
                  right: designTokens.spacing[2],
                  padding: `${designTokens.spacing[1]} ${designTokens.spacing[2]}`,
                  backgroundColor: designTokens.colors.interactive.success,
                  color: designTokens.colors.text.primary,
                  borderRadius: designTokens.borderRadius.sm,
                  fontSize: designTokens.typography.fontSize.xs,
                }}
              >
                ✓ Copied!
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ marginBottom: designTokens.spacing[12] }}>
      <h2
        style={{
          fontSize: designTokens.typography.fontSize['2xl'],
          fontWeight: designTokens.typography.fontWeight.bold,
          color: designTokens.colors.text.primary,
          marginBottom: designTokens.spacing[6],
          fontFamily: designTokens.typography.fontFamily.primary,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );

  const ComponentShowcase: React.FC<{
    title: string;
    description: string;
    example: React.ReactNode;
    code: string;
  }> = ({ title, description, example, code }) => (
    <Card variant="elevated" padding={6} style={{ marginBottom: designTokens.spacing[8] }}>
      <h3
        style={{
          fontSize: designTokens.typography.fontSize.xl,
          fontWeight: designTokens.typography.fontWeight.semibold,
          color: designTokens.colors.text.primary,
          marginBottom: designTokens.spacing[2],
          fontFamily: designTokens.typography.fontFamily.primary,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: designTokens.typography.fontSize.sm,
          color: designTokens.colors.text.secondary,
          marginBottom: designTokens.spacing[6],
          fontFamily: designTokens.typography.fontFamily.primary,
        }}
      >
        {description}
      </p>
      <div
        style={{
          padding: designTokens.spacing[8],
          backgroundColor: designTokens.colors.background.primary,
          borderRadius: designTokens.borderRadius.md,
          marginBottom: designTokens.spacing[4],
          display: 'flex',
          flexWrap: 'wrap',
          gap: designTokens.spacing[4],
          alignItems: 'center',
        }}
      >
        {example}
      </div>
      <CodeBlock code={code} label={title} />
    </Card>
  );

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: designTokens.colors.background.primary,
    color: designTokens.colors.text.primary,
    padding: designTokens.spacing[8],
    fontFamily: designTokens.typography.fontFamily.primary,
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: designTokens.layout.maxContentWidth,
    margin: '0 auto',
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ marginBottom: designTokens.spacing[12], textAlign: 'center' }}>
          {/* Custom SweatBot Design System Icon */}
          <div style={{ marginBottom: designTokens.spacing[4] }}>
            <DesignSystemIcon size={80} />
          </div>
          <h1
            style={{
              fontSize: designTokens.typography.fontSize['3xl'],
              fontWeight: designTokens.typography.fontWeight.bold,
              color: designTokens.colors.text.primary,
              marginBottom: designTokens.spacing[4],
            }}
          >
            💪🎨 SweatBot Design System
          </h1>
          <p
            style={{
              fontSize: designTokens.typography.fontSize.lg,
              color: designTokens.colors.text.secondary,
            }}
          >
            Unified design language. Click any code block to copy.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: designTokens.spacing[2],
          marginBottom: designTokens.spacing[8],
          borderBottom: `1px solid ${designTokens.colors.border.default}`,
          paddingBottom: designTokens.spacing[2],
        }}>
          <button
            onClick={() => setActiveTab('tokens')}
            style={{
              padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
              fontSize: designTokens.typography.fontSize.base,
              fontWeight: activeTab === 'tokens' ? designTokens.typography.fontWeight.semibold : designTokens.typography.fontWeight.normal,
              color: activeTab === 'tokens' ? designTokens.colors.interactive.primary : designTokens.colors.text.secondary,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tokens' ? `2px solid ${designTokens.colors.interactive.primary}` : 'none',
              cursor: 'pointer',
              transition: `all ${designTokens.transitions.fast}`,
            }}
          >
            🎨 Design Tokens
          </button>
          <button
            onClick={() => setActiveTab('base')}
            style={{
              padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
              fontSize: designTokens.typography.fontSize.base,
              fontWeight: activeTab === 'base' ? designTokens.typography.fontWeight.semibold : designTokens.typography.fontWeight.normal,
              color: activeTab === 'base' ? designTokens.colors.interactive.primary : designTokens.colors.text.secondary,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'base' ? `2px solid ${designTokens.colors.interactive.primary}` : 'none',
              cursor: 'pointer',
              transition: `all ${designTokens.transitions.fast}`,
            }}
          >
            🔘 Base Components
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            style={{
              padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
              fontSize: designTokens.typography.fontSize.base,
              fontWeight: activeTab === 'modules' ? designTokens.typography.fontWeight.semibold : designTokens.typography.fontWeight.normal,
              color: activeTab === 'modules' ? designTokens.colors.interactive.primary : designTokens.colors.text.secondary,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'modules' ? `2px solid ${designTokens.colors.interactive.primary}` : 'none',
              cursor: 'pointer',
              transition: `all ${designTokens.transitions.fast}`,
            }}
          >
            📦 Modules & Examples
          </button>
        </div>

        {/* Design Tokens Tab */}
        {activeTab === 'tokens' && (
          <>
            {/* Color Palette */}
            <Section title="🎨 Color Palette">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: designTokens.spacing[4] }}>
            {Object.entries(designTokens.colors).map(([category, colors]) => (
              <Card key={category} padding={4}>
                <h4 style={{ fontSize: designTokens.typography.fontSize.sm, fontWeight: designTokens.typography.fontWeight.semibold, marginBottom: designTokens.spacing[3], textTransform: 'capitalize' }}>
                  {category}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing[2] }}>
                  {typeof colors === 'object' && Object.entries(colors).map(([name, value]) => (
                    <div
                      key={name}
                      onClick={() => copyToClipboard(`designTokens.colors.${category}.${name}`, `${category}.${name}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: designTokens.spacing[2], cursor: 'pointer' }}
                    >
                      <div style={{ width: '24px', height: '24px', backgroundColor: value, borderRadius: designTokens.borderRadius.sm, border: `1px solid ${designTokens.colors.border.default}` }} />
                      <span style={{ fontSize: designTokens.typography.fontSize.xs, color: designTokens.colors.text.secondary }}>{name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="📝 Typography">
          <Card variant="elevated" padding={6}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing[4] }}>
              {Object.entries(designTokens.typography.fontSize).map(([size, value]) => (
                <div key={size} onClick={() => copyToClipboard(`designTokens.typography.fontSize.${size}`, `fontSize.${size}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: value, fontWeight: designTokens.typography.fontWeight.medium }}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                  <div style={{ fontSize: designTokens.typography.fontSize.xs, color: designTokens.colors.text.tertiary, marginTop: designTokens.spacing[1] }}>
                    {size} - {value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* Spacing Scale */}
        <Section title="📏 Spacing Scale">
          <Card variant="elevated" padding={6}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing[2] }}>
              {Object.entries(designTokens.spacing).map(([key, value]) => (
                <div
                  key={key}
                  onClick={() => copyToClipboard(`designTokens.spacing.${key}`, `spacing.${key}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: designTokens.spacing[4], cursor: 'pointer' }}
                >
                  <div style={{ width: '60px', fontSize: designTokens.typography.fontSize.sm, color: designTokens.colors.text.secondary }}>
                    {key}
                  </div>
                  <div
                    style={{
                      height: '24px',
                      width: value,
                      backgroundColor: designTokens.colors.interactive.primary,
                      borderRadius: designTokens.borderRadius.sm,
                    }}
                  />
                  <div style={{ fontSize: designTokens.typography.fontSize.sm, color: designTokens.colors.text.tertiary }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>
          </>
        )}

        {/* Base Components Tab */}
        {activeTab === 'base' && (
          <>
            {/* Button Component */}
            <Section title="🔘 Components">
          <ComponentShowcase
            title="Button"
            description="Primary action component with multiple variants and sizes"
            example={
              <>
                <Button variant="primary" size="sm">Primary Small</Button>
                <Button variant="primary" size="md">Primary Medium</Button>
                <Button variant="primary" size="lg">Primary Large</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="primary" disabled>Disabled</Button>
                <Button variant="primary" loading>Loading...</Button>
              </>
            }
            code={`<Button variant="primary" size="md" onClick={handleClick}>
  לחץ כאן
</Button>

// Variants: primary, secondary, danger, ghost
// Sizes: sm, md, lg
// Props: loading, disabled, fullWidth, icon`}
          />

          <ComponentShowcase
            title="Card"
            description="Container component for grouping related content"
            example={
              <>
                <Card variant="default" padding={4} style={{ width: '200px' }}>
                  <h4>Default Card</h4>
                  <p style={{ fontSize: designTokens.typography.fontSize.sm, color: designTokens.colors.text.secondary }}>
                    With subtle border
                  </p>
                </Card>
                <Card variant="elevated" padding={4} style={{ width: '200px' }}>
                  <h4>Elevated Card</h4>
                  <p style={{ fontSize: designTokens.typography.fontSize.sm, color: designTokens.colors.text.secondary }}>
                    With shadow
                  </p>
                </Card>
                <Card variant="outlined" padding={4} style={{ width: '200px' }}>
                  <h4>Outlined Card</h4>
                  <p style={{ fontSize: designTokens.typography.fontSize.sm, color: designTokens.colors.text.secondary }}>
                    Transparent bg
                  </p>
                </Card>
              </>
            }
            code={`<Card variant="elevated" padding={4}>
  <h3>כותרת</h3>
  <p>תוכן הכרטיס</p>
</Card>

// Variants: default, elevated, outlined
// Padding: any spacing key (1-16)`}
          />

          <ComponentShowcase
            title="Input"
            description="Text input with RTL support and validation states"
            example={
              <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: designTokens.spacing[4] }}>
                <Input label="Name" placeholder="Enter your name" />
                <Input label="Email" placeholder="user@example.com" error="Invalid email format" />
                <Input label="Search" placeholder="Search..." helperText="Helper text here" />
              </div>
            }
            code={`<Input
  label="שם"
  placeholder="הזן את שמך"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
  fullWidth
/>

// Props: label, error, helperText, icon, fullWidth`}
          />

          <ComponentShowcase
            title="Avatar"
            description="User/bot avatar with fallback to initials"
            example={
              <>
                <Avatar name="Noam" size="sm" />
                <Avatar name="Noam" size="md" />
                <Avatar name="Noam" size="lg" />
                <Avatar name="Noam" size="xl" />
                <Avatar name="SweatBot" size="md" variant="square" />
              </>
            }
            code={`<Avatar
  src="/user-avatar.jpg"
  name="נועם"
  size="md"
  variant="circular"
/>

// Sizes: sm, md, lg, xl
// Variants: circular, square`}
          />

          <ComponentShowcase
            title="Badge"
            description="Status indicators and labels"
            example={
              <>
                <Badge variant="default">Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="success" dot>With Dot</Badge>
                <Badge variant="primary" size="sm">Small</Badge>
              </>
            }
            code={`<Badge variant="success" size="md" dot>
  פעיל
</Badge>

// Variants: default, primary, success, danger
// Sizes: sm, md
// Props: dot (boolean)`}
          />

          <ComponentShowcase
            title="IconButton"
            description="Button with just an icon"
            example={
              <>
                <IconButton icon="⚙️" size="sm" variant="default" aria-label="Settings" />
                <IconButton icon="🗑️" size="md" variant="danger" aria-label="Delete" />
                <IconButton icon="✓" size="lg" variant="default" aria-label="Confirm" />
                <IconButton icon="✕" variant="ghost" aria-label="Close" />
              </>
            }
            code={`<IconButton
  icon={<TrashIcon />}
  variant="danger"
  size="md"
  aria-label="מחק"
  onClick={handleDelete}
/>

// Variants: default, ghost, danger
// Sizes: sm, md, lg
// Note: aria-label is required!`}
          />
        </Section>
          </>
        )}

        {/* Modules & Examples Tab */}
        {activeTab === 'modules' && (
          <>
            <Section title="💬 Chat Module">
              <Card variant="elevated" padding={6}>
                <h3 style={{
                  fontSize: designTokens.typography.fontSize.xl,
                  fontWeight: designTokens.typography.fontWeight.semibold,
                  color: designTokens.colors.text.primary,
                  marginBottom: designTokens.spacing[2],
                }}>
                  ChatMessage
                </h3>
                <p style={{
                  fontSize: designTokens.typography.fontSize.sm,
                  color: designTokens.colors.text.secondary,
                  marginBottom: designTokens.spacing[4],
                }}>
                  Complete chat message component with user/bot variants
                </p>

                {/* WHERE TO USE indicator */}
                <div style={{
                  fontSize: designTokens.typography.fontSize.xs,
                  color: designTokens.colors.interactive.primary,
                  marginBottom: designTokens.spacing[4],
                  padding: designTokens.spacing[2],
                  backgroundColor: designTokens.colors.background.primary,
                  borderRadius: designTokens.borderRadius.sm,
                  border: `1px solid ${designTokens.colors.border.default}`,
                }}>
                  📁 WHERE TO USE: src/components/SweatBotChat.tsx
                </div>

                {/* Live example */}
                <div style={{
                  backgroundColor: designTokens.colors.background.primary,
                  padding: designTokens.spacing[6],
                  borderRadius: designTokens.borderRadius.md,
                  marginBottom: designTokens.spacing[4],
                }}>
                  <ChatMessage
                    content="עשיתי 20 סקוואטים"
                    sender="user"
                    userName="נועם"
                    timestamp={new Date()}
                  />
                  <ChatMessage
                    content="מעולה! רשמתי את האימון שלך. 20 סקוואטים = 20 נקודות 💪"
                    sender="bot"
                    timestamp={new Date()}
                  />
                </div>

                {/* Code block */}
                <CodeBlock
                  label="ChatMessage"
                  code={`<ChatMessage
  content="עשיתי 20 סקוואטים"
  sender="user"
  userName="נועם"
  timestamp={new Date()}
/>

<ChatMessage
  content="מעולה! רשמתי את האימון"
  sender="bot"
  timestamp={new Date()}
/>`}
                />
              </Card>

              <Card variant="elevated" padding={6} style={{ marginTop: designTokens.spacing[8] }}>
                <h3 style={{
                  fontSize: designTokens.typography.fontSize.xl,
                  fontWeight: designTokens.typography.fontWeight.semibold,
                  color: designTokens.colors.text.primary,
                  marginBottom: designTokens.spacing[2],
                }}>
                  ChatHistoryItem
                </h3>
                <p style={{
                  fontSize: designTokens.typography.fontSize.sm,
                  color: designTokens.colors.text.secondary,
                  marginBottom: designTokens.spacing[4],
                }}>
                  Conversation history list item with selection state
                </p>

                {/* WHERE TO USE indicator */}
                <div style={{
                  fontSize: designTokens.typography.fontSize.xs,
                  color: designTokens.colors.interactive.primary,
                  marginBottom: designTokens.spacing[4],
                  padding: designTokens.spacing[2],
                  backgroundColor: designTokens.colors.background.primary,
                  borderRadius: designTokens.borderRadius.sm,
                  border: `1px solid ${designTokens.colors.border.default}`,
                }}>
                  📁 WHERE TO USE: src/components/ui/ChatHistorySidebar.tsx
                </div>

                {/* Live example */}
                <div style={{
                  backgroundColor: designTokens.colors.background.primary,
                  padding: designTokens.spacing[6],
                  borderRadius: designTokens.borderRadius.md,
                  marginBottom: designTokens.spacing[4],
                }}>
                  <ChatHistoryItem
                    title="אימון רגליים"
                    preview="עשיתי 20 סקוואטים ו-15 לאנג'ים"
                    timestamp={new Date()}
                    isActive={false}
                    onClick={() => {}}
                  />
                  <ChatHistoryItem
                    title="אימון חזה"
                    preview="סיימתי 30 שכיבות סמיכה"
                    timestamp={new Date(Date.now() - 86400000)}
                    isActive={true}
                    onClick={() => {}}
                  />
                </div>

                {/* Code block */}
                <CodeBlock
                  label="ChatHistoryItem"
                  code={`<ChatHistoryItem
  title="אימון רגליים"
  preview="עשיתי 20 סקוואטים"
  timestamp={new Date()}
  isActive={false}
  onClick={() => handleSelectConversation(id)}
/>`}
                />
              </Card>
            </Section>

            <Section title="📊 Statistics Module">
              <Card variant="elevated" padding={6}>
                <h3 style={{
                  fontSize: designTokens.typography.fontSize.xl,
                  fontWeight: designTokens.typography.fontWeight.semibold,
                  color: designTokens.colors.text.primary,
                  marginBottom: designTokens.spacing[2],
                }}>
                  StatisticsPanel
                </h3>
                <p style={{
                  fontSize: designTokens.typography.fontSize.sm,
                  color: designTokens.colors.text.secondary,
                  marginBottom: designTokens.spacing[4],
                }}>
                  Complete statistics panel with collapsible sections
                </p>

                {/* WHERE TO USE indicator */}
                <div style={{
                  fontSize: designTokens.typography.fontSize.xs,
                  color: designTokens.colors.interactive.primary,
                  marginBottom: designTokens.spacing[4],
                  padding: designTokens.spacing[2],
                  backgroundColor: designTokens.colors.background.primary,
                  borderRadius: designTokens.borderRadius.sm,
                  border: `1px solid ${designTokens.colors.border.default}`,
                }}>
                  📁 WHERE TO USE: src/pages/Chat.tsx (right sidebar)
                </div>

                {/* Live example */}
                <div style={{
                  backgroundColor: designTokens.colors.background.primary,
                  padding: designTokens.spacing[6],
                  borderRadius: designTokens.borderRadius.md,
                  marginBottom: designTokens.spacing[4],
                }}>
                  <StatisticsPanel
                    stats={[
                      { label: 'נקודות השבוע', value: '247', change: { value: 12, label: 'מהשבוע שעבר' }, icon: '⭐', variant: 'success' },
                      { label: 'אימונים', value: '5', icon: '🏋️', variant: 'primary' },
                      { label: 'שריפת קלוריות', value: '1,250', change: { value: -5, label: 'מהשבוע שעבר' }, icon: '🔥', variant: 'danger' },
                    ]}
                    isOpen={true}
                    onToggle={() => {}}
                    onClear={() => {}}
                  />
                </div>

                {/* Code block */}
                <CodeBlock
                  label="StatisticsPanel"
                  code={`<StatisticsPanel
  stats={[
    {
      label: 'נקודות השבוע',
      value: '247',
      change: { value: 12, label: 'מהשבוע שעבר' },
      icon: '⭐',
      variant: 'success'
    },
    {
      label: 'אימונים',
      value: '5',
      icon: '🏋️',
      variant: 'primary'
    },
  ]}
  isOpen={true}
  onToggle={() => setStatsOpen(!statsOpen)}
  onClear={handleClearStats}
/>`}
                />
              </Card>

              {/* Statistics Variants */}
              <Card variant="elevated" padding={6} style={{ marginTop: designTokens.spacing[8] }}>
                <h3 style={{
                  fontSize: designTokens.typography.fontSize.xl,
                  fontWeight: designTokens.typography.fontWeight.semibold,
                  color: designTokens.colors.text.primary,
                  marginBottom: designTokens.spacing[2],
                }}>
                  Statistics Card Variants
                </h3>
                <p style={{
                  fontSize: designTokens.typography.fontSize.sm,
                  color: designTokens.colors.text.secondary,
                  marginBottom: designTokens.spacing[6],
                }}>
                  Different patterns for displaying statistics
                </p>

                {/* Example 1: Success variant with positive change */}
                <div style={{
                  marginBottom: designTokens.spacing[6],
                  padding: designTokens.spacing[4],
                  backgroundColor: designTokens.colors.background.primary,
                  borderRadius: designTokens.borderRadius.md,
                  border: `1px solid ${designTokens.colors.border.default}`,
                }}>
                  <h4 style={{
                    fontSize: designTokens.typography.fontSize.sm,
                    fontWeight: designTokens.typography.fontWeight.semibold,
                    marginBottom: designTokens.spacing[3],
                    color: designTokens.colors.text.secondary,
                  }}>
                    Pattern 1: Success with Positive Change
                  </h4>
                  <StatisticsPanel
                    stats={[
                      { label: 'נקודות השבוע', value: '247', change: { value: 12, label: 'מהשבוע שעבר' }, icon: '⭐', variant: 'success' },
                    ]}
                    isOpen={true}
                    onToggle={() => {}}
                  />
                </div>

                {/* Example 2: Primary variant without change */}
                <div style={{
                  marginBottom: designTokens.spacing[6],
                  padding: designTokens.spacing[4],
                  backgroundColor: designTokens.colors.background.primary,
                  borderRadius: designTokens.borderRadius.md,
                  border: `1px solid ${designTokens.colors.border.default}`,
                }}>
                  <h4 style={{
                    fontSize: designTokens.typography.fontSize.sm,
                    fontWeight: designTokens.typography.fontWeight.semibold,
                    marginBottom: designTokens.spacing[3],
                    color: designTokens.colors.text.secondary,
                  }}>
                    Pattern 2: Primary without Change Indicator
                  </h4>
                  <StatisticsPanel
                    stats={[
                      { label: 'אימונים השבוע', value: '5', icon: '🏋️', variant: 'primary' },
                    ]}
                    isOpen={true}
                    onToggle={() => {}}
                  />
                </div>

                {/* Example 3: Danger variant with negative change */}
                <div style={{
                  marginBottom: designTokens.spacing[6],
                  padding: designTokens.spacing[4],
                  backgroundColor: designTokens.colors.background.primary,
                  borderRadius: designTokens.borderRadius.md,
                  border: `1px solid ${designTokens.colors.border.default}`,
                }}>
                  <h4 style={{
                    fontSize: designTokens.typography.fontSize.sm,
                    fontWeight: designTokens.typography.fontWeight.semibold,
                    marginBottom: designTokens.spacing[3],
                    color: designTokens.colors.text.secondary,
                  }}>
                    Pattern 3: Danger with Negative Change
                  </h4>
                  <StatisticsPanel
                    stats={[
                      { label: 'שריפת קלוריות', value: '1,250', change: { value: -5, label: 'מהשבוע שעבר' }, icon: '🔥', variant: 'danger' },
                    ]}
                    isOpen={true}
                    onToggle={() => {}}
                  />
                </div>

                <CodeBlock
                  label="Statistics Variants"
                  code={`// Success with positive change
{
  label: 'נקודות השבוע',
  value: '247',
  change: { value: 12, label: 'מהשבוע שעבר' },
  icon: '⭐',
  variant: 'success'
}

// Primary without change
{
  label: 'אימונים',
  value: '5',
  icon: '🏋️',
  variant: 'primary'
}

// Danger with negative change
{
  label: 'שריפת קלוריות',
  value: '1,250',
  change: { value: -5, label: 'מהשבוע שעבר' },
  icon: '🔥',
  variant: 'danger'
}`}
                />
              </Card>
            </Section>
          </>
        )}

        {/* Usage Guidelines */}
        <Section title="📚 Usage Guidelines">
          <Card variant="elevated" padding={6}>
            <h3 style={{ fontSize: designTokens.typography.fontSize.xl, marginBottom: designTokens.spacing[4] }}>
              🚨 CRITICAL RULES
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing[3], fontSize: designTokens.typography.fontSize.sm }}>
              <div style={{ padding: designTokens.spacing[3], backgroundColor: designTokens.colors.background.primary, borderRadius: designTokens.borderRadius.md, borderLeft: `4px solid ${designTokens.colors.interactive.danger}` }}>
                <strong>❌ NEVER hardcode colors, spacing, or typography</strong>
                <pre style={{ marginTop: designTokens.spacing[2], color: designTokens.colors.interactive.danger }}>
                  {'// WRONG:\ncolor: "#FFFFFF"\npadding: "16px"'}
                </pre>
              </div>
              <div style={{ padding: designTokens.spacing[3], backgroundColor: designTokens.colors.background.primary, borderRadius: designTokens.borderRadius.md, borderLeft: `4px solid ${designTokens.colors.interactive.success}` }}>
                <strong>✅ ALWAYS use design tokens</strong>
                <pre style={{ marginTop: designTokens.spacing[2], color: designTokens.colors.interactive.success }}>
                  {'// CORRECT:\ncolor: designTokens.colors.text.primary\npadding: designTokens.spacing[4]'}
                </pre>
              </div>
              <div style={{ padding: designTokens.spacing[3], backgroundColor: designTokens.colors.background.primary, borderRadius: designTokens.borderRadius.md }}>
                <strong>Import design tokens:</strong>
                <pre style={{ marginTop: designTokens.spacing[2] }}>
                  {'import { designTokens } from \'../design-system/tokens\';\nimport { Button, Card } from \'../design-system/components/base\';'}
                </pre>
              </div>
            </div>
          </Card>
        </Section>

        <div style={{ textAlign: 'center', padding: designTokens.spacing[8], color: designTokens.colors.text.tertiary }}>
          <p>💪🎨 Design System v1.0.0 • SweatBot © 2025</p>
        </div>
      </div>
    </div>
  );
};
