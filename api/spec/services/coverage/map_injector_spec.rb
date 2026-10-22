# frozen_string_literal: true

require 'spec_helper'
require_relative '../../../app/services/coverage/map_injector'

RSpec.describe Coverage::MapInjector do
  let(:session) { double('InterviewSession', started_at: Time.current - 10.minutes) }
  let(:assessment) { double('Assessment', time_limit_min: 30) }
  let(:injector) { described_class.new(session) }

  before do
    allow(session).to receive(:assessment).and_return(assessment)
  end

  describe '#all_covered?' do
    let(:map_scope) { double('CoverageMapScope') }

    before do
      allow(session).to receive(:coverage_maps).and_return(map_scope)
    end

    it 'returns false if any configured skill is not yet covered' do
      configured = [
        double('Map', state: 'covered'),
        double('Map', state: 'partial')
      ]
      discovered = []

      allow(map_scope).to receive(:configured).and_return(configured)
      allow(map_scope).to receive(:discovered).and_return(discovered)

      expect(injector.all_covered?).to be false
    end

    it 'returns false if a discovered skill is still in initiated state' do
      configured = [
        double('Map', state: 'covered'),
        double('Map', state: 'covered')
      ]
      discovered = [
        double('Map', state: 'initiated')
      ]

      allow(map_scope).to receive(:configured).and_return(configured)
      allow(map_scope).to receive(:discovered).and_return(discovered)

      expect(injector.all_covered?).to be false
    end

    it 'returns true when all configured skills are covered and no discovered skill is initiated' do
      configured = [
        double('Map', state: 'covered'),
        double('Map', state: 'covered')
      ]
      discovered = [
        double('Map', state: 'partial')
      ]

      allow(map_scope).to receive(:configured).and_return(configured)
      allow(map_scope).to receive(:discovered).and_return(discovered)

      expect(injector.all_covered?).to be true
    end
  end

  describe '#pacing_bucket (private)' do
    it 'categorizes pacing correctly based on remaining time per skill' do
      expect(injector.send(:pacing_bucket, 6.0)).to eq('ahead')
      expect(injector.send(:pacing_bucket, 3.5)).to eq('on_track')
      expect(injector.send(:pacing_bucket, 2.0)).to eq('behind')
      expect(injector.send(:pacing_bucket, 1.0)).to eq('critical')
      expect(injector.send(:pacing_bucket, nil)).to be_nil
    end
  end
end
