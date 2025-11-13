# Pre-Deployment Checklist

Run before deploying to production:

## Code Quality
- [ ] All feature branches merged to main
- [ ] No console.log() in production code
- [ ] No TODO/FIXME comments
- [ ] Code formatted consistently
- [ ] No unused imports

## Testing
- [ ] All API endpoints tested manually
- [ ] Upload flow works for all file types
- [ ] Search returns accurate results
- [ ] Timeline loads and paginates correctly
- [ ] Mobile responsive on 3 screen sizes
- [ ] No browser console errors

## Security
- [ ] JWT secrets are 64+ characters
- [ ] .env.production created with unique secrets
- [ ] No hardcoded credentials
- [ ] File upload size limits enforced
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

## Performance
- [ ] Smart OCR working (<10s for text PDFs)
- [ ] Search response time <50ms
- [ ] Frontend build size <2MB
- [ ] Images optimized
- [ ] No memory leaks

## Database
- [ ] All migrations run successfully
- [ ] Indexes created on activity_log
- [ ] Foreign keys configured
- [ ] Backup script tested

## Documentation
- [ ] USER_GUIDE.md complete
- [ ] DEVELOPER.md complete
- [ ] API documented
- [ ] Environment variables documented

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
