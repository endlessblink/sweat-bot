---
name: Documentation & Knowledge Management
description: Complete documentation and knowledge management workflows including API documentation generation (OpenAPI/Swagger), README and project documentation creation, code comment standards and implementation, knowledge base organization and maintenance, technical blog post and tutorial creation, and internal documentation workflows. Use when creating technical documentation, setting up knowledge management systems, or maintaining project documentation.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# Documentation & Knowledge Management

## Overview

Technical skill for implementing comprehensive documentation and knowledge management workflows including API documentation generation (OpenAPI/Swagger), README and project documentation creation, code comment standards and implementation, knowledge base organization and maintenance, technical blog post and tutorial creation, and internal documentation workflows.

## When to Use

- Generating API documentation from code annotations and type definitions
- Creating comprehensive README files and project documentation
- Implementing code comment standards and documentation practices
- Setting up knowledge base systems and organizing technical information
- Creating technical tutorials, blog posts, and educational content
- Establishing internal documentation workflows and maintenance procedures

## Technical Capabilities

1. **API Documentation Generation**: OpenAPI/Swagger specification generation, endpoint documentation, schema definitions, interactive API docs
2. **Project Documentation**: README templates, changelog generation, contributing guidelines, architecture documentation
3. **Code Documentation**: Comment standards, JSDoc/TSDoc implementation, inline documentation, code examples
4. **Knowledge Base Management**: Content organization, search optimization, versioning, maintenance workflows
5. **Technical Writing**: Blog post generation, tutorial creation, educational content, documentation templates
6. **Documentation Automation**: Automated generation from code, CI/CD integration, update workflows

## Documentation Generation Frameworks

### API Documentation Generator
```typescript
// documentation/apiDocGenerator.ts

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description: string;
  parameters?: APIParameter[];
  requestBody?: RequestBody;
  responses: Record<string, ApiResponse>;
  tags?: string[];
  deprecated?: boolean;
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description: string;
  required: boolean;
  type: string;
  schema?: any;
  example?: any;
}

export interface RequestBody {
  description: string;
  required: boolean;
  content: Record<string, MediaType>;
}

export interface MediaType {
  schema?: any;
  example?: any;
}

export interface ApiResponse {
  description: string;
  content?: Record<string, MediaType>;
  headers?: Record<string, any>;
}

export interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: {
      name: string;
      email: string;
      url?: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers?: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
    responses?: Record<string, any>;
    parameters?: Record<string, any>;
    examples?: Record<string, any>;
    requestBodies?: Record<string, any>;
    headers?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  tags?: Array<{
    name: string;
    description: string;
  }>;
  security?: Record<string, string[]>;
}

export class APIDocGenerator {
  private endpoints: APIEndpoint[] = [];
  private schemas: Map<string, any> = new Map();
  private examples: Map<string, any> = new Map();

  constructor(private config: {
    title: string;
    version: string;
    description?: string;
    baseUrl?: string;
    contact?: {
      name: string;
      email: string;
      url?: string;
    };
  }) {}

  addEndpoint(endpoint: APIEndpoint): void {
    this.endpoints.push(endpoint);
  }

  addSchema(name: string, schema: any): void {
    this.schemas.set(name, schema);
  }

  addExample(name: string, example: any): void {
    this.examples.set(name, example);
  }

  generateOpenAPISpec(): OpenAPIDocument {
    const paths: Record<string, Record<string, any>> = {};

    // Group endpoints by path
    const pathGroups = new Map<string, APIEndpoint[]>();
    for (const endpoint of this.endpoints) {
      if (!pathGroups.has(endpoint.path)) {
        pathGroups.set(endpoint.path, []);
      }
      pathGroups.get(endpoint.path)!.push(endpoint);
    }

    // Convert to OpenAPI paths format
    for (const [path, endpoints] of pathGroups) {
      paths[path] = {};
      for (const endpoint of endpoints) {
        paths[path][endpoint.method.toLowerCase()] = this.convertEndpointToOpenAPI(endpoint);
      }
    }

    return {
      openapi: '3.0.0',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description,
        contact: this.config.contact
      },
      servers: this.config.baseUrl ? [{
        url: this.config.baseUrl,
        description: 'Production server'
      }] : undefined,
      paths,
      components: {
        schemas: Object.fromEntries(this.schemas),
        examples: Object.fromEntries(this.examples)
      },
      tags: this.generateTags()
    };
  }

  private convertEndpointToOpenAPI(endpoint: APIEndpoint): any {
    const openAPIEndpoint: any = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      parameters: endpoint.parameters?.map(param => this.convertParameterToOpenAPI(param)),
      responses: this.convertResponsesToOpenAPI(endpoint.responses)
    };

    if (endpoint.requestBody) {
      openAPIEndpoint.requestBody = this.convertRequestBodyToOpenAPI(endpoint.requestBody);
    }

    if (endpoint.deprecated) {
      openAPIEndpoint.deprecated = true;
    }

    return openAPIEndpoint;
  }

  private convertParameterToOpenAPI(param: APIParameter): any {
    return {
      name: param.name,
      in: param.in,
      description: param.description,
      required: param.required,
      schema: param.schema || { type: param.type },
      example: param.example
    };
  }

  private convertResponsesToOpenAPI(responses: Record<string, ApiResponse>): Record<string, any> {
    const openAPIResponses: Record<string, any> = {};

    for (const [statusCode, response] of Object.entries(responses)) {
      openAPIResponses[statusCode] = {
        description: response.description
      };

      if (response.content) {
        openAPIResponses[statusCode].content = response.content;
      }

      if (response.headers) {
        openAPIResponses[statusCode].headers = response.headers;
      }
    }

    return openAPIResponses;
  }

  private convertRequestBodyToOpenAPI(requestBody: RequestBody): any {
    return {
      description: requestBody.description,
      required: requestBody.required,
      content: requestBody.content
    };
  }

  private generateTags(): Array<{ name: string; description: string }> {
    const tagSet = new Set<string>();
    for (const endpoint of this.endpoints) {
      if (endpoint.tags) {
        endpoint.tags.forEach(tag => tagSet.add(tag));
      }
    }

    return Array.from(tagSet).map(tag => ({
      name: tag,
      description: `${tag} related endpoints`
    }));
  }

  generateMarkdown(): string {
    const spec = this.generateOpenAPISpec();

    return `
