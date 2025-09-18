# 🔐 OAuth Security Best Practices Guide

## 🚨 **CRITICAL: Your OAuth Secret Was Exposed**

Your OAuth2 client ID `1000.A7GBW3AR476CCTVPXTK10OXJ8CRNXL` was detected by GitGuardian in your repository. This is a serious security issue that needs immediate attention.

## ✅ **Immediate Actions Required**

### 1. **Regenerate Your OAuth Credentials**
- Go to [Zoho Developer Console](https://api-console.zoho.com/)
- Navigate to your application
- **REVOKE** the current client ID: `1000.A7GBW3AR476CCTVPXTK10OXJ8CRNXL`
- **GENERATE** a new client ID and client secret
- Update all authorized redirect URIs

### 2. **Clean Git History**
```bash
# Remove the secret from Git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch client/dashboard/client-package.json' \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remove from remote
git push origin --force --all
```

## 🔒 **Best Practices for OAuth Security**

### **1. Environment Variables (Recommended)**

#### **For Development:**
Create `.env.local` file (never commit this):
```bash
# .env.local (DO NOT COMMIT)
REACT_APP_ZOHO_CLIENT_ID=your_new_client_id_here
REACT_APP_ZOHO_CLIENT_SECRET=your_new_client_secret_here
REACT_APP_ZOHO_REDIRECT_URI=http://localhost:3000/auth/callback
REACT_APP_API_BASE_URL=http://localhost:3001
```

#### **For Production (Catalyst):**
Set environment variables in Catalyst Console:
1. Go to Catalyst Console → Your Project
2. Navigate to **Functions** → **Environment Variables**
3. Add:
   - `REACT_APP_ZOHO_CLIENT_ID`: Your new client ID
   - `REACT_APP_ZOHO_CLIENT_SECRET`: Your new client secret
   - `REACT_APP_ZOHO_REDIRECT_URI`: Your production callback URL

### **2. Configuration Updates**

#### **Update config.js:**
```javascript
ZOHO_OAUTH: {
  clientId: process.env.REACT_APP_ZOHO_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
  clientSecret: process.env.REACT_APP_ZOHO_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE',
  redirectUri: process.env.REACT_APP_ZOHO_REDIRECT_URI || 'YOUR_REDIRECT_URI_HERE',
  // ... other config
}
```

#### **Update client-package.json:**
```json
{
  "environment": {
    "REACT_APP_ZOHO_CLIENT_ID": "YOUR_CLIENT_ID_HERE",
    "REACT_APP_ZOHO_REDIRECT_URI": "https://your-domain.com/auth/callback",
    "NODE_ENV": "production"
  }
}
```

### **3. Security Measures**

#### **A. Never Commit Secrets**
- Add `.env*` to `.gitignore`
- Use `.env.example` for documentation
- Never hardcode secrets in source code

#### **B. Use Different Credentials**
- **Development**: Use test/sandbox OAuth app
- **Production**: Use production OAuth app
- **Staging**: Use separate staging OAuth app

#### **C. Restrict Redirect URIs**
In Zoho Developer Console, only allow:
- `http://localhost:3000/auth/callback` (development)
- `https://your-production-domain.com/auth/callback` (production)
- `https://your-staging-domain.com/auth/callback` (staging)

#### **D. Use HTTPS in Production**
- Always use HTTPS for OAuth callbacks
- Never use HTTP in production

### **4. Monitoring & Detection**

#### **A. GitGuardian Integration**
- Enable GitGuardian in your repository
- Set up alerts for secret detection
- Review and fix any detected secrets immediately

#### **B. Regular Audits**
- Monthly review of OAuth applications
- Check for unused/old applications
- Rotate credentials quarterly

### **5. Deployment Security**

#### **A. Catalyst Environment Variables**
```bash
# Set in Catalyst Console
catalyst env:set REACT_APP_ZOHO_CLIENT_ID=your_new_client_id
catalyst env:set REACT_APP_ZOHO_CLIENT_SECRET=your_new_client_secret
catalyst env:set REACT_APP_ZOHO_REDIRECT_URI=https://your-domain.com/auth/callback
```

#### **B. GitHub Secrets (if using GitHub Actions)**
```yaml
# .github/workflows/deploy.yml
env:
  REACT_APP_ZOHO_CLIENT_ID: ${{ secrets.ZOHO_CLIENT_ID }}
  REACT_APP_ZOHO_CLIENT_SECRET: ${{ secrets.ZOHO_CLIENT_SECRET }}
```

## 🛠️ **Implementation Steps**

### **Step 1: Regenerate OAuth Credentials**
1. Go to Zoho Developer Console
2. Revoke old client ID
3. Create new OAuth application
4. Note down new client ID and secret

### **Step 2: Update Configuration**
1. Update `config.js` to use environment variables
2. Update `client-package.json` with placeholder values
3. Create `.env.example` file

### **Step 3: Set Environment Variables**
1. **Development**: Create `.env.local`
2. **Production**: Set in Catalyst Console
3. **Staging**: Set in staging environment

### **Step 4: Test OAuth Flow**
1. Test login in development
2. Test login in staging
3. Test login in production
4. Verify all redirect URIs work

### **Step 5: Clean Up**
1. Remove old secrets from code
2. Clean Git history
3. Update documentation
4. Notify team of new credentials

## 📋 **Security Checklist**

- [ ] Old OAuth credentials revoked
- [ ] New OAuth credentials generated
- [ ] Environment variables configured
- [ ] `.env*` files added to `.gitignore`
- [ ] Hardcoded secrets removed from code
- [ ] Git history cleaned
- [ ] Redirect URIs restricted
- [ ] HTTPS enabled in production
- [ ] GitGuardian alerts configured
- [ ] Team notified of credential changes

## 🚨 **Emergency Response**

If secrets are exposed:
1. **Immediately** revoke exposed credentials
2. Generate new credentials
3. Update all environments
4. Clean Git history
5. Notify security team
6. Review access logs
7. Update security policies

## 📞 **Support Resources**

- [Zoho OAuth Documentation](https://www.zoho.com/accounts/protocol/oauth.html)
- [Catalyst Environment Variables](https://docs.catalyst.zoho.com/en/cloud-scale/help/functions/environment-variables/)
- [GitGuardian Documentation](https://docs.gitguardian.com/)

---

**Remember**: OAuth secrets are like passwords - treat them with the same level of security!
