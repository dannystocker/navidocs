# NaviDocs User Testing Instructions - Cloud Sessions

**Status**: Ready for Production Testing
**Created**: 2025-11-13
**Target Users**: Boat owners (non-technical, first-time users)
**Test Duration**: 45-60 minutes per user
**Devices**: Desktop + Mobile

---

## Welcome to NaviDocs Beta Testing!

You're about to test a new app that helps boat owners organize and find boat documentation. **Please act like you know nothing about software development** - test like a regular boat owner would. Your honest feedback will help us make this better.

**Important**: This is a USER PERSPECTIVE TEST, not a developer test. We want to know:
- Is the interface intuitive?
- Can you accomplish tasks without asking for help?
- Does it feel slow or fast?
- Would you actually use this every day?

---

## Part 1: Setup (5 minutes)

### Before You Start

1. **Find the Test URL**
   - Desktop: `https://digital-lab.ca/navidocs/`
   - Mobile: Same URL (it's fully responsive)

2. **Create a Test Account**
   - Click "Create Account"
   - Email: Use your real email (for notifications)
   - Password: Something you'll remember (write it down if needed)
   - Boat Name: Use any boat you know (or "Test Boat")
   - **Note**: This is just for testing - your data will be deleted after

3. **Check Device**
   - Make sure you're testing on BOTH:
     - [ ] Desktop browser (Chrome, Safari, Firefox - pick one)
     - [ ] Mobile phone browser (iPhone Safari or Android Chrome)

---

## Part 2: What You're Testing (3 Features)

### Feature 1: Smart OCR (Fast Document Processing)

**What it does**: When you upload a PDF, the app reads text from it and makes it searchable. This should be FAST (under 10 seconds).

**What we're testing**:
- Does the upload button work?
- Does the progress indicator show anything?
- How long does it actually take? (Time it with your phone)
- Can you search for text from the PDF afterward?

**Test files to use**:
- Try uploading a real boat manual PDF (if you have one)
- Or create a test PDF with text like "Engine Serial Number: ABC123456"
- Test document should be 10-100 pages

---

### Feature 2: Multi-Format Upload Support

**What it does**: You should be able to upload 6 different file types:

| Format | What It Is | How to Test |
|--------|-----------|------------|
| **PDF** | Boat manuals | Upload any PDF manual |
| **JPG/PNG** | Photos of documents | Take a photo of a receipt, upload it |
| **DOCX** | Word documents | Create a .docx file with boat info |
| **XLSX** | Spreadsheets | Create a .xlsx with maintenance dates |
| **TXT** | Plain text | Create a .txt file with any text |
| **MD** | Markdown (formatted text) | Create a .md file with content |

**What we're testing**:
- Can you upload each format?
- Does the app show what type it is?
- Does text get extracted (searchable)?
- Any format that fails - which one?

**Test Plan**:
1. Gather these files (or create them):
   - 1 PDF
   - 1 JPG or PNG (photo)
   - 1 DOCX file (Word)
   - 1 XLSX file (Excel)
   - 1 TXT file
   - 1 MD file

2. Upload each one and answer:
   - [ ] PDF uploaded and searchable?
   - [ ] JPG/PNG uploaded and searchable?
   - [ ] DOCX uploaded and searchable?
   - [ ] XLSX uploaded and searchable?
   - [ ] TXT uploaded and searchable?
   - [ ] MD uploaded and searchable?

---

### Feature 3: Timeline Activity Tracking

**What it does**: The app tracks what you did (when you uploaded documents, when you deleted them, etc.) and shows a timeline.

**What we're testing**:
- After you upload documents, do they appear in a timeline?
- Do the timestamps make sense?
- Can you see which documents you uploaded?
- Is it clear what happened and when?

**Test Plan**:
1. Upload a document
2. Wait 5 seconds
3. Look for a "Timeline" or "Activity" section
4. Answer:
   - [ ] Timeline visible after uploading?
   - [ ] Shows correct upload time?
   - [ ] Shows your username or "You"?
   - [ ] Easy to understand what happened?

---

## Part 3: User Scenarios (Real-World Testing)

**These scenarios mimic what actual boat owners would do. Test each one and pay attention to how easy or hard it is.**

### Scenario A: "I just bought a boat, need to organize 50 manuals"

**What you would do in real life**: Buy a new boat, get a stack of manuals (engine, electrical, plumbing, hull, etc.), need to organize them so you can find things later.

**Your test**:
1. Create 5-10 test documents representing manuals:
   - `Engine_Manual_2024.pdf`
   - `Electrical_System_Guide.pdf`
   - `Plumbing_Specs.docx`
   - `Maintenance_Schedule.xlsx`
   - `Hull_Warranty.txt`

2. Upload all of them (over a few minutes)

3. Answer these questions:
   - [ ] Easy to figure out where to click to upload?
   - [ ] Can you upload multiple files in a row?
   - [ ] Does the app feel like it's hanging or is there feedback?
   - [ ] How long did 5 files take to process?
   - [ ] Would you do this again if you had to?

---

### Scenario B: "I need to find the engine serial number quickly"

**What you would do in real life**: You're at the marina, the mechanic asks "What's your engine serial number?" You need to find it in seconds.

**Your test**:
1. Create a document with engine details:
   - PDF, Word doc, or text file
   - Include text like "Engine Serial: ABC123DEF456"
   - Include model number, year, etc.

2. Upload it

3. After it processes, search for:
   - [ ] Search for "serial" - does it find the document?
   - [ ] Search for "ABC123" - does it find it?
   - [ ] How fast does search return results? (Should be instant)
   - [ ] Can you click the result and see the text highlighted?
   - [ ] Does it feel faster or slower than using Google?

---

### Scenario C: "I want to see what I did last week"

**What you would do in real life**: You're trying to remember when you last serviced the engine, or when you uploaded a specific document.

**Your test**:
1. Upload documents over a 5-minute period
2. Look for timeline/activity section
3. Answer:
   - [ ] Is there a clear "Timeline" or "Recent Activity" section?
   - [ ] Can you see when each document was uploaded?
   - [ ] Is the order clear (newest first, oldest last)?
   - [ ] Can you click timeline items to view documents?
   - [ ] Would you use this feature regularly?

---

### Scenario D: "I need to share a document with my mechanic"

**What you would do in real life**: Your mechanic needs to see your warranty information, fuel system specs, or maintenance history. You need to share it somehow.

**Your test**:
1. Upload a document
2. Look for a "Share" button or similar
3. **Important**: If there's NO share button, report this as feedback!
4. Answer:
   - [ ] Can you find a way to share? (If no, just note it)
   - [ ] Does the share option make sense?
   - [ ] Would you trust sharing documents this way?

---

## Part 4: Mobile Testing (15 minutes)

**Now test the SAME features on a phone.**

### Do This on Mobile:

1. **Upload a document on mobile**
   - Can you figure out how to upload from a phone?
   - Is the button easy to click?
   - Can you select a file from your phone?

2. **Search on mobile**
   - Is the search box visible?
   - Can you type easily?
   - Are search results readable?

3. **View timeline on mobile**
   - Scroll down - can you find the timeline?
   - Is the timeline readable on a small screen?

4. **General mobile experience**
   - [ ] Text is readable (not tiny)?
   - [ ] Buttons are big enough to click easily?
   - [ ] No parts of the interface cut off?
   - [ ] Scrolling feels smooth?
   - [ ] If you have to zoom in/out, it's annoying (note this)

---

## Part 5: Edge Cases (Try to Break Things)

**These are unusual situations that might cause problems. Try them:**

### Edge Case 1: Very Large File
- [ ] Try uploading a PDF larger than 50 MB
- What happens? Does it upload or show an error?

### Edge Case 2: Special File Names
- [ ] Try uploading a file with special characters: `Engine#1&2 (Copy).pdf`
- Does it work or cause an error?

### Edge Case 3: Slow Internet Simulation
- [ ] On mobile, switch to a slower connection (or use phone's throttling)
- Does the upload still work?
- What happens if you close the browser mid-upload?

### Edge Case 4: Empty Search
- [ ] Search for something that doesn't exist: "zzzzzzzzqqqqqq"
- Does it show "No results" or an error?

### Edge Case 5: Rapid Uploads
- [ ] Try uploading 3 documents in quick succession
- Does the app handle it or get confused?

---

## Part 6: Compare to Competitors (Optional but Helpful)

**If you've used other boat document apps, compare:**

| Competitor | Link | What Do They Do Better? |
|------------|------|------------------------|
| Boat Books | https://boatbooksapp.com | __ |
| YachtCloser | (search Google) | __ |
| Other apps you've seen | | __ |

**Just note**: What would make NaviDocs better than what you've seen before?

---

## Part 7: Usability Feedback

**Answer these honestly:**

### UI/UX Questions

1. **First Impression** (After 30 seconds):
   - [ ] Is it clear what this app does?
   - [ ] Would you continue exploring or leave?
   - [ ] Rate clarity: 1 (confusing) → 5 (obvious)

2. **Navigation**:
   - [ ] Can you find where to upload documents?
   - [ ] Can you find where to search?
   - [ ] Can you find the timeline?
   - [ ] Any buttons or menus that confused you?

3. **Search**:
   - [ ] Search results make sense?
   - [ ] Can you find what you're looking for?
   - [ ] Any results that seem wrong or irrelevant?

4. **Performance**:
   - [ ] App feels responsive or slow?
   - [ ] Loading times acceptable?
   - [ ] Any lag when typing or clicking?

5. **Visual Design**:
   - [ ] Colors easy on the eyes?
   - [ ] Text easy to read?
   - [ ] Layout feels organized or cluttered?

6. **Overall Experience**:
   - [ ] Would you recommend this to another boat owner?
   - [ ] Would you pay for this? (How much: $5/mo? $10/mo? $20/mo?)
   - [ ] What's the #1 thing you'd change?

---

## Part 8: Issue Reporting

**If you found something broken, confusing, or slow, report it here.**

### Report Template

Create a file called `TEST-REPORT-SESSION-[YOUR-NAME].md` and fill in this template:

```markdown
# NaviDocs Test Report

**Tester Name**: [Your name]
**Test Date**: [Date and time]
**Device(s) Tested**: [ ] Desktop  [ ] Mobile  [ ] Both
**Duration**: [How long you tested]

---

## What Worked Well

1.
2.
3.

---

## Issues Found

### Issue #1: [Brief Title]
- **Severity**: [ ] Critical (app broke)  [ ] Major (feature doesn't work)  [ ] Minor (confusing)
- **How to reproduce**:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- **Expected**: [What should happen]
- **Actual**: [What actually happened]
- **Screenshot**: (if possible, paste URL)

### Issue #2: [Brief Title]
- [Same template as above]

---

## Feature Feedback

### Smart OCR (Document Processing)
- **Works?**: [ ] Yes  [ ] No  [ ] Partially
- **Speed**: [ ] Fast (<10s)  [ ] Slow (>30s)  [ ] Very Slow (>60s)
- **Comments**:

### Multi-Format Upload
- **Works?**: [ ] Yes  [ ] No  [ ] Partially
- **Which formats work?**: PDF [ ] JPG/PNG [ ] DOCX [ ] XLSX [ ] TXT [ ] MD
- **Which formats don't?**:
- **Comments**:

### Timeline Activity
- **Visible?**: [ ] Yes  [ ] No
- **Clear?**: [ ] Yes  [ ] No  [ ] Somewhat
- **Comments**:

---

## Usability Ratings (1-5 scale)

- **Ease of Use**: ___ / 5
- **Search Quality**: ___ / 5
- **Design**: ___ / 5
- **Performance**: ___ / 5
- **Overall Experience**: ___ / 5

---

## Scenario Results

### Scenario A: Organize 50 Manuals
- [ ] Completed easily
- [ ] Completed with some difficulty
- [ ] Could not complete
- **Time taken**: [minutes]
- **Comments**:

### Scenario B: Find Engine Serial Quickly
- [ ] Completed easily
- [ ] Completed with some difficulty
- [ ] Could not complete
- **Time taken**: [seconds]
- **Comments**:

### Scenario C: See Last Week's Activity
- [ ] Completed easily
- [ ] Completed with some difficulty
- [ ] Could not complete
- **Comments**:

### Scenario D: Share with Mechanic
- [ ] Feature exists and works
- [ ] Feature missing
- [ ] Feature exists but confusing
- **Comments**:

---

## Mobile Testing Results

- **Tested on**: [Device and browser]
- **Readability**: [ ] Good  [ ] OK  [ ] Hard to read
- **Touch targets**: [ ] Easy to tap  [ ] Sometimes hard  [ ] Too small
- **Responsive**: [ ] Fully responsive  [ ] Mostly responsive  [ ] Not mobile-friendly
- **Overall mobile experience**: ___ / 5

---

## Competitive Comparison

**If tested other apps, what did NaviDocs do better/worse?**

Better than competitors:
-

Worse than competitors:
-

---

## Would You Use This?

- [ ] Yes, I'd definitely use this
- [ ] Maybe, if [features added]
- [ ] No, because [reasons]

**How much would you pay per month?**
- [ ] Free only
- [ ] $1-5/month
- [ ] $5-10/month
- [ ] $10-20/month
- [ ] $20+/month

---

## Additional Comments

[Your final thoughts, suggestions, or anything else we should know]

---

**Thank you for testing NaviDocs!** Your feedback helps us build something boat owners actually want to use.
```

---

## Part 9: How to Submit Your Results

### Option 1: GitHub (Preferred)

1. Fork the repository: `https://github.com/dannystocker/navidocs`
2. Create a new branch: `testing/[your-name]-[date]`
3. Add your report file: `testing/TEST-REPORT-SESSION-[YOUR-NAME].md`
4. Create a Pull Request with title: `Test Report: [Your Name] - [Date]`

### Option 2: Email

Send the completed report to: [Contact email - to be updated]

### Option 3: Issue on GitHub

If there are critical bugs, also create a GitHub Issue:
1. Go to: `https://github.com/dannystocker/navidocs/issues`
2. Click "New Issue"
3. Use title: `[BUG] Issue description` or `[FEEDBACK] Suggestion`

---

## Timing Guide

Use this to plan your testing session:

| Activity | Time |
|----------|------|
| Setup (account, uploads) | 5 min |
| Feature 1: Smart OCR | 10 min |
| Feature 2: Multi-Format | 15 min |
| Feature 3: Timeline | 5 min |
| Scenarios (A, B, C, D) | 15 min |
| Mobile Testing | 15 min |
| Edge Cases | 10 min |
| Reporting | 10 min |
| **TOTAL** | **~85 minutes** |

**Minimum viable test** (if short on time): Features 1-3 + Scenario A = 30 minutes

---

## Important Reminders

### What We Want to Know

- Is this intuitive for a boat owner with NO software background?
- Would you actually use this instead of Google Drive or email?
- What would make you NOT use this?
- What features are missing?

### What We DON'T Want

- Technical jargon ("The API response time..." - we don't care)
- Vague feedback ("It's slow" - TELL US WHEN and WHERE it's slow)
- Wishful features unrelated to boat docs ("Add a chat feature")

### Act Like a Real User

- Don't overthink it
- Don't try to "be nice" if something sucks
- Don't assume you should know how something works
- If you're confused, that's important feedback!

---

## Questions During Testing?

**If something is unclear:**
- Take a screenshot
- Note what confused you
- Include this in your report

**If the app crashes:**
- Note the exact steps you did
- Take a screenshot of the error
- Report it (this is valuable!)

---

## What Happens After You Test

1. Your report is reviewed by the product team
2. We identify patterns (if 5 people report the same issue, it's a priority)
3. We fix critical bugs before launch
4. We thank you (seriously!)
5. You might be invited to test future features

---

## Thank You!

Boat owners deserve great software. Your testing makes NaviDocs better.

**Happy testing!**

---

**NaviDocs Test Version**: v1.0.0-beta
**Last Updated**: 2025-11-13
**Test Lead**: Product Team
**Feedback Deadline**: [TBD - update after cloud sessions]

