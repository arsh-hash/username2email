# username2email     

`username2email` is a CLI-based OSINT tool  that generates realistic email address permutations from a target’s name (username) It is designed for **investigative, recon, and research workflows**, where knowing email provide edge in  information gathering.

---

## ⚠️ Disclaimer        

This tool is intended for **educational, research, and lawful OSINT purposes only**. You are responsible for how you use it. Do **not** use it for spam, harassment, or illegal access attempts.

---

## ✨ Features    

- 🖥️ Cross-platform (Windows / Linux )
- 🔢 Supports numeric ranges (e.g., `john0` → `john1000`)
- 📋 Copies results directly to clipboard
---

## 🛠 Requirements           

Python **3.8+** recommended.

Install dependencies:

```bash
pip install pyfiglet colorama pyperclip
```

---

## 🚀 Usage 

Run the script:

```bash
python username2email.py
```

You will be prompted for:

- **First name** (required)
- **Last name** (required)
- **Add-up** (optional: city, keyword, surname, etc.)
- **Start number** (default: `0`)
- **End number** (default: `1000`)

The email domain is currently **fixed to `@gmail.com`** .
You can change the domain manually if needed, but the logic is optimized for Gmail-style patterns.



## 👤 Author

Built by Arsh

https://www.linkedin.com/in/arshdeep-singh-61356331a/



## 🔗 Recommended Extension (Workflow Completion)

`username2email` is designed to be most effective when paired with a **Gmail-based verification workflow**.
