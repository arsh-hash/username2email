import re
import pyperclip
import os
import time
from pyfiglet import Figlet
from colorama import Fore, Style, init

# =========================
# Init
# =========================
init(autoreset=True)
CLEAR = "cls" if os.name == "nt" else "clear"

# =========================
# Helpers
# =========================

def clean_username(s: str) -> str:
    return re.sub(r'[^a-z0-9]', '', s.lower())

def prepend_base_email(emails, base, domain):
    if 6 <= len(base) <= 30:
        return [f"{base}{domain}"] + emails
    return emails

def divider():
    print(Fore.LIGHTBLACK_EX + "─" * 60)



def banner():
    f = Figlet(font="standard")
    print(Fore.CYAN + f.renderText("username2email"))
    # print(Fore.GREEN + "Username → Email permutations \n")


def show_user_summary(first, last, addup, start, end, domain):
    print(Fore.GREEN + Style.BRIGHT + " ✔ User Configuration Loaded\n")
    print(Fore.WHITE + f"  First name              : {first}")
    print(Fore.WHITE + f"  Last name               : {last}")
    print(Fore.WHITE + f"  Add-up (surname/city)   : {addup or '-'}")
    print(Fore.WHITE + f"  Start num               : {start}")
    print(Fore.WHITE + f"  End num                 : {end}")
    print(Fore.WHITE + f"  Email domain            : {domain}")
    divider()
    input(Fore.LIGHTBLACK_EX + " Press ENTER to continue ")

def copy_and_display(batch_name, emails):
    os.system(CLEAR)
    banner()

    if not emails:
        print(Fore.RED + f"[!] {batch_name}: No valid emails generated")
        return

    emails = list(dict.fromkeys(emails))
    pyperclip.copy("\n".join(emails))

    print(Fore.GREEN + f"[✓] {batch_name} completed")
    print(Fore.CYAN + f"    Results generated : {len(emails)}")
    print(Fore.CYAN + "    Clipboard         : copied")
    divider()

    print(Fore.WHITE + " Preview (first 15):\n")
    for e in emails[:15]:
        print("  " + e)

    if len(emails) > 15:
        print(Fore.YELLOW + f"\n  ... {len(emails) - 15} more hidden")

    divider()
    input(Fore.LIGHTBLACK_EX + " Press ENTER to return to menu ")

# =========================
# Batch Generators (UNCHANGED LOGIC)
# =========================

def batch1(first, domain, start, end):
    emails = [f"{first}{i}{domain}" for i in range(start, end + 1)
              if 6 <= len(f"{first}{i}") <= 30]
    return prepend_base_email(emails, first, domain)

def batch2(first, last, domain, start, end):
    base = f"{first}{last}"
    emails = [f"{base}{i}{domain}" for i in range(start, end + 1)
              if 6 <= len(f"{base}{i}") <= 30]
    return prepend_base_email(emails, base, domain)

def batch3(first, last, domain, start, end):
    base = f"{last}{first}"
    emails = [f"{base}{i}{domain}" for i in range(start, end + 1)
              if 6 <= len(f"{base}{i}") <= 30]
    return prepend_base_email(emails, base, domain)

def batch4(first, last, addup, domain, start, end):
    base = f"{first}{last}{addup}"
    emails = [f"{base}{i}{domain}" for i in range(start, end + 1)
              if 6 <= len(f"{base}{i}") <= 30]
    return prepend_base_email(emails, base, domain)

def batch5(first, last, addup, domain, start, end):
    base = f"{addup}{first}{last}"
    emails = [f"{base}{i}{domain}" for i in range(start, end + 1)
              if 6 <= len(f"{base}{i}") <= 30]
    return prepend_base_email(emails, base, domain)

def batch6(first, last, domain):
    base = f"{first}{last}"
    emails = [f"{chr(c)}{base}{domain}"
              for c in range(ord('a'), ord('z') + 1)
              if 6 <= len(f"{chr(c)}{base}") <= 30]
    return prepend_base_email(emails, base, domain)

def batch7(first, last, domain):
    base = f"{first}{last}"
    emails = []
    for digit in range(10):
        for r in range(1, 8):
            local = f"{base}{str(digit) * r}"
            if 6 <= len(local) <= 30:
                emails.append(f"{local}{domain}")
    return prepend_base_email(emails, base, domain)

