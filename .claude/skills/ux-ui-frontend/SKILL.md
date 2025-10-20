---
name: UX/UI Design & Frontend Development
description: Complete UX/UI design and frontend development workflows including React component creation, accessibility compliance (WCAG), design system integration, responsive design implementation, UI state management patterns, and user experience optimization. Use when building user interfaces, implementing design systems, ensuring accessibility, or optimizing user experience.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# UX/UI Design & Frontend Development

## Overview

Technical skill for implementing comprehensive UX/UI design and frontend development workflows including React component creation with TypeScript, accessibility compliance (WCAG 2.1 AA/AAA standards), design system integration and token management, responsive design implementation, UI state management patterns, and user experience optimization and testing.

## When to Use

- Creating React components with TypeScript and modern patterns
- Implementing accessibility features and WCAG compliance
- Building or integrating design systems and component libraries
- Implementing responsive design for mobile and desktop
- Managing complex UI state and user interactions
- Optimizing user experience and conducting usability testing

## Technical Capabilities

1. **React Component Development**: TypeScript components with proper props, hooks integration, and modern patterns
2. **Accessibility Implementation**: WCAG 2.1 AA/AAA compliance, screen reader support, keyboard navigation, ARIA labels
3. **Design System Integration**: Design tokens, component variants, theme management, and consistent styling
4. **Responsive Design**: Mobile-first approach, breakpoint management, fluid layouts, and adaptive UI
5. **UI State Management**: Local state, global state patterns, form handling, and data flow
6. **UX Optimization**: Performance optimization, user feedback, loading states, and error handling

## Component Development Frameworks