# ${spec.info.title} API Documentation

**Version**: ${spec.info.version}
**Description**: ${spec.info.description || 'API documentation for ' + spec.info.title}

## Base URL
${spec.servers?.map(server => `- ${server.description}: ${server.url}`).join('\n') || 'Not specified'}

## Authentication
${spec.security ? 'This API uses authentication. Contact the development team for access credentials.' : 'No authentication required.'}

## Endpoints

${this.generateEndpointsMarkdown()}

## Data Models

${this.generateSchemasMarkdown()}

## Examples

${this.generateExamplesMarkdown()}

---

*Generated with APIDocGenerator on ${new Date().toISOString()}*
    `.trim();
  }

  private generateEndpointsMarkdown(): string {
    const pathGroups = new Map<string, APIEndpoint[]>();
    for (const endpoint of this.endpoints) {
      if (!pathGroups.has(endpoint.path)) {
        pathGroups.set(endpoint.path, []);
      }
      pathGroups.get(endpoint.path)!.push(endpoint);
    }

    return Array.from(pathGroups.entries())
      .map(([path, endpoints]) => {
        const endpointMarkdown = endpoints.map(endpoint => {
          let markdown = `### ${endpoint.method.toUpperCase()} ${path}\n\n`;
          markdown += `**Summary**: ${endpoint.summary}\n\n`;
          markdown += `**Description**: ${endpoint.description}\n\n`;

          if (endpoint.parameters && endpoint.parameters.length > 0) {
            markdown += '**Parameters**:\n\n';
            markdown += '| Name | Type | In | Required | Description |\n';
            markdown += '|------|------|----|----------|-------------|\n';
            for (const param of endpoint.parameters) {
              markdown += `| ${param.name} | ${param.type} | ${param.in} | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`;
            }
            markdown += '\n';
          }

          if (endpoint.requestBody) {
            markdown += '**Request Body**:\n\n';
            markdown += `**Required**: ${endpoint.requestBody.required ? 'Yes' : 'No'}\n`;
            markdown += `**Description**: ${endpoint.requestBody.description}\n\n`;
          }

          markdown += '**Responses**:\n\n';
          for (const [statusCode, response] of Object.entries(endpoint.responses)) {
            markdown += `- **${statusCode}**: ${response.description}\n`;
          }

          if (endpoint.deprecated) {
            markdown += '\n⚠️ **Deprecated**: This endpoint is deprecated and may be removed in future versions.\n';
          }

          return markdown;
        }).join('\n');

        return endpointMarkdown;
      })
      .join('\n');
  }

  private generateSchemasMarkdown(): string {
    if (this.schemas.size === 0) {
      return 'No data models defined.\n';
    }

    return Array.from(this.schemas.entries())
      .map(([name, schema]) => {
        let markdown = `### ${name}\n\n`;
        markdown += '```json\n';
        markdown += JSON.stringify(schema, null, 2);
        markdown += '\n```\n\n';
        return markdown;
      })
      .join('');
  }

  private generateExamplesMarkdown(): string {
    if (this.examples.size === 0) {
      return 'No examples available.\n';
    }

    return Array.from(this.examples.entries())
      .map(([name, example]) => {
        let markdown = `### ${name}\n\n`;
        markdown += '```json\n';
        markdown += JSON.stringify(example, null, 2);
        markdown += '\n```\n\n';
        return markdown;
      })
      .join('');
  }

  saveToFile(filePath: string, format: 'json' | 'yaml' | 'markdown' = 'json'): void {
    const spec = this.generateOpenAPISpec();
    let content: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(spec, null, 2);
        break;
      case 'yaml':
        // Simple YAML conversion (in production, use a proper YAML library)
        content = this.convertToYAML(spec);
        break;
      case 'markdown':
        content = this.generateMarkdown();
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // In a real implementation, write content to file
    console.log(`Documentation would be saved to: ${filePath}`);
    console.log(`Format: ${format}`);
    console.log(`Content length: ${content.length} characters`);
  }

  private convertToYAML(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
          continue;
        }

        yaml += `${spaces}${key}:`;

        if (typeof value === 'object' && !Array.isArray(value)) {
          yaml += '\n' + this.convertToYAML(value, indent + 1);
        } else if (Array.isArray(value)) {
          yaml += '\n';
          for (const item of value) {
            yaml += `${spaces}  - `;
            if (typeof item === 'object') {
              yaml += '\n' + this.convertToYAML(item, indent + 2);
            } else {
              yaml += `${item}\n`;
            }
          }
        } else {
          yaml += ` ${value}\n`;
        }
      }
    } else {
      yaml += `${spaces}${obj}\n`;
    }

    return yaml;
  }
}
```

### README Generator
```typescript
// documentation/readmeGenerator.ts

export interface ProjectConfig {
  name: string;
  description: string;
  version: string;
  author: {
    name: string;
    email: string;
    url?: string;
  };
  license: string;
  repository: {
    type: string;
    url: string;
  };
  homepage?: string;
  keywords: string[];
  mainSections: string[];
  installation: InstallationSection;
  usage: UsageSection;
  api?: APISection;
  contributing?: ContributingSection;
  licenseSection?: LicenseSection;
  badges?: Badge[];
}

export interface InstallationSection {
  npm: boolean;
  yarn: boolean;
  docker: boolean;
  manual: boolean;
  prerequisites: string[];
  commands: string[];
}

export interface UsageSection {
  basicExample: string;
  advancedExamples?: string[];
  configuration?: {
    environment: string[];
    options: Record<string, any>;
  };
}

