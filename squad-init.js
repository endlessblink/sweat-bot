#!/usr/bin/env node

/**
 * Squad Engineering Initialization Script for SweatBot
 * This script initializes and manages the Squad Engineering workflow
 */

const fs = require('fs');
const path = require('path');

const SQUAD_DIR = path.join(__dirname, '.squad');
const ROLES = ['backend', 'frontend', 'ai', 'qa'];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function analyzeCodebase() {
  log('\n🔍 Analyzing SweatBot Codebase...', 'blue');
  
  const analysis = {
    timestamp: new Date().toISOString(),
    structure: {
      hasBackend: fs.existsSync(path.join(__dirname, 'hebrew-fitness-hybrid/backend')),
      hasFrontend: fs.existsSync(path.join(__dirname, 'hebrew-fitness-hybrid/frontend')),
      hasAI: fs.existsSync(path.join(__dirname, 'hebrew_voice_recognition.py')),
      hasTests: fs.existsSync(path.join(__dirname, 'tests'))
    },
    components: {
      backend: [],
      frontend: [],
      ai: [],
      testing: []
    },
    recommendations: []
  };

  // Analyze backend
  if (analysis.structure.hasBackend) {
    analysis.components.backend = [
      'FastAPI server (main.py)',
      'Model management (models.py)',
      'Database integration'
    ];
  } else {
    analysis.recommendations.push('Initialize backend with FastAPI');
  }

  // Analyze frontend
  if (analysis.structure.hasFrontend) {
    analysis.components.frontend = [
      'Next.js application',
      'React components',
      'Hebrew UI support'
    ];
  } else {
    analysis.recommendations.push('Set up frontend with Next.js');
  }

  // Analyze AI components
  if (analysis.structure.hasAI) {
    analysis.components.ai = [
      'Hebrew voice recognition',
      'Exercise tracking',
      'AI coaching',
      'Gamification'
    ];
  } else {
    analysis.recommendations.push('Integrate AI models');
  }

  // Save analysis
  const analysisPath = path.join(SQUAD_DIR, 'analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
  
  log('✅ Analysis complete! Results saved to .squad/analysis.json', 'green');
  
  // Display summary
  log('\n📊 Codebase Summary:', 'bright');
  console.log(`  Backend: ${analysis.structure.hasBackend ? '✓' : '✗'}`);
  console.log(`  Frontend: ${analysis.structure.hasFrontend ? '✓' : '✗'}`);
  console.log(`  AI Models: ${analysis.structure.hasAI ? '✓' : '✗'}`);
  console.log(`  Tests: ${analysis.structure.hasTests ? '✓' : '✗'}`);
  
  if (analysis.recommendations.length > 0) {
    log('\n💡 Recommendations:', 'yellow');
    analysis.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
  }
  
  return analysis;
}

function syncRoles() {
  log('\n🔄 Syncing Squad Roles...', 'blue');
  
  const updates = [];
  
  ROLES.forEach(role => {
    const commFile = path.join(SQUAD_DIR, `role-comm-${role}.md`);
    const defFile = path.join(SQUAD_DIR, `role-definition-${role}.md`);
    
    if (fs.existsSync(commFile) && fs.existsSync(defFile)) {
      log(`  ✓ ${role.toUpperCase()} role configured`, 'green');
      
      // Read communication file for updates
      const commContent = fs.readFileSync(commFile, 'utf8');
      const blockers = commContent.match(/### Blockers\n(.+?)(?=\n###|\n\n|$)/s);
      
      if (blockers && blockers[1].trim() !== '- None currently' && blockers[1].trim() !== 'None currently') {
        updates.push({
          role,
          blockers: blockers[1].trim()
        });
      }
    } else {
      log(`  ✗ ${role.toUpperCase()} role missing files`, 'red');
    }
  });
  
  if (updates.length > 0) {
    log('\n⚠️  Active Blockers:', 'yellow');
    updates.forEach(update => {
      console.log(`  ${update.role.toUpperCase()}: ${update.blockers}`);
    });
  } else {
    log('\n✅ All roles synced successfully!', 'green');
  }
  
  // Create sync summary
  const syncSummary = {
    timestamp: new Date().toISOString(),
    roles: ROLES.map(role => ({
      name: role,
      hasDefinition: fs.existsSync(path.join(SQUAD_DIR, `role-definition-${role}.md`)),
      hasCommunication: fs.existsSync(path.join(SQUAD_DIR, `role-comm-${role}.md`))
    })),
    blockers: updates
  };
  
  fs.writeFileSync(
    path.join(SQUAD_DIR, 'sync-summary.json'),
    JSON.stringify(syncSummary, null, 2)
  );
  
  return syncSummary;
}

function createFeature(featureName) {
  if (!featureName) {
    log('❌ Please provide a feature name', 'red');
    process.exit(1);
  }
  
  log(`\n🚀 Creating new feature: ${featureName}`, 'blue');
  
  const featureDoc = `# Feature: ${featureName}

## Created: ${new Date().toISOString()}
## Status: Planning

### Description
[Describe the feature here]

### User Story
As a [user type]
I want [feature]
So that [benefit]

### Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

### Technical Requirements

#### Backend (Owner: Backend Engineer)
- [ ] API endpoints needed
- [ ] Database changes
- [ ] Business logic

#### Frontend (Owner: Frontend Engineer)
- [ ] UI components
- [ ] User interactions
- [ ] Responsive design

#### AI (Owner: AI Engineer)
- [ ] Model requirements
- [ ] Processing pipeline
- [ ] Performance targets

#### QA (Owner: QA Engineer)
- [ ] Test scenarios
- [ ] Performance benchmarks
- [ ] Acceptance tests

### Implementation Plan
1. Design phase (Day 1-2)
2. Development (Day 3-5)
3. Testing (Day 6)
4. Deployment (Day 7)

### Dependencies
- None identified

### Risks
- None identified
`;

  const featurePath = path.join(SQUAD_DIR, `feature-${featureName.toLowerCase().replace(/\s+/g, '-')}.md`);
  fs.writeFileSync(featurePath, featureDoc);
  
  log(`✅ Feature document created: ${featurePath}`, 'green');
  
  // Update role communication files
  ROLES.forEach(role => {
    const commFile = path.join(SQUAD_DIR, `role-comm-${role}.md`);
    if (fs.existsSync(commFile)) {
      let content = fs.readFileSync(commFile, 'utf8');
      const taskSection = content.indexOf('### Active Tasks');
      if (taskSection !== -1) {
        const insertPoint = content.indexOf('\n', taskSection) + 1;
        const newTask = `- [ ] Feature: ${featureName}\n`;
        content = content.slice(0, insertPoint) + newTask + content.slice(insertPoint);
        fs.writeFileSync(commFile, content);
      }
    }
  });
  
  log('✅ Updated all role communication files', 'green');
}

function showStatus() {
  log('\n📈 SweatBot Squad Status', 'bright');
  
  // Check if squad directory exists
  if (!fs.existsSync(SQUAD_DIR)) {
    log('❌ Squad not initialized. Run: npm run squad:init', 'red');
    return;
  }
  
  // Read latest analysis
  const analysisPath = path.join(SQUAD_DIR, 'analysis.json');
  if (fs.existsSync(analysisPath)) {
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    log(`\nLast Analysis: ${analysis.timestamp}`, 'blue');
  }
  
  // Check role status
  log('\nRole Status:', 'blue');
  ROLES.forEach(role => {
    const defExists = fs.existsSync(path.join(SQUAD_DIR, `role-definition-${role}.md`));
    const commExists = fs.existsSync(path.join(SQUAD_DIR, `role-comm-${role}.md`));
    
    const status = defExists && commExists ? '✅ Active' : '⚠️  Incomplete';
    console.log(`  ${role.toUpperCase().padEnd(10)} ${status}`);
  });
  
  // List features
  const features = fs.readdirSync(SQUAD_DIR)
    .filter(f => f.startsWith('feature-'))
    .map(f => f.replace('feature-', '').replace('.md', ''));
  
  if (features.length > 0) {
    log('\nActive Features:', 'blue');
    features.forEach(f => console.log(`  - ${f}`));
  }
  
  // Check for blockers
  const syncPath = path.join(SQUAD_DIR, 'sync-summary.json');
  if (fs.existsSync(syncPath)) {
    const sync = JSON.parse(fs.readFileSync(syncPath, 'utf8'));
    if (sync.blockers && sync.blockers.length > 0) {
      log('\n⚠️  Active Blockers:', 'yellow');
      sync.blockers.forEach(b => {
        console.log(`  ${b.role}: ${b.blockers}`);
      });
    }
  }
}

// Main execution
const command = process.argv[2];
const args = process.argv.slice(3);

log('🏃 SweatBot Squad Engineering', 'bright');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');

switch (command) {
  case 'analyze':
    analyzeCodebase();
    break;
  case 'sync':
    syncRoles();
    break;
  case 'feature':
    createFeature(args.join(' '));
    break;
  case 'status':
    showStatus();
    break;
  case 'init':
    analyzeCodebase();
    syncRoles();
    showStatus();
    break;
  default:
    log('\nAvailable commands:', 'yellow');
    console.log('  node squad-init.js analyze  - Analyze codebase');
    console.log('  node squad-init.js sync     - Sync role communications');
    console.log('  node squad-init.js feature  - Create new feature');
    console.log('  node squad-init.js status   - Show squad status');
    console.log('  node squad-init.js init     - Full initialization');
    break;
}