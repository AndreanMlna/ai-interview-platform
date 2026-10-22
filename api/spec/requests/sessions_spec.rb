# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sessions API & Invite Redirection', type: :request do
  let(:user) { User.create!(email: 'assessor_session@example.com', password: 'password123', role: 'admin') }
  let(:jwt_token) { JsonWebToken.encode({ user_id: user.id, role: user.role, scheme: 'test-corp' }) }
  let(:headers) { { 'Authorization' => "Bearer #{jwt_token}", 'Content-Type' => 'application/json' } }

  before do
    unless Organization.exists?(scheme: 'test-corp')
      ActiveRecord::Base.connection.execute(<<~SQL)
        INSERT INTO public.organizations (name, scheme, identifier, host, alias_hosts, config, created_at, updated_at)
        VALUES ('Test Corp', 'test-corp', 'test-corp', 'localhost', '{}', '{}', NOW(), NOW())
        ON CONFLICT (scheme) DO NOTHING;
      SQL
    end
  end

  let!(:assessment) do
    Assessment.create!(
      name: 'Fullstack Engineer',
      time_limit_min: 45,
      language: 'en',
      created_by: user.id,
      tenant_id: Organization.find_by(scheme: 'test-corp').id
    )
  end

  describe 'GET /interview/:token (Defensive Fallback Redirect)' do
    it 'redirects to the frontend client URL with status 302' do
      get '/interview/test-invite-token-123'

      expect(response).to have_http_status(:redirect)
      expect(response.location).to include('5173/interview/test-invite-token-123')
    end

    it 'safely isolates token parameter without format suffix' do
      get '/interview/test_token-123.evil'

      expect(response).to have_http_status(:redirect)
      expect(response.location).to eq('http://localhost:5173/interview/test_token-123')
    end
  end

  describe 'POST /api/v1/assessments/:assessment_id/sessions' do
    it 'creates a candidate session with an invite URL pointing to the frontend port' do
      post "/api/v1/assessments/#{assessment.id}/sessions",
           params: { session: { candidate_name: 'Wafa Candidate' } }.to_json,
           headers: headers

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['session']['candidate_name']).to eq('Wafa Candidate')
      expect(json['session']['invite_url']).to include('5173/interview/')
      expect(json['invite_url']).to include('5173/interview/')
    end
  end

  describe 'GET /api/v1/sessions/:token/candidate' do
    let!(:session) do
      assessment.sessions.create!(
        candidate_name: 'Wafa Candidate',
        tenant_id: assessment.tenant_id,
        status: 'pending'
      )
    end

    it 'returns candidate info without requiring JWT authentication' do
      get "/api/v1/sessions/#{session.invite_token}/candidate"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['session_id']).to eq(session.id)
      expect(json['role_title']).to eq('Fullstack Engineer')
      expect(json['time_limit_min']).to eq(45)
      expect(json['session_status']).to eq('pending')
    end

    it 'returns 404 for an invalid invite token' do
      get '/api/v1/sessions/non-existent-token/candidate'

      expect(response).to have_http_status(:not_found)
    end
  end
end
