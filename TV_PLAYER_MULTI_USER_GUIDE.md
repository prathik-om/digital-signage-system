# 📺 TV Player Multi-User Implementation Guide

## 🚨 **CRITICAL: TV Players Need User Isolation Too!**

Your TV players currently have the **same multi-user problems** as the dashboard, but they're **even more critical** because:

- TV players run 24/7 in public spaces
- They display content to customers/visitors
- Wrong content shown = brand damage, security issues
- No way to control which content each TV displays

## ❌ **Current TV Player Problems:**

### **What's Happening Now (BROKEN):**
```
TV Player A (Hospital) → Shows Restaurant Menu
TV Player B (School) → Shows Office Announcements  
TV Player C (Restaurant) → Shows Hospital Content
```

### **What Should Happen (CORRECT):**
```
TV Player A (Hospital) → Shows Hospital Content Only
TV Player B (School) → Shows School Content Only
TV Player C (Restaurant) → Shows Restaurant Content Only
```

## 🛠️ **TV Player Multi-User Solutions:**

### **Option 1: User-Specific TV Players (Recommended)**
Each TV player is assigned to a specific user/organization:

```bash
# Environment variables for each TV player
REACT_APP_TV_PLAYER_USER_ID=user_123_hospital
REACT_APP_TV_PLAYER_API_KEY=secure_api_key_here
```

### **Option 2: Location-Based TV Players**
TV players identified by physical location:

```bash
# Environment variables for each TV player
REACT_APP_TV_PLAYER_LOCATION_ID=hospital_lobby_tv_1
REACT_APP_TV_PLAYER_API_KEY=secure_api_key_here
```

### **Option 3: Hybrid Approach**
Combine user and location identification:

```bash
# Environment variables for each TV player
REACT_APP_TV_PLAYER_USER_ID=hospital_org_123
REACT_APP_TV_PLAYER_LOCATION_ID=lobby_display_1
REACT_APP_TV_PLAYER_API_KEY=secure_api_key_here
```

## 🚀 **Implementation Steps:**

### **Step 1: Update TV Player Code**
Replace `src/App.js` with `src/App-multiuser.js`:

```bash
cd web-clients/tv-player
cp src/App-multiuser.js src/App.js
```

### **Step 2: Set Environment Variables**
For each TV player, set unique environment variables:

```bash
# Hospital TV Player
REACT_APP_TV_PLAYER_USER_ID=hospital_123
REACT_APP_TV_PLAYER_API_KEY=hospital_secure_key

# School TV Player  
REACT_APP_TV_PLAYER_USER_ID=school_456
REACT_APP_TV_PLAYER_API_KEY=school_secure_key

# Restaurant TV Player
REACT_APP_TV_PLAYER_USER_ID=restaurant_789
REACT_APP_TV_PLAYER_API_KEY=restaurant_secure_key
```

### **Step 3: Update Backend Functions**
Modify your backend functions to filter by user/location:

```javascript
// In your playlist function
const query = `
  SELECT * FROM playlists 
  WHERE user_id = ? AND is_active = true
`;
const result = await datastore.executeQuery(query, [user_id]);
```

### **Step 4: Deploy TV Players**
Deploy each TV player with its unique configuration:

```bash
# Deploy Hospital TV Player
REACT_APP_TV_PLAYER_USER_ID=hospital_123 \
REACT_APP_TV_PLAYER_API_KEY=hospital_secure_key \
vercel --prod

# Deploy School TV Player
REACT_APP_TV_PLAYER_USER_ID=school_456 \
REACT_APP_TV_PLAYER_API_KEY=school_secure_key \
vercel --prod
```

## 🔒 **Security Considerations:**

### **API Key Management**
- Generate unique API keys for each TV player
- Store API keys securely (environment variables)
- Rotate API keys regularly
- Monitor API key usage

### **User ID Security**
- Use non-guessable user IDs
- Don't expose user IDs in public URLs
- Validate user IDs on backend
- Log all TV player access