export interface APISection {
  documentation: string;
  baseUrl: string;
  authentication?: string;
  examples: APIExample[];
}

export interface APIExample {
  title: string;
  description: string;
  method: string;
  endpoint: string;
  request?: any;
  response?: any;
}

export interface ContributingSection {
  guidelines: string[];
  process: string[];
  codeOfConduct?: string;
}

export interface Badge {
  alt: string;
  src: string;
  href?: string;
}

export class ReadmeGenerator {
  constructor(private config: ProjectConfig) {}

  generate(): string {
    let readme = '';

    // Badges section
    if (this.config.badges && this.config.badges.length > 0) {
      readme += this.generateBadgesSection() + '\n\n';
    }

    // Project title and description
    readme += `# ${this.config.name}\n\n`;
    readme += `${this.config.description}\n\n`;

    // Table of contents
    readme += this.generateTableOfContents() + '\n\n';

    // Installation section
    readme += this.generateInstallationSection() + '\n\n';

    // Usage section
    readme += this.generateUsageSection() + '\n\n';

    // API section (if exists)
    if (this.config.api) {
      readme += this.generateAPISection() + '\n\n';
    }

    // Contributing section (if exists)
    if (this.config.contributing) {
      readme += this.generateContributingSection() + '\n\n';
    }

    // License section
    readme += this.generateLicenseSection() + '\n\n';

    // Footer
    readme += this.generateFooter();

    return readme;
  }

  private generateBadgesSection(): string {
    const badges = this.config.badges!.map(badge => {
      if (badge.href) {
        return `[![${badge.alt}](${badge.src})](${badge.href})`;
      }
      return `![${badge.alt}](${badge.src})`;
    });

    return badges.join(' ');
  }

  private generateTableOfContents(): string {
    let toc = '## Table of Contents\n\n';

    const sections = [
      'Installation',
      'Usage',
      ...(this.config.api ? ['API'] : []),
      ...(this.config.contributing ? ['Contributing'] : []),
      'License'
    ];

    sections.forEach(section => {
      toc += `- [${section}](#${section.toLowerCase().replace(/\s+/g, '-')})\n`;
    });

    return toc;
  }

  private generateInstallationSection(): string {
    let section = '## Installation\n\n';

    // Prerequisites
    if (this.config.installation.prerequisites.length > 0) {
      section += '### Prerequisites\n\n';
      this.config.installation.prerequisites.forEach(prereq => {
        section += `- ${prereq}\n`;
      });
      section += '\n';
    }

    // Installation methods
    section += '### Install\n\n';

    if (this.config.installation.npm) {
      section += '#### npm\n\n';
      section += '```bash\n';
      section += 'npm install ' + this.config.name + '\n';
      section += '```\n\n';
    }

    if (this.config.installation.yarn) {
      section += '#### yarn\n\n';
      section += '```bash\n';
      section += 'yarn add ' + this.config.name + '\n';
      section += '```\n\n';
    }

    if (this.config.installation.docker) {
      section += '#### Docker\n\n';
      section += '```bash\n';
      section += 'docker pull ' + this.config.name + ':' + this.config.version + '\n';
      section += '```\n\n';
    }

    // Manual installation
    if (this.config.installation.manual) {
      section += '#### Manual\n\n';
      this.config.installation.commands.forEach(cmd => {
        section += '```bash\n';
        section += cmd + '\n';
        section += '```\n\n';
      });
    }

    return section;
  }

  private generateUsageSection(): string {
    let section = '## Usage\n\n';

    // Basic example
    section += '### Basic Example\n\n';
    section += '```javascript\n';
    section += this.config.usage.basicExample + '\n';
    section += '```\n\n';

    // Advanced examples
    if (this.config.usage.advancedExamples && this.config.usage.advancedExamples.length > 0) {
      section += '### Advanced Examples\n\n';
      this.config.usage.advancedExamples.forEach((example, index) => {
        section += `#### Example ${index + 1}\n\n`;
        section += '```javascript\n';
        section += example + '\n';
        section += '```\n\n';
      });
    }

    // Configuration
    if (this.config.usage.configuration) {
      section += '### Configuration\n\n';

      if (this.config.usage.configuration.environment.length > 0) {
        section += '#### Environment Variables\n\n';
        section += '| Variable | Description | Default |\n';
        section += '|----------|-------------|---------|\n';
        this.config.usage.configuration.environment.forEach(envVar => {
          section += `| ${envVar} | Description | N/A |\n`;
        });
        section += '\n';
      }

      if (Object.keys(this.config.usage.configuration.options).length > 0) {
        section += '#### Options\n\n';
        section += '```javascript\n';
        section += 'const options = {\n';
        for (const [key, value] of Object.entries(this.config.usage.configuration.options)) {
          section += `  ${key}: ${JSON.stringify(value)},\n`;
        }
        section += '};\n';
        section += '```\n\n';
      }
    }

    return section;
  }

  private generateAPISection(): string {
    const api = this.config.api!;
    let section = '## API\n\n';

    section += `${api.documentation}\n\n`;

    section += '### Base URL\n\n';
    section += '```\n';
    section += api.baseUrl + '\n';
    section += '```\n\n';

    if (api.authentication) {
      section += '### Authentication\n\n';
      section += api.authentication + '\n\n';
    }

    if (api.examples.length > 0) {
      section += '### Examples\n\n';
      api.examples.forEach(example => {
        section += `#### ${example.title}\n\n`;
        section += `${example.description}\n\n`;
        section += `**${example.method}** \`${example.endpoint}\`\n\n`;

        if (example.request) {
          section += '**Request:**\n\n';
          section += '```json\n';
          section += JSON.stringify(example.request, null, 2) + '\n';
          section += '```\n\n';
        }

        if (example.response) {
          section += '**Response:**\n\n';
          section += '```json\n';
          section += JSON.stringify(example.response, null, 2) + '\n';
          section += '```\n\n';
        }
      });
    }

    return section;
  }

