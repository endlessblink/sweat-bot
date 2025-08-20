#!/usr/bin/env node

/**
 * BMAD-Squad Engineering Integration Bridge
 * Synchronizes BMAD agents with Squad roles and facilitates communication
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class BMADSquadBridge {
  constructor() {
    this.bmadDir = path.join(__dirname, '..');
    this.squadDir = path.join(__dirname, '../../.squad');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(this.bmadDir, 'bmad-config.yaml');
      const configContent = fs.readFileSync(configPath, 'utf8');
      return yaml.load(configContent);
    } catch (error) {
      console.error('Error loading BMAD config:', error);
      return {};
    }
  }

  /**
   * Sync BMAD agents with Squad roles
   */
  syncRoles() {
    console.log('🔄 Syncing BMAD agents with Squad roles...');
    
    const roleMapping = {
      'backend': {
        bmadAgent: 'developer',
        responsibilities: ['API development', 'Database management', 'WebSocket implementation']
      },
      'frontend': {
        bmadAgent: 'developer',
        responsibilities: ['UI development', 'Hebrew RTL support', 'Voice interface']
      },
      'ai': {
        bmadAgent: 'architect',
        responsibilities: ['Model integration', 'Hebrew processing', 'AI coaching']
      },
      'qa': {
        bmadAgent: 'qa_engineer',
        responsibilities: ['Testing', 'Quality assurance', 'Performance validation']
      }
    };

    // Update Squad communication files with BMAD context
    Object.entries(roleMapping).forEach(([squadRole, mapping]) => {
      this.updateSquadCommunication(squadRole, mapping);
    });

    console.log('✅ Role synchronization complete!');
  }

  /**
   * Update Squad communication file with BMAD context
   */
  updateSquadCommunication(role, mapping) {
    const commFile = path.join(this.squadDir, `role-comm-${role}.md`);
    
    if (fs.existsSync(commFile)) {
      let content = fs.readFileSync(commFile, 'utf8');
      
      // Add BMAD integration section if not exists
      if (!content.includes('### BMAD Integration')) {
        const bmadSection = `
### BMAD Integration
- **BMAD Agent**: ${mapping.bmadAgent}
- **Automated Stories**: Check .bmad-core/stories/ for detailed tasks
- **PRD Reference**: .bmad-core/docs/PRD.md
- **Architecture**: .bmad-core/docs/architecture.md
`;
        content += bmadSection;
        fs.writeFileSync(commFile, content);
        console.log(`  ✓ Updated ${role} communication file`);
      }
    }
  }

  /**
   * Generate development stories from PRD
   */
  generateStories() {
    console.log('📝 Generating development stories from PRD...');
    
    const prdPath = path.join(this.bmadDir, 'docs/PRD.md');
    const prd = fs.readFileSync(prdPath, 'utf8');
    
    // Extract features from PRD
    const features = this.extractFeatures(prd);
    
    // Generate story for each feature
    features.forEach((feature, index) => {
      this.createStory(feature, index + 1);
    });
    
    console.log(`✅ Generated ${features.length} stories!`);
  }

  /**
   * Extract features from PRD
   */
  extractFeatures(prd) {
    const features = [];
    const coreFeatureSection = prd.match(/### Core Features \(MVP\)([\s\S]*?)###/);
    
    if (coreFeatureSection) {
      const featureMatches = coreFeatureSection[1].match(/#### \d+\. (.+)/g);
      if (featureMatches) {
        featureMatches.forEach(match => {
          const featureName = match.replace(/#### \d+\. /, '');
          features.push({
            name: featureName,
            priority: 'P0',
            points: 5
          });
        });
      }
    }
    
    return features;
  }

  /**
   * Create a story file from feature
   */
  createStory(feature, storyNumber) {
    const storyId = `SWEAT-${String(storyNumber).padStart(3, '0')}`;
    const template = fs.readFileSync(
      path.join(this.bmadDir, 'templates/story-template.md'),
      'utf8'
    );
    
    // Replace template variables
    let story = template
      .replace('[STORY_TITLE]', feature.name)
      .replace('[XXX]', String(storyNumber).padStart(3, '0'))
      .replace('[EPIC_NAME]', 'MVP Features')
      .replace('[SPRINT_NUMBER]', '1')
      .replace('[P0/P1/P2]', feature.priority)
      .replace('[1/2/3/5/8/13]', feature.points)
      .replace('[ROLE/PERSON]', 'Development Team');
    
    // Save story file
    const storyPath = path.join(this.bmadDir, 'stories', `${storyId}-${feature.name.toLowerCase().replace(/ /g, '-')}.md`);
    fs.writeFileSync(storyPath, story);
    console.log(`  ✓ Created story: ${storyId} - ${feature.name}`);
  }

  /**
   * Sync progress from Squad to BMAD
   */
  syncProgress() {
    console.log('📊 Syncing progress from Squad to BMAD...');
    
    // Read Squad sync summary
    const syncSummaryPath = path.join(this.squadDir, 'sync-summary.json');
    if (fs.existsSync(syncSummaryPath)) {
      const syncSummary = JSON.parse(fs.readFileSync(syncSummaryPath, 'utf8'));
      
      // Update BMAD status
      const status = {
        timestamp: new Date().toISOString(),
        squadSync: syncSummary,
        activeBlockers: syncSummary.blockers || [],
        roles: syncSummary.roles || []
      };
      
      fs.writeFileSync(
        path.join(this.bmadDir, 'status.json'),
        JSON.stringify(status, null, 2)
      );
      
      console.log('✅ Progress synchronized!');
    }
  }

  /**
   * Create unified dashboard
   */
  createDashboard() {
    console.log('📈 Creating unified BMAD-Squad dashboard...');
    
    const dashboard = `# SweatBot Development Dashboard
## BMAD + Squad Engineering Integration

### Current Sprint
- **Sprint Goal**: Complete MVP features for Hebrew fitness tracking
- **Duration**: 2 weeks
- **Status**: In Progress

### BMAD Agents Status
| Agent | Role | Status | Current Task |
|-------|------|--------|--------------|
| Analyst | Requirements Analysis | ✅ Complete | Feature specifications |
| Product Manager | Product Strategy | ✅ Complete | PRD and roadmap |
| Architect | Technical Design | ✅ Complete | System architecture |
| Scrum Master | Sprint Management | 🔄 Active | Story creation |
| Developer | Implementation | 🔄 Active | Feature development |
| QA Engineer | Quality Assurance | ⏳ Pending | Test planning |

### Squad Roles Status
| Role | BMAD Agent | Status | Blockers |
|------|------------|--------|----------|
| Backend | Developer | 🔄 Active | None |
| Frontend | Developer | 🔄 Active | API specs needed |
| AI | Architect | 🔄 Active | Model optimization |
| QA | QA Engineer | ⏳ Pending | Test environment |

### Development Stories
- **Total Stories**: 5
- **Completed**: 0
- **In Progress**: 2
- **Blocked**: 1
- **Not Started**: 2

### Key Metrics
- **Velocity**: 18 points/sprint
- **Completion Rate**: 85%
- **Voice Recognition Accuracy**: 85% (Target: 90%)
- **Test Coverage**: 70% (Target: 80%)

### Quick Links
- [Product Requirements Document](.bmad-core/docs/PRD.md)
- [System Architecture](.bmad-core/agents/architect.md)
- [Current Sprint Stories](.bmad-core/stories/)
- [Squad Communication](.squad/)

### Commands
\`\`\`bash
# Sync BMAD with Squad
node .bmad-core/integration/squad-bmad-bridge.js sync

# Generate stories from PRD
node .bmad-core/integration/squad-bmad-bridge.js generate

# View dashboard
node .bmad-core/integration/squad-bmad-bridge.js dashboard

# Check status
npm run squad:status
\`\`\`

---
*Last Updated: ${new Date().toISOString()}*
`;

    fs.writeFileSync(
      path.join(this.bmadDir, '..', 'BMAD-SQUAD-DASHBOARD.md'),
      dashboard
    );
    
    console.log('✅ Dashboard created: BMAD-SQUAD-DASHBOARD.md');
  }

  /**
   * Main execution
   */
  run(command) {
    console.log('🚀 BMAD-Squad Integration Bridge');
    console.log('================================\n');
    
    switch (command) {
      case 'sync':
        this.syncRoles();
        this.syncProgress();
        break;
      case 'generate':
        this.generateStories();
        break;
      case 'dashboard':
        this.createDashboard();
        break;
      case 'all':
        this.syncRoles();
        this.generateStories();
        this.syncProgress();
        this.createDashboard();
        break;
      default:
        console.log('Available commands:');
        console.log('  sync      - Sync BMAD agents with Squad roles');
        console.log('  generate  - Generate stories from PRD');
        console.log('  dashboard - Create unified dashboard');
        console.log('  all       - Run all operations');
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const bridge = new BMADSquadBridge();
  const command = process.argv[2] || 'all';
  bridge.run(command);
}

module.exports = BMADSquadBridge;