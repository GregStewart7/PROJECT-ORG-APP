#!/usr/bin/env node

/**
 * Test script for environment variable validation
 * Run this to test the environment validation system
 */

const { validateEnvironment, validateEnvironmentOrThrow, logEnvironmentStatus } = require('../src/lib/env-validation.ts');

console.log('🧪 Testing Environment Validation System\n');

try {
  console.log('📋 Current Environment Status:');
  logEnvironmentStatus();

  console.log('🔍 Running Validation Tests...\n');

  // Test 1: Basic validation
  console.log('Test 1: Basic Environment Validation');
  const result = validateEnvironment();
  
  if (result.isValid) {
    console.log('✅ Environment validation passed!');
  } else {
    console.log('❌ Environment validation failed:');
    result.errors.forEach(error => console.log(`  • ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  • ${warning}`));
  }

  console.log('');

  // Test 2: Strict validation (throws on error)
  console.log('Test 2: Strict Environment Validation (throws on error)');
  try {
    validateEnvironmentOrThrow();
    console.log('✅ Strict validation passed!');
  } catch (error) {
    console.log('❌ Strict validation failed:');
    console.log(error.message);
  }

} catch (error) {
  console.error('💥 Test script error:', error.message);
  process.exit(1);
}

console.log('\n🎯 Test completed!');
console.log('\n💡 To fix environment issues:');
console.log('  1. Create a .env.local file in your project root');
console.log('  2. Add your Supabase URL and anon key');
console.log('  3. See environment-setup-guide.md for detailed instructions'); 