### TypeScript React Component Generator
```typescript
// frontend/componentGenerator.ts

export interface ComponentConfig {
  name: string;
  description: string;
  category: 'form' | 'layout' | 'feedback' | 'navigation' | 'data' | 'media';
  props: PropConfig[];
  hooks?: HookConfig[];
  styling: 'css-modules' | 'styled-components' | 'tailwind' | 'inline';
  accessibility: AccessibilityConfig;
  responsive: ResponsiveConfig;
  testing: boolean;
  stories: boolean;
}

export interface PropConfig {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export interface HookConfig {
  name: string;
  type: 'useState' | 'useEffect' | 'useCallback' | 'useMemo' | 'useRef' | 'custom';
  purpose: string;
  dependencies?: string[];
}

export interface AccessibilityConfig {
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  focusManagement: boolean;
  colorContrast: 'AA' | 'AAA' | 'none';
}

export interface ResponsiveConfig {
  breakpoints: boolean;
  mobileFirst: boolean;
  fluidLayout: boolean;
  adaptiveImages: boolean;
  touchTargets: boolean;
}

export class ComponentGenerator {
  private componentTemplates: Map<string, string> = new Map();
  private designTokens: DesignTokenManager;

  constructor(designTokens?: DesignTokenManager) {
    this.designTokens = designTokens || new DesignTokenManager();
    this.initializeTemplates();
  }

  generateComponent(config: ComponentConfig): string {
    const template = this.componentTemplates.get(config.category);
    if (!template) {
      throw new Error(`No template found for category: ${config.category}`);
    }

    let componentCode = this.processTemplate(template, config);

    // Add imports
    const imports = this.generateImports(config);
    componentCode = `${imports}\n\n${componentCode}`;

    // Add exports
    const exports = this.generateExports(config);
    componentCode = `${componentCode}\n\n${exports}`;

    return componentCode;
  }

  private processTemplate(template: string, config: ComponentConfig): string {
    let processed = template;

    // Replace basic placeholders
    processed = processed.replace(/{{COMPONENT_NAME}}/g, config.name);
    processed = processed.replace(/{{COMPONENT_DESCRIPTION}}/g, config.description);

    // Generate props interface
    const propsInterface = this.generatePropsInterface(config);
    processed = processed.replace(/{{PROPS_INTERFACE}}/g, propsInterface);

    // Generate hooks
    const hooksCode = this.generateHooksCode(config);
    processed = processed.replace(/{{HOOKS_CODE}}/g, hooksCode);

    // Generate accessibility attributes
    const accessibilityAttrs = this.generateAccessibilityAttributes(config);
    processed = processed.replace(/{{ACCESSIBILITY_ATTRS}}/g, accessibilityAttrs);

    // Generate responsive classes
    const responsiveClasses = this.generateResponsiveClasses(config);
    processed = processed.replace(/{{RESPONSIVE_CLASSES}}/g, responsiveClasses);

    return processed;
  }

  private generatePropsInterface(config: ComponentConfig): string {
    const props = config.props.map(prop => {
      let propDefinition = `  ${prop.name}`;

      if (!prop.required) {
        propDefinition += '?';
      }

      propDefinition += `: ${prop.type}`;

      if (prop.defaultValue !== undefined) {
        propDefinition += ` = ${this.formatDefaultValue(prop.defaultValue, prop.type)}`;
      }

      propDefinition += `; // ${prop.description}`;

      return propDefinition;
    });

    return `export interface ${config.name}Props {\n${props.join('\n')}\n}`;
  }

  private generateHooksCode(config: ComponentConfig): string {
    if (!config.hooks || config.hooks.length === 0) {
      return '';
    }

    return config.hooks.map(hook => {
      switch (hook.type) {
        case 'useState':
          return `  const [${hook.name}, set${this.capitalize(hook.name)}] = useState<${hook.type}>(${this.getDefaultHookValue(hook)});`;
        case 'useEffect':
          return `  useEffect(() => {\n    // ${hook.purpose}\n  }, [${hook.dependencies?.join(', ') || ''}]);`;
        case 'useCallback':
          return `  const ${hook.name} = useCallback(() => {\n    // ${hook.purpose}\n  }, [${hook.dependencies?.join(', ') || ''}]);`;
        case 'useMemo':
          return `  const ${hook.name} = useMemo(() => {\n    // ${hook.purpose}\n    return ${this.getDefaultHookValue(hook)};\n  }, [${hook.dependencies?.join(', ') || ''}]);`;
        default:
          return `  // Custom hook: ${hook.name}`;
      }
    }).join('\n');
  }

  private generateAccessibilityAttributes(config: ComponentConfig): string {
    const attrs: string[] = [];

    if (config.accessibility.role) {
      attrs.push(`role="${config.accessibility.role}"`);
    }

    if (config.accessibility.ariaLabel) {
      attrs.push(`aria-label="${config.accessibility.ariaLabel}"`);
    }

    if (config.accessibility.ariaDescribedBy) {
      attrs.push(`aria-describedby="${config.accessibility.ariaDescribedBy}"`);
    }

    if (config.accessibility.keyboardNavigation) {
      attrs.push('tabIndex={0}');
      attrs.push('onKeyDown={handleKeyDown}');
    }

    return attrs.length > 0 ? attrs.join(' ') : '';
  }

  private generateResponsiveClasses(config: ComponentConfig): string {
    if (!config.responsive.breakpoints) {
      return '';
    }

    switch (config.styling) {
      case 'tailwind':
        return 'className="w-full md:w-auto lg:w-full"';
      case 'styled-components':
        return 'className={responsiveClasses}';
      default:
        return 'style={responsiveStyles}';
    }
  }

  private generateImports(config: ComponentConfig): string {
    const imports: string[] = [];

    // React imports
    imports.push("import React, { useState, useEffect, useCallback, useMemo } from 'react';");

    // Styling imports
    switch (config.styling) {
      case 'styled-components':
        imports.push("import styled from 'styled-components';");
        break;
      case 'css-modules':
        imports.push(`import styles from './${config.name}.module.css';`);
        break;
    }

    // Accessibility imports
    if (config.accessibility.screenReaderSupport) {
      imports.push("import { useAriaLive } from 'react-aria-live';");
    }

    return imports.join('\n');
  }

  private generateExports(config: ComponentConfig): string {
    let exports = `export default ${config.name};`;

    if (config.testing) {
      exports += `\n\nexport { ${config.name} } from './${config.name}';`;
    }

    return exports;
  }

  private formatDefaultValue(value: any, type: string): string {
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value.toString();
  }

  private getDefaultHookValue(hook: HookConfig): string {
    switch (hook.type) {
      case 'useState':
        return 'null';
      case 'useMemo':
        return '{}';
      default:
        return 'undefined';
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private initializeTemplates(): void {
    // Form component template
    this.componentTemplates.set('form', `
import React from 'react';
{{PROPS_INTERFACE}}

export const {{COMPONENT_NAME}}: React.FC<{{COMPONENT_NAME}}Props> = ({{props.map(p => p.name).join(', ')}}) => {
  {{HOOKS_CODE}}

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission
  };

  const handleChange = (field: string, value: any) => {
    // Handle field changes
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="{{RESPONSIVE_CLASSES}}"
      {{ACCESSIBILITY_ATTRS}}
    >
      {/* Form content here */}
    </form>
  );
};
    `);

    // Layout component template
    this.componentTemplates.set('layout', `
import React from 'react';
{{PROPS_INTERFACE}}

export const {{COMPONENT_NAME}}: React.FC<{{COMPONENT_NAME}}Props> = ({{props.map(p => p.name).join(', ')}}) => {
  {{HOOKS_CODE}}

  return (
    <div
      className="{{RESPONSIVE_CLASSES}}"
      {{ACCESSIBILITY_ATTRS}}
    >
      {/* Layout content here */}
    </div>
  );
};
    `);

    // Navigation component template
    this.componentTemplates.set('navigation', `
import React from 'react';
{{PROPS_INTERFACE}}

export const {{COMPONENT_NAME}}: React.FC<{{COMPONENT_NAME}}Props> = ({{props.map(p => p.name).join(', ')}}) => {
  {{HOOKS_CODE}}

  const handleNavigation = (item: any) => {
    // Handle navigation
  };

  return (
    <nav
      className="{{RESPONSIVE_CLASSES}}"
      {{ACCESSIBILITY_ATTRS}}
    >
      {/* Navigation content here */}
    </nav>
  );
};
    `);
  }
}
```

### Design Token Manager
```typescript
// frontend/designTokenManager.ts

export interface DesignToken {
  name: string;
  value: string | number;
  type: 'color' | 'spacing' | 'typography' | 'borderRadius' | 'shadows' | 'transition';
  category?: string;
  description?: string;
}

export interface Theme {
  name: string;
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, any>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  transitions: Record<string, string>;
  breakpoints: Record<string, string>;
}

export class DesignTokenManager {
  private tokens: Map<string, DesignToken> = new Map();
  private themes: Map<string, Theme> = new Map();
  private currentTheme: string = 'default';

  constructor() {
    this.initializeDefaultTokens();
    this.initializeDefaultTheme();
  }

  private initializeDefaultTokens(): void {
    // Color tokens
    this.addToken({
      name: 'primary-50',
      value: '#eff6ff',
      type: 'color',
      category: 'primary',
      description: 'Primary color, lightest shade'
    });

    this.addToken({
      name: 'primary-500',
      value: '#3b82f6',
      type: 'color',
      category: 'primary',
      description: 'Primary color, base shade'
    });

    this.addToken({
      name: 'primary-900',
      value: '#1e3a8a',
      type: 'color',
      category: 'primary',
      description: 'Primary color, darkest shade'
    });

    // Semantic color tokens
    this.addToken({ name: 'success', value: '#10b981', type: 'color', category: 'semantic' });
    this.addToken({ name: 'warning', value: '#f59e0b', type: 'color', category: 'semantic' });
    this.addToken({ name: 'error', value: '#ef4444', type: 'color', category: 'semantic' });
    this.addToken({ name: 'info', value: '#3b82f6', type: 'color', category: 'semantic' });

    // Spacing tokens
    this.addToken({ name: 'spacing-xs', value: '0.25rem', type: 'spacing', category: 'spacing' });
    this.addToken({ name: 'spacing-sm', value: '0.5rem', type: 'spacing', category: 'spacing' });
    this.addToken({ name: 'spacing-md', value: '1rem', type: 'spacing', category: 'spacing' });
    this.addToken({ name: 'spacing-lg', value: '1.5rem', type: 'spacing', category: 'spacing' });
    this.addToken({ name: 'spacing-xl', value: '2rem', type: 'spacing', category: 'spacing' });
    this.addToken({ name: 'spacing-2xl', value: '3rem', type: 'spacing', category: 'spacing' });

    // Typography tokens
    this.addToken({
      name: 'font-sans',
      value: 'Inter, system-ui, sans-serif',
      type: 'typography',
      category: 'fonts'
    });

    this.addToken({
      name: 'font-mono',
      value: 'JetBrains Mono, Consolas, monospace',
      type: 'typography',
      category: 'fonts'
    });

    // Border radius tokens
    this.addToken({ name: 'radius-sm', value: '0.25rem', type: 'borderRadius', category: 'radius' });
    this.addToken({ name: 'radius-md', value: '0.375rem', type: 'borderRadius', category: 'radius' });
    this.addToken({ name: 'radius-lg', value: '0.5rem', type: 'borderRadius', category: 'radius' });
    this.addToken({ name: 'radius-xl', value: '0.75rem', type: 'borderRadius', category: 'radius' });

    // Shadow tokens
    this.addToken({
      name: 'shadow-sm',
      value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      type: 'shadows',
      category: 'shadows'
    });

    this.addToken({
      name: 'shadow-md',
      value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      type: 'shadows',
      category: 'shadows'
    });

    this.addToken({
      name: 'shadow-lg',
      value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      type: 'shadows',
      category: 'shadows'
    });

    // Transition tokens
    this.addToken({ name: 'transition-fast', value: '150ms ease-in-out', type: 'transition', category: 'transitions' });
    this.addToken({ name: 'transition-normal', value: '250ms ease-in-out', type: 'transition', category: 'transitions' });
    this.addToken({ name: 'transition-slow', value: '350ms ease-in-out', type: 'transition', category: 'transitions' });
  }

  private initializeDefaultTheme(): void {
    const defaultTheme: Theme = {
      name: 'default',
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        },
        semantic: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem'
      },
      typography: {
        fontFamily: {
          sans: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, Consolas, monospace'
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        },
        fontWeight: {
          light: '300',
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        },
        lineHeight: {
          tight: '1.25',
          normal: '1.5',
          relaxed: '1.75'
        }
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      transitions: {
        fast: '150ms ease-in-out',
        normal: '250ms ease-in-out',
        slow: '350ms ease-in-out'
      },
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      }
    };

    this.themes.set('default', defaultTheme);
  }

  addToken(token: DesignToken): void {
    this.tokens.set(token.name, token);
  }

  getToken(name: string): DesignToken | undefined {
    return this.tokens.get(name);
  }

  getTokenValue(name: string): string | number | undefined {
    const token = this.tokens.get(name);
    return token?.value;
  }

  getTheme(name?: string): Theme | undefined {
    return this.themes.get(name || this.currentTheme);
  }

  setCurrentTheme(name: string): void {
    if (this.themes.has(name)) {
      this.currentTheme = name;
    } else {
      throw new Error(`Theme '${name}' not found`);
    }
  }

  generateCSSVariables(themeName?: string): string {
    const theme = this.getTheme(themeName);
    if (!theme) return '';

    let cssVars = ':root {\n';

    // Color variables
    Object.entries(theme.colors).forEach(([category, colors]) => {
      if (typeof colors === 'object') {
        Object.entries(colors).forEach(([shade, value]) => {
          cssVars += `  --color-${category}-${shade}: ${value};\n`;
        });
      } else {
        cssVars += `  --color-${category}: ${colors};\n`;
      }
    });

    // Spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      cssVars += `  --spacing-${key}: ${value};\n`;
    });

    // Typography variables
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      cssVars += `  --font-size-${key}: ${value};\n`;
    });

    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      cssVars += `  --font-weight-${key}: ${value};\n`;
    });

    // Border radius variables
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      cssVars += `  --radius-${key}: ${value};\n`;
    });

    // Shadow variables
    Object.entries(theme.shadows).forEach(([key, value]) => {
      cssVars += `  --shadow-${key}: ${value};\n`;
    });

    // Transition variables
    Object.entries(theme.transitions).forEach(([key, value]) => {
      cssVars += `  --transition-${key}: ${value};\n`;
    });

    cssVars += '}';

    return cssVars;
  }

  generateTailwindConfig(themeName?: string): any {
    const theme = this.getTheme(themeName);
    if (!theme) return {};

    return {
      theme: {
        extend: {
          colors: theme.colors,
          spacing: theme.spacing,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSize,
          fontWeight: theme.typography.fontWeight,
          lineHeight: theme.typography.lineHeight,
          borderRadius: theme.borderRadius,
          boxShadow: theme.shadows,
          transitionDuration: {
            fast: '150ms',
            normal: '250ms',
            slow: '350ms'
          },
          screens: theme.breakpoints
        }
      }
    };
  }

  generateTypeScriptTypes(themeName?: string): string {
    const theme = this.getTheme(themeName);
    if (!theme) return '';

    return `
export interface DesignTokens {
  colors: ${this.generateTypeInterface(theme.colors)};
  spacing: ${this.generateTypeInterface(theme.spacing)};
  typography: {
    fontFamily: ${this.generateTypeInterface(theme.typography.fontFamily)};
    fontSize: ${this.generateTypeInterface(theme.typography.fontSize)};
    fontWeight: ${this.generateTypeInterface(theme.typography.fontWeight)};
    lineHeight: ${this.generateTypeInterface(theme.typography.lineHeight)};
  };
  borderRadius: ${this.generateTypeInterface(theme.borderRadius)};
  shadows: ${this.generateTypeInterface(theme.shadows)};
  transitions: ${this.generateTypeInterface(theme.transitions)};
  breakpoints: ${this.generateTypeInterface(theme.breakpoints)};
}

export const tokens: DesignTokens = ${JSON.stringify(theme, null, 2)};
    `.trim();
  }

  private generateTypeInterface(obj: any): string {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj;
    }

    const entries = Object.entries(obj).map(([key, value]) => {
      const valueType = typeof value === 'object' ? this.generateTypeInterface(value) : typeof value;
      return `  ${key}: ${valueType};`;
    });

    return `{\n${entries.join('\n')}\n}`;
  }
}
```

### Accessibility Compliance Checker
```typescript
// frontend/accessibilityChecker.ts

export interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'wcag' | 'aria' | 'keyboard' | 'color' | 'structure';
  rule: string;
  description: string;
  element?: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  recommendation: string;
  wcagLevel?: 'A' | 'AA' | 'AAA';
}

export interface AccessibilityReport {
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  issues: AccessibilityIssue[];
  score: number;
  wcagCompliance: 'A' | 'AA' | 'AAA' | 'Non-compliant';
}

export class AccessibilityChecker {
  private wcagRules: Map<string, WCAGRule> = new Map();
  private ariaRules: Map<string, ARIARule> = new Map();

  constructor() {
    this.initializeWCAGRules();
    this.initializeARIARules();
  }

  async checkProject(projectPath: string): Promise<AccessibilityReport> {
    console.log('♿ Starting accessibility compliance check...');

    const report: AccessibilityReport = {
      totalIssues: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      issues: [],
      score: 0,
      wcagCompliance: 'Non-compliant'
    };

    // Check different file types
    await this.checkReactComponents(projectPath, report);
    await this.checkHTMLFiles(projectPath, report);
    await this.checkCSSFiles(projectPath, report);
    await this.checkConfigurationFiles(projectPath, report);

    // Calculate score and compliance level
    report.score = this.calculateAccessibilityScore(report);
    report.wcagCompliance = this.determineWCAGCompliance(report);

    console.log(`✅ Accessibility check complete. Found ${report.totalIssues} issues (${report.errors} errors).`);

    return report;
  }

