import re
from collections import Counter
from difflib import get_close_matches


def simple_tokenize(text):
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    return [word for word in text.split() if len(word) > 2]


def normalize_text(text):
    return " ".join(simple_tokenize(text))


def build_synonym_lookup(synonyms):
    variant_to_key = {}
    for key, variants in synonyms.items():
        variant_to_key[key] = key
        for variant in variants:
            variant_to_key[variant.strip().lower()] = key
    return variant_to_key


def resolve_ingredient_key(norm_ingredient, synonyms, cutoff=0.84):
    variant_to_key = build_synonym_lookup(synonyms)
    if norm_ingredient in variant_to_key:
        return variant_to_key[norm_ingredient]
    close = get_close_matches(norm_ingredient, list(synonyms.keys()), n=1, cutoff=cutoff)
    if close:
        return close[0]
    return norm_ingredient


def get_token_frequency(products, token_key="nameTokens"):
    counter = Counter()
    for product in products:
        counter.update(product.get(token_key, []))
    max_freq = max(counter.values()) if counter else 1
    return counter, max_freq


def token_rarity(token, token_freq, max_freq):
    if not token_freq or not max_freq:
        return 0
    freq = token_freq.get(token, max_freq)
    return (max_freq - freq) / max_freq
