/**
 * SweatBot Skill Registry
 * Manages registration, discovery, and validation of skills
 */

import { Skill, SkillRegistry, SkillCategory, ValidationResult } from './types';

export class DefaultSkillRegistry implements SkillRegistry {
  private skills = new Map<string, Skill>();
  private categoryIndex = new Map<SkillCategory, Set<string>>();
  private tagIndex = new Map<string, Set<string>>();

  /**
   * Register a new skill
   */
  public register(skill: Skill): void {
    // Validate skill before registration
    const validation = this.validateSkill(skill);
    if (!validation.isValid) {
      throw new Error(`Cannot register skill ${skill.id}: ${validation.errors.join(', ')}`);
    }

    // Check for conflicts
    if (this.skills.has(skill.id)) {
      console.warn(`Skill ${skill.id} is already registered. Overwriting...`);
    }

    // Register skill
    this.skills.set(skill.id, skill);

    // Update category index
    if (!this.categoryIndex.has(skill.category)) {
      this.categoryIndex.set(skill.category, new Set());
    }
    this.categoryIndex.get(skill.category)!.add(skill.id);

    // Update tag index
    skill.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(skill.id);
    });

    console.log(`✅ Registered skill: ${skill.name} (${skill.id})`);
  }

  /**
   * Unregister a skill
   */
  public unregister(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (!skill) {
      console.warn(`Skill ${skillId} not found for unregistration`);
      return;
    }

    // Remove from main registry
    this.skills.delete(skillId);

    // Remove from category index
    const categorySkills = this.categoryIndex.get(skill.category);
    if (categorySkills) {
      categorySkills.delete(skillId);
      if (categorySkills.size === 0) {
        this.categoryIndex.delete(skill.category);
      }
    }

    // Remove from tag index
    skill.tags.forEach(tag => {
      const tagSkills = this.tagIndex.get(tag);
      if (tagSkills) {
        tagSkills.delete(skillId);
        if (tagSkills.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    console.log(`🗑️ Unregistered skill: ${skill.name} (${skill.id})`);
  }

  /**
   * Get a specific skill by ID
   */
  public getSkill(skillId: string): Skill | null {
    return this.skills.get(skillId) || null;
  }

  /**
   * Get all skills in a specific category
   */
  public getSkillsByCategory(category: SkillCategory): Skill[] {
    const skillIds = this.categoryIndex.get(category);
    if (!skillIds) return [];

    return Array.from(skillIds)
      .map(id => this.skills.get(id))
      .filter((skill): skill is Skill => skill !== undefined);
  }

  /**
   * Get all skills with a specific tag
   */
  public getSkillsByTag(tag: string): Skill[] {
    const skillIds = this.tagIndex.get(tag);
    if (!skillIds) return [];

    return Array.from(skillIds)
      .map(id => this.skills.get(id))
      .filter((skill): skill is Skill => skill !== undefined);
  }

  /**
   * Search skills by query (searches name, description, and tags)
   */
  public searchSkills(query: string): Skill[] {
    const lowerQuery = query.toLowerCase();
    const results: Skill[] = [];

    for (const skill of this.skills.values()) {
      const nameMatch = skill.name.toLowerCase().includes(lowerQuery);
      const descMatch = skill.description.toLowerCase().includes(lowerQuery);
      const tagMatch = skill.tags.some(tag => tag.toLowerCase().includes(lowerQuery));

      if (nameMatch || descMatch || tagMatch) {
        results.push(skill);
      }
    }

    // Sort by relevance (name match > description match > tag match)
    return results.sort((a, b) => {
      const aNameScore = a.name.toLowerCase().includes(lowerQuery) ? 3 : 0;
      const aDescScore = a.description.toLowerCase().includes(lowerQuery) ? 2 : 0;
      const aTagScore = a.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ? 1 : 0;
      const aScore = aNameScore + aDescScore + aTagScore;

      const bNameScore = b.name.toLowerCase().includes(lowerQuery) ? 3 : 0;
      const bDescScore = b.description.toLowerCase().includes(lowerQuery) ? 2 : 0;
      const bTagScore = b.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ? 1 : 0;
      const bScore = bNameScore + bDescScore + bTagScore;

      return bScore - aScore;
    });
  }

  /**
   * Get all registered skills
   */
  public getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Validate a skill implementation
   */
  public validateSkill(skill: Skill): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!skill.id || skill.id.trim() === '') {
      errors.push('Skill ID is required');
    }

    if (!skill.name || skill.name.trim() === '') {
      errors.push('Skill name is required');
    }

    if (!skill.description || skill.description.trim() === '') {
      errors.push('Skill description is required');
    }

    if (!skill.version || skill.version.trim() === '') {
      errors.push('Skill version is required');
    }

    // ID format validation
    if (skill.id && !/^[a-z][a-z0-9_]*$/i.test(skill.id)) {
      errors.push('Skill ID must be a valid identifier (letters, numbers, underscores, no spaces)');
    }

    // Version format validation
    if (skill.version && !/^\d+\.\d+\.\d+$/i.test(skill.version)) {
      warnings.push('Version should follow semantic versioning (e.g., 1.0.0)');
    }

    // Schema validation
    try {
      const schema = skill.getSchema();
      if (!schema) {
        errors.push('Skill must return a valid Zod schema');
      }
    } catch (error) {
      errors.push(`Invalid schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Method validation
    if (typeof skill.validate !== 'function') {
      errors.push('Skill must implement validate method');
    }

    if (typeof skill.execute !== 'function') {
      errors.push('Skill must implement execute method');
    }

    if (typeof skill.getInfo !== 'function') {
      errors.push('Skill must implement getInfo method');
    }

    // Configuration validation
    if (skill.config.timeout <= 0) {
      errors.push('Skill timeout must be positive');
    }

    if (skill.config.retryAttempts < 0) {
      errors.push('Skill retry attempts cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get registry statistics
   */
  public getStats() {
    return {
      totalSkills: this.skills.size,
      categoryBreakdown: Object.fromEntries(
        Array.from(this.categoryIndex.entries()).map(([cat, skills]) => [cat, skills.size])
      ),
      tagBreakdown: Object.fromEntries(
        Array.from(this.tagIndex.entries()).map(([tag, skills]) => [tag, skills.size])
      )
    };
  }

  /**
   * Clear all registered skills (for testing)
   */
  public clear(): void {
    this.skills.clear();
    this.categoryIndex.clear();
    this.tagIndex.clear();
  }
}

// Global registry instance
export const skillRegistry = new DefaultSkillRegistry();