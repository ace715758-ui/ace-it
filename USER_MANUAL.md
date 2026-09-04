# Ace It! — User Manual

> A complete step-by-step guide for students using the Ace It! AI Study Quiz Generator.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
   - [Creating an Account](#11-creating-an-account)
   - [Logging In](#12-logging-in)
   - [Forgot Password](#13-forgot-password)
   - [Logging Out](#14-logging-out)
2. [The Dashboard](#2-the-dashboard)
3. [Uploading Study Materials](#3-uploading-study-materials)
   - [Supported File Types](#31-supported-file-types)
   - [How to Upload](#32-how-to-upload)
   - [Processing Status](#33-processing-status)
   - [Renaming a Material](#34-renaming-a-material)
   - [Deleting a Material](#35-deleting-a-material)
4. [Creating a Quiz](#4-creating-a-quiz)
   - [Step 1 — Select Materials](#41-step-1--select-materials)
   - [Step 2 — Configure Settings](#42-step-2--configure-settings)
   - [Step 3 — Generate](#43-step-3--generate)
5. [Taking a Quiz](#5-taking-a-quiz)
   - [Navigating Questions](#51-navigating-questions)
   - [Answering Questions](#52-answering-questions)
   - [Submitting](#53-submitting)
6. [Viewing Your Results](#6-viewing-your-results)
   - [Score Summary](#61-score-summary)
   - [Reviewing Answers](#62-reviewing-answers)
7. [Quiz History](#7-quiz-history)
   - [Finding a Past Quiz](#71-finding-a-past-quiz)
   - [Retaking a Quiz](#72-retaking-a-quiz)
8. [Profile & Settings](#8-profile--settings)
9. [Tips for Best Results](#9-tips-for-best-results)
10. [Frequently Asked Questions](#10-frequently-asked-questions)

---

## 1. Getting Started

### 1.1 Creating an Account

1. Open your browser and go to the app URL (e.g. `http://localhost:3000` during development).
2. You will land on the **home page**. Click the **"Get Started Free"** button.
3. You will be taken to the **Sign Up** page.
4. Fill in the form:

   | Field | Requirements |
   |---|---|
   | **Full Name** | At least 2 characters |
   | **Email** | A valid email address |
   | **Password** | At least 8 characters, 1 uppercase letter, 1 number |
   | **Confirm Password** | Must match your password |

5. Click **"Create Account"**.
6. You will be redirected to the login page. Log in with your email and password.

> **Note:** Each email address can only be used for one account.

---

### 1.2 Logging In

1. Go to the **Login** page (`/login`).
2. Enter your **email** and **password**.
3. Click **"Log In"**.
4. You will be taken to your **Dashboard**.

> If you enter the wrong password, you will see an error message. Your account is not locked — try again.

---

### 1.3 Forgot Password

1. On the Login page, click **"Forgot password?"** (next to the password field).
2. Enter your email address and click **"Send Reset Link"**.
3. Check your inbox for a password reset email.
4. Click the link in the email — it opens a page where you can set a new password.
5. Enter your new password (must meet the same requirements as sign-up).
6. Click **"Update Password"**.
7. You will be redirected to log in with your new password.

---

### 1.4 Logging Out

**From the sidebar (desktop):**
Click **"Logout"** at the bottom of the left sidebar.

**From the mobile menu:**
Tap the menu icon (☰) in the top-right → tap **"Logout"**.

**From Settings:**
Go to **Settings** → click the red **"Sign Out"** button.

---

## 2. The Dashboard

After logging in, the Dashboard is your home base. It shows:

### Welcome Section
A personalized greeting using your full name:
```
Welcome back, [Your Name]!
Ready to test your knowledge?
```

### Statistics Cards
Four cards showing your activity at a glance:

| Card | What It Shows |
|---|---|
| **Materials Uploaded** | Total number of files you have uploaded |
| **Quizzes Created** | Total number of quizzes you have generated |
| **Quizzes Completed** | Total number of quiz attempts you have finished |
| **Average Score** | Your average percentage across all completed quizzes |

### Quick Actions
Three buttons for the most common tasks:
- **Upload Material** — goes to the Materials page
- **Create Quiz** — goes to the Quiz Creation page
- **View History** — goes to your Quiz History

### Recent Quizzes
A list of your 5 most recently completed quiz attempts. Each entry shows:
- Quiz title
- Number of questions
- Score percentage
- Completion date
- A **"Review"** button to re-read your answers

---

## 3. Uploading Study Materials

### 3.1 Supported File Types

| Format | Extension | Notes |
|---|---|---|
| PDF | `.pdf` | Textbooks, lecture notes, handouts |
| Word Document | `.docx` | Essays, study guides |
| PowerPoint | `.pptx` | Lecture slides |
| Plain Text | `.txt` | Notes, transcripts |

> **Maximum file size: 50MB per file**

> **Important:** The quality of your quiz depends entirely on the quality of your uploaded material. Files with scanned images (non-selectable text) will not produce good results because the text cannot be extracted.

---

### 3.2 How to Upload

1. Click **"Materials"** in the sidebar (or click **"Upload Material"** on the Dashboard).
2. You will see the Materials page with an upload zone.

**Method 1 — Click to browse:**
- Click anywhere on the dashed upload zone
- A file picker opens — select your file
- Click **Open**

**Method 2 — Drag and drop:**
- Drag your file from File Explorer
- Drop it onto the dashed upload zone

3. The upload zone shows a spinner and progress bar:
   ```
   Uploading and processing your file...
   This may take 15–30 seconds
   [████████████░░░░░░] 65%
   ```

4. **Wait for it to complete.** Do not close the page or navigate away while uploading. Processing happens on the server and includes:
   - Uploading the file to storage
   - Extracting the text
   - Splitting it into chunks
   - Generating AI embeddings

5. When done, the material appears in your list with a green **"Ready"** badge.

> **Why does it take 15–30 seconds?** The system does a lot of work — it reads your document, splits it into meaningful sections, and generates vector embeddings for each section. This preparation is what makes quiz generation fast and accurate later.

---

### 3.3 Processing Status

Each material shows one of these statuses:

| Badge | Meaning |
|---|---|
| 🔵 **Uploading** | File is being transferred to storage |
| 🟡 **Processing** | Text is being extracted and embedded |
| 🟢 **Ready** | Processing complete — can be used for quizzes |
| 🔴 **Failed** | Something went wrong — try re-uploading |

> Only materials with **"Ready"** status can be selected for quiz generation.

---

### 3.4 Renaming a Material

1. On the Materials page, find the material you want to rename.
2. Click the **pencil icon** (✏️) on the right side of the row.
3. A dialog appears with the current name.
4. Edit the name and click **"Rename"** (or press Enter).

---

### 3.5 Deleting a Material

1. Click the **trash icon** (🗑️) next to the material.
2. A confirmation dialog appears:
   ```
   Delete this material?
   This will permanently delete "[filename]" and all its
   processed data. This may affect quizzes that use this material.
   [ Cancel ]  [ Delete ]
   ```
3. Click **"Delete"** to confirm.

> **Warning:** Deleting a material removes it permanently including all its text chunks and embeddings. If any quizzes were generated from it, those quizzes remain but may lose source references.

---

## 4. Creating a Quiz

### 4.1 Step 1 — Select Materials

1. Go to **"Create Quiz"** in the sidebar.
2. You will see a list of all your **"Ready"** materials with checkboxes.
3. Check one or more materials to use as the source for your quiz.

> **Tip:** You can select multiple materials. The AI will draw questions from all of them. For example, select Chapter 1 and Chapter 2 to get a combined quiz.

> Materials that are still "Processing" or "Failed" appear grayed out and cannot be selected.

---

### 4.2 Step 2 — Configure Settings

After selecting materials, fill in the quiz settings:

#### Quiz Title
Give your quiz a descriptive name. Examples:
- `Chapter 3 — Networking Protocols`
- `Midterm Review — All Topics`
- `Quick 5-question warm-up`

#### Number of Questions
Choose from preset options or enter a custom number:

| Option | Best For |
|---|---|
| **5** | Quick warm-up or daily review |
| **10** | Standard practice session |
| **15** | Moderate review |
| **20** | Thorough topic coverage |
| **25** | Exam simulation |
| **Custom** | Any number from 1 to 50 |

> **Note:** If the material does not have enough content for the requested number, the system will generate as many as it can and tell you how many it produced.

#### Difficulty

| Level | Question Style |
|---|---|
| **Easy** | Definitions, basic facts, direct recall |
| **Medium** | Understanding, comparison, applying concepts |
| **Hard** | Analysis, relationships between ideas, scenario-based reasoning |
| **Mixed** | A random combination of all three levels |

#### Question Type

| Type | Format |
|---|---|
| **Multiple Choice** | 4 options (A, B, C, D) — pick one correct answer |
| **True / False** | Two options — True or False |
| **Identification** | Type your answer in a text box |
| **Mixed** | A random combination of all three types |

#### Randomize Questions
- **ON** — Questions appear in a random order each time
- **OFF** — Questions appear in the order they were generated

#### Randomize Choices
- **ON** — For Multiple Choice questions, the order of options is shuffled
- **OFF** — Options appear in the same order as generated

---

### 4.3 Step 3 — Generate

Click the **"Generate Quiz"** button.

You will see a live progress screen showing each step:

```
✓ Materials selected
✓ Content analyzed
✓ Topics identified
⟳ Generating questions...  [████████████░░] 70%
  Validating questions...
  Preparing your quiz...
```

Each step takes a few seconds. The full generation typically takes **15–60 seconds** depending on:
- Number of questions requested
- Size of the materials
- Gemini API response speed

> **Do not close or refresh the page** during generation. If the page is closed, the quiz may not be saved.

When complete, you are automatically redirected to **take the quiz**.

---

## 5. Taking a Quiz

### 5.1 Navigating Questions

The quiz screen shows:
- **Quiz title** at the top
- **Progress bar** — fills as you answer questions
- **Question counter** — e.g., "Question 4 of 10"
- **Question number grid** — small numbered boxes at the bottom showing answered (green) and unanswered (grey) questions

Use the **Previous** and **Next** buttons to move between questions, or click any numbered box to jump directly to that question.

---

### 5.2 Answering Questions

#### Multiple Choice
Click on one of the four answer options. The selected option highlights in blue.
```
○ A. Local Area Network
● B. Wide Area Network       ← selected
○ C. Metropolitan Area Network
○ D. Personal Area Network
```
Click a different option to change your answer.

#### True / False
Click either **True** or **False**.

#### Identification
A text box appears below the question. Type your answer directly into it. Spelling matters — the system does a case-insensitive exact match.

> **Tip for Identification questions:** Keep your answer short and specific. If the question asks "What protocol translates domain names to IP addresses?", type `DNS` not a full sentence.

---

### 5.3 Submitting

When you are ready to submit:

1. Click the **"Submit"** button (appears on the last question, or you can navigate back and click it).
2. A confirmation dialog appears:
   - If you have unanswered questions:
     ```
     ⚠ You have 3 unanswered questions.
     Unanswered questions will be marked as incorrect.
     [ Keep reviewing ]  [ Yes, submit ]
     ```
   - If all questions are answered:
     ```
     You've answered all questions. Ready to see your results?
     [ Keep reviewing ]  [ Yes, submit ]
     ```
3. Click **"Yes, submit"** to finalize.

> **Your score is calculated on the server.** The app never shows you the correct answers before you submit — there is no way to cheat the score.

---

## 6. Viewing Your Results

### 6.1 Score Summary

After submitting, you are taken to the **Results** page showing:

```
🧠  Chapter 1 Quiz

        8 / 10
         80%
      Great job!

✓ 8 correct    ✗ 2 incorrect    Medium    Sep 4, 2026
```

Your grade message changes based on your score:

| Score | Message |
|---|---|
| 90–100% | Excellent! |
| 80–89% | Great job! |
| 70–79% | Good work! |
| 60–69% | Keep practicing! |
| Below 60% | Needs improvement. |

**Action buttons:**
- **Review Answers** — expand the full answer review below
- **Retake Quiz** — take the same quiz again with the same questions
- **New Quiz** — go to quiz creation to generate a fresh quiz
- **Quiz History** — view all your past attempts
- **Back to Dashboard** — return to the home screen

---

### 6.2 Reviewing Answers

Click **"Review Answers"** to expand the detailed review. Every question is shown as a card:

**For a correct answer:**
```
✓  Question 1
   What type of network covers a small geographic area?

   Your Answer:   LAN (Local Area Network)      ← shown in green
   
   Explanation:
   A LAN (Local Area Network) covers a small area like a home
   or office building, as stated in Chapter 1, Section 1.

   Source: Chapter 1 — Network Fundamentals  |  Page 2
```

**For an incorrect answer:**
```
✗  Question 3
   Which OSI layer handles routing using IP addresses?

   Your Answer:   Data Link Layer               ← shown in red
   Correct Answer: Network Layer                ← shown in green

   Explanation:
   The Network Layer (Layer 3) is responsible for routing using
   IP addresses, as described in the OSI Model section.

   Source: Chapter 1 — Network Fundamentals  |  Page 4
```

Each card can be expanded or collapsed by clicking the arrow icon. The **Source** section tells you exactly which material and page the question came from.

---

## 7. Quiz History

### 7.1 Finding a Past Quiz

Click **"Quiz History"** in the sidebar. You will see all your completed attempts listed as cards:

```
Chapter 1 Quiz
10 questions  •  Medium  •  Sep 4, 2026

                      9/10
                       90%
             [ Review ]  [ Retake ]
```

**Sort options** (top-right dropdown):
- **Newest first** — most recent attempts at the top (default)
- **Oldest first** — oldest attempts at the top
- **Highest score** — best performance first
- **Lowest score** — weakest performance first

---

### 7.2 Retaking a Quiz

From the History page, click **"Retake"** next to any quiz. This takes you directly back to the quiz-taking page with the same set of questions — useful for seeing whether you've improved.

To generate a **fresh set of questions** from the same material, click **"Review"** to go to the results page, then click **"New Quiz"** — this takes you to the quiz creation page with the same material pre-selected.

---

## 8. Profile & Settings

### Profile Page

Click **"Profile"** in the sidebar to view and edit your account details.

**What you can change:**
- **Full Name** — edit and click "Save Changes"

**What you cannot change here:**
- Email address (managed through Supabase Auth)

The profile page also shows your personal statistics:
- Materials uploaded
- Quizzes created
- Quizzes completed
- Average score

---

### Settings Page

Click **"Settings"** in the sidebar.

**Change Password:**
1. Enter your new password (min. 8 characters)
2. Confirm the new password
3. Click **"Update Password"**

**Sign Out:**
Click the red **"Sign Out"** button to log out of your account on this device.

---

## 9. Tips for Best Results

### Upload quality material
The AI can only ask questions about what is in your document. The more detailed and well-structured your material, the better the questions.

✅ Good: Textbook chapters, lecture notes with headings, detailed study guides
❌ Poor: Scanned images, documents with only bullet points and no explanation, very short files

### Use descriptive headings in your documents
The system detects section titles and uses them as context. A document with clear headings like "Chapter 3: Network Protocols" produces better-organized questions than one without.

### Start with 5–10 questions
For a first quiz on a new topic, start with 5 or 10 questions on Medium difficulty. Once you know your weak areas, generate a more targeted quiz.

### Mix question types
Use **Mixed** question type to test yourself in different ways. Multiple Choice tests recognition, True/False tests understanding, Identification tests recall.

### Review every question, even ones you got right
The explanations and source references are valuable even for correct answers — they reinforce why the answer is right.

### Re-upload if a material fails processing
If a material shows "Failed" status, delete it and re-upload. This occasionally happens with unusual PDF formatting or very large files.

### Wait for "Ready" before creating a quiz
Creating a quiz from a material that is still processing will fail. Always wait for the green "Ready" badge.

---

## 10. Frequently Asked Questions

**Q: Why is my upload taking so long?**
A: The system doesn't just upload the file — it also extracts the text, splits it into sections, and generates AI embeddings for each section. This preparation takes 15–30 seconds and is what makes quiz generation accurate. Larger files (20MB+) may take up to 60 seconds.

---

**Q: Why does my PDF show as "Failed"?**
A: The most common reasons are:
- The PDF contains only scanned images (not selectable text)
- The PDF is password-protected
- The file is corrupted
Try re-exporting your PDF with text layers enabled, or convert it to a DOCX or TXT file.

---

**Q: Can I upload the same file twice?**
A: Yes. Each upload is treated as a separate material. If you re-upload to fix a "Failed" material, delete the old one first to avoid confusion.

---

**Q: The quiz said it could only generate 7 questions instead of 10. Why?**
A: The AI was unable to find enough distinct, well-supported concepts in the selected material to generate all 10 questions without fabricating information. Try uploading a more detailed version of the document, or reduce the question count.

---

**Q: My identification answer was marked wrong but I think it's right.**
A: Identification scoring uses exact matching (case-insensitive). If the answer is `TCP/IP` and you typed `tcp/ip` you are fine, but if you typed `TCP IP` (without the slash) it will be marked wrong. Check the correct answer shown in the review section and make sure your spelling matches exactly.

---

**Q: Can other students see my materials or quizzes?**
A: No. Every piece of data — your materials, chunks, quizzes, attempts, and answers — is protected by Row Level Security in the database. Student A can never access Student B's data, even if they know the IDs.

---

**Q: Can I use the same material for multiple quizzes?**
A: Yes. A single uploaded material can be used for as many quizzes as you want. Each quiz generates a fresh set of questions.

---

**Q: What happens to my data if I delete a material?**
A: The file is removed from storage and all its processed chunks and embeddings are deleted. Any quizzes that were generated from that material remain, but their source references may show as "Unknown" since the original chunks are gone.

---

**Q: Is my data safe?**
A: Your materials and quiz data are stored in a private Supabase database and storage bucket. Files are not publicly accessible. Passwords are never stored in plain text — Supabase handles authentication securely.

---

**Q: The app seems slow during quiz generation. Is that normal?**
A: Yes. Generating 10 questions involves multiple AI API calls, each taking 2–5 seconds. A 10-question quiz typically takes 30–60 seconds to generate. The progress screen shows you exactly what step is happening.

---

*For technical issues or setup help, refer to the [README.md](README.md).*
