# Pre-Deployment Checklist

Run before deploying to production:

## Code Quality
- [x] All feature branches merged to main
- [x] No console.log() in production code
- [x] No TODO/FIXME comments
- [x] Code formatted consistently
- [x] No unused imports

## Testing
- [x] All API endpoints tested manually
- [x] Upload flow works for all file types
- [x] Search returns accurate results
- [x] Timeline loads and paginates correctly
- [x] Mobile responsive on 3 screen sizes
- [x] No browser console errors

## Security
- [x] JWT secrets are 64+ characters
- [x] .env.production created with unique secrets
- [x] No hardcoded credentials
- [x] File upload size limits enforced
- [x] SQL injection prevention verified
- [x] XSS prevention verified

## Performance
- [x] Smart OCR working (<10s for text PDFs)
- [x] Search response time <50ms
- [x] Frontend build size <2MB
- [x] Images optimized
- [x] No memory leaks

## Database
- [x] All migrations run successfully
- [x] Indexes created on activity_log
- [x] Foreign keys configured
- [x] Backup script tested

## Documentation
- [x] USER_GUIDE.md complete
- [x] DEVELOPER.md complete
- [x] API documented
- [x] Environment variables documented

## Deployment
- [ ] deploy-stackcp.sh configured with correct host
- [ ] SSH access to StackCP verified
- [ ] PM2 configuration ready
- [ ] Backup strategy defined
- [ ] Rollback plan documented

## Post-Deployment
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Monitoring alerts configured
- [ ] First backup completed
- [ ] Version tagged in git
