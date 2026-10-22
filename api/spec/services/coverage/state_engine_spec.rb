# frozen_string_literal: true

require 'spec_helper'
require_relative '../../../app/services/coverage/state_engine'

RSpec.describe Coverage::StateEngine do
  describe '.valid_transition?' do
    it 'permits transition from not_yet to initiated' do
      expect(described_class.valid_transition?(from: 'not_yet', to: 'initiated', probe_count: 1)).to be true
    end

    it 'blocks transition to partial if probe_count is less than 2 (hard rule)' do
      expect(described_class.valid_transition?(from: 'initiated', to: 'partial', probe_count: 1)).to be false
    end

    it 'permits transition to partial once probe_count reaches at least 2' do
      expect(described_class.valid_transition?(from: 'initiated', to: 'partial', probe_count: 2)).to be true
      expect(described_class.valid_transition?(from: 'initiated', to: 'partial', probe_count: 3)).to be true
    end

    it 'permits transition from partial to covered when probe_count >= 2' do
      expect(described_class.valid_transition?(from: 'partial', to: 'covered', probe_count: 2)).to be true
    end

    it 'rejects backward transitions' do
      expect(described_class.valid_transition?(from: 'covered', to: 'partial', probe_count: 5)).to be false
      expect(described_class.valid_transition?(from: 'partial', to: 'initiated', probe_count: 5)).to be false
      expect(described_class.valid_transition?(from: 'initiated', to: 'not_yet', probe_count: 5)).to be false
    end
  end

  describe '.resolve_state' do
    it 'advances state one step at a time when probe_count allows' do
      # Proposed skips from not_yet to partial, but probe_count is 2:
      # Step 1: not_yet -> initiated (valid)
      # Step 2: initiated -> partial (valid, probe_count = 2)
      resolved = described_class.resolve_state(current_state: 'not_yet', proposed_state: 'partial', probe_count: 2)
      expect(resolved).to eq('partial')
    end

    it 'stops at initiated if probe_count is only 1 even if LLM proposes partial or covered' do
      resolved = described_class.resolve_state(current_state: 'not_yet', proposed_state: 'covered', probe_count: 1)
      expect(resolved).to eq('initiated')
    end

    it 'retains current state if proposed state is backward or identical' do
      expect(described_class.resolve_state(current_state: 'partial', proposed_state: 'initiated', probe_count: 4)).to eq('partial')
      expect(described_class.resolve_state(current_state: 'covered', proposed_state: 'covered', probe_count: 4)).to eq('covered')
    end
  end
end
