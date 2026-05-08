from app.models.preprocessing import clean_text

def test_clean_text():
    text = "الخدمــة ممتازة جداً"
    result = clean_text(text)
    assert isinstance(result, str)
    assert len(result) > 0