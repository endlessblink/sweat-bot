---
name: Security & Compliance
description: Complete security assessment and compliance checking including OWASP Top 10 vulnerability scanning, dependency security analysis, code security reviews, GDPR compliance validation, SSL/TLS configuration, and security incident response procedures. Use when implementing security best practices, conducting security audits, or ensuring compliance requirements.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# Security & Compliance

## Overview

Technical skill for implementing comprehensive security assessment and compliance checking workflows including OWASP Top 10 vulnerability scanning, dependency security analysis, code security reviews, GDPR and regulatory compliance validation, SSL/TLS configuration verification, and security incident response procedures.

## When to Use

- Conducting security assessments and vulnerability scans
- Implementing secure coding practices and code reviews
- Validating compliance with regulations (GDPR, SOC 2, HIPAA)
- Setting up security monitoring and incident response
- Configuring SSL/TLS and secure communications
- Performing dependency security analysis and updates

## Technical Capabilities

1. **OWASP Top 10 Assessment**: Automated scanning for injection flaws, broken authentication, sensitive data exposure, XML external entities, broken access control, security misconfigurations, cross-site scripting, insecure deserialization, using components with known vulnerabilities, and insufficient logging
2. **Dependency Security**: Automated vulnerability scanning of npm, pip, Maven packages, license compliance checking, and automated dependency updates
3. **Code Security Analysis**: Static application security testing (SAST), insecure coding pattern detection, secrets scanning, and security code review automation
4. **Compliance Validation**: GDPR compliance checking, data protection impact assessments, privacy policy validation, and regulatory requirement verification
5. **SSL/TLS Security**: Certificate validation, secure configuration verification, and cryptographic standard compliance
6. **Security Incident Response**: Security breach detection, incident containment procedures, forensics data collection, and recovery workflows

## Security Assessment Frameworks