def batch8(first, last, domain, start, end):
    base = f"{first}{last[0]}"
    emails = [f"{base}{i}{domain}" for i in range(start, end + 1)
              if 6 <= len(f"{base}{i}") <= 30]
    return prepend_base_email(emails, base, domain)

# =========================
# Menu
# =========================

def menu():
    print(Fore.YELLOW + "="*31)
    print(Fore.YELLOW + "   📧 Select generation mode:")
    print(Fore.YELLOW + "="*31 + Style.RESET_ALL)

    print(Fore.CYAN + " [1]  → " + Fore.WHITE + "  First name + numbers")
    print(Fore.CYAN + " [2]  → "  + Fore.WHITE + "  First name + Last name + numbers")
    print(Fore.CYAN + " [3]  → " + Fore.WHITE + "  Last name + First name + numbers")
    print(Fore.CYAN + " [4]  → " + Fore.WHITE + "  First name + Last name + Add-up + numbers")
    print(Fore.CYAN + " [5]  → " + Fore.WHITE + "  Add-up + First name + Last name + numbers")
    print(Fore.CYAN + " [6]  → " + Fore.WHITE + "  a–z + First name + Last name")
    print(Fore.CYAN + " [7]  → " + Fore.WHITE + "  First name + Last name + digit patterns")
    print(Fore.CYAN + " [8]  → " + Fore.WHITE + "  First name + Last initial + numbers")

    print(Fore.GREEN + "\n  [all] Run all batches")
    print(Fore.RED + "  [exit] Quit")
    divider()

# =========================
# Main
# =========================

if __name__ == "__main__":
    banner()
    print(Fore.YELLOW + "="*31)
    print(Fore.YELLOW + "   📌 Target Information ")
    print(Fore.YELLOW + "="*31 + Style.RESET_ALL)

    first = input(Fore.CYAN + "🔹 First name: " + Fore.WHITE).strip().lower()
    last = input(Fore.CYAN +  "🔹 Last name: " + Fore.WHITE).strip().lower()
    addup = input(Fore.CYAN + "🔹 Add-up (surname/city etc.): " + Fore.WHITE).strip().lower()


    try:
        start = int(input(Fore.CYAN + "🔹 Start num(default 0): " + Fore.WHITE) or 0)
        end = int(input(Fore.CYAN + "🔹 End num (default 1000): " + Fore.WHITE) or 1000)
    except ValueError:
        start, end = 0, 1000

    domain = "@gmail.com"

    os.system(CLEAR)
    banner()
    show_user_summary(first, last, addup, start, end, domain)

    while True:
        menu()
        choice = input("  > ").strip().lower()

        if choice == "1":
            copy_and_display("Batch 1", batch1(first, domain, start, end))
        elif choice == "2":
            copy_and_display("Batch 2", batch2(first, last, domain, start, end))
        elif choice == "3":
            copy_and_display("Batch 3", batch3(first, last, domain, start, end))
        elif choice == "4":
            copy_and_display("Batch 4", batch4(first, last, addup, domain, start, end))
        elif choice == "5":
            copy_and_display("Batch 5", batch5(first, last, addup, domain, start, end))
        elif choice == "6":
            copy_and_display("Batch 6", batch6(first, last, domain))
        elif choice == "7":
            copy_and_display("Batch 7", batch7(first, last, domain))
        elif choice == "8":
            copy_and_display("Batch 8", batch8(first, last, domain, start, end))
        elif choice == "all":
            copy_and_display("Batch 1", batch1(first, domain, start, end))
            copy_and_display("Batch 2", batch2(first, last, domain, start, end))
            copy_and_display("Batch 3", batch3(first, last, domain, start, end))
            copy_and_display("Batch 4", batch4(first, last, addup, domain, start, end))
            copy_and_display("Batch 5", batch5(first, last, addup, domain, start, end))
            copy_and_display("Batch 6", batch6(first, last, domain))
            copy_and_display("Batch 7", batch7(first, last, domain))
            copy_and_display("Batch 8", batch8(first, last, domain, start, end))
        elif choice == "exit":
            os.system(CLEAR)
            print(Fore.GREEN + " Exiting username2email. Stay sharp.\n")
            break
        else:
            print(Fore.RED + " Invalid option")
            time.sleep(1)
