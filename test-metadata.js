#!/usr/bin/env node
/**
 * Simple test script to verify metadata is included in SDK payloads
 */

const { generateFeaturesPayload, generateAutoExperimentsPayload } = require('./packages/back-end/dist/services/features');

console.log('Testing metadata in SDK payloads...\n');

// Test data
const testFeature = {
  id: 'test-feature',
  project: 'proj-1',
  customFields: {
    'field-1': 'value1',
    'field-2': 'value2',
    'field-3': 'value3',
  },
  tags: ['tag1', 'tag2', 'tag3'],
  dateCreated: new Date(),
  dateUpdated: new Date(),
  defaultValue: 'default',
  environments: {
    production: {
      enabled: true,
      rules: [],
    },
  },
};

const testProject = {
  id: 'proj-1',
  name: 'Test Project',
  publicId: 'test-project-public',
  organization: 'org-1',
  dateCreated: new Date(),
  dateUpdated: new Date(),
  description: '',
  settings: {},
};

const testExperiment = {
  id: 'exp-1',
  organization: 'org-1',
  project: 'proj-1',
  name: 'Test Experiment',
  hypothesis: '',
  status: 'running',
  hashVersion: 2,
  phases: [{
    phase: 'main',
    coverage: 1,
    variationWeights: [0.5, 0.5],
    seed: 'test-seed',
  }],
  variations: [
    { id: 'v0', key: '0', name: 'Control' },
    { id: 'v1', key: '1', name: 'Treatment' },
  ],
  dateCreated: new Date(),
  dateUpdated: new Date(),
  trackingKey: 'test-exp',
  archived: false,
  customFields: {
    'field-1': 'exp-value1',
    'field-2': 'exp-value2',
  },
  tags: ['exp-tag1'],
};

try {
  console.log('✓ Modules loaded successfully');
  
  // Test 1: Feature with all metadata
  console.log('\nTest 1: Feature with all metadata enabled');
  const projectsMap = new Map([[testProject.id, testProject]]);
  
  const featuresPayload = generateFeaturesPayload({
    features: [testFeature],
    experimentMap: new Map(),
    environment: 'production',
    groupMap: new Map(),
    prereqStateCache: {},
    safeRolloutMap: new Map(),
    holdoutsMap: new Map(),
    includeProjectIdInMetadata: true,
    includeCustomFieldsInMetadata: true,
    allowedCustomFieldsInMetadata: ['field-1', 'field-2'],
    includeTagsInMetadata: true,
    projectsMap,
  });
  
  const featureDef = featuresPayload['test-feature'];
  if (!featureDef) {
    console.error('✗ Feature not found in payload');
    process.exit(1);
  }
  
  if (!featureDef.metadata) {
    console.error('✗ Metadata missing from feature');
    process.exit(1);
  }
  
  if (!featureDef.metadata.projects || featureDef.metadata.projects[0] !== 'test-project-public') {
    console.error('✗ Project ID not included correctly:', featureDef.metadata.projects);
    process.exit(1);
  }
  console.log('  ✓ Project ID included:', featureDef.metadata.projects);
  
  if (!featureDef.metadata.customFields || 
      featureDef.metadata.customFields['field-1'] !== 'value1' ||
      featureDef.metadata.customFields['field-2'] !== 'value2') {
    console.error('✗ Custom fields not filtered correctly:', featureDef.metadata.customFields);
    process.exit(1);
  }
  if (featureDef.metadata.customFields['field-3']) {
    console.error('✗ Field-3 should have been filtered out');
    process.exit(1);
  }
  console.log('  ✓ Custom fields filtered correctly:', featureDef.metadata.customFields);
  
  if (!featureDef.metadata.tags || 
      !featureDef.metadata.tags.includes('tag1') ||
      !featureDef.metadata.tags.includes('tag2')) {
    console.error('✗ Tags not included correctly:', featureDef.metadata.tags);
    process.exit(1);
  }
  console.log('  ✓ Tags included:', featureDef.metadata.tags);
  
  // Test 2: Feature with no metadata
  console.log('\nTest 2: Feature with metadata disabled');
  const noMetadataPayload = generateFeaturesPayload({
    features: [testFeature],
    experimentMap: new Map(),
    environment: 'production',
    groupMap: new Map(),
    prereqStateCache: {},
    safeRolloutMap: new Map(),
    holdoutsMap: new Map(),
    includeProjectIdInMetadata: false,
    includeCustomFieldsInMetadata: false,
    allowedCustomFieldsInMetadata: [],
    includeTagsInMetadata: false,
    projectsMap,
  });
  
  const noMetadataFeature = noMetadataPayload['test-feature'];
  if (noMetadataFeature.metadata) {
    console.error('✗ Metadata should not be present when disabled');
    process.exit(1);
  }
  console.log('  ✓ No metadata when disabled');
  
  console.log('\n✅ All tests passed!');
  process.exit(0);
  
} catch (error) {
  console.error('✗ Test failed with error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