  private async checkReactComponents(projectPath: string, report: AccessibilityReport): Promise<void> {
    const componentFiles = await this.findFiles(projectPath, '**/*.tsx');

    for (const file of componentFiles) {
      await this.checkReactFile(file, report);
    }
  }

  private async checkReactFile(filePath: string, report: AccessibilityReport): Promise<void> {
    try {
      const content = await this.readFile(filePath);
      const lines = content.split('\n');

      // Check for missing alt text on images
      this.checkImageAltText(filePath, lines, report);

      // Check for proper heading structure
      this.checkHeadingStructure(filePath, lines, report);

      // Check for ARIA attributes
      this.checkAriaAttributes(filePath, lines, report);

      // Check for keyboard navigation
      this.checkKeyboardNavigation(filePath, lines, report);

      // Check for form labels
      this.checkFormLabels(filePath, lines, report);

    } catch (error) {
      console.warn(`⚠️ Could not check file ${filePath}: ${error.message}`);
    }
  }

  private checkImageAltText(filePath: string, lines: string[], report: AccessibilityReport): void {
    lines.forEach((line, index) => {
      // Look for img tags without alt
      if (line.includes('<img') && !line.includes('alt=')) {
        report.issues.push({
          id: this.generateIssueId(),
          type: 'error',
          category: 'wcag',
          rule: 'WCAG 1.1.1 - Non-text Content',
          description: 'Image found without alt text',
          element: 'img',
          location: { file: filePath, line: index + 1, column: 0 },
          recommendation: 'Add descriptive alt text to all images',
          wcagLevel: 'A'
        });
        report.errors++;
        report.totalIssues++;
      }

      // Look for empty alt text
      if (line.includes('alt=""') || line.includes("alt=''")) {
        report.issues.push({
          id: this.generateIssueId(),
          type: 'warning',
          category: 'wcag',
          rule: 'WCAG 1.1.1 - Non-text Content',
          description: 'Image with empty alt text detected',
          element: 'img',
          location: { file: filePath, line: index + 1, column: 0 },
          recommendation: 'Use alt="" only for decorative images, otherwise provide descriptive text',
          wcagLevel: 'A'
        });
        report.warnings++;
        report.totalIssues++;
      }
    });
  }

  private checkHeadingStructure(filePath: string, lines: string[], report: AccessibilityReport): void {
    const headingLevels: number[] = [];

    lines.forEach((line, index) => {
      // Look for h1-h6 tags
      const headingMatch = line.match(/<h([1-6])/i);
      if (headingMatch) {
        const level = parseInt(headingMatch[1]);
        headingLevels.push(level);

        // Check for skipped heading levels
        if (headingLevels.length > 1) {
          const prevLevel = headingLevels[headingLevels.length - 2];
          if (level > prevLevel + 1) {
            report.issues.push({
              id: this.generateIssueId(),
              type: 'warning',
              category: 'structure',
              rule: 'WCAG 1.3.1 - Info and Relationships',
              description: `Heading level skipped: from h${prevLevel} to h${level}`,
              element: `h${level}`,
              location: { file: filePath, line: index + 1, column: 0 },
              recommendation: 'Do not skip heading levels (e.g., h1 to h3)',
              wcagLevel: 'AA'
            });
            report.warnings++;
            report.totalIssues++;
          }
        }
      }
    });

    // Check if there are multiple h1 tags
    const h1Count = headingLevels.filter(level => level === 1).length;
    if (h1Count > 1) {
      report.issues.push({
        id: this.generateIssueId(),
        type: 'error',
        category: 'structure',
        rule: 'WCAG 1.3.1 - Info and Relationships',
        description: `Multiple h1 tags found (${h1Count})`,
        element: 'h1',
        location: { file: filePath, line: 0, column: 0 },
        recommendation: 'Use only one h1 tag per page',
        wcagLevel: 'AA'
      });
      report.errors++;
      report.totalIssues++;
    }
  }

  private checkAriaAttributes(filePath: string, lines: string[], report: AccessibilityReport): void {
    lines.forEach((line, index) => {
      // Check for ARIA attributes used on wrong elements
      if (line.includes('aria-label=') && !line.match(/<(button|a|input|textarea|select)/)) {
        report.issues.push({
          id: this.generateIssueId(),
          type: 'warning',
          category: 'aria',
          rule: 'ARIA Best Practices',
          description: 'aria-label used on potentially inappropriate element',
          location: { file: filePath, line: index + 1, column: 0 },
          recommendation: 'Ensure aria-label is used on interactive elements',
          wcagLevel: 'AA'
        });
        report.warnings++;
        report.totalIssues++;
      }

      // Check for aria-required without required attribute
      if (line.includes('aria-required="true"') && !line.includes('required')) {
        report.issues.push({
          id: this.generateIssueId(),
          type: 'info',
          category: 'aria',
          rule: 'ARIA Best Practices',
          description: 'aria-required used without native required attribute',
          location: { file: filePath, line: index + 1, column: 0 },
          recommendation: 'Use native required attribute instead of aria-required when possible',
          wcagLevel: 'AA'
        });
        report.info++;
        report.totalIssues++;
      }
    });
  }