  private generateContributingSection(): string {
    const contributing = this.config.contributing!;
    let section = '## Contributing\n\n';

    section += contributing.guidelines + '\n\n';

    if (contributing.process.length > 0) {
      section += '### Process\n\n';
      contributing.process.forEach((step, index) => {
        section += `${index + 1}. ${step}\n`;
      });
      section += '\n';
    }

    if (contributing.codeOfConduct) {
      section += '### Code of Conduct\n\n';
      section += contributing.codeOfConduct + '\n\n';
    }

    return section;
  }

  private generateLicenseSection(): string {
    let section = '## License\n\n';

    if (this.config.licenseSection) {
      section += this.config.licenseSection + '\n\n';
    } else {
      section += `This project is licensed under the ${this.config.license} License.\n\n`;
    }

    return section;
  }

  private generateFooter(): string {
    let footer = '';

    footer += `---\n\n`;
    footer += `**${this.config.name}** © ${new Date().getFullYear()} ${this.config.author.name}\n\n`;

    if (this.config.author.url) {
      footer += `Author: [${this.config.author.name}](${this.config.author.url})\n\n`;
    }

    if (this.config.repository.url) {
      footer += `Repository: ${this.config.repository.url}\n\n`;
    }

    if (this.config.homepage) {
      footer += `Homepage: ${this.config.homepage}\n\n`;
    }

    footer += `*This README was generated automatically.*`;

    return footer;
  }

  saveToFile(filePath: string): void {
    const content = this.generate();
    // In a real implementation, write content to file
    console.log(`README would be saved to: ${filePath}`);
    console.log(`Content length: ${content.length} characters`);
  }
}
```

### Code Comment Generator
```typescript
// documentation/commentGenerator.ts

export interface CommentConfig {
  style: 'jsdoc' | 'tsdoc' | 'javadoc' | 'pydoc';
  includeTypes: boolean;
  includeExamples: boolean;
  includeSeeAlso: boolean;
  includeAuthor: boolean;
  includeSince: boolean;
  includeDeprecated: boolean;
  author?: string;
  template?: string;
}

export interface FunctionComment {
  description: string;
  parameters?: ParameterDoc[];
  returns?: string;
  example?: string;
  seeAlso?: string[];
  deprecated?: string;
  since?: string;
  author?: string;
  tags?: string[];
}

export interface ParameterDoc {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
  defaultValue?: any;
}

export interface ClassComment {
  description: string;
  example?: string;
  seeAlso?: string[];
  deprecated?: string;
  since?: string;
  author?: string;
  methods?: MethodDoc[];
  properties?: PropertyDoc[];
}

export interface MethodDoc {
  name: string;
  description: string;
  parameters?: ParameterDoc[];
  returns?: string;
  example?: string;
  seeAlso?: string[];
  static?: boolean;
  deprecated?: string;
  since?: string;
}

export interface PropertyDoc {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
  readonly?: boolean;
  defaultValue?: any;
}

export class CommentGenerator {
  constructor(private config: CommentConfig) {}

  generateFunctionComment(comment: FunctionComment): string {
    switch (this.config.style) {
      case 'jsdoc':
        return this.generateJSDocFunction(comment);
      case 'tsdoc':
        return this.generateTSDocFunction(comment);
      case 'javadoc':
        return this.generateJavadocFunction(comment);
      case 'pydoc':
        return this.generatePydocFunction(comment);
      default:
        return this.generateJSDocFunction(comment);
    }
  }

  generateClassComment(comment: ClassComment): string {
    switch (this.config.style) {
      case 'jsdoc':
        return this.generateJSDocClass(comment);
      case 'tsdoc':
        return this.generateTSDocClass(comment);
      case 'javadoc':
        return this.generateJavadocClass(comment);
      case 'pydoc':
        return this.generatePydocClass(comment);
      default:
        return this.generateJSDocClass(comment);
    }
  }

  private generateJSDocFunction(comment: FunctionComment): string {
    let docstring = '/**\n';

    // Description
    docstring += ` * ${comment.description}\n`;

    // Parameters
    if (comment.parameters && comment.parameters.length > 0) {
      docstring += ' *\n';
      for (const param of comment.parameters) {
        const optional = param.optional ? ' [optional]' : '';
        docstring += ` * @param {${param.type}} ${param.name}${optional} ${param.description}\n`;
      }
    }

    // Return value
    if (comment.returns) {
      docstring += ' *\n';
      docstring += ` * @returns {${this.extractReturnType(comment.returns)}} ${comment.returns}\n`;
    }

    // Example
    if (this.config.includeExamples && comment.example) {
      docstring += ' *\n';
      docstring += ' * @example\n';
      docstring += ` * ${comment.example.split('\n').map(line => ` * ${line}`).join('\n')}\n`;
    }

    // See also
    if (this.config.includeSeeAlso && comment.seeAlso && comment.seeAlso.length > 0) {
      docstring += ' *\n';
      comment.seeAlso.forEach(reference => {
        docstring += ` * @see ${reference}\n`;
      });
    }

    // Deprecated
    if (this.config.includeDeprecated && comment.deprecated) {
      docstring += ' *\n';
      docstring += ` * @deprecated ${comment.deprecated}\n`;
    }

    // Since
    if (this.config.includeSince && comment.since) {
      docstring += ' *\n';
      docstring += ` * @since ${comment.since}\n`;
    }

    // Author
    if (this.config.includeAuthor && comment.author) {
      docstring += ' *\n';
      docstring += ` * @author ${comment.author}\n`;
    } else if (this.config.includeAuthor && this.config.author) {
      docstring += ' *\n';
      docstring += ` * @author ${this.config.author}\n`;
    }

    // Custom tags
    if (comment.tags && comment.tags.length > 0) {
      docstring += ' *\n';
      comment.tags.forEach(tag => {
        docstring += ` * @${tag}\n`;
      });
    }

    docstring += ' */';

    return docstring;
  }

