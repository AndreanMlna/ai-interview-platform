# frozen_string_literal: true

require 'spec_helper'
require_relative '../../../app/services/security/pii_sanitizer'

RSpec.describe Security::PiiSanitizer do
  describe '.mask' do
    it 'returns empty string for nil input' do
      expect(described_class.mask(nil)).to eq('')
    end

    it 'masks email addresses' do
      input = 'Candidate contact is john.doe@example.com or lead@rakamin.com for follow-up.'
      masked = described_class.mask(input)
      expect(masked).not_to include('john.doe@example.com')
      expect(masked).not_to include('lead@rakamin.com')
      expect(masked).to include('[EMAIL_REDACTED]')
    end

    it 'masks Indonesian phone numbers (+62 and 08 prefixes)' do
      input = 'Call me on +6281234567890 or WhatsApp 0812-9876-5432.'
      masked = described_class.mask(input)
      expect(masked).not_to include('+6281234567890')
      expect(masked).not_to include('0812-9876-5432')
      expect(masked).to include('[PHONE_REDACTED]')
    end

    it 'masks 16-digit National Identification Numbers (NIK)' do
      input = 'My NIK is 3171012345678901 registered in Jakarta.'
      masked = described_class.mask(input)
      expect(masked).not_to include('3171012345678901')
      expect(masked).to include('[NIK_REDACTED]')
    end

    it 'masks candidate name when present' do
      input = 'Hello my name is Andrian Maulana and I am applying for backend.'
      masked = described_class.mask(input, candidate_name: 'Andrian Maulana')
      expect(masked).not_to include('Andrian Maulana')
      expect(masked).to include('[CANDIDATE_NAME]')
    end

    it 'preserves non-PII technical interview text' do
      input = 'We designed an event-driven architecture using PostgreSQL and Kafka with 99.99% uptime.'
      masked = described_class.mask(input)
      expect(masked).to eq(input)
    end
  end
end