### **Data Isolation**
- Ensure TV players can only access their assigned content
- Validate user/location on every API call
- No cross-user data access allowed
- Regular security audits

## 📋 **Deployment Checklist:**

### **For Each TV Player:**
- [ ] Set unique `TV_PLAYER_USER_ID` or `TV_PLAYER_LOCATION_ID`
- [ ] Generate secure API key
- [ ] Test content isolation
- [ ] Verify only correct content displays
- [ ] Monitor for security issues

### **Backend Requirements:**
- [ ] Update all functions to filter by user/location
- [ ] Add user/location validation
- [ ] Implement API key authentication
- [ ] Add access logging

### **Testing Requirements:**
- [ ] Test with multiple TV players
- [ ] Verify content isolation
- [ ] Test API key security
- [ ] Validate error handling

## 🎯 **Real-World Examples:**

### **Hospital Setup:**
```bash
# Emergency Room TV
REACT_APP_TV_PLAYER_USER_ID=hospital_emergency_room
REACT_APP_TV_PLAYER_LOCATION_ID=er_waiting_area

# Lobby TV  
REACT_APP_TV_PLAYER_USER_ID=hospital_emergency_room
REACT_APP_TV_PLAYER_LOCATION_ID=main_lobby

# Cafeteria TV
REACT_APP_TV_PLAYER_USER_ID=hospital_emergency_room  
REACT_APP_TV_PLAYER_LOCATION_ID=cafeteria
```

### **School Setup:**
```bash
# Main Hallway TV
REACT_APP_TV_PLAYER_USER_ID=school_main_campus
REACT_APP_TV_PLAYER_LOCATION_ID=main_hallway

# Library TV
REACT_APP_TV_PLAYER_USER_ID=school_main_campus
REACT_APP_TV_PLAYER_LOCATION_ID=library

# Gym TV
REACT_APP_TV_PLAYER_USER_ID=school_main_campus
REACT_APP_TV_PLAYER_LOCATION_ID=gymnasium
```

### **Restaurant Chain Setup:**
```bash
# Location 1 - Downtown
REACT_APP_TV_PLAYER_USER_ID=restaurant_downtown
REACT_APP_TV_PLAYER_LOCATION_ID=dining_room_main

# Location 2 - Mall
REACT_APP_TV_PLAYER_USER_ID=restaurant_mall_location  
REACT_APP_TV_PLAYER_LOCATION_ID=counter_display

# Location 3 - Airport
REACT_APP_TV_PLAYER_USER_ID=restaurant_airport_terminal
REACT_APP_TV_PLAYER_LOCATION_ID=gate_area
```

## ⚠️ **Critical Warnings:**

### **DO NOT Deploy TV Players Until:**
- ✅ User/location identification is implemented
- ✅ Content isolation is verified
- ✅ API security is in place
- ✅ Multiple TV players are tested

### **Security Risks if Deployed Without Fixes:**
- Wrong content displayed to customers
- Brand damage and confusion
- Potential security breaches
- Compliance violations
- Customer trust issues

## 🧪 **Testing Strategy:**

### **Multi-TV Player Testing:**
1. Deploy 3+ TV players with different user IDs
2. Verify each shows only its assigned content
3. Test content updates affect only correct TV players
4. Verify no cross-contamination between TVs

### **Security Testing:**
1. Try accessing other users' content
2. Test API key validation
3. Verify user ID validation
4. Test error handling and fallbacks

## 📞 **Next Steps:**

1. **STOP TV player deployment** until multi-user support is implemented
2. **Choose user identification strategy** (user ID vs location ID)
3. **Update TV player code** with user context
4. **Modify backend functions** for user filtering
5. **Test with multiple TV players**
6. **Deploy with proper security**

## 🎯 **Estimated Timeline:**

- **TV Player Code Updates**: 2-3 hours
- **Backend Function Updates**: 3-4 hours
- **Testing & Validation**: 4-6 hours
- **Deployment Setup**: 2-3 hours
- **Total**: 1-2 days

**This is equally critical as the dashboard multi-user support!**