  private generateTSDocFunction(comment: FunctionComment): string {
    let docstring = '/**\n';

    // Description
    docstring += ` * ${comment.description}\n`;

    // Parameters
    if (comment.parameters && comment.parameters.length > 0) {
      docstring += ' *\n';
      for (const param of comment.parameters) {
        const optional = param.optional ? '?' : '';
        docstring += ` * @param ${param.name}${optional} ${param.description}\n`;
      }
    }

    // Return value
    if (comment.returns) {
      docstring += ' *\n';
      docstring += ` * @returns ${comment.returns}\n`;
    }

    // Example
    if (this.config.includeExamples && comment.example) {
      docstring += ' *\n';
      docstring += ' * @example\n';
      docstring += ` * ${comment.example.split('\n').map(line => ` * ${line}`).join('\n')}\n`;
    }

    // See also
    if (this.config.includeSeeAlso && comment.seeAlso && comment.seeAlso.length > 0) {
      docstring += ' *\n';
      comment.seeAlso.forEach(reference => {
        docstring += ` * @see ${reference}\n`;
      });
    }

    docstring += ' */';

    return docstring;
  }

  private generateJSDocClass(comment: ClassComment): string {
    let docstring = '/**\n';

    // Description
    docstring += ` * ${comment.description}\n`;

    // Example
    if (this.config.includeExamples && comment.example) {
      docstring += ' *\n';
      docstring += ' * @example\n';
      docstring += ` * ${comment.example.split('\n').map(line => ` * ${line}`).join('\n')}\n`;
    }

    // See also
    if (this.config.includeSeeAlso && comment.seeAlso && comment.seeAlso.length > 0) {
      docstring += ' *\n';
      comment.seeAlso.forEach(reference => {
        docstring += ` * @see ${reference}\n`;
      });
    }

    // Deprecated
    if (this.config.includeDeprecated && comment.deprecated) {
      docstring += ' *\n';
      docstring += ` * @deprecated ${comment.deprecated}\n`;
    }

    // Since
    if (this.config.includeSince && comment.since) {
      docstring += ' *\n';
      docstring += ` * @since ${comment.since}\n`;
    }

    // Author
    if (this.config.includeAuthor && comment.author) {
      docstring += ' *\n';
      docstring += ` * @author ${comment.author}\n`;
    }

    docstring += ' */';

    return docstring;
  }

  private generatePydocFunction(comment: FunctionComment): string {
    let docstring = '"""\n';

    // Description
    docstring += `${comment.description}\n`;

    // Parameters
    if (comment.parameters && comment.parameters.length > 0) {
      docstring += '\nArgs:\n';
      for (const param of comment.parameters) {
        const optional = param.optional ? ' (optional)' : '';
        docstring += `    ${param.name} (${param.type})${optional}: ${param.description}\n`;
      }
    }

    // Return value
    if (comment.returns) {
      docstring += '\nReturns:\n';
      docstring += `    ${comment.returns}\n`;
    }

    // Example
    if (this.config.includeExamples && comment.example) {
      docstring += '\nExample:\n';
      docstring += `    ${comment.example.split('\n').map(line => `    ${line}`).join('\n')}\n`;
    }

    // See also
    if (this.config.includeSeeAlso && comment.seeAlso && comment.seeAlso.length > 0) {
      docstring += '\nSee also:\n';
      comment.seeAlso.forEach(reference => {
        docstring += `    ${reference}\n`;
      });
    }

    docstring += '"""\n';

    return docstring;
  }

  private generatePydocClass(comment: ClassComment): string {
    let docstring = '"""\n';

    // Description
    docstring += `${comment.description}\n`;

    // Example
    if (this.config.includeExamples && comment.example) {
      docstring += '\nExample:\n';
      docstring += `${comment.example.split('\n').map(line => `${line}`).join('\n')}\n`;
    }

    // See also
    if (this.config.includeSeeAlso && comment.seeAlso && comment.seeAlso.length > 0) {
      docstring += '\nSee also:\n';
      comment.seeAlso.forEach(reference => {
        docstring += `${reference}\n`;
      });
    }

    docstring += '"""\n';

    return docstring;
  }

  private generateJavadocFunction(comment: FunctionComment): string {
    let docstring = '/**\n';

    // Description
    docstring += ` * ${comment.description}\n`;

    // Parameters
    if (comment.parameters && comment.parameters.length > 0) {
      docstring += ' *\n';
      for (const param of comment.parameters) {
        docstring += ` * @param ${param.name} the ${param.description}\n`;
      }
    }

    // Return value
    if (comment.returns) {
      docstring += ' *\n';
      docstring += ` * @return ${comment.returns}\n`;
    }

    // Example
    if (this.config.includeExamples && comment.example) {
      docstring += ' *\n';
      docstring += ' * @example\n';
      docstring += ` * ${comment.example.split('\n').map(line => ` * ${line}`).join('\n')}\n`;
    }

    // See also
    if (this.config.includeSeeAlso && comment.seeAlso && comment.seeAlso.length > 0) {
      docstring += ' *\n';
      comment.seeAlso.forEach(reference => {
        docstring += ` * @see ${reference}\n`;
      });
    }

    // Deprecated
    if (this.config.includeDeprecated && comment.deprecated) {
      docstring += ' *\n';
      docstring += ` * @deprecated ${comment.deprecated}\n`;
    }

    // Since
    if (this.config.includeSince && comment.since) {
      docstring += ' *\n';
      docstring += ` * @since ${comment.since}\n`;
    }

    // Author
    if (this.config.includeAuthor && comment.author) {
      docstring += ' *\n';
      docstring += ` * @author ${comment.author}\n`;
    }

    docstring += ' */';

    return docstring;
  }

