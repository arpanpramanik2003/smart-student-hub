# 🚗 Google Drive Setup Guide
## Use Your 2TB Storage for Smart Student Hub

Quick guide to setup Google Drive API for file storage (avatars, certificates, documents).

---

## 🎯 Why Google Drive?

- ✅ **2TB Storage** - Your existing Google Drive space
- ✅ **No Additional Cost** - Use what you already have
- ✅ **Easy Management** - View/manage files in Drive UI
- ✅ **Reliable** - Google's infrastructure
- ✅ **Fast Access** - Direct download links

---

## 📝 Step 1: Create Google Cloud Project (5 minutes)

### 1.1 Go to Google Cloud Console
```
URL: https://console.cloud.google.com
```

### 1.2 Create New Project
```
1. Click dropdown at top (next to "Google Cloud")
2. Click "New Project"
3. Name: smart-student-hub
4. Click "Create"
5. Wait 30 seconds for project creation
6. Select your new project from dropdown
```

---

## 📡 Step 2: Enable Google Drive API (2 minutes)

### 2.1 Enable API
```
1. In search bar at top, type: "Google Drive API"
2. Click first result: "Google Drive API"
3. Click "Enable" button
4. Wait for API to enable (30 seconds)
```

### 2.2 Verify
```
✅ You should see "API enabled" message
✅ Dashboard shows "Google Drive API" as enabled
```

---

## 🔑 Step 3: Create Service Account (5 minutes)

### 3.1 Navigate to Service Accounts
```
1. Left menu > IAM & Admin > Service Accounts
2. Click "+ Create Service Account"
```

### 3.2 Create Account
```
Step 1: Service account details
- Name: drive-uploader
- Description: Service account for Smart Student Hub file uploads
- Click "Create and Continue"

Step 2: Grant access (SKIP THIS)
- Click "Continue" (no roles needed)

Step 3: Grant users access (SKIP THIS)
- Click "Done"
```

### 3.3 Create JSON Key
```
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select: JSON
5. Click "Create"
6. JSON file downloads automatically
   ✅ SAVE THIS FILE SECURELY!
   ✅ You'll need it for deployment
```

### 3.4 Copy Service Account Email
```
1. On the service account page, copy the email address
2. Format: drive-uploader@smart-student-hub-xxxxx.iam.gserviceaccount.com
3. ✅ You'll need this email in next step!
```

---

## 📁 Step 4: Create Google Drive Folder (3 minutes)

### 4.1 Create Upload Folder
```
1. Go to: https://drive.google.com
2. Click "+ New" > "Folder"
3. Name: SmartStudentHub-Uploads
4. Click "Create"
```

### 4.2 Get Folder ID
```
1. Open the folder you just created
2. Look at URL in browser:
   https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
3. Copy the part after /folders/
   Example: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ
4. ✅ This is your GOOGLE_DRIVE_FOLDER_ID
```

### 4.3 Share Folder with Service Account
```
1. Right-click on folder > "Share"
2. In "Add people and groups" field:
   Paste the service account email from Step 3.4
   (drive-uploader@smart-student-hub-xxxxx.iam.gserviceaccount.com)
3. Role: Editor
4. Uncheck "Notify people"
5. Click "Share"
```

✅ **Important:** This allows the service account to upload files to your folder!

---

## 🔍 Step 5: Prepare Credentials (2 minutes)

### 5.1 Open JSON Key File
```
1. Open the JSON file you downloaded in Step 3.3
2. It should look like this:
```