  private checkKeyboardNavigation(filePath: string, lines: string[], report: AccessibilityReport): void {
    lines.forEach((line, index) => {
      // Check for elements without keyboard access
      if (line.includes('onClick') && !line.includes('onKeyDown') && !line.includes('tabIndex')) {
        report.issues.push({
          id: this.generateIssueId(),
          type: 'error',
          category: 'keyboard',
          rule: 'WCAG 2.1.1 - Keyboard',
          description: 'Clickable element without keyboard accessibility',
          location: { file: filePath, line: index + 1, column: 0 },
          recommendation: 'Add keyboard event handlers or ensure element is focusable',
          wcagLevel: 'A'
        });
        report.errors++;
        report.totalIssues++;
      }
    });
  }

  private checkFormLabels(filePath: string, lines: string[], report: AccessibilityReport): void {
    lines.forEach((line, index) => {
      // Check for input fields without labels
      if (line.includes('<input') && !line.includes('id=') && !line.includes('aria-label=')) {
        report.issues.push({
          id: this.generateIssueId(),
          type: 'error',
          category: 'wcag',
          rule: 'WCAG 3.3.2 - Labels or Instructions',
          description: 'Input field without associated label',
          element: 'input',
          location: { file: filePath, line: index + 1, column: 0 },
          recommendation: 'Add label element or aria-label to input fields',
          wcagLevel: 'A'
        });
        report.errors++;
        report.totalIssues++;
      }
    });
  }

  private calculateAccessibilityScore(report: AccessibilityReport): number {
    if (report.totalIssues === 0) return 100;

    // Weight errors more heavily than warnings and info
    const errorWeight = 10;
    const warningWeight = 3;
    const infoWeight = 1;

    const totalDeductions = (report.errors * errorWeight) +
                          (report.warnings * warningWeight) +
                          (report.info * infoWeight);

    const maxPossibleScore = 100;
    const score = Math.max(0, maxPossibleScore - totalDeductions);

    return Math.round(score);
  }

  private determineWCAGCompliance(report: AccessibilityReport): AccessibilityReport['wcagCompliance'] {
    if (report.errors === 0 && report.warnings === 0) {
      return 'AAA';
    } else if (report.errors === 0) {
      return 'AA';
    } else if (report.errors <= 2) {
      return 'A';
    } else {
      return 'Non-compliant';
    }
  }

