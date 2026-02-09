# username2email     

**username2email** is a CLI-based OSINT utility that generates realistic email address permutations from a target’s **name** and related identifiers like **username**
It is built for investigative, reconnaissance, and research workflows, where discovering potential email addresses can significantly improve attribution, pivoting, and enrichment.
Unlike noisy brute-force generators, username2email focuses on human-like, commonly used email patterns to keep results relevant and usable.

## Why username2email?

In OSINT email addresses are one of the highest-value identifiers.
They act as stable pivot points across platforms, breaches, social networks, and account ecosystems.

However, in many investigations:

- The email is not directly available
- Only partial identity data exists (name, alias, city, username)
- Existing generators produce huge, noisy, unrealistic lists

**username2email** was built to solve this specific gap.

## ✨ Features    
- 🖥️ Cross-platform (Windows / Linux )
- 🔢 Supports numeric ranges (e.g., `john0` → `john1000`)
- 📋 Copies results directly to clipboard


## 🛠 Requirements           
Python **3.8+** recommended.
Install dependencies:
```
pip install pyfiglet colorama pyperclip
```

## Setup
Clone the Repository
``` 
git clone https://github.com/yourusername/username2email.git
```

``` 
cd username2email
```

## 🚀 Usage 
Run the script:
```
python username2email.py
```
If that fails:
``` 
python3 username2email.py
```

You will be prompted for:

- **First name** (required)
- **Last name** (required)
- **Add-up** (optional: city, keyword, surname, etc.)
- **Start number** (default: `0`)
- **End number** (default: `1000`)

The email domain is currently **fixed to `@gmail.com`** .
You can change the domain manually if needed, but the logic is optimized for Gmail-style patterns.

## 🔗 Recommended Extension 
`username2email` is designed to be most effective when paired with a **username2eamil extension**.

## ⚠️ Disclaimer        
This tool is intended for **educational, research, and lawful OSINT purposes only**. You are responsible for how you use it. Do **not** use it for spam, harassment, or illegal access attempts.

## Demo Video 

[![username2 email video demo ](https://img.youtube.com/vi/W2L7ioO8kFs/0.jpg)](https://youtu.be/W2L7ioO8kFs?si=jxgCBkSapa-T6CyC)



## 👤 Author
Built by Arsh
https://www.linkedin.com/in/arshdeep-singh-61356331a/


