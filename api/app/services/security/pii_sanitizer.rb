# frozen_string_literal: true

module Security
  # UU No. 27/2022 tentang Pelindungan Data Pribadi (UU PDP) Compliance Engine.
  # Masks PII (Emails, Indonesian Phone Numbers, 16-digit NIK, Credit Cards, Candidate Name)
  # before passing unstructured transcript turns to external LLM providers or logs.
  class PiiSanitizer
    EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/
    PHONE_REGEX = /(?:\+?62|08)[0-9\-\s]{8,14}\b/
    NIK_REGEX   = /\b[0-9]{16}\b/
    CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/

    def self.mask(text, candidate_name: nil)
      return "" if text.nil?

      sanitized = text.dup
      sanitized.gsub!(EMAIL_REGEX, "[EMAIL_REDACTED]")
      sanitized.gsub!(PHONE_REGEX, "[PHONE_REDACTED]")
      sanitized.gsub!(NIK_REGEX, "[NIK_REDACTED]")
      sanitized.gsub!(CREDIT_CARD_REGEX, "[CARD_REDACTED]")

      if candidate_name.present? && candidate_name.strip.length >= 3
        sanitized.gsub!(/#{Regexp.escape(candidate_name.strip)}/i, "[CANDIDATE_NAME]")
      end

      sanitized
    end
  end
end