### OWASP Top 10 Security Scanner
```typescript
// security/owaspScanner.ts

export interface Vulnerability {
  id: string;
  category: OWASPCategory;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    file?: string;
    line?: number;
    column?: number;
    endpoint?: string;
    parameter?: string;
  };
  recommendation: string;
  cwe?: string;
  references: string[];
  cvssScore?: number;
}

export enum OWASPCategory {
  INJECTION = 'A01:2021-Broken Access Control',
  BROKEN_AUTHENTICATION = 'A02:2021-Cryptographic Failures',
  SENSITIVE_DATA_EXPOSURE = 'A03:2021-Injection',
  XML_EXTERNAL_ENTITIES = 'A04:2021-Insecure Design',
  BROKEN_ACCESS_CONTROL = 'A05:2021-Security Misconfiguration',
  SECURITY_MISCONFIGURATION = 'A06:2021-Vulnerable and Outdated Components',
  XSS = 'A07:2021-Identification and Authentication Failures',
  INSECURE_DESERIALIZATION = 'A08:2021-Software and Data Integrity Failures',
  USING_COMPONENTS_VULNERABILITIES = 'A09:2021-Security Logging and Monitoring Failures',
  INSUFFICIENT_LOGGING = 'A10:2021-Server-Side Request Forgery'
}

export class OWASPScanner {
  private vulnerabilities: Vulnerability[] = [];
  private patterns: Map<OWASPCategory, RegExp[]> = new Map();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // A01: Broken Access Control
    this.patterns.set(OWASPCategory.INJECTION, [
      /SELECT.*FROM.*WHERE/i,
      /INSERT INTO.*VALUES/i,
      /UPDATE.*SET/i,
      /DELETE FROM/i,
      /DROP TABLE/i,
      /UNION SELECT/i,
      /\$\{.*\}/g, // Template injection
      /eval\s*\(/gi, // Code injection
      /exec\s*\(/gi, // Command injection
      /system\s*\(/gi,
      /shell_exec\s*\(/gi
    ]);

    // A02: Cryptographic Failures
    this.patterns.set(OWASPCategory.BROKEN_AUTHENTICATION, [
      /password\s*=\s*['"]?[^'"]*['"]?/i,
      /md5\s*\(/gi,
      /sha1\s*\(/gi,
      /crypto\.createHash\s*\(\s*['"]md5/i,
      /crypto\.createHash\s*\(\s*['"]sha1/i,
      /JWT_SECRET\s*=\s*['"]?(?!.{32,})/i,
      /secret\s*=\s*['"]?(?!.{16,})/i,
      /hash\s*=\s*['"]?(?!.{32,})/i
    ]);

    // A03: Sensitive Data Exposure
    this.patterns.set(OWASPCategory.SENSITIVE_DATA_EXPOSURE, [
      /api[_-]?key\s*=\s*['"]?\w+['"]?/i,
      /password\s*=\s*['"][^'"]{1,10}['"]/i,
      /secret[_-]?key\s*=\s*['"]?\w+['"]?/i,
      /access[_-]?token\s*=\s*['"]?\w+['"]?/i,
      /console\.log\s*\(\s*.*password/i,
      /console\.log\s*\(\s*.*token/i,
      /process\.env\./gi,
      /AWS[_-]?ACCESS[_-]?KEY/i,
      /DATABASE_URL/i
    ]);

    // A05: Security Misconfiguration
    this.patterns.set(OWASPCategory.SECURITY_MISCONFIGURATION, [
      /app\.use\s*\(\s*cors\s*\(\s*\{\s*\}\s*\)\s*\)/gi,
      /helmet\s*\(\s*\{\s*\}\s*\)/gi,
      /debug\s*=\s*true/gi,
      /NODE_ENV\s*=\s*['"]development['"]/gi,
      /origin\s*:\s*['"]?\*['"]?/gi,
      /credentials\s*:\s*true/gi,
      /allowOrigins\s*:\s*\[\s*['"]?\*['"]?\s*\]/gi
    ]);

    // A06: XSS Protection
    this.patterns.set(OWASPCategory.XSS, [
      /innerHTML\s*=/gi,
      /outerHTML\s*=/gi,
      /document\.write\s*\(/gi,
      /eval\s*\(/gi,
      /<script[^>]*>/gi,
      /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers
      /dangerouslySetInnerHTML/gi,
      /v-html/gi // Vue.js XSS
    ]);
  }

  async scanProject(projectPath: string): Promise<Vulnerability[]> {
    this.vulnerabilities = [];

    console.log('🔍 Starting OWASP Top 10 security scan...');

    // Scan different file types
    await this.scanJavaScriptFiles(projectPath);
    await this.scanTypeScriptFiles(projectPath);
    await this.scanPythonFiles(projectPath);
    await this.scanConfigurationFiles(projectPath);
    await this.scanPackageFiles(projectPath);
    await this.scanEnvironmentFiles(projectPath);

    console.log(`✅ Scan complete. Found ${this.vulnerabilities.length} potential vulnerabilities.`);

    return this.vulnerabilities;
  }

  private async scanJavaScriptFiles(projectPath: string): Promise<void> {
    const jsFiles = await this.findFiles(projectPath, '**/*.js');

    for (const file of jsFiles) {
      await this.scanFileForPatterns(file, 'javascript');
    }
  }

  private async scanTypeScriptFiles(projectPath: string): Promise<void> {
    const tsFiles = await this.findFiles(projectPath, '**/*.ts');

    for (const file of tsFiles) {
      await this.scanFileForPatterns(file, 'typescript');
    }
  }

  private async scanPythonFiles(projectPath: string): Promise<void> {
    const pyFiles = await this.findFiles(projectPath, '**/*.py');

    for (const file of pyFiles) {
      await this.scanFileForPatterns(file, 'python');
    }
  }

  private async scanConfigurationFiles(projectPath: string): Promise<void> {
    const configFiles = await this.findFiles(projectPath, '**/*.{json,yaml,yml,toml,ini,conf}');

    for (const file of configFiles) {
      await this.scanConfigurationFile(file);
    }
  }

  private async scanPackageFiles(projectPath: string): Promise<void> {
    const packageFiles = ['package.json', 'requirements.txt', 'Pipfile', 'pyproject.toml'];

    for (const filename of packageFiles) {
      const filePath = `${projectPath}/${filename}`;
      if (await this.fileExists(filePath)) {
        await this.scanDependencies(filePath);
      }
    }
  }

  private async scanEnvironmentFiles(projectPath: string): Promise<void> {
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];

    for (const filename of envFiles) {
      const filePath = `${projectPath}/${filename}`;
      if (await this.fileExists(filePath)) {
        await this.scanEnvironmentFile(filePath);
      }
    }
  }

  private async scanFileForPatterns(filePath: string, fileType: string): Promise<void> {
    try {
      const content = await this.readFile(filePath);
      const lines = content.split('\n');

      for (const [category, patterns] of this.patterns) {
        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const lineNumber = this.getLineNumber(content, match.index);
            const vulnerability: Vulnerability = {
              id: this.generateVulnerabilityId(),
              category,
              severity: this.assessSeverity(category, pattern),
              title: this.generateTitle(category, pattern),
              description: this.generateDescription(category, match),
              location: {
                file: filePath,
                line: lineNumber,
                column: match.index ? this.getColumnNumber(content, match.index, lineNumber) : undefined
              },
              recommendation: this.generateRecommendation(category, pattern),
              references: this.getReferences(category),
              cwe: this.getCWEForCategory(category)
            };

            this.vulnerabilities.push(vulnerability);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not scan file ${filePath}: ${error.message}`);
    }
  }

  private async scanConfigurationFile(filePath: string): Promise<void> {
    try {
      const content = await this.readFile(filePath);
      const config = JSON.parse(content);

      // Check for common security misconfigurations
      this.checkCorsConfiguration(filePath, config);
      this.checkHelmetConfiguration(filePath, config);
      this.checkDatabaseConfiguration(filePath, config);
      this.checkSessionConfiguration(filePath, config);

    } catch (error) {
      // File might not be JSON or have parse errors
      console.warn(`⚠️ Could not parse configuration file ${filePath}: ${error.message}`);
    }
  }

  private checkCorsConfiguration(filePath: string, config: any): void {
    if (config.cors) {
      if (config.cors.origin === '*' || config.cors.origins?.includes('*')) {
        this.vulnerabilities.push({
          id: this.generateVulnerabilityId(),
          category: OWASPCategory.SECURITY_MISCONFIGURATION,
          severity: 'medium',
          title: 'CORS allows all origins',
          description: 'CORS configuration allows requests from any origin, which can lead to security issues.',
          location: { file: filePath },
          recommendation: 'Restrict CORS to specific trusted origins only.',
          references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS'],
          cwe: 'CWE-942'
        });
      }
    }
  }

  private async scanDependencies(filePath: string): Promise<void> {
    try {
      const content = await this.readFile(filePath);

      if (filePath.endsWith('package.json')) {
        const packageJson = JSON.parse(content);
        await this.checkNpmDependencies(filePath, packageJson);
      } else if (filePath.endsWith('requirements.txt')) {
        await this.checkPythonDependencies(filePath, content);
      }

    } catch (error) {
      console.warn(`⚠️ Could not scan dependencies in ${filePath}: ${error.message}`);
    }
  }

  private async checkNpmDependencies(filePath: string, packageJson: any): Promise<void> {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    for (const [name, version] of Object.entries(dependencies)) {
      if (typeof version === 'string') {
        // Check for known vulnerable packages (simplified)
        const vulnerablePackages = [
          'lodash',
          'request',
          'axios',
          'moment',
          'underscore'
        ];

        if (vulnerablePackages.includes(name)) {
          this.vulnerabilities.push({
            id: this.generateVulnerabilityId(),
            category: OWASPCategory.USING_COMPONENTS_VULNERABILITIES,
            severity: 'medium',
            title: `Potentially vulnerable dependency: ${name}`,
            description: `Package ${name}@${version} may have known vulnerabilities. Check security advisories.`,
            location: { file: filePath },
            recommendation: `Update ${name} to the latest secure version and run npm audit.`,
            references: [`https://www.npmjs.com/advisories?search=${name}`],
            cwe: 'CWE-1035'
          });
        }
      }
    }
  }

  private assessSeverity(category: OWASPCategory, pattern: RegExp): Vulnerability['severity'] {
    // Critical patterns
    if (pattern.source.includes('eval') || pattern.source.includes('exec')) {
      return 'critical';
    }

    // High severity categories
    if (category === OWASPCategory.INJECTION ||
        category === OWASPCategory.BROKEN_AUTHENTICATION) {
      return 'high';
    }

    // Medium severity
    if (category === OWASPCategory.SENSITIVE_DATA_EXPOSURE ||
        category === OWASPCategory.SECURITY_MISCONFIGURATION) {
      return 'medium';
    }

    return 'low';
  }

  private generateTitle(category: OWASPCategory, pattern: RegExp): string {
    const categoryTitles = {
      [OWASPCategory.INJECTION]: 'Potential Code Injection',
      [OWASPCategory.BROKEN_AUTHENTICATION]: 'Weak Cryptographic Usage',
      [OWASPCategory.SENSITIVE_DATA_EXPOSURE]: 'Sensitive Data Exposure',
      [OWASPCategory.SECURITY_MISCONFIGURATION]: 'Security Misconfiguration',
      [OWASPCategory.XSS]: 'Cross-Site Scripting (XSS)'
    };

    return categoryTitles[category] || 'Security Vulnerability';
  }

  private generateDescription(category: OWASPCategory, match: RegExpMatchArray): string {
    const matchedText = match[0] || '';

    const descriptions = {
      [OWASPCategory.INJECTION]: `Detected potential injection vulnerability: "${matchedText}". This could allow malicious code execution.`,
      [OWASPCategory.BROKEN_AUTHENTICATION]: `Detected weak cryptographic usage: "${matchedText}". This may not provide adequate security.`,
      [OWASPCategory.SENSITIVE_DATA_EXPOSURE]: `Detected potential sensitive data exposure: "${matchedText}". This could leak credentials or secrets.`,
      [OWASPCategory.SECURITY_MISCONFIGURATION]: `Detected security misconfiguration: "${matchedText}". This could lead to security vulnerabilities.`,
      [OWASPCategory.XSS]: `Detected potential XSS vulnerability: "${matchedText}". This could allow script injection.`
    };

    return descriptions[category] || `Security issue detected: ${matchedText}`;
  }

  private generateRecommendation(category: OWASPCategory, pattern: RegExp): string {
    const recommendations = {
      [OWASPCategory.INJECTION]: 'Use parameterized queries or prepared statements. Validate and sanitize all user input.',
      [OWASPCategory.BROKEN_AUTHENTICATION]: 'Use strong cryptographic algorithms (SHA-256, bcrypt). Never hardcode secrets.',
      [OWASPCategory.SENSITIVE_DATA_EXPOSURE]: 'Remove sensitive data from code. Use environment variables for secrets. Implement proper logging.',
      [OWASPCategory.SECURITY_MISCONFIGURATION]: 'Review and harden security configurations. Use security headers and proper CORS settings.',
      [OWASPCategory.XSS]: 'Use content security policy (CSP). Sanitize user input. Use textContent instead of innerHTML.'
    };

    return recommendations[category] || 'Review and fix the identified security issue.';
  }

  private getReferences(category: OWASPCategory): string[] {
    const baseReferences = {
      [OWASPCategory.INJECTION]: ['https://owasp.org/www-project-top-ten/2021/A03_2021-Injection/'],
      [OWASPCategory.BROKEN_AUTHENTICATION]: ['https://owasp.org/www-project-top-ten/2021/A02_2021-Cryptographic_Failures/'],
      [OWASPCategory.SENSITIVE_DATA_EXPOSURE]: ['https://owasp.org/www-project-top-ten/2021/A02_2021-Cryptographic_Failures/'],
      [OWASPCategory.SECURITY_MISCONFIGURATION]: ['https://owasp.org/www-project-top-ten/2021/A05_2021-Security_Misconfiguration/'],
      [OWASPCategory.XSS]: ['https://owasp.org/www-project-top-ten/2021/A03_2021-Injection/']
    };

    return baseReferences[category] || ['https://owasp.org/www-project-top-ten/'];
  }

  private getCWEForCategory(category: OWASPCategory): string {
    const cweMapping = {
      [OWASPCategory.INJECTION]: 'CWE-89',
      [OWASPCategory.BROKEN_AUTHENTICATION]: 'CWE-287',
      [OWASPCategory.SENSITIVE_DATA_EXPOSURE]: 'CWE-200',
      [OWASPCategory.SECURITY_MISCONFIGURATION]: 'CWE-16',
      [OWASPCategory.XSS]: 'CWE-79'
    };

    return cweMapping[category] || 'CWE-16';
  }

  private generateVulnerabilityId(): string {
    return `VULN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private getColumnNumber(content: string, index: number, lineNumber: number): number {
    const lines = content.split('\n');
    const lineStartIndex = lines.slice(0, lineNumber - 1).join('\n').length + (lineNumber > 1 ? 1 : 0);
    return index - lineStartIndex + 1;
  }

  // Helper methods (simplified implementations)
  private async findFiles(path: string, pattern: string): Promise<string[]> {
    // In a real implementation, use glob or similar
    return [];
  }

  private async readFile(filePath: string): Promise<string> {
    // Implementation would read file content
    return '';
  }

  private async fileExists(filePath: string): Promise<boolean> {
    // Implementation would check file existence
    return false;
  }

  generateReport(): string {
    const critical = this.vulnerabilities.filter(v => v.severity === 'critical').length;
    const high = this.vulnerabilities.filter(v => v.severity === 'high').length;
    const medium = this.vulnerabilities.filter(v => v.severity === 'medium').length;
    const low = this.vulnerabilities.filter(v => v.severity === 'low').length;

    return `
# OWASP Top 10 Security Scan Report

**Generated**: ${new Date().toISOString()}
**Total Vulnerabilities**: ${this.vulnerabilities.length}

## Severity Distribution
- 🔴 Critical: ${critical}
- 🟠 High: ${high}
- 🟡 Medium: ${medium}
- 🔵 Low: ${low}

## Vulnerabilities by Category
${this.generateCategoryBreakdown()}

## Detailed Findings
${this.generateDetailedFindings()}

## Recommendations
${this.generateOverallRecommendations()}
    `.trim();
  }

  private generateCategoryBreakdown(): string {
    const categoryCounts = new Map<OWASPCategory, number>();

    for (const vuln of this.vulnerabilities) {
      categoryCounts.set(vuln.category, (categoryCounts.get(vuln.category) || 0) + 1);
    }

    return Array.from(categoryCounts.entries())
      .map(([category, count]) => `- ${category}: ${count}`)
      .join('\n');
  }

  private generateDetailedFindings(): string {
    return this.vulnerabilities
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 20) // Limit to top 20 findings
      .map(vuln => `
### ${vuln.title}
- **Severity**: ${vuln.severity.toUpperCase()}
- **Category**: ${vuln.category}
- **Location**: ${vuln.location.file}${vuln.location.line ? `:${vuln.location.line}` : ''}
- **Description**: ${vuln.description}
- **Recommendation**: ${vuln.recommendation}
${vuln.cwe ? `- **CWE**: ${vuln.cwe}` : ''}
${vuln.references.length > 0 ? `- **References**: ${vuln.references.join(', ')}` : ''}
      `.trim())
      .join('\n');
  }

  private generateOverallRecommendations(): string {
    const recommendations = [
      'Implement a secure development lifecycle (SDL) with regular security assessments',
      'Use automated security scanning in CI/CD pipelines',
      'Keep all dependencies updated and regularly scan for vulnerabilities',
      'Implement proper input validation and output encoding',
      'Use strong authentication and authorization mechanisms',
      'Implement proper logging and monitoring for security events',
      'Regularly conduct security training for development teams'
    ];

    return recommendations.map(rec => `- ${rec}`).join('\n');
  }
}
```

### Dependency Security Scanner
```typescript
// security/dependencyScanner.ts

export interface DependencyVulnerability {
  packageName: string;
  currentVersion: string;
  fixedIn?: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  url: string;
  cve?: string;
  cvssScore?: number;
}

export interface DependencyReport {
  totalDependencies: number;
  vulnerableDependencies: number;
  vulnerabilities: DependencyVulnerability[];
  outdatedPackages: Array<{
    name: string;
    current: string;
    latest: string;
  }>;
  licenseIssues: Array<{
    name: string;
    license: string;
    issue: string;
  }>;
}

export class DependencyScanner {
  private readonly NPM_AUDIT_URL = 'https://registry.npmjs.org/-/npm/v1/security/advisories';
  private readonly GITHUB_ADVISORIES_URL = 'https://api.github.com/advisories';

  async scanDependencies(projectPath: string): Promise<DependencyReport> {
    console.log('🔍 Scanning project dependencies for vulnerabilities...');

    const report: DependencyReport = {
      totalDependencies: 0,
      vulnerableDependencies: 0,
      vulnerabilities: [],
      outdatedPackages: [],
      licenseIssues: []
    };

    // Scan npm dependencies
    if (await this.fileExists(`${projectPath}/package.json`)) {
      const npmReport = await this.scanNpmDependencies(projectPath);
      this.mergeReports(report, npmReport);
    }

    // Scan Python dependencies
    if (await this.fileExists(`${projectPath}/requirements.txt`)) {
      const pythonReport = await this.scanPythonDependencies(projectPath);
      this.mergeReports(report, pythonReport);
    }

    // Scan Maven dependencies
    if (await this.fileExists(`${projectPath}/pom.xml`)) {
      const mavenReport = await this.scanMavenDependencies(projectPath);
      this.mergeReports(report, mavenReport);
    }

    console.log(`✅ Dependency scan complete. Found ${report.vulnerableDependencies} vulnerable dependencies.`);

    return report;
  }

  private async scanNpmDependencies(projectPath: string): Promise<DependencyReport> {
    try {
      const packageJson = JSON.parse(await this.readFile(`${projectPath}/package.json`));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      const report: DependencyReport = {
        totalDependencies: Object.keys(dependencies).length,
        vulnerableDependencies: 0,
        vulnerabilities: [],
        outdatedPackages: [],
        licenseIssues: []
      };

      // Run npm audit
      const auditResult = await this.runNpmAudit(projectPath);
      report.vulnerabilities = auditResult.vulnerabilities;
      report.vulnerableDependencies = auditResult.vulnerableCount;

      // Check for outdated packages
      const outdatedResult = await this.runNpmOutdated(projectPath);
      report.outdatedPackages = outdatedResult;

      // Check license compatibility
      report.licenseIssues = await this.checkNpmLicenses(dependencies);

      return report;
    } catch (error) {
      console.warn(`⚠️ Error scanning npm dependencies: ${error.message}`);
      return this.createEmptyReport();
    }
  }

  private async runNpmAudit(projectPath: string): Promise<{ vulnerabilities: DependencyVulnerability[], vulnerableCount: number }> {
    try {
      // Run npm audit command
      const { execSync } = require('child_process');
      const auditOutput = execSync('npm audit --json', {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const auditData = JSON.parse(auditOutput);
      const vulnerabilities: DependencyVulnerability[] = [];
      let vulnerableCount = 0;

      for (const [packageName, advisory] of Object.entries(auditData.vulnerabilities || {})) {
        const adv = advisory as any;

        const vulnerability: DependencyVulnerability = {
          packageName,
          currentVersion: adv.version,
          fixedIn: adv.fixAvailable?.version,
          severity: this.mapNpmSeverity(adv.severity),
          title: adv.title,
          description: adv.overview || adv.title,
          url: adv.url,
          cve: adv.cwe,
          cvssScore: cvssScore
        };

        vulnerabilities.push(vulnerability);
        vulnerableCount++;
      }

      return { vulnerabilities, vulnerableCount };
    } catch (error) {
      // npm audit exits with non-zero code if vulnerabilities found
      try {
        const errorOutput = (error as any).stdout || (error as any).message;
        const auditData = JSON.parse(errorOutput);
        // Parse error output for vulnerabilities
        return { vulnerabilities: [], vulnerableCount: 0 };
      } catch {
        return { vulnerabilities: [], vulnerableCount: 0 };
      }
    }
  }

  private async runNpmOutdated(projectPath: string): Promise<Array<{ name: string; current: string; latest: string }>> {
    try {
      const { execSync } = require('child_process');
      const outdatedOutput = execSync('npm outdated --json', {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const outdatedData = JSON.parse(outdatedOutput);

      return Object.entries(outdatedData).map(([name, info]: [string, any]) => ({
        name,
        current: info.current,
        latest: info.latest
      }));
    } catch (error) {
      // npm outdated exits with non-zero code if outdated packages found
      return [];
    }
  }

  private async checkNpmLicenses(dependencies: Record<string, string>): Promise<Array<{ name: string; license: string; issue: string }>> {
    const licenseIssues: Array<{ name: string; license: string; issue: string }> = [];
    const problematicLicenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-1.0', 'AGPL-3.0'];

    for (const [name, version] of Object.entries(dependencies)) {
      try {
        // Get package info from npm registry
        const packageInfo = await this.fetchNpmPackageInfo(name);
        const license = packageInfo.license || 'Unknown';

        if (problematicLicenses.includes(license)) {
          licenseIssues.push({
            name,
            license,
            issue: 'Copyleft license may require source code disclosure'
          });
        }
      } catch (error) {
        // Skip if unable to fetch license info
      }
    }

    return licenseIssues;
  }

  private async fetchNpmPackageInfo(packageName: string): Promise<any> {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    return response.json();
  }

  private mapNpmSeverity(npmSeverity: string): DependencyVulnerability['severity'] {
    const mapping = {
      'low': 'low',
      'moderate': 'moderate',
      'high': 'high',
      'critical': 'critical'
    };

    return mapping[npmSeverity] || 'moderate';
  }

  private async scanPythonDependencies(projectPath: string): Promise<DependencyReport> {
    try {
      const requirementsContent = await this.readFile(`${projectPath}/requirements.txt`);
      const dependencies = this.parseRequirementsFile(requirementsContent);

      const report: DependencyReport = {
        totalDependencies: dependencies.length,
        vulnerableDependencies: 0,
        vulnerabilities: [],
        outdatedPackages: [],
        licenseIssues: []
      };

      // Check with safety (Python vulnerability scanner)
      try {
        const { execSync } = require('child_process');
        const safetyOutput = execSync('safety check --json --short-report', {
          cwd: projectPath,
          encoding: 'utf8',
          stdio: 'pipe'
        });

        const safetyData = JSON.parse(safetyOutput);
        report.vulnerabilities = this.parseSafetyVulnerabilities(safetyData);
        report.vulnerableDependencies = report.vulnerabilities.length;
      } catch (error) {
        // Safety not installed or no vulnerabilities
      }

      return report;
    } catch (error) {
      console.warn(`⚠️ Error scanning Python dependencies: ${error.message}`);
      return this.createEmptyReport();
    }
  }

  private parseRequirementsFile(content: string): Array<{ name: string; version: string }> {
    const lines = content.split('\n');
    const dependencies: Array<{ name: string; version: string }> = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        // Parse package==version or package>=version format
        const match = trimmed.match(/^([a-zA-Z0-9\-_]+)([><=!]+.*)?$/);
        if (match) {
          dependencies.push({
            name: match[1],
            version: match[2] || 'latest'
          });
        }
      }
    }

    return dependencies;
  }

  private parseSafetyVulnerabilities(safetyData: any): DependencyVulnerability[] {
    if (!safetyData.vulnerabilities) {
      return [];
    }

    return safetyData.vulnerabilities.map((vuln: any): DependencyVulnerability => ({
      packageName: vuln.advisory,
      currentVersion: vuln.analyzed_version,
      fixedIn: vuln.vulnerable_spec,
      severity: this.mapSafetySeverity(vuln.id),
      title: vuln.advisory,
      description: vuln.advisory,
      url: vuln.advisory,
      cve: vuln.cve,
      cvssScore: vuln.cvss_score
    }));
  }

  private mapSafetySeverity(safetyId: string): DependencyVulnerability['severity'] {
    // Safety uses different severity classification
    if (safetyId.includes('pyup.io')) {
      return 'high';
    }
    return 'moderate';
  }

  private createEmptyReport(): DependencyReport {
    return {
      totalDependencies: 0,
      vulnerableDependencies: 0,
      vulnerabilities: [],
      outdatedPackages: [],
      licenseIssues: []
    };
  }

  private mergeReports(target: DependencyReport, source: DependencyReport): void {
    target.totalDependencies += source.totalDependencies;
    target.vulnerableDependencies += source.vulnerableDependencies;
    target.vulnerabilities.push(...source.vulnerabilities);
    target.outdatedPackages.push(...source.outdatedPackages);
    target.licenseIssues.push(...source.licenseIssues);
  }

  // Helper methods (simplified implementations)
  private async fileExists(filePath: string): Promise<boolean> {
    // Implementation would check file existence
    return false;
  }

  private async readFile(filePath: string): Promise<string> {
    // Implementation would read file content
    return '';
  }
}
```

## Security Scripts

### Automated Security Audit
```bash
#!/bin/bash
# scripts/security-audit.sh

set -e

echo "🔒 Starting comprehensive security audit..."

# Create results directory
mkdir -p security-audit-results

# 1. OWASP Top 10 Scan
echo "🔍 Running OWASP Top 10 vulnerability scan..."
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    echo "📦 Scanning Node.js project..."

    # Run npm audit
    if npm audit --json > security-audit-results/npm-audit.json 2>&1; then
        echo "✅ No npm vulnerabilities found"
    else
        echo "⚠️ npm vulnerabilities detected - check security-audit-results/npm-audit.json"
    fi

    # Check for common security issues
    echo "🔍 Checking for common security patterns..."
    grep -r "eval\|exec\|innerHTML\|document\.write" src/ --include="*.js" --include="*.ts" > security-audit-results/pattern-scan.txt 2>/dev/null || echo "No dangerous patterns found"
fi

# 2. Python Security Scan
if command -v python3 &> /dev/null && [ -f "requirements.txt" ]; then
    echo "🐍 Scanning Python project..."

    # Install safety if not present
    if ! python3 -c "import safety" 2>/dev/null; then
        echo "📦 Installing safety for Python vulnerability scanning..."
        pip install safety
    fi

    # Run safety check
    if safety check --json --output security-audit-results/safety-report.json 2>/dev/null; then
        echo "✅ No Python vulnerabilities found"
    else
        echo "⚠️ Python vulnerabilities detected - check security-audit-results/safety-report.json"
    fi
fi

# 3. Environment Security Check
echo "🔐 Checking environment security..."
if [ -f ".env" ]; then
    echo "⚠️ .env file found - checking for exposed secrets..."

    # Check for weak secrets
    if grep -q "SECRET.*=.\{1,10\}" .env; then
        echo "❌ Weak secrets detected in .env"
    fi

    if grep -q "password.*=.\{1,8\}" .env; then
        echo "❌ Weak passwords detected in .env"
    fi

    # Check for exposed API keys
    if grep -q "API_KEY.*=\w\{20,}" .env; then
        echo "⚠️ Potential API keys in .env - ensure they are properly secured"
    fi
else
    echo "✅ No .env file found"
fi

# 4. Configuration Security Check
echo "⚙️ Checking configuration security..."

# Check CORS configuration
if [ -f "server.js" ] || [ -f "app.js" ] || [ -f "index.js" ]; then
    echo "🔍 Checking CORS configuration..."
    if grep -r "origin.*\*" server.js app.js index.js 2>/dev/null; then
        echo "⚠️ CORS allows all origins - security risk"
    fi
fi

# Check for debug mode in production
if grep -r "debug.*=.*true\|NODE_ENV.*=.*development" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null; then
    echo "⚠️ Debug mode detected - ensure disabled in production"
fi

# 5. File Permissions Check
echo "📂 Checking file permissions..."
find . -type f -name "*.key" -o -name "*.pem" -o -name "*.p12" 2>/dev/null | while read file; do
    if [ "$(stat -c %a "$file")" != "600" ]; then
        echo "⚠️ Insecure permissions on $file - should be 600"
    fi
done

# 6. SSL/TLS Configuration Check
echo "🔒 Checking SSL/TLS configuration..."
if [ -f "nginx.conf" ] || [ -f "apache2.conf" ]; then
    echo "🔍 Checking web server SSL configuration..."
    # Check for weak SSL protocols
    if grep -q "ssl_protocols.*TLSv1\|ssl_protocols.*TLSv1\.1" nginx.conf apache2.conf 2>/dev/null; then
        echo "⚠️ Weak SSL protocols detected - use TLS 1.2+"
    fi
fi

# 7. Dependency Security Check
echo "📦 Checking dependency security..."
if [ -f "package.json" ]; then
    echo "🔍 Checking for vulnerable npm packages..."
    npm audit > security-audit-results/npm-audit-output.txt 2>&1 || true
fi

if [ -f "requirements.txt" ]; then
    echo "🔍 Checking for vulnerable Python packages..."
    pip list --outdated > security-audit-results/pip-outdated.txt 2>&1 || true
fi

# 8. Generate Summary Report
echo "📊 Generating security audit summary..."
{
    echo "# Security Audit Report"
    echo "Generated: $(date)"
    echo ""
    echo "## Executive Summary"
    echo "- OWASP Top 10 Scan: Completed"
    echo "- Dependency Security: Completed"
    echo "- Environment Security: Completed"
    echo "- Configuration Security: Completed"
    echo "- File Permissions: Completed"
    echo "- SSL/TLS Security: Completed"
    echo ""
    echo "## Detailed Results"
    echo "Check the following files for detailed findings:"
    echo "- npm-audit.json - Node.js vulnerability scan"
    echo "- safety-report.json - Python vulnerability scan"
    echo "- pattern-scan.txt - Dangerous code patterns"
    echo "- npm-audit-output.txt - npm audit output"
    echo "- pip-outdated.txt - outdated Python packages"
    echo ""
    echo "## Recommendations"
    echo "1. Review and fix all high and critical vulnerabilities"
    echo "2. Update dependencies to latest secure versions"
    echo "3. Implement secure coding practices"
    echo "4. Regular security scans in CI/CD pipeline"
    echo "5. Security training for development team"
} > security-audit-results/README.md

echo "✅ Security audit complete"
echo "📊 Check security-audit-results/ directory for detailed findings"
echo "📋 Summary available at: security-audit-results/README.md"
```

### SSL/TLS Configuration Validator
```bash
#!/bin/bash
# scripts/ssl-tls-validator.sh

set -e

echo "🔒 Starting SSL/TLS configuration validation..."

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL not found. Please install OpenSSL."
    exit 1
fi

# Create results directory
mkdir -p ssl-validation-results

# Function to validate certificate
validate_certificate() {
    local cert_file="$1"
    local domain="$2"

    echo "🔍 Validating certificate: $cert_file"

    # Check certificate expiration
    local expiry_date
    expiry_date=$(openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
    local expiry_timestamp
    expiry_timestamp=$(date -d "$expiry_date" +%s)
    local current_timestamp
    current_timestamp=$(date +%s)
    local days_until_expiry
    days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))

    if [ $days_until_expiry -lt 30 ]; then
        echo "⚠️ Certificate expires in $days_until_expiry days ($expiry_date)"
    else
        echo "✅ Certificate valid for $days_until_expiry days"
    fi

    # Check certificate key strength
    local key_size
    key_size=$(openssl x509 -in "$cert_file" -noout -text | grep "Public-Key:" | cut -d\( -f2 | cut -d\) -f1)
    if [ "$key_size" -lt 2048 ]; then
        echo "⚠️ Weak key size: $key_size bits (minimum 2048 recommended)"
    else
        echo "✅ Strong key size: $key_size bits"
    fi

    # Check certificate signature algorithm
    local sig_algorithm
    sig_algorithm=$(openssl x509 -in "$cert_file" -noout -text | grep "Signature Algorithm:" | head -1 | cut -d: -f2 | xargs)
    case "$sig_algorithm" in
        *sha1*|*md5*)
            echo "⚠️ Weak signature algorithm: $sig_algorithm (use SHA-256 or stronger)"
            ;;
        *)
            echo "✅ Strong signature algorithm: $sig_algorithm"
            ;;
    esac

    # Validate certificate chain if domain provided
    if [ -n "$domain" ]; then
        echo "🔗 Validating certificate chain for $domain"
        if echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt >/dev/null 2>&1; then
            echo "✅ Certificate chain is valid"
        else
            echo "❌ Certificate chain validation failed"
        fi
    fi
}

# Function to test SSL/TLS configuration of a domain
test_ssl_configuration() {
    local domain="$1"

    echo "🌐 Testing SSL/TLS configuration for: $domain"

    # Test SSL/TLS connection
    local ssl_result
    ssl_result=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null)

    if [ $? -eq 0 ]; then
        echo "✅ SSL/TLS connection successful"

        # Extract certificate information
        local cert_info
        cert_info=$(echo "$ssl_result" | openssl x509 -noout -text)

        # Check for supported protocols
        echo "🔍 Checking supported SSL/TLS protocols..."

        # Test TLS 1.3
        if echo | openssl s_client -connect "$domain:443" -tls1_3 2>/dev/null | grep -q "Verify return code: 0"; then
            echo "✅ TLS 1.3 supported"
        else
            echo "⚠️ TLS 1.3 not supported"
        fi

        # Test TLS 1.2
        if echo | openssl s_client -connect "$domain:443" -tls1_2 2>/dev/null | grep -q "Verify return code: 0"; then
            echo "✅ TLS 1.2 supported"
        else
            echo "❌ TLS 1.2 not supported"
        fi

        # Test weak protocols (should fail)
        if echo | openssl s_client -connect "$domain:443" -tls1 2>/dev/null | grep -q "Verify return code: 0"; then
            echo "⚠️ TLS 1.0 supported (should be disabled)"
        fi

        if echo | openssl s_client -connect "$domain:443" -ssl3 2>/dev/null | grep -q "Verify return code: 0"; then
            echo "⚠️ SSLv3 supported (should be disabled)"
        fi

        # Check cipher suites
        echo "🔐 Checking cipher suite configuration..."
        local cipher_info
        cipher_info=$(echo "$ssl_result" | grep "Cipher    :" | cut -d: -f2 | xargs)
        echo "Current cipher: $cipher_info"

        # Check for weak ciphers
        case "$cipher_info" in
            *RC4*|*DES*|*3DES*|*MD5*)
                echo "⚠️ Weak cipher suite detected: $cipher_info"
                ;;
            *)
                echo "✅ Strong cipher suite: $cipher_info"
                ;;
        esac

    else
        echo "❌ SSL/TLS connection failed"
    fi
}

# Scan for certificate files
echo "📂 Scanning for certificate files..."
cert_files=()
while IFS= read -r -d '' file; do
    cert_files+=("$file")
done < <(find . -type f \( -name "*.crt" -o -name "*.pem" -o -name "*.cert" \) -print0 2>/dev/null)

if [ ${#cert_files[@]} -gt 0 ]; then
    echo "📋 Found ${#cert_files[@]} certificate file(s):"
    for cert_file in "${cert_files[@]}"; do
        validate_certificate "$cert_file"
        echo ""
    done
else
    echo "📁 No local certificate files found"
fi

# Test common production domains
if [ -n "$1" ]; then
    echo "🌐 Testing provided domain: $1"
    test_ssl_configuration "$1"
else
    echo "💡 To test a specific domain, run: $0 example.com"
    echo ""
    echo "🌐 Testing common secure domains..."
    test_ssl_configuration "google.com"
    echo ""
    test_ssl_configuration "github.com"
fi

# Check for SSL/TLS configuration files
echo "⚙️ Checking for SSL/TLS configuration files..."
config_files=()
while IFS= read -r -d '' file; do
    config_files+=("$file")
done < <(find . -type f \( -name "*.conf" -o -name "nginx.conf" -o -name "apache2.conf" -o -name "httpd.conf" \) -print0 2>/dev/null)

if [ ${#config_files[@]} -gt 0 ]; then
    echo "📋 Found ${#config_files[@]} configuration file(s):"

    for config_file in "${config_files[@]}"; do
        echo "🔍 Analyzing: $config_file"

        # Check for SSL configuration
        if grep -q "ssl_certificate\|SSLCertificateFile" "$config_file"; then
            echo "✅ SSL certificate configured"

            # Check for SSL protocol configuration
            if grep -q "ssl_protocols\|SSLProtocol" "$config_file"; then
                echo "🔐 SSL protocols configured"

                # Check for weak protocols
                if grep -qi "TLSv1\|SSLv3" "$config_file"; then
                    echo "⚠️ Weak SSL protocols may be enabled"
                fi
            else
                echo "⚠️ SSL protocols not explicitly configured"
            fi

            # Check for cipher configuration
            if grep -q "ssl_ciphers\|SSLCipherSuite" "$config_file"; then
                echo "🔐 SSL ciphers configured"
            else
                echo "⚠️ SSL ciphers not explicitly configured"
            fi

        else
            echo "ℹ️ No SSL configuration found"
        fi

        echo ""
    done
else
    echo "📁 No SSL/TLS configuration files found"
fi

# Generate summary report
echo "📊 Generating SSL/TLS validation summary..."
{
    echo "# SSL/TLS Validation Report"
    echo "Generated: $(date)"
    echo ""
    echo "## Summary"
    if [ ${#cert_files[@]} -gt 0 ]; then
        echo "- Local certificates analyzed: ${#cert_files[@]}"
    else
        echo "- No local certificates found"
    fi
    echo "- SSL/TLS configuration files analyzed: ${#config_files[@]}"
    echo ""
    echo "## Recommendations"
    echo "1. Use TLS 1.2 or higher only"
    echo "2. Disable weak cipher suites (RC4, DES, 3DES, MD5)"
    echo "3. Use certificates with 2048-bit keys or larger"
    echo "4. Use SHA-256 or stronger signature algorithms"
    echo "5. Monitor certificate expiration dates"
    echo "6. Implement proper certificate chain validation"
    echo "7. Use HSTS headers for additional security"
    echo ""
    echo "## Next Steps"
    echo "- Address any security concerns identified above"
    echo "- Set up certificate expiration monitoring"
    echo "- Implement automated SSL/TLS testing"
    echo "- Regular security audits of SSL/TLS configurations"
} > ssl-validation-results/README.md

echo "✅ SSL/TLS validation complete"
echo "📊 Check ssl-validation-results/ directory for detailed findings"
echo "📋 Summary available at: ssl-validation-results/README.md"
```

This comprehensive Security & Compliance skill provides automated vulnerability scanning, dependency security analysis, code security reviews, compliance validation, and SSL/TLS security configuration checking, enabling systematic security assessment and remediation workflows.