```json
{
  "type": "service_account",
  "project_id": "smart-student-hub-xxxxx",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "drive-uploader@smart-student-hub-xxxxx.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 5.2 Copy Entire JSON
```
✅ Select all text in the file
✅ Copy it (Ctrl+C or Cmd+C)
✅ You'll paste this in Render environment variables
```

---

## 📋 Step 6: Summary - What You Need

Before deploying to Render, you should have:

### ✅ Google Drive Folder ID
```
Example: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ
From: Step 4.2
```

### ✅ Service Account JSON
```
Entire JSON file content from Step 5.2
Contains: project_id, private_key, client_email, etc.
```

---

## 🎬 Step 7: Test Locally (Optional)

### 7.1 Update Local .env
```bash
# Edit backend/.env
GOOGLE_DRIVE_FOLDER_ID=1aBcDeFgHiJkLmNoPqRsTuVwXyZ
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account",...paste entire JSON...}
```

### 7.2 Install Dependencies
```bash
cd backend
npm install googleapis
```

### 7.3 Start Backend
```bash
npm run dev
```

### 7.4 Test Upload
```
1. Start frontend: cd frontend && npm run dev
2. Login as student
3. Try uploading avatar
4. Check your Google Drive folder for uploaded file
```

---

## 🚀 Step 8: Deploy to Render

When deploying backend to Render, add these environment variables:

| Variable | Value |
|----------|-------|
| `GOOGLE_DRIVE_FOLDER_ID` | Your folder ID from Step 4.2 |
| `GOOGLE_DRIVE_CREDENTIALS` | Entire JSON from Step 5.2 |

**Note:** Render accepts multi-line JSON, so you can paste it as-is!

---

## 🔒 Security Notes

### ✅ DO:
- Keep JSON key file secure (never commit to git)
- Use `.gitignore` to exclude `.env` files
- Share Drive folder only with service account
- Use Editor role (not Owner) for service account

### ❌ DON'T:
- Don't share JSON key publicly
- Don't commit credentials to GitHub
- Don't share Drive folder publicly
- Don't use your personal Google account credentials

---

## 🎨 How It Works in Production

```
User uploads file
      ↓
Backend receives file (multer)
      ↓
cloudStorage.js detects production mode
      ↓
File uploaded to Google Drive folder
      ↓
Public link generated: https://drive.google.com/uc?export=view&id=FILE_ID
      ↓
Link saved in database
      ↓
Frontend displays image/file using the link
```

---

## 📊 File Management

### View Uploaded Files
```
1. Go to: https://drive.google.com
2. Open SmartStudentHub-Uploads folder
3. All uploaded files will be here with timestamps
```

### File Naming
```
Format: {timestamp}-{original-filename}
Example: 1700123456789-profile-photo.jpg
```

### Organize Files
```
You can create subfolders manually:
- Avatars/
- Certificates/
- Documents/

Files will still upload to main folder,
but you can move them manually if needed.
```

---

## 🐛 Troubleshooting

### "Error: Could not load credentials"
```
Problem: JSON credentials invalid or malformed
Solution:
1. Verify JSON is complete (starts with { ends with })
2. Check for proper escaping of quotes
3. Try pasting in Render as multi-line
4. Regenerate key if needed
```

### "Error: Folder not found"
```
Problem: Service account can't access folder
Solution:
1. Verify folder ID is correct
2. Check folder is shared with service account email
3. Service account needs "Editor" permission
4. Wait 5 minutes after sharing for permissions to propagate
```

### "Error: Google Drive API not enabled"
```
Problem: API not enabled in Cloud Console
Solution:
1. Go to: https://console.cloud.google.com
2. Select correct project
3. Search "Google Drive API"
4. Click "Enable"
```

### Files upload but links don't work
```
Problem: Files not set to public
Solution:
1. Check cloudStorage.js has permission.create code
2. Manually make folder publicly readable
3. Or use anyone-with-link sharing
```

---

## 💡 Tips & Tricks

### Quota Limits
```
Google Drive API Free Tier:
- 1 billion queries/day (way more than you need!)
- 2TB storage (your existing Drive space)
- No bandwidth limits
```

### Performance
```
- Direct links are fast (cached by Google CDN)
- No cold starts (unlike Cloud Storage)
- Works worldwide
```

### Backup
```
- Files are in your Google Drive
- Enable version history in Drive settings
- Download all files anytime from Drive
```

### Migration
```
If you want to switch to Cloud Storage later:
1. Update cloudStorage.js
2. Update environment variables
3. Files will upload to new location
4. Old files remain accessible via saved links
```

---

## ✅ Checklist

Before deployment, ensure you have:

- [ ] Created Google Cloud project
- [ ] Enabled Google Drive API
- [ ] Created service account
- [ ] Downloaded JSON key file
- [ ] Created Google Drive folder
- [ ] Copied folder ID
- [ ] Shared folder with service account email
- [ ] Tested locally (optional)
- [ ] Ready to paste in Render environment variables

---

## 🎉 You're Ready!

Your Google Drive is now configured for Smart Student Hub!

**Next Steps:**
1. Go to Render deployment
2. Add GOOGLE_DRIVE_FOLDER_ID and GOOGLE_DRIVE_CREDENTIALS
3. Deploy backend
4. Test file upload
5. Enjoy 2TB of free storage! 🎊

---

**Need Help?** See DEPLOYMENT_RENDER_SUPABASE.md for full deployment guide.
