# Security Checklist for Production Deployment

## ✅ **Before Every Commit**
- [ ] Run `npm run security:cleanup` to remove sensitive data
- [ ] Verify no credentials in git diff
- [ ] Check that .env.local is not staged
- [ ] Run `npm run lint` to catch security issues

## ✅ **Before Production Deployment**
- [x] XSS vulnerabilities patched (note rendering secured)
- [x] Environment variables properly configured  
- [x] ESLint enabled for production builds
- [x] Security headers configured in Next.js
- [x] Authentication middleware properly secured
- [x] Database access uses parameterized queries (Supabase handles this)
- [x] Row Level Security enabled in Supabase
- [ ] All test passwords removed from documentation
- [ ] No hardcoded secrets in codebase

## ✅ **Supabase Security**
- [x] JWT secret rotated (old exposed keys invalidated)
- [x] RLS policies enabled on all tables
- [x] Anon key properly scoped
- [ ] Service role key secured (not used in client)
- [ ] Database backup strategy configured

## ✅ **Vercel Deployment Security**
- [ ] Environment variables set in Vercel dashboard
- [ ] No secrets in build logs
- [ ] Security headers properly configured
- [ ] HTTPS enforced

## ⚠️ **Manual Review Required**
- [ ] Clean up `cursor_build_project_management_softwar.md` (contains old credentials)
- [ ] Review all .md files for test passwords
- [ ] Verify no debug logs expose sensitive data

## 🔧 **Security Commands**
```bash
# Clean sensitive data
npm run security:cleanup

# Run security checks
npm run precommit

# Check for exposed secrets
git diff --name-only | xargs grep -l "password\|secret\|key"
```

## 🚨 **If Credentials Are Exposed**
1. Immediately rotate Supabase JWT secret
2. Generate new API keys
3. Update environment variables
4. Clean up git history if needed
5. Monitor for unusual access patterns

## 📱 **Production Monitoring**
- [ ] Set up Supabase monitoring alerts
- [ ] Monitor authentication failures
- [ ] Track unusual database access patterns
- [ ] Set up error reporting (Sentry, etc.) 