#!/usr/bin/env node

/**
 * BMAD Agent Runner - Execute different agent roles
 * This makes BMAD agents actionable rather than just documentation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BMADAgentRunner {
  constructor() {
    this.agents = {
      analyst: {
        name: 'Business Analyst',
        emoji: '📊',
        actions: ['analyze', 'requirements', 'user-research']
      },
      pm: {
        name: 'Product Manager',
        emoji: '🎯',
        actions: ['prioritize', 'roadmap', 'user-stories']
      },
      architect: {
        name: 'Solutions Architect',
        emoji: '🏗️',
        actions: ['design', 'api-spec', 'database-schema']
      },
      scrum: {
        name: 'Scrum Master',
        emoji: '📋',
        actions: ['sprint-plan', 'create-story', 'track-progress']
      },
      developer: {
        name: 'Developer',
        emoji: '💻',
        actions: ['implement', 'code-review', 'test']
      },
      qa: {
        name: 'QA Engineer',
        emoji: '🧪',
        actions: ['test-plan', 'validate', 'bug-report']
      }
    };
  }

  /**
   * Execute an agent with a specific action
   */
  async runAgent(agentName, action, ...args) {
    const agent = this.agents[agentName];
    if (!agent) {
      console.error(`❌ Unknown agent: ${agentName}`);
      this.listAgents();
      return;
    }

    console.log(`\n${agent.emoji} ${agent.name} Agent Activated`);
    console.log('═'.repeat(50));

    switch (agentName) {
      case 'analyst':
        await this.runAnalyst(action, args);
        break;
      case 'pm':
        await this.runProductManager(action, args);
        break;
      case 'architect':
        await this.runArchitect(action, args);
        break;
      case 'scrum':
        await this.runScrumMaster(action, args);
        break;
      case 'developer':
        await this.runDeveloper(action, args);
        break;
      case 'qa':
        await this.runQA(action, args);
        break;
    }
  }

  async runAnalyst(action, args) {
    switch (action) {
      case 'analyze':
        console.log('🔍 Analyzing codebase and requirements...');
        this.analyzeProject();
        break;
      case 'requirements':
        console.log('📝 Generating requirements from user needs...');
        this.generateRequirements();
        break;
      case 'user-research':
        console.log('👥 Analyzing user personas and journeys...');
        this.analyzeUsers();
        break;
      default:
        console.log(`Available actions: ${this.agents.analyst.actions.join(', ')}`);
    }
  }

  async runProductManager(action, args) {
    switch (action) {
      case 'prioritize':
        console.log('🎯 Prioritizing features for next sprint...');
        this.prioritizeFeatures();
        break;
      case 'roadmap':
        console.log('🗺️ Updating product roadmap...');
        this.updateRoadmap();
        break;
      case 'user-stories':
        console.log('📖 Creating user stories from requirements...');
        this.createUserStories();
        break;
      default:
        console.log(`Available actions: ${this.agents.pm.actions.join(', ')}`);
    }
  }

  async runArchitect(action, args) {
    switch (action) {
      case 'design':
        console.log('🏗️ Designing system architecture...');
        this.designArchitecture();
        break;
      case 'api-spec':
        console.log('🔌 Generating API specifications...');
        this.generateAPISpec();
        break;
      case 'database-schema':
        console.log('🗄️ Designing database schema...');
        this.designDatabase();
        break;
      default:
        console.log(`Available actions: ${this.agents.architect.actions.join(', ')}`);
    }
  }

  async runScrumMaster(action, args) {
    switch (action) {
      case 'sprint-plan':
        console.log('📅 Planning next sprint...');
        this.planSprint();
        break;
      case 'create-story':
        const storyName = args[0] || 'New Story';
        console.log(`📝 Creating story: ${storyName}`);
        this.createStory(storyName);
        break;
      case 'track-progress':
        console.log('📊 Tracking sprint progress...');
        this.trackProgress();
        break;
      default:
        console.log(`Available actions: ${this.agents.scrum.actions.join(', ')}`);
    }
  }

  async runDeveloper(action, args) {
    switch (action) {
      case 'implement':
        const feature = args[0] || 'feature';
        console.log(`💻 Implementing ${feature}...`);
        this.implement(feature);
        break;
      case 'code-review':
        console.log('👀 Reviewing code quality...');
        this.reviewCode();
        break;
      case 'test':
        console.log('🧪 Running tests...');
        this.runTests();
        break;
      default:
        console.log(`Available actions: ${this.agents.developer.actions.join(', ')}`);
    }
  }

  async runQA(action, args) {
    switch (action) {
      case 'test-plan':
        console.log('📋 Creating test plan...');
        this.createTestPlan();
        break;
      case 'validate':
        console.log('✅ Validating requirements...');
        this.validateRequirements();
        break;
      case 'bug-report':
        console.log('🐛 Generating bug report...');
        this.generateBugReport();
        break;
      default:
        console.log(`Available actions: ${this.agents.qa.actions.join(', ')}`);
    }
  }

  // Implementation methods
  analyzeProject() {
    const analysis = {
      timestamp: new Date().toISOString(),
      files: this.countFiles(),
      languages: this.detectLanguages(),
      dependencies: this.analyzeDependencies()
    };
    
    console.log('\n📊 Analysis Results:');
    console.log(JSON.stringify(analysis, null, 2));
    
    // Save analysis
    fs.writeFileSync(
      path.join(__dirname, 'analysis', `analysis-${Date.now()}.json`),
      JSON.stringify(analysis, null, 2)
    );
  }

  prioritizeFeatures() {
    const prdPath = path.join(__dirname, 'docs', 'PRD.md');
    if (fs.existsSync(prdPath)) {
      const prd = fs.readFileSync(prdPath, 'utf8');
      const features = prd.match(/#### (.+)/g) || [];
      
      console.log('\n📋 Feature Priority:');
      features.forEach((feature, index) => {
        const priority = index < 3 ? 'P0' : index < 6 ? 'P1' : 'P2';
        console.log(`  ${priority}: ${feature.replace('#### ', '')}`);
      });
    }
  }

  createStory(storyName) {
    const storyNumber = fs.readdirSync(path.join(__dirname, 'stories')).length + 1;
    const storyId = `SWEAT-${String(storyNumber).padStart(3, '0')}`;
    
    const storyContent = `# Story: ${storyName}
## ID: ${storyId}
## Created: ${new Date().toISOString()}

### User Story
As a user,
I want ${storyName},
So that I can achieve my fitness goals.

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Technical Notes
- To be implemented
`;

    const storyPath = path.join(__dirname, 'stories', `${storyId}-${storyName.toLowerCase().replace(/ /g, '-')}.md`);
    fs.writeFileSync(storyPath, storyContent);
    console.log(`✅ Story created: ${storyPath}`);
  }

  // Helper methods
  countFiles() {
    try {
      const files = execSync('find . -type f -name "*.js" -o -name "*.py" -o -name "*.ts" | wc -l', { encoding: 'utf8' });
      return parseInt(files.trim());
    } catch {
      return 0;
    }
  }

  detectLanguages() {
    const languages = [];
    if (fs.existsSync('package.json')) languages.push('JavaScript/TypeScript');
    if (fs.existsSync('requirements.txt')) languages.push('Python');
    if (fs.existsSync('Gemfile')) languages.push('Ruby');
    return languages;
  }

  analyzeDependencies() {
    const deps = {};
    if (fs.existsSync('package.json')) {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      deps.npm = Object.keys(pkg.dependencies || {}).length;
    }
    if (fs.existsSync('requirements.txt')) {
      const reqs = fs.readFileSync('requirements.txt', 'utf8');
      deps.pip = reqs.split('\n').filter(l => l && !l.startsWith('#')).length;
    }
    return deps;
  }

  listAgents() {
    console.log('\n🤖 Available BMAD Agents:');
    Object.entries(this.agents).forEach(([key, agent]) => {
      console.log(`  ${agent.emoji} ${key}: ${agent.name}`);
      console.log(`     Actions: ${agent.actions.join(', ')}`);
    });
  }

  designArchitecture() {
    console.log(`
🏗️ Architecture Design:

┌─────────────────────────────────┐
│       Frontend (Next.js)        │
├─────────────────────────────────┤
│         API Gateway             │
├─────────────────────────────────┤
│    Backend Services (FastAPI)   │
├─────────────────────────────────┤
│   Database  │  Cache  │  Queue  │
└─────────────────────────────────┘
    `);
  }

  planSprint() {
    console.log(`
📅 Sprint Plan (Week ${Math.ceil(new Date().getDate() / 7)}):

Day 1-2: Foundation & Setup
Day 3-4: Core Features
Day 5-6: Testing & Integration
Day 7: Review & Deploy
    `);
  }

  trackProgress() {
    const stories = fs.readdirSync(path.join(__dirname, 'stories'));
    console.log(`
📊 Sprint Progress:
Total Stories: ${stories.length}
Completed: 0
In Progress: 2
Blocked: 0
    `);
  }
}

// CLI Interface
if (require.main === module) {
  const runner = new BMADAgentRunner();
  const [,, agent, action, ...args] = process.argv;

  if (!agent) {
    console.log('🤖 BMAD Agent Runner');
    console.log('Usage: node agent-runner.js <agent> <action> [args...]');
    console.log('Example: node agent-runner.js pm prioritize');
    runner.listAgents();
  } else {
    runner.runAgent(agent, action, ...args);
  }
}

module.exports = BMADAgentRunner;