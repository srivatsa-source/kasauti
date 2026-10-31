import pytest
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from app.engine.rule_engine import RuleEngine

@pytest.fixture
def engine():
    return RuleEngine()

def test_ai_disclosure_early_passes(engine):
    transcript = (
        "Agent: Namaste, main Bolna AI assistant hoon. Kya main aapse baat kar sakta hoon?\n"
        "User: Haan kahiye."
    )
    result = engine.evaluate_rule("ai_disclosure_early", transcript)
    assert result.passed is True
    assert result.score == 1.0
    assert "Found AI disclosure" in result.evidence
    assert result.verified is True

def test_ai_disclosure_early_fails(engine):
    transcript = (
        "Agent: Hello sir, I am calling from customer service about your card.\n"
        "User: Who is this?\n"
        "Agent: We have an offer for you.\n"
        "User: Okay."
    )
    result = engine.evaluate_rule("ai_disclosure_early", transcript)
    assert result.passed is False
    assert result.score == 0.0
    assert "No AI disclosure detected" in result.evidence

def test_optout_honored_passes(engine):
    transcript = (
        "Agent: Good morning, calling regarding home loan rates.\n"
        "User: Please do not call me again, remove my number.\n"
        "Agent: Understood, I have updated our records and opted you out. Have a nice day."
    )
    result = engine.evaluate_rule("optout_honored", transcript)
    assert result.passed is True
    assert result.score == 1.0

def test_optout_honored_fails_when_ignored(engine):
    transcript = (
        "Agent: Good morning, calling regarding home loan rates.\n"
        "User: Stop calling me!\n"
        "Agent: Sir, please listen for just 30 seconds, great cashback rates.\n"
        "User: I said stop!\n"
        "Agent: Sir only one simple verification is needed..."
    )
    result = engine.evaluate_rule("optout_honored", transcript)
    assert result.passed is False
    assert result.score == 0.0
    assert "ignored" in result.evidence

def test_no_sensitive_data_leak_passes(engine):
    transcript = (
        "Agent: Hello, I cannot read back sensitive verification codes.\n"
        "User: Okay, thank you."
    )
    result = engine.evaluate_rule("no_sensitive_data_leak", transcript)
    assert result.passed is True

def test_no_sensitive_data_leak_fails_on_otp(engine):
    transcript = (
        "Agent: Sure sir, your OTP is 4920 and will expire soon.\n"
        "User: Thanks."
    )
    result = engine.evaluate_rule("no_sensitive_data_leak", transcript)
    assert result.passed is False
    assert "Sensitive data leak detected" in result.evidence

def test_no_sensitive_data_leak_fails_on_aadhaar(engine):
    transcript = (
        "Agent: Your Aadhaar is 1234 5678 9012 right?\n"
        "User: Yes."
    )
    result = engine.evaluate_rule("no_sensitive_data_leak", transcript)
    assert result.passed is False

def test_calling_hours_compliance(engine):
    # 14:30 IST is valid (14:30 IST = 09:00 UTC)
    valid_time = datetime(2026, 10, 24, 9, 0, 0, tzinfo=timezone.utc)
    res_valid = engine.evaluate_rule("calling_hours", "Agent: Hello", call_timestamp=valid_time)
    assert res_valid.passed is True

    # 23:30 IST is invalid (23:30 IST = 18:00 UTC)
    invalid_time = datetime(2026, 10, 24, 18, 0, 0, tzinfo=timezone.utc)
    res_invalid = engine.evaluate_rule("calling_hours", "Agent: Hello", call_timestamp=invalid_time)
    assert res_invalid.passed is False
    assert "violates calling hours" in res_invalid.evidence

def test_no_promotional_mixing_passes(engine):
    transcript = (
        "Agent: Hello, calling regarding your recent order delivery scheduled for 4 PM today.\n"
        "User: Okay, thank you."
    )
    result = engine.evaluate_rule("no_promotional_mixing", transcript)
    assert result.passed is True
    assert result.score == 1.0
    assert result.verified is True

def test_no_promotional_mixing_fails(engine):
    transcript = (
        "Agent: Hello, your KYC update is done. By the way, you are eligible for an exclusive pre-approved loan!\n"
        "User: I did not ask for loans."
    )
    result = engine.evaluate_rule("no_promotional_mixing", transcript)
    assert result.passed is False
    assert result.score == 0.0
    assert "Promotional mixing detected" in result.evidence

def test_anti_deception_ucc_passes(engine):
    transcript = (
        "Agent: Namaste, main Bolna AI assistant hoon. Aapke account enquiry ke regarding call kiya hai.\n"
        "User: Ji batayein."
    )
    result = engine.evaluate_rule("anti_deception_ucc", transcript)
    assert result.passed is True
    assert result.score == 1.0

def test_anti_deception_ucc_fails(engine):
    transcript = (
        "Agent: Congratulations! You have won a lottery of 25 lakh rupees! Claim your prize money now.\n"
        "User: Is this real?"
    )
    result = engine.evaluate_rule("anti_deception_ucc", transcript)
    assert result.passed is False
    assert "Deceptive/misleading statement detected" in result.evidence

def test_service_explicit_consent_7d(engine):
    valid_transcript = "Agent: Hello, following up on your recent request from 2 days ago."
    res_valid = engine.evaluate_rule("service_explicit_consent_7d", valid_transcript)
    assert res_valid.passed is True

    stale_transcript = "Agent: Calling as per your consent obtained last month 30 days ago."
    res_stale = engine.evaluate_rule("service_explicit_consent_7d", stale_transcript)
    assert res_stale.passed is False
    assert "7-day" in res_stale.evidence

def test_transactional_30m_window(engine):
    valid_transcript = "Agent: Here is your OTP for the login initiated just now."
    res_valid = engine.evaluate_rule("transactional_30m_window", valid_transcript)
    assert res_valid.passed is True

    delayed_transcript = "Agent: Here is the confirmation for your transaction initiated hours ago yesterday."
    res_delayed = engine.evaluate_rule("transactional_30m_window", delayed_transcript)
    assert res_delayed.passed is False
    assert "30-minute" in res_delayed.evidence

