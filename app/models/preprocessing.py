import re 

def remove_diacritics(text: str) -> str:
    """Remove Arabic diacritical marks (tashkeel)."""
    arabic_diacritics = re.compile(r"[\u0617-\u061A\u064B-\u0652]")
    return arabic_diacritics.sub("", text)

def normalize_arabic(text: str) -> str: 
    """Normalize common Arabic character variants."""
    text = re.sub(r"[إأآا]", "ا", text)  # Alef variants → Alef
    text = re.sub(r"ى", "ي", text)        # Alef Maksura → Ya
    text = re.sub(r"ة", "ه", text)        # Ta Marbuta → Ha
    text = re.sub(r"گ", "ك", text)        # Gaf → Kaf
    text = re.sub(r'ـ', '', text) # Remove Tatweel (Kashida) - e.g., "كــــــتاب" -> "كتاب"
    return text

def remove_noise(text: str) -> str: 
    """Remove URLs, mentions, hashtags, and extra whitespace."""
    text = re.sub(r"http\S+|www\.\S+", "", text)   # URLs
    text = re.sub(r"@\w+", "", text)                 # Mentions
    text = re.sub(r"#\w+", "", text)                 # Hashtags
    txt = re.sub(r"\d", ' ', text)                   # digits with no space
    text = re.sub(r"[^\w\s\u0600-\u06FF]", "", text) # Non-Arabic/non-word chars
    text = re.sub(r"\s+", " ", text).strip()          # Collapse whitespace
    text = re.sub(r'(.)\1+', r'\1', text)             # Remove Repeating Characters (e.g., "رااااائع" -> "رائع")
    return text

def clean_text(text: str) -> str:
    """Full preprocessing pipeline for Arabic text."""
    if not isinstance(text, str):
        return ""
    text = remove_noise(text)
    text = remove_diacritics(text)
    text = normalize_arabic(text)
    return text