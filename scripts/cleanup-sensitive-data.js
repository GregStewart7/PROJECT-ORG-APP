#!/usr/bin/env node

/**
 * Script to clean up sensitive data from documentation files
 * Run this before committing to ensure no credentials are exposed
 */

const fs = require('fs')
const path = require('path')

// Files to clean up
const filesToClean = [
  '../cursor_build_project_management_softwar.md',
  '../TASK_12.1_AUTH_TESTING_GUIDE.md'
]

// Sensitive patterns to replace
const sensitivePatterns = [
  {
    pattern: /https:\/\/tydmubjwtoioutylauoy\.supabase\.co/g,
    replacement: 'https://your-project-id.supabase.co'
  },
  {
    pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZG11Ymp3dG9pb3V0eWxhdW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MDMwNDEsImV4cCI6MjA2NjQ3OTA0MX0\.[a-zA-Z0-9_-]+/g,
    replacement: '[REDACTED - Use your actual Supabase anon key]'
  },
  {
    pattern: /TestPassword123!/g,
    replacement: 'YourTestPassword123!'
  },
  {
    pattern: /testpass123/g,
    replacement: 'your-test-password'
  }
]

console.log('🧹 Cleaning up sensitive data from documentation files...\n')

filesToClean.forEach(relativePath => {
  const filePath = path.join(__dirname, relativePath)
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let changed = false
    
    sensitivePatterns.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern)
      if (matches) {
        console.log(`🔍 Found ${matches.length} instance(s) of sensitive data in ${path.basename(filePath)}`)
        content = content.replace(pattern, replacement)
        changed = true
      }
    })
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Cleaned up ${path.basename(filePath)}`)
    } else {
      console.log(`✅ No sensitive data found in ${path.basename(filePath)}`)
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
  }
})

console.log('\n🎯 Cleanup complete!')
console.log('\n💡 Remember to:')
console.log('  1. Review the changes before committing')
console.log('  2. Never commit .env.local files')
console.log('  3. Use environment variables for all sensitive data')
console.log('  4. Rotate any exposed credentials immediately') 