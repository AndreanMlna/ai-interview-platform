# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Assessments API', type: :request do
  let(:user) { User.create!(email: 'assessor@example.com', password: 'password123', role: 'admin') }
  let(:token) { JsonWebToken.encode({ user_id: user.id, role: user.role, scheme: 'test-corp' }) }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' } }

  before do
    unless Organization.exists?(scheme: 'test-corp')
      ActiveRecord::Base.connection.execute(<<~SQL)
        INSERT INTO public.organizations (name, scheme, identifier, host, alias_hosts, config, created_at, updated_at)
        VALUES ('Test Corp', 'test-corp', 'test-corp', 'localhost', '{}', '{}', NOW(), NOW())
        ON CONFLICT (scheme) DO NOTHING;
      SQL
    end
  end

  describe 'POST /api/v1/assessments' do
    let(:assessment_params) do
      {
        assessment: {
          name: 'Senior Frontend Engineer',
          time_limit_min: 45,
          language: 'en',
          assessment_skills_attributes: [
            {
              skill_label: 'React Core',
              expected_level: 4,
              display_order: 0,
              l1_anchor: 'Junior',
              l2_anchor: 'Mid',
              l3_anchor: 'Senior',
              l4_anchor: 'Lead',
              l5_anchor: 'Principal'
            }
          ]
        }
      }
    end

    it 'creates an assessment and safely compiles system prompt even without Redis' do
      expect do
        post '/api/v1/assessments', params: assessment_params.to_json, headers: headers
      end.to change(Assessment, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['assessment']['name']).to eq('Senior Frontend Engineer')
      expect(json['system_prompt_generated']).to be true

      created = Assessment.last
      expect(created.system_prompt).to be_present
      expect(created.system_prompt).to include('ASSESSMENT AGENDA')
      expect(created.system_prompt).to include('React Core')
    end
  end
end
