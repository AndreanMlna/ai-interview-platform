# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Authentication API', type: :request do
  let(:valid_email) { 'recruiter@example.com' }
  let(:valid_password) { 'secret123' }

  describe 'POST /api/v1/auth/register' do
    context 'with valid parameters' do
      let(:valid_params) do
        { email: valid_email, password: valid_password }
      end

      it 'creates a new admin user and returns a 201 with JWT token' do
        expect do
          post '/api/v1/auth/register', params: valid_params, as: :json
        end.to change(User, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['token']).to be_present
        expect(json['user']['email']).to eq(valid_email)
        expect(json['user']['role']).to eq('admin')
      end

      it 'also responds successfully to alias /api/v1/signup' do
        post '/api/v1/signup', params: { email: 'another@example.com', password: 'password123' }, as: :json
        expect(response).to have_http_status(:created)
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 when email is already registered' do
        User.create!(email: valid_email, password: valid_password, role: 'admin')

        post '/api/v1/auth/register', params: { email: valid_email, password: valid_password }, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['errors'][0]['message']).to match(/Email has already been taken/i)
      end

      it 'returns 422 when password is shorter than 6 characters' do
        post '/api/v1/auth/register', params: { email: 'short@example.com', password: '123' }, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['errors'][0]['message']).to match(/Password is too short/i)
      end

      it 'returns 422 when email is missing or malformed' do
        post '/api/v1/auth/register', params: { email: 'invalid-email', password: 'password123' }, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'POST /api/v1/auth/login' do
    before do
      User.create!(email: valid_email, password: valid_password, role: 'admin')
    end

    it 'returns 200 with JWT when credentials are valid' do
      post '/api/v1/auth/login', params: { email: valid_email, password: valid_password }, as: :json
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['token']).to be_present
      expect(json['user']['email']).to eq(valid_email)
    end

    it 'returns 401 when password does not match' do
      post '/api/v1/auth/login', params: { email: valid_email, password: 'wrongpassword' }, as: :json
      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json['errors'][0]['message']).to eq('Invalid email or password')
    end

    it 'returns 401 when email does not exist' do
      post '/api/v1/auth/login', params: { email: 'nonexistent@example.com', password: valid_password }, as: :json
      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json['errors'][0]['message']).to eq('Invalid email or password')
    end
  end
end