  private extractReturnType(returns: string): string {
    // Extract type information from return description
    const typeMatch = returns.match(/\{([^}]+)\}/);
    if (typeMatch) {
      return typeMatch[1];
    }
    return 'void';
  }

  // Method to add comments to existing files
  addCommentsToFile(filePath: string, comments: Array<{
    type: 'function' | 'class' | 'method' | 'property';
    name: string;
    comment: FunctionComment | ClassComment | MethodDoc | PropertyDoc;
    line?: number;
  }>): string {
    // In a real implementation, this would read the file,
    // find the target function/class/method/property,
    // and insert the generated comment above it
    console.log(`Would add comments to: ${filePath}`);
    console.log(`Comments to add: ${comments.length}`);
    return 'Comments added successfully';
  }

  // Method to extract documentation from code
  extractDocumentationFromFile(filePath: string): {
    functions: Array<{ name: string; comment: string; line: number }>;
    classes: Array<{ name: string; comment: string; line: number }>;
    methods: Array<{ className: string; name: string; comment: string; line: number }>;
  } {
    // In a real implementation, this would parse the file
    // and extract existing documentation comments
    console.log(`Would extract documentation from: ${filePath}`);
    return {
      functions: [],
      classes: [],
      methods: []
    };
  }

  // Method to validate documentation quality
  validateDocumentation(documentation: string): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check for common issues
    if (!documentation.includes('@param') && documentation.includes('function')) {
      issues.push('Function parameters not documented');
      score -= 20;
      suggestions.push('Add @param tags for all function parameters');
    }

    if (!documentation.includes('@returns') && documentation.includes('function')) {
      issues.push('Return value not documented');
      score -= 15;
      suggestions.push('Add @returns tag to document return values');
    }

    if (!documentation.includes('@example')) {
      suggestions.push('Add @example tags to improve documentation');
      score -= 5;
    }

    if (!documentation.includes('@see')) {
      suggestions.push('Add @see tags to reference related items');
      score -= 5;
    }

    return { score, issues, suggestions };
  }
}
```

## Documentation Scripts

### Automated Documentation Generation
```bash
#!/bin/bash
# scripts/generate-docs.sh

set -e

echo "📚 Automated Documentation Generator"