  private generateIssueId(): string {
    return `A11Y-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private async findFiles(path: string, pattern: string): Promise<string[]> {
    // Implementation would use glob or similar
    return [];
  }

  private async readFile(filePath: string): Promise<string> {
    // Implementation would read file content
    return '';
  }

  private initializeWCAGRules(): void {
    // WCAG 2.1 guidelines
    this.wcagRules.set('perceivable', {
      name: 'Perceivable',
      description: 'Information and user interface components must be presentable to users in ways they can perceive.',
      guidelines: ['1.1', '1.2', '1.3', '1.4']
    });

    this.wcagRules.set('operable', {
      name: 'Operable',
      description: 'User interface components and navigation must be operable.',
      guidelines: ['2.1', '2.2', '2.3', '2.4', '2.5']
    });

    this.wcagRules.set('understandable', {
      name: 'Understandable',
      description: 'Information and the operation of user interface must be understandable.',
      guidelines: ['3.1', '3.2', '3.3']
    });

    this.wcagRules.set('robust', {
      name: 'Robust',
      description: 'Content must be robust enough that it can be interpreted reliably by a wide variety of user agents, including assistive technologies.',
      guidelines: ['4.1']
    });
  }

  private initializeARIARules(): void {
    this.ariaRules.set('roles', {
      name: 'ARIA Roles',
      description: 'Use semantic HTML elements when possible. Use ARIA roles only when necessary.',
      bestPractices: [
        'Prefer native HTML elements over ARIA roles',
        'Use landmark roles (banner, navigation, main, etc.) for page structure',
        'Avoid role="presentation" on interactive elements'
      ]
    });

    this.ariaRules.set('labels', {
      name: 'ARIA Labels',
      description: 'Provide accessible names for elements using aria-label, aria-labelledby, or native HTML labels.',
      bestPractices: [
        'Use aria-label for short descriptive labels',
        'Use aria-labelledby for longer descriptions or multiple elements',
        'Ensure labels are descriptive and unique'
      ]
    });
  }

  generateReport(): string {
    const report = {
      totalIssues: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      issues: [],
      score: 0,
      wcagCompliance: 'Non-compliant' as const
    };

    return `
# Accessibility Compliance Report

**Generated**: ${new Date().toISOString()}
**Score**: ${report.score}/100
**WCAG Compliance**: ${report.wcagCompliance}

## Summary
- Total Issues: ${report.totalIssues}
- Errors: ${report.errors}
- Warnings: ${report.warnings}
- Info: ${report.info}

## Issues by Category
${this.generateCategoryBreakdown(report)}

## Recommendations
${this.generateAccessibilityRecommendations(report)}

## Next Steps
${this.generateNextSteps(report)}
    `.trim();
  }

  private generateCategoryBreakdown(report: AccessibilityReport): string {
    const categories = {
      wcag: report.issues.filter(i => i.category === 'wcag').length,
      aria: report.issues.filter(i => i.category === 'aria').length,
      keyboard: report.issues.filter(i => i.category === 'keyboard').length,
      color: report.issues.filter(i => i.category === 'color').length,
      structure: report.issues.filter(i => i.category === 'structure').length
    };

    return Object.entries(categories)
      .map(([category, count]) => `- ${category}: ${count}`)
      .join('\n');
  }

  private generateAccessibilityRecommendations(report: AccessibilityReport): string {
    const recommendations = [
      'Add alt text to all meaningful images',
      'Ensure proper heading structure (single h1, no skipped levels)',
      'Implement keyboard navigation for all interactive elements',
      'Use semantic HTML elements instead of divs where appropriate',
      'Add form labels to all input fields',
      'Ensure sufficient color contrast (4.5:1 for normal text)',
      'Test with screen readers and keyboard navigation',
      'Implement focus management for dynamic content'
    ];

    return recommendations.map(rec => `- ${rec}`).join('\n');
  }

  private generateNextSteps(report: AccessibilityReport): string {
    if (report.errors > 0) {
      return 'Priority: Fix all errors first, then address warnings and info items.';
    } else if (report.warnings > 0) {
      return 'Priority: Address warnings to improve AA compliance, then handle info items.';
    } else {
      return 'Priority: Address info items to achieve AAA compliance level.';
    }
  }
}

interface WCAGRule {
  name: string;
  description: string;
  guidelines: string[];
}

interface ARIARule {
  name: string;
  description: string;
  bestPractices: string[];
}
```

## Frontend Development Scripts

### Component Generation Script
```bash
#!/bin/bash
# scripts/generate-component.sh

set -e

echo "🎨 React Component Generator"

# Check if component name provided
if [ -z "$1" ]; then
    echo "Usage: $0 <component-name> [type] [options]"
    echo ""
    echo "Types: form, layout, feedback, navigation, data, media"
    echo ""
    echo "Options:"
    echo "  --typescript     Generate TypeScript component (default)"
    echo "  --javascript     Generate JavaScript component"
    echo "  --styled-components   Use styled-components"
    echo "  --tailwind       Use Tailwind CSS"
    echo "  --css-modules    Use CSS modules"
    echo "  --accessibility  Include accessibility features"
    echo "  --responsive     Include responsive design"
    echo "  --testing        Generate test files"
    echo "  --stories        Generate Storybook stories"
    echo ""
    echo "Example: $0 Button feedback --typescript --styled-components --accessibility --testing"
    exit 1
fi

COMPONENT_NAME="$1"
COMPONENT_TYPE="${2:-data}"
USE_TYPESCRIPT=true
STYLING="css-modules"
ACCESSIBILITY=true
RESPONSIVE=true
TESTING=false
STORIES=false

# Parse options
shift 2
while [[ $# -gt 0 ]]; do
    case $1 in
        --typescript)
            USE_TYPESCRIPT=true
            shift
            ;;
        --javascript)
            USE_TYPESCRIPT=false
            shift
            ;;
        --styled-components)
            STYLING="styled-components"
            shift
            ;;
        --tailwind)
            STYLING="tailwind"
            shift
            ;;
        --css-modules)
            STYLING="css-modules"
            shift
            ;;
        --accessibility)
            ACCESSIBILITY=true
            shift
            ;;
        --responsive)
            RESPONSIVE=true
            shift
            ;;
        --testing)
            TESTING=true
            shift
            ;;
        --stories)
            STORIES=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Convert component name to PascalCase
COMPONENT_PASCAL=$(echo "$COMPONENT_NAME" | sed 's/\b\w/\u&/g')

# Create component directory
COMPONENT_DIR="src/components/${COMPONENT_PASCAL}"
mkdir -p "$COMPONENT_DIR"

echo "📁 Creating component in: $COMPONENT_DIR"

# Generate component file
if [ "$USE_TYPESCRIPT" = true ]; then
    COMPONENT_FILE="$COMPONENT_DIR/${COMPONENT_PASCAL}.tsx"
    TEST_FILE="$COMPONENT_DIR/${COMPONENT_PASCAL}.test.tsx"
    STORIES_FILE="$COMPONENT_DIR/${COMPONENT_PASCAL}.stories.tsx"
else
    COMPONENT_FILE="$COMPONENT_DIR/${COMPONENT_PASCAL}.jsx"
    TEST_FILE="$COMPONENT_DIR/${COMPONENT_PASCAL}.test.jsx"
    STORIES_FILE="$COMPONENT_DIR/${COMPONENT_PASCAL}.stories.jsx"
fi

# Generate component code
echo "🔧 Generating component code..."

cat > "$COMPONENT_FILE" << EOF
import React from 'react';

$([ "$USE_TYPESCRIPT" = true ] && echo "interface ${COMPONENT_PASCAL}Props {" || echo "")
$([ "$USE_TYPESCRIPT" = true ] && echo "  /** Component description here */" || echo "")
$([ "$USE_TYPESCRIPT" = true ] && echo "  className?: string;" || echo "")
$([ "$USE_TYPESCRIPT" = true ] && echo "  children?: React.ReactNode;" || echo "")
$([ "$USE_TYPESCRIPT" = true ] && echo "}" || echo "")

export const ${COMPONENT_PASCAL}: $([ "$USE_TYPESCRIPT" = true ] && echo "React.FC<${COMPONENT_PASCAL}Props>" || echo "React.FC") = ({
  $([ "$USE_TYPESCRIPT" = true ] && echo "className = ''," || echo "")
  $([ "$USE_TYPESCRIPT" = true ] && echo "children" || echo "children"),
  ...props
}) => {
  $([ "$ACCESSIBILITY" = true ] && echo "const handleKeyDown = (event: React.KeyboardEvent) => {" || echo "")
  $([ "$ACCESSIBILITY" = true ] && echo "  // Handle keyboard interactions here" || echo "")
  $([ "$ACCESSIBILITY" = true ] && echo "};" || echo "")

  return (
    <div
$([ "$RESPONSIVE" = true ] && [ "$STYLING" = "tailwind" ] && echo "      className=\"w-full md:w-auto\"")
$([ "$STYLING" = "styled-components" ] && echo "      className={styles.container}")
$([ "$STYLING" = "css-modules" ] && echo "      className={styles.container}")
$([ "$ACCESSIBILITY" = true ] && echo "      onKeyDown={handleKeyDown}")
$([ "$ACCESSIBILITY" = true ] && echo "      role=\"${COMPONENT_TYPE}\"")
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

export default ${COMPONENT_PASCAL};
EOF

# Generate styling based on chosen method
case "$STYLING" in
    "styled-components")
        cat > "$COMPONENT_DIR/styles.ts" << EOF
import styled from 'styled-components';

export const Container = styled.div\`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  \${props => props.responsive && `
    @media (min-width: 768px) {
      flex-direction: row;
    }
  `}
\`;
EOF
        ;;
    "css-modules")
        cat > "$COMPONENT_DIR/${COMPONENT_PASCAL}.module.css" << EOF
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .container {
    flex-direction: row;
  }
}
EOF
        ;;
esac

# Generate test file if requested
if [ "$TESTING" = true ]; then
    echo "🧪 Generating test file..."
    cat > "$TEST_FILE" << EOF
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ${COMPONENT_PASCAL} from './${COMPONENT_PASCAL}';

describe('${COMPONENT_PASCAL}', () => {
  it('renders without crashing', () => {
    render(<${COMPONENT_PASCAL} />);
    expect(screen.getByRole('${COMPONENT_TYPE}')).toBeInTheDocument();
  });

$([ "$ACCESSIBILITY" = true ] && echo "  it('supports keyboard navigation', () => {" || echo "")
$([ "$ACCESSIBILITY" = true ] && echo "    render(<${COMPONENT_PASCAL} />);" || echo "")
$([ "$ACCESSIBILITY" = true ] && echo "    const component = screen.getByRole('${COMPONENT_TYPE}');" || echo "")
$([ "$ACCESSIBILITY" = true ] && echo "    expect(component).toHaveAttribute('tabIndex');" || echo "")
$([ "$ACCESSIBILITY" = true ] && echo "  });" || echo "")

  it('applies custom className', () => {
    render(<${COMPONENT_PASCAL} className="custom-class" />);
    const component = screen.getByRole('${COMPONENT_TYPE}');
    expect(component).toHaveClass('custom-class');
  });
});
EOF
fi

# Generate stories file if requested
if [ "$STORIES" = true ]; then
    echo "📖 Generating Storybook stories..."
    cat > "$STORIES_FILE" << EOF
import type { Meta, StoryObj } from '@storybook/react';
import ${COMPONENT_PASCAL} from './${COMPONENT_PASCAL}';

const meta: Meta<typeof ${COMPONENT_PASCAL}> = {
  title: 'Components/${COMPONENT_PASCAL}',
  component: ${COMPONENT_PASCAL},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '${COMPONENT_NAME} content',
  },
};

export const WithCustomClass: Story = {
  args: {
    children: '${COMPONENT_NAME} with custom styling',
    className: 'custom-styling',
  },
};
EOF
fi

# Generate index file
cat > "$COMPONENT_DIR/index.ts" << EOF
export { ${COMPONENT_PASCAL} } from './${COMPONENT_PASCAL}';
export { default } from './${COMPONENT_PASCAL}';
EOF

echo "✅ Component ${COMPONENT_PASCAL} generated successfully!"
echo ""
echo "📁 Files created:"
echo "  - ${COMPONENT_FILE}"
$([ "$STYLING" = "styled-components" ] && echo "  - ${COMPONENT_DIR}/styles.ts")
$([ "$STYLING" = "css-modules" ] && echo "  - ${COMPONENT_DIR}/${COMPONENT_PASCAL}.module.css")
$([ "$TESTING" = true ] && echo "  - ${TEST_FILE}")
$([ "$STORIES" = true ] && echo "  - ${STORIES_FILE}")
echo "  - ${COMPONENT_DIR}/index.ts"

echo ""
echo "🎨 Component features:"
echo "  - Type: ${COMPONENT_TYPE}"
echo "  - TypeScript: $([ "$USE_TYPESCRIPT" = true ] && echo "✅" || echo "❌")"
echo "  - Accessibility: $([ "$ACCESSIBILITY" = true ] && echo "✅" || echo "❌")"
echo "  - Responsive: $([ "$RESPONSIVE" = true ] && echo "✅" || echo "❌")"
echo "  - Testing: $([ "$TESTING" = true ] && echo "✅" || echo "❌")"
echo "  - Stories: $([ "$STORIES" = true ] && echo "✅" || echo "❌")"
echo "  - Styling: ${STYLING}"
echo ""
echo "💡 Next steps:"
echo "  1. Customize the component props and functionality"
echo "  2. Add specific styling and design tokens"
echo "  3. Implement component-specific accessibility features"
echo "  4. Write comprehensive tests for component behavior"
echo "  5. Add to your component library documentation"
```

### Accessibility Audit Script
```bash
#!/bin/bash
# scripts/accessibility-audit.sh

set -e

echo "♿ Starting accessibility audit..."

# Create results directory
mkdir -p accessibility-results

# 1. Check for axe-core accessibility testing
echo "🔍 Checking for automated accessibility testing setup..."
if [ -f "package.json" ]; then
    if grep -q "@axe-core/react" package.json; then
        echo "✅ axe-core found for accessibility testing"
    else
        echo "⚠️ axe-core not found - consider adding for automated accessibility testing"
        echo "   Install with: npm install --save-dev @axe-core/react"
    fi
fi

# 2. Check for accessibility ESLint rules
echo "📋 Checking for accessibility linting rules..."
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
    if grep -q "plugin:jsx-a11y\|eslint-plugin-jsx-a11y" .eslintrc.js .eslintrc.json eslint.config.js 2>/dev/null; then
        echo "✅ JSX accessibility linting rules configured"
    else
        echo "⚠️ JSX accessibility linting rules not found"
        echo "   Consider adding: eslint-plugin-jsx-a11y"
    fi
else
    echo "⚠️ ESLint configuration not found"
fi

# 3. Scan for common accessibility issues
echo "🔍 Scanning for common accessibility issues..."

# Check for missing alt text
echo "  Checking for images without alt text..."
IMG_ISSUES=0
if [ -d "src" ]; then
    while IFS= read -r -d '' file; do
        if grep -q "<img.*[^>]*>" "$file" 2>/dev/null; then
            if grep -v "alt=" "$file" | grep -q "<img"; then
                echo "    ⚠️ Images without alt text found in: $file"
                ((IMG_ISSUES++))
            fi
        fi
    done < <(find src -name "*.jsx" -o -name "*.tsx" -print0 2>/dev/null)
fi

if [ $IMG_ISSUES -eq 0 ]; then
    echo "  ✅ No images without alt text found"
fi

# Check for form labels
echo "  Checking for form inputs without labels..."
FORM_ISSUES=0
if [ -d "src" ]; then
    while IFS= read -r -d '' file; do
        if grep -q "<input\|<textarea\|<select" "$file" 2>/dev/null; then
            if grep -v "id=" "$file" | grep -v "aria-label=" "$file" | grep -q "<input\|<textarea\|<select"; then
                echo "    ⚠️ Form inputs without labels found in: $file"
                ((FORM_ISSUES++))
            fi
        fi
    done < <(find src -name "*.jsx" -o -name "*.tsx" -print0 2>/dev/null)
fi

if [ $FORM_ISSUES -eq 0 ]; then
    echo "  ✅ All form inputs have labels"
fi

# 4. Check for semantic HTML
echo "📄 Checking for semantic HTML usage..."
echo "  Checking for proper heading structure..."
if [ -d "src" ]; then
    H1_COUNT=$(find src -name "*.jsx" -o -name "*.tsx" -exec grep -l "<h1\|<H1" {} \; | wc -l)
    if [ "$H1_COUNT" -gt 1 ]; then
        echo "    ⚠️ Multiple h1 tags found ($H1_COUNT files with h1 tags)"
    else
        echo "    ✅ Single h1 tag usage looks good"
    fi
fi

# 5. Check for focus management
echo "🎯 Checking for focus management..."
if [ -d "src" ]; then
    FOCUS_ISSUES=0
    while IFS= read -r -d '' file; do
        if grep -q "onClick\|onKeyDown\|onFocus" "$file" 2>/dev/null; then
            if ! grep -q "tabIndex\|focusable\|keyboard" "$file"; then
                echo "    ⚠️ Interactive elements without keyboard navigation found in: $file"
                ((FOCUS_ISSUES++))
            fi
        fi
    done < <(find src -name "*.jsx" -o -name "*.tsx" -print0 2>/dev/null)
fi

if [ $FOCUS_ISSUES -eq 0 ]; then
    echo "    ✅ Focus management looks good"
fi

# 6. Check color contrast (if possible)
echo "🎨 Checking for color contrast configuration..."
if [ -f "tailwind.config.js" ] || [ -f "tailwind.config.ts" ]; then
    if grep -q "contrast\|accessibility" tailwind.config.js tailwind.config.ts 2>/dev/null; then
        echo "    ✅ Color contrast configuration found"
    else
        echo "    ⚠️ Consider adding color contrast configuration"
        echo "       Add plugins like '@tailwindcss/contrast' for color checking"
    fi
fi

# 7. Generate accessibility report
echo "📊 Generating accessibility audit report..."
{
    echo "# Accessibility Audit Report"
    echo "Generated: $(date)"
    echo ""
    echo "## Summary"
    echo "- Images without alt text: $IMG_ISSUES"
    echo "- Form inputs without labels: $FORM_ISSUES"
    echo "- Focus management issues: $FOCUS_ISSUES"
    echo ""
    echo "## Findings"

    if [ $IMG_ISSUES -gt 0 ]; then
        echo "### Images"
        echo "- ⚠️ $IMG_ISSUES files contain images without alt text"
        echo "- 💡 Add descriptive alt text to all meaningful images"
        echo "- 💡 Use alt=\"\" for decorative images only"
        echo ""
    fi

    if [ $FORM_ISSUES -gt 0 ]; then
        echo "### Forms"
        echo "- ⚠️ $FORM_ISSUES files contain form inputs without labels"
        echo "- 💡 Use label elements with htmlFor attributes"
        echo "- 💡 Add aria-label for complex form controls"
        echo ""
    fi

    if [ $FOCUS_ISSUES -gt 0 ]; then
        echo "### Keyboard Navigation"
        echo "- ⚠️ $FOCUS_ISSUES files have focus management issues"
        echo "- 💡 Add tabIndex to interactive elements"
        echo "- 💡 Implement keyboard event handlers"
        echo "- 💡 Test navigation with Tab key"
        echo ""
    fi

    echo "## Recommendations"
    echo "1. Implement automated accessibility testing with axe-core"
    echo "2. Add JSX accessibility linting rules"
    echo "3. Test with screen readers (NVDA, VoiceOver)"
    echo "4. Test keyboard navigation thoroughly"
    echo "5. Use semantic HTML elements appropriately"
    echo "6. Ensure sufficient color contrast (4.5:1 minimum)"
    echo "7. Add focus indicators for interactive elements"
    echo ""
    echo "## Tools to Install"
    echo "- npm install --save-dev @axe-core/react"
    echo "- npm install --save-dev eslint-plugin-jsx-a11y"
    echo "- npm install --save-dev @storybook/addon-a11y"
    echo ""
    echo "## WCAG 2.1 Compliance Levels"
    echo "- **A**: Basic accessibility (required)"
    echo "- **AA**: Enhanced accessibility (recommended)"
    echo "- **AAA**: Advanced accessibility (ideal)"
    echo ""
    echo "## Next Steps"
    echo "1. Fix all identified issues"
    echo "2. Set up automated accessibility testing in CI/CD"
    echo "3. Conduct manual accessibility testing"
    echo "4. Regular accessibility audits with users"
    echo "5. Monitor accessibility compliance over time"
} > accessibility-results/README.md

TOTAL_ISSUES=$((IMG_ISSUES + FORM_ISSUES + FOCUS_ISSUES))
echo "✅ Accessibility audit complete"
echo "📊 Total issues found: $TOTAL_ISSUES"
echo "📋 Detailed report available at: accessibility-results/README.md"

if [ $TOTAL_ISSUES -eq 0 ]; then
    echo "🎉 Great job! No major accessibility issues found."
else
    echo "⚠️ Please review and fix the identified accessibility issues."
fi
```

This comprehensive UX/UI Design & Frontend Development skill provides automated component generation, design token management, accessibility compliance checking, and frontend development workflows, enabling systematic creation of accessible, responsive, and well-designed user interfaces.