#!/usr/bin/env node

/**
 * Enhanced BMAD-Squad Mapping System
 * Provides intelligent agent-role mapping and team formations
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class SquadBMADMapping {
  constructor() {
    this.bmadDir = path.join(__dirname, '..');
    this.squadDir = path.join(__dirname, '../../.squad');
    
    // Enhanced mapping with multi-agent support
    this.roleAgentMapping = {
      'backend': {
        primary: 'developer',
        supporting: ['architect', 'analyst'],
        expertise: ['FastAPI', 'PostgreSQL', 'WebSockets', 'Python'],
        bmadTasks: [
          'API endpoint implementation',
          'Database schema design',
          'Business logic development',
          'Integration with Hebrew AI models'
        ]
      },
      'frontend': {
        primary: 'developer',
        supporting: ['ux-expert', 'analyst'],
        expertise: ['Next.js', 'React', 'TypeScript', 'Hebrew RTL'],
        bmadTasks: [
          'UI component development',
          'Voice recording interface',
          'Gamification dashboard',
          'Hebrew language support'
        ]
      },
      'ai': {
        primary: 'architect',
        supporting: ['analyst', 'developer'],
        expertise: ['Whisper', 'Transformers', 'Hebrew NLP', 'PyTorch'],
        bmadTasks: [
          'Model integration',
          'Hebrew voice recognition',
          'Exercise parsing algorithms',
          'AI coaching responses'
        ]
      },
      'qa': {
        primary: 'qa',
        supporting: ['analyst', 'scrum'],
        expertise: ['Jest', 'Pytest', 'Performance testing', 'Hebrew validation'],
        bmadTasks: [
          'Test plan creation',
          'Automated test development',
          'Hebrew accuracy validation',
          'Performance benchmarking'
        ]
      }
    };

    // Agent team formations for complex tasks
    this.agentTeams = {
      'feature-development': {
        agents: ['analyst', 'architect', 'developer', 'qa'],
        workflow: 'sequential',
        description: 'Full feature development from requirements to testing'
      },
      'sprint-planning': {
        agents: ['pm', 'scrum', 'architect'],
        workflow: 'collaborative',
        description: 'Sprint planning and story creation'
      },
      'architecture-review': {
        agents: ['architect', 'developer', 'qa'],
        workflow: 'review',
        description: 'Technical architecture review and validation'
      },
      'hebrew-optimization': {
        agents: ['analyst', 'architect', 'developer'],
        workflow: 'specialized',
        description: 'Hebrew language processing optimization'
      }
    };

    // Fitness domain expertise
    this.domainExpertise = {
      'exercise-tracking': {
        knowledge: [
          'CrossFit movements and terminology',
          'Hebrew exercise names and variations',
          'Rep counting patterns',
          'Weight tracking standards'
        ],
        agents: ['analyst', 'developer']
      },
      'gamification': {
        knowledge: [
          'Achievement systems',
          'Progress tracking',
          'Motivation techniques',
          'Social features'
        ],
        agents: ['pm', 'ux-expert', 'developer']
      },
      'voice-interface': {
        knowledge: [
          'Hebrew voice commands',
          'Natural language processing',
          'Command disambiguation',
          'Error recovery'
        ],
        agents: ['architect', 'developer', 'qa']
      }
    };
  }

  /**
   * Get optimal agent for a Squad role and task
   */
  getOptimalAgent(squadRole, taskType) {
    const mapping = this.roleAgentMapping[squadRole];
    if (!mapping) {
      return null;
    }

    // Determine best agent based on task type
    const taskAgentMap = {
      'requirements': 'analyst',
      'design': 'architect',
      'implementation': 'developer',
      'testing': 'qa',
      'planning': 'scrum',
      'strategy': 'pm'
    };

    const recommendedAgent = taskAgentMap[taskType] || mapping.primary;
    
    // Check if recommended agent is available for this role
    const availableAgents = [mapping.primary, ...mapping.supporting];
    
    return {
      primary: recommendedAgent,
      alternatives: availableAgents.filter(a => a !== recommendedAgent),
      expertise: mapping.expertise,
      confidence: availableAgents.includes(recommendedAgent) ? 'high' : 'medium'
    };
  }

  /**
   * Form an agent team for a specific workflow
   */
  formAgentTeam(workflowType, customRequirements = {}) {
    const team = this.agentTeams[workflowType];
    if (!team) {
      console.error(`Unknown workflow type: ${workflowType}`);
      return null;
    }

    // Enhance team with domain expertise if needed
    let enhancedTeam = { ...team };
    
    if (customRequirements.domain) {
      const domainExperts = this.domainExpertise[customRequirements.domain];
      if (domainExperts) {
        enhancedTeam.agents = [...new Set([...team.agents, ...domainExperts.agents])];
        enhancedTeam.domainKnowledge = domainExperts.knowledge;
      }
    }

    // Add Hebrew language expertise if needed
    if (customRequirements.hebrew) {
      enhancedTeam.hebrewExperts = ['analyst', 'architect'];
      enhancedTeam.hebrewValidation = true;
    }

    return enhancedTeam;
  }

  /**
   * Map Squad feature to BMAD workflow
   */
  mapFeatureToWorkflow(featureName, featureDescription) {
    const workflow = {
      feature: featureName,
      phases: [],
      agents: [],
      estimatedDays: 0
    };

    // Analyze feature to determine required phases
    const keywords = featureDescription.toLowerCase();
    
    // Phase 1: Analysis (always required)
    workflow.phases.push({
      name: 'Requirements Analysis',
      agent: 'analyst',
      duration: 1,
      outputs: ['requirements.md', 'user-stories.md']
    });

    // Phase 2: Design (if technical)
    if (keywords.includes('api') || keywords.includes('database') || keywords.includes('architecture')) {
      workflow.phases.push({
        name: 'Technical Design',
        agent: 'architect',
        duration: 1,
        outputs: ['architecture.md', 'api-spec.yaml']
      });
    }

    // Phase 3: Hebrew Processing (if needed)
    if (keywords.includes('hebrew') || keywords.includes('voice') || keywords.includes('recognition')) {
      workflow.phases.push({
        name: 'Hebrew NLP Design',
        agent: 'architect',
        duration: 1,
        outputs: ['hebrew-processing.md', 'model-requirements.md']
      });
    }

    // Phase 4: Implementation
    workflow.phases.push({
      name: 'Development',
      agent: 'developer',
      duration: 3,
      outputs: ['code', 'unit-tests']
    });

    // Phase 5: Testing
    workflow.phases.push({
      name: 'Quality Assurance',
      agent: 'qa',
      duration: 1,
      outputs: ['test-plan.md', 'test-results.md']
    });

    // Calculate totals
    workflow.agents = [...new Set(workflow.phases.map(p => p.agent))];
    workflow.estimatedDays = workflow.phases.reduce((sum, p) => sum + p.duration, 0);

    return workflow;
  }

  /**
   * Generate agent collaboration plan
   */
  generateCollaborationPlan(squadRoles, projectPhase) {
    const plan = {
      phase: projectPhase,
      timestamp: new Date().toISOString(),
      collaborations: []
    };

    // Define collaboration patterns
    const phasePatterns = {
      'planning': {
        lead: 'pm',
        participants: ['analyst', 'architect', 'scrum'],
        meetings: ['requirements-review', 'sprint-planning']
      },
      'development': {
        lead: 'developer',
        participants: ['architect', 'qa'],
        meetings: ['daily-standup', 'code-review']
      },
      'testing': {
        lead: 'qa',
        participants: ['developer', 'analyst'],
        meetings: ['test-planning', 'bug-triage']
      },
      'deployment': {
        lead: 'architect',
        participants: ['developer', 'qa', 'pm'],
        meetings: ['deployment-review', 'go-live']
      }
    };

    const pattern = phasePatterns[projectPhase] || phasePatterns['development'];
    
    // Map Squad roles to BMAD agents
    squadRoles.forEach(role => {
      const mapping = this.roleAgentMapping[role];
      if (mapping) {
        plan.collaborations.push({
          squadRole: role,
          primaryAgent: mapping.primary,
          supportingAgents: mapping.supporting,
          responsibilities: mapping.bmadTasks,
          meetings: pattern.meetings
        });
      }
    });

    // Add cross-functional collaborations
    plan.crossFunctional = [
      {
        name: 'Hebrew Validation Session',
        participants: ['ai', 'qa'],
        frequency: 'weekly',
        purpose: 'Validate Hebrew recognition accuracy'
      },
      {
        name: 'Architecture Review',
        participants: ['backend', 'frontend', 'ai'],
        frequency: 'bi-weekly',
        purpose: 'Review system architecture and integration points'
      },
      {
        name: 'User Experience Review',
        participants: ['frontend', 'qa'],
        frequency: 'weekly',
        purpose: 'Review UI/UX and accessibility'
      }
    ];

    return plan;
  }

  /**
   * Create unified task assignment
   */
  assignTask(task, availableRoles) {
    const assignment = {
      task: task.name,
      type: task.type,
      assignments: []
    };

    // Determine task type from description
    const taskTypes = {
      'api': 'backend',
      'ui': 'frontend',
      'database': 'backend',
      'model': 'ai',
      'hebrew': 'ai',
      'test': 'qa',
      'voice': 'ai',
      'component': 'frontend'
    };

    // Find primary role
    let primaryRole = null;
    for (const [keyword, role] of Object.entries(taskTypes)) {
      if (task.name.toLowerCase().includes(keyword)) {
        primaryRole = role;
        break;
      }
    }

    if (primaryRole && availableRoles.includes(primaryRole)) {
      const mapping = this.roleAgentMapping[primaryRole];
      assignment.assignments.push({
        role: primaryRole,
        agent: mapping.primary,
        type: 'primary',
        expertise: mapping.expertise
      });

      // Add supporting assignments
      mapping.supporting.forEach(agent => {
        assignment.assignments.push({
          role: primaryRole,
          agent: agent,
          type: 'supporting',
          expertise: []
        });
      });
    }

    return assignment;
  }

  /**
   * Export mapping configuration
   */
  exportConfiguration() {
    const config = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      roleAgentMapping: this.roleAgentMapping,
      agentTeams: this.agentTeams,
      domainExpertise: this.domainExpertise
    };

    const configPath = path.join(this.bmadDir, 'squad-mapping-config.yaml');
    fs.writeFileSync(configPath, yaml.dump(config));
    
    console.log(`✅ Configuration exported to: ${configPath}`);
    return config;
  }

  /**
   * Display mapping summary
   */
  displaySummary() {
    console.log('\n🗺️  Squad-BMAD Mapping Summary');
    console.log('═'.repeat(50));
    
    console.log('\n📋 Role to Agent Mapping:');
    Object.entries(this.roleAgentMapping).forEach(([role, mapping]) => {
      console.log(`\n  ${role.toUpperCase()}:`);
      console.log(`    Primary Agent: ${mapping.primary}`);
      console.log(`    Supporting: ${mapping.supporting.join(', ')}`);
      console.log(`    Expertise: ${mapping.expertise.slice(0, 3).join(', ')}`);
    });

    console.log('\n👥 Agent Teams:');
    Object.entries(this.agentTeams).forEach(([name, team]) => {
      console.log(`\n  ${name}:`);
      console.log(`    Agents: ${team.agents.join(', ')}`);
      console.log(`    Workflow: ${team.workflow}`);
    });

    console.log('\n🏋️ Fitness Domain Expertise:');
    Object.entries(this.domainExpertise).forEach(([domain, expertise]) => {
      console.log(`\n  ${domain}:`);
      console.log(`    Experts: ${expertise.agents.join(', ')}`);
      console.log(`    Knowledge Areas: ${expertise.knowledge.length}`);
    });
  }
}

// Export for use in other scripts
module.exports = SquadBMADMapping;

// Run if executed directly
if (require.main === module) {
  const mapping = new SquadBMADMapping();
  
  const command = process.argv[2];
  switch (command) {
    case 'export':
      mapping.exportConfiguration();
      break;
    case 'summary':
      mapping.displaySummary();
      break;
    case 'test':
      // Test optimal agent selection
      console.log('\n🧪 Testing Agent Selection:');
      const agent = mapping.getOptimalAgent('backend', 'implementation');
      console.log('Backend Implementation:', agent);
      
      // Test team formation
      console.log('\n🧪 Testing Team Formation:');
      const team = mapping.formAgentTeam('feature-development', { 
        domain: 'voice-interface', 
        hebrew: true 
      });
      console.log('Feature Team:', team);
      break;
    default:
      mapping.displaySummary();
  }
}