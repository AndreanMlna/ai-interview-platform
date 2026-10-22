# frozen_string_literal: true

require 'spec_helper'
require_relative '../../../app/services/fit_gap/engine'

RSpec.describe FitGap::Engine do
  let(:portfolio) { double('Portfolio', id: 42, session: double('Session', candidate_name: 'Jane Doe')) }
  let(:vacancy) { double('Vacancy', id: 99, role_title: 'Senior Backend Engineer') }
  let(:gemini_client) { double('GeminiClient') }
  let(:engine) { described_class.new(portfolio: portfolio, vacancy: vacancy, gemini_client: gemini_client) }

  describe '#effective_portfolio_skills' do
    it 'applies assessor override level and marks overridden: true when override is present' do
      override = double('AssessorOverride', override_level: 4, present?: true)
      skill_with_override = double(
        'PortfolioSkill',
        id: 1,
        skill_id: 10,
        skill_label: 'PostgreSQL',
        ai_level: 2,
        ai_confidence: 'medium',
        assessor_override: override
      )
      skill_without_override = double(
        'PortfolioSkill',
        id: 2,
        skill_id: 20,
        skill_label: 'Ruby on Rails',
        ai_level: 3,
        ai_confidence: 'high',
        assessor_override: nil
      )

      portfolio_skills_relation = double('Relation')
      allow(portfolio).to receive(:portfolio_skills).and_return(portfolio_skills_relation)
      allow(portfolio_skills_relation).to receive(:includes).with(:assessor_override).and_return([
        skill_with_override,
        skill_without_override
      ])

      effective = engine.send(:effective_portfolio_skills)

      expect(effective).to contain_exactly(
        {
          id: 1,
          skill_id: 10,
          skill_label: 'PostgreSQL',
          ai_level: 2,
          effective_level: 4,
          confidence: 'medium',
          overridden: true
        },
        {
          id: 2,
          skill_id: 20,
          skill_label: 'Ruby on Rails',
          ai_level: 3,
          effective_level: 3,
          confidence: 'high',
          overridden: false
        }
      )
    end
  end

  describe '#build_skill_comparisons' do
    it 'emits required_level, expected_level, and is_override for every vacancy skill' do
      vacancy_skills = [
        double('VacancySkill', skill_id: 10, skill_label: 'PostgreSQL', expected_level: 3),
        double('VacancySkill', skill_id: 99, skill_label: 'System Design', expected_level: 4)
      ]
      allow(vacancy).to receive(:vacancy_skills).and_return(vacancy_skills)

      # Portfolio only has PostgreSQL (with override to 4)
      effective_skills = [
        {
          id: 1,
          skill_id: 10,
          skill_label: 'PostgreSQL',
          ai_level: 2,
          effective_level: 4,
          confidence: 'high',
          overridden: true
        }
      ]
      allow(engine).to receive(:effective_portfolio_skills).and_return(effective_skills)

      comparisons = engine.send(:build_skill_comparisons)

      pg_comp = comparisons.find { |c| c[:skill_label] == 'PostgreSQL' }
      sd_comp = comparisons.find { |c| c[:skill_label] == 'System Design' }

      # PostgreSQL comparison (exceeds with override)
      expect(pg_comp[:required_level]).to eq(3)
      expect(pg_comp[:expected_level]).to eq(3)
      expect(pg_comp[:candidate_level]).to eq(4)
      expect(pg_comp[:delta]).to eq(1)
      expect(pg_comp[:result]).to eq('exceed')
      expect(pg_comp[:is_override]).to be true

      # System Design comparison (unassessed skill)
      expect(sd_comp[:required_level]).to eq(4)
      expect(sd_comp[:expected_level]).to eq(4)
      expect(sd_comp[:candidate_level]).to be_nil
      expect(sd_comp[:delta]).to be_nil
      expect(sd_comp[:result]).to eq('not_assessed')
      expect(sd_comp[:is_override]).to be false
    end
  end

  describe '#generate_fallback_narrative' do
    it 'includes unassessed skills warning and count in fallback narrative' do
      comparisons = [
        { skill_label: 'PostgreSQL', result: 'match', candidate_level: 3, expected_level: 3 },
        { skill_label: 'Distributed Systems', result: 'not_assessed', candidate_level: nil, expected_level: 4 }
      ]

      narrative = engine.send(:generate_fallback_narrative, comparisons)

      expect(narrative).to include('1 skill match, 0 exceeds, and 0 gaps')
      expect(narrative).to include('1 required skill was not assessed')
    end
  end
end