# Check if in a project directory
if [ ! -f "package.json" ] && [ ! -f "requirements.txt" ] && [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: Not in a valid project directory"
    exit 1
fi

# Create documentation directory
mkdir -p docs

# 1. Generate API documentation
echo "🔍 Generating API documentation..."
if [ -f "package.json" ]; then
    echo "📦 Node.js project detected"

    # Check for Express.js
    if grep -q "express" package.json; then
        echo "🌐 Express.js API detected"
        npm run docs:generate 2>/dev/null || echo "Consider adding 'npm run docs:generate' script"
    fi

    # Check for TypeScript
    if [ -f "tsconfig.json" ]; then
        echo "📘 TypeScript project detected"
        # Look for API routes or controllers
        if [ -d "src/api" ]; then
            echo "📁 API directory found"
            find src/api -name "*.ts" -o -name "*.js" | head -5
        fi
    fi

elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    echo "🐍 Python project detected"

    # Check for FastAPI
    if grep -q "fastapi" requirements.txt 2>/dev/null || grep -q "fastapi" pyproject.toml 2>/dev/null; then
        echo "⚡ FastAPI detected"
        echo "📝 API documentation available at: /docs"
    fi

    # Check for Flask
    if grep -q "flask" requirements.txt 2>/dev/null || grep -q "flask" pyproject.toml 2>/dev/null; then
        echo "🌶 Flask detected"
        echo "📝 Consider using Flask-RESTX or Marshmallow for API docs"
    fi
fi

# 2. Generate README if missing
echo "📄 Checking README file..."
if [ ! -f "README.md" ]; then
    echo "📝 Generating basic README..."
    cat > README.md << 'EOF'
# Project Name

Project description goes here.

## Installation

\`\`\`
# Installation instructions here
\`\`\`

## Usage

\`\`\`
# Usage example here
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
EOF
    echo "✅ Basic README.md generated"
else
    echo "✅ README.md exists"
fi

# 3. Check for existing documentation
echo "🔍 Checking existing documentation..."

DOC_FILES=()
if [ -d "docs" ]; then
    while IFS= read -r -d '' file; do
        DOC_FILES+=("$file")
    done < <(find docs -name "*.md" -print0 2>/dev/null)
fi

if [ -f "CHANGELOG.md" ]; then
    DOC_FILES+=("CHANGELOG.md")
fi

if [ -f "CONTRIBUTING.md" ]; then
    DOC_FILES+=("CONTRIBUTING.md")
fi

if [ ${#DOC_FILES[@]} -gt 0 ]; then
    echo "📚 Found ${#DOC_FILES[@]} documentation file(s):"
    printf '  %s\n' "${DOC_FILES[@]}"
else
    echo "ℹ️ No documentation files found"
fi

# 4. Check for code comments
echo "💬 Checking code documentation quality..."

COMMENT_SCORE=0
COMMENT_ISSUES=0

if [ -d "src" ]; then
    echo "🔍 Analyzing source code comments..."

    # Check for JSDoc/TSDoc comments
    JSDOC_COUNT=$(find src -name "*.js" -o -name "*.ts" -exec grep -l "/**" {} \; 2>/dev/null | wc -l)
    echo "  - JSDoc/TSDoc comments: $JSDOC_COUNT files"

    if [ $JSDOC_COUNT -gt 0 ]; then
        COMMENT_SCORE=$((COMMENT_SCORE + 20))
        echo "  ✅ JSDoc/TSDoc documentation found"
    else
        COMMENT_ISSUES=$((COMMENT_ISSUES + 1))
        echo "  ⚠️ No JSDoc/TSDoc comments found"
    fi

    # Check for function documentation
    FUNCTION_COUNT=$(find src -name "*.js" -o -name "*.ts" -exec grep -l "function\|=>\|class " {} \; 2>/dev/null | wc -l)
    DOCUMENTED_FUNCTIONS=$(find src -name "*.js" -o -name "*.ts" -exec grep -l "@param\|@returns\|@description" {} \; 2>/dev/null | wc -l)

    echo "  - Functions/Classes: $FUNCTION_COUNT"
    echo "  - Documented functions: $DOCUMENTED_FUNCTIONS"

    if [ $DOCUMENTED_FUNCTIONS -gt 0 ]; then
        DOC_PERCENTAGE=$((DOCUMENTED_FUNCTIONS * 100 / FUNCTION_COUNT))
        COMMENT_SCORE=$((COMMENT_SCORE + DOC_PERCENTAGE / 5))
        echo "  📊 Documentation coverage: ${DOC_PERCENTAGE}%"
    else
        COMMENT_ISSUES=$((COMMENT_ISSUES + 1))
        echo "  ⚠️ No function documentation found"
    fi
fi

if [ -d "lib" ] || [ -d "app" ]; then
    echo "🔍 Analyzing Python code comments..."

    # Check for docstrings
    DOCSTRING_COUNT=$(find lib app -name "*.py" -exec grep -l '"""' {} \; 2>/dev/null | wc -l)
    echo "  - Python docstrings: $DOCSTRING_COUNT files"

    if [ $DOCSTRING_COUNT -gt 0 ]; then
        COMMENT_SCORE=$((COMMENT_SCORE + 20))
        echo "  ✅ Python docstrings found"
    else
        COMMENT_ISSUES=$((COMMENT_ISSUES + 1))
        echo "  ⚠️ No Python docstrings found"
    fi
fi

# 5. Generate documentation report
echo "📊 Generating documentation report..."
{
    echo "# Documentation Audit Report"
    echo "Generated: $(date)"
    echo ""
    echo "## Summary"
    echo "- Documentation files found: ${#DOC_FILES[@]}"
    echo "- Documentation quality score: $COMMENT_SCORE/100"
    echo "- Issues identified: $COMMENT_ISSUES"
    echo ""
    echo "## Recommendations"

    if [ $COMMENT_ISSUES -eq 0 ]; then
        echo "✅ Excellent documentation quality!"
        echo "- Continue maintaining current documentation standards"
        echo "- Consider adding more examples and tutorials"
    else
        echo "⚠️ Documentation needs improvement:"
        echo "- Add JSDoc/TSDoc comments to all functions"
        echo "- Include @param and @returns tags"
        echo "- Add usage examples for complex functions"
        echo "- Document class methods and properties"
        echo "- Include inline code comments for complex logic"
    fi

    echo ""
    echo "## Next Steps"
    echo "1. Address identified documentation issues"
    echo "2. Set up automated documentation generation in CI/CD"
    echo "3. Create comprehensive API documentation"
    echo "4. Add tutorials and examples"
    echo "5. Regular documentation reviews and updates"
    echo ""
    echo "## Tools to Consider"
    echo "- TypeDoc (TypeScript): npm install --save-dev typedoc"
    echo "- JSDoc (JavaScript): npm install --save-dev jsdoc"
    echo "- Sphinx (Python): pip install sphinx"
    echo "- Swagger/OpenAPI for API documentation"
    echo "- Storybook for component documentation"
    echo ""
    echo "## Best Practices"
    echo "- Document all public APIs and functions"
    echo "- Include usage examples in documentation"
    echo "- Keep documentation up to date with code changes"
    echo "- Use consistent documentation style"
    echo "- Include parameter types and return values"
    echo "- Add error handling examples"
    echo "- Document edge cases and limitations"
} > docs/documentation-report.md

echo "✅ Documentation audit complete"
echo "📊 Detailed report available at: docs/documentation-report.md"
echo "🎯 Documentation quality score: $COMMENT_SCORE/100"

if [ $COMMENT_ISSUES -eq 0 ]; then
    echo "🎉 Great documentation quality!"
else
    echo "💡 Review documentation suggestions above"
fi

# 6. Generate documentation index
echo "📚 Generating documentation index..."
cat > docs/index.md << 'EOF
# Project Documentation

## Table of Contents

- [README](../README.md) - Project overview and getting started
- [Installation Guide](installation.md) - Detailed installation instructions
- [API Documentation](api/) - API reference and examples
- [Examples](examples/) - Usage examples and tutorials
- [Contributing Guide](contributing.md) - How to contribute to the project
- [Changelog](../CHANGELOG.md) - Version history and changes

## Quick Links

- [Getting Started](../README.md#getting-started)
- [API Reference](api/)
- [Examples](examples/)
- [Contributing](contributing.md)

## Documentation Guidelines

This project follows standard documentation practices:

1. **Code Comments**: All public functions and classes include comprehensive comments
2. **API Documentation**: All APIs are documented with examples
3. **Examples**: Practical examples demonstrate key features
4. **Contributing**: Clear guidelines for contributors
5. **Versioning**: Changelog tracks all significant changes

## Maintaining Documentation

Documentation is updated automatically when code changes are made. Please:

1. Update comments when modifying functions or classes
2. Add examples for new features
3. Update API documentation when endpoints change
4. Review documentation regularly for accuracy

## Feedback

Documentation feedback is welcome! Please open an issue or submit a pull request.
EOF

echo "✅ Documentation index created: docs/index.md"
```

### API Documentation Builder
```bash
#!/bin/bash
# scripts/build-api-docs.sh

set -e

echo "🔗 Building API Documentation..."

# Check if we're in a project directory
if [ ! -f "package.json" ] && [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Not in a valid project directory"
    exit 1
fi

# Create API docs directory
mkdir -p docs/api

echo "📁 Created docs/api directory"

# Generate OpenAPI specification
if [ -f "package.json" ]; then
    echo "📦 Building API docs for Node.js project..."

    # Check for OpenAPI/Swagger setup
    if [ -f "swagger.yaml" ] || [ -f "openapi.json" ]; then
        echo "✅ OpenAPI specification found"

        if [ -f "swagger.yaml" ]; then
            echo "🔄 Converting Swagger YAML to HTML..."
            # In a real implementation, use swagger-codegen or redoc
            echo "Would convert swagger.yaml to HTML documentation"
        fi

        if [ -f "openapi.json" ]; then
            echo "🔄 Converting OpenAPI JSON to HTML..."
            # In a real implementation, use redoc or swagger-ui
            echo "Would convert openapi.json to HTML documentation"
        fi
    else
        echo "⚠️ No OpenAPI specification found"
        echo "💡 Consider using swagger-jsdoc or similar tools"
        echo "   Install with: npm install --save-dev swagger-jsdoc swagger-jsdoc-json"
    fi

    # Look for Express routes
    if grep -q "express" package.json; then
        echo "🌐 Express.js detected - analyzing routes..."

        # Find route files
        ROUTE_FILES=()
        if [ -d "src/routes" ]; then
            while IFS= read -r -d '' file; do
                ROUTE_FILES+=("$file")
            done < <(find src/routes -name "*.js" -o -name "*.ts" -print0 2>/dev/null)
        fi

        if [ -f "server.js" ] || [ -f "app.js" ]; then
            ROUTE_FILES+=("server.js")
            ROUTE_FILES+=("app.js")
        fi

        echo "📁 Found ${#ROUTE_FILES[@]} potential route files:"
        printf '  %s\n' "${ROUTE_FILES[@]}"

        # Extract API endpoints
        ENDPOINTS=()
        for file in "${ROUTE_FILES[@]}"; do
            if [ -f "$file" ]; then
                # Look for HTTP method patterns
                if grep -q "app\.\(get\|post\|put\|delete\|patch\)" "$file"; then
                    echo "🔍 Extracting endpoints from: $file"
                    # In a real implementation, parse the file and extract endpoints
                fi
            fi
        done

        if [ ${#ENDPOINTS[@]} -gt 0 ]; then
            echo "📊 Found ${#ENDPOINTS[@]} API endpoints"
        else
            echo "ℹ️ No explicit API endpoints found"
        fi
    fi

    # Generate basic API documentation structure
    cat > docs/api/README.md << 'EOF'
# API Documentation

This section contains the API documentation for the project.

## Base URL

\`\`\`
https://api.example.com/v1
\`\`

## Authentication

If your API requires authentication, describe it here:

- **API Key**: Include how to obtain and use API keys
- **OAuth**: Describe OAuth flow if applicable
- **JWT**: Explain token-based authentication

## Endpoints

*Endpoint documentation will be generated here*

## Error Handling

The API uses standard HTTP status codes:

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

API rate limits are implemented to ensure fair usage:

- **Requests per minute**: 100
- **Requests per hour**: 1000

Rate limit headers are included in all API responses.

## Versioning

API versioning follows semantic versioning:

- **v1.0.0** - Current stable version
- **v1.1.0** - Backward compatible changes
- **v2.0.0** - Breaking changes

## SDKs and Libraries

Official SDKs are available for:

- [JavaScript/Node.js](#) - npm install project-name
- [Python](#) - pip install project-name
- [Other languages](#) - Coming soon

## Support

For API support and questions:

- Create an issue in the repository
- Email: api-support@example.com
- Documentation: [API Guide](#)
EOF
        echo "✅ Basic API documentation structure created"
    fi
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    echo "🐍 Building API docs for Python project..."

    # Check for FastAPI
    if grep -q "fastapi" requirements.txt 2>/dev/null || grep -q "fastapi" pyproject.toml 2>/dev/null; then
        echo "⚡ FastAPI detected - auto-generated docs available"
        echo "📝 FastAPI automatically generates interactive API docs at /docs"
        echo "   Start your application and visit http://localhost:8000/docs"
    else
        echo "⚠️ Not a FastAPI project"
        echo "💡 Consider using FastAPI for automatic API documentation"
    fi

    # Generate basic Python API documentation
    cat > docs/api/README.md << 'EOF'
# API Documentation

Python API documentation for this project.

## Base URL

\`\`\`
https://api.example.com/v1
\`\`

## Endpoints

*Endpoint documentation will be added here*

## Request/Response Format

All API requests and responses use JSON format.

### Request Headers

\`\`\`
Content-Type: application/json
Authorization: Bearer <token>
\`\`

### Response Format

\`\`\`
{
  "status": "success|error",
  "data": {},
  "message": "Description of the result"
}
\`\`

## Error Handling

Standard HTTP status codes are used for error responses.

## Python Client Example

\`\`\python
import requests

# Make API request
response = requests.get(
    "https://api.example.com/v1/endpoint",
    headers={"Authorization": "Bearer <token>"}
)

data = response.json()
print(data)
\`\`
EOF
        echo "✅ Basic Python API documentation created"
    fi
fi

# 6. Generate interactive API docs setup
echo "🔧 Setting up interactive API documentation..."

# Check for redoc or swagger-ui
if command -v npx &> /dev/null; then
    echo "📦 Setting up Redoc for interactive docs..."

    cat > docs/api/redoc.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Roboto, sans-serif;
        }
    </style>
</head>
<body>
    <redoc spec-url="openapi.json"></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@2.0.0/bundles/redoc.standalone.js"></script>
</body>
</html>
EOF

    echo "✅ Redoc HTML template created: docs/api/redoc.html"
    echo "💡 Add your openapi.json file to make it interactive"
fi

echo "✅ API documentation build complete"
echo ""
echo "📁 Files created in docs/api/:"
echo "  - README.md - API overview and guidelines"
echo "  - redoc.html - Interactive API docs (if available)"
echo ""
echo "🌐 Next steps:"
echo "1. Create or update your OpenAPI specification"
echo "2. Add the OpenAPI file to docs/api/"
echo "3. Test the interactive documentation"
echo "4. Customize the documentation with examples"
echo "5. Set up automatic documentation updates in CI/CD"
```

This comprehensive Documentation & Knowledge Management skill provides automated documentation generation for APIs, projects, and codebases, enabling systematic creation and maintenance of high-quality technical documentation and knowledge management systems.