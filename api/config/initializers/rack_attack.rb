# frozen_string_literal: true

class Rack::Attack
  # Use Redis for distributed throttle state across pods in production.
  # In development/test, use MemoryStore for instant local responsiveness.
  if Rails.env.production? && ENV['REDIS_URL'].present?
    Rack::Attack.cache.store = ActiveSupport::Cache::RedisCacheStore.new(
      url: ENV['REDIS_URL'],
      connect_timeout: 0.5,
      read_timeout: 0.5,
      write_timeout: 0.5
    )
  else
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  end

  # Throttle auth attempts (login & register): 10 per minute per IP.
  throttle('auth/endpoints', limit: 10, period: 1.minute) do |req|
    req.ip if req.post? && req.path.match?(%r{\A/api/v1/(auth/login|auth/register|signup)\z})
  end

  # Throttle candidate-facing endpoints: 30 per minute per IP.
  throttle('candidate/session', limit: 30, period: 1.minute) do |req|
    req.ip if req.path.match?(%r{\A/api/v1/sessions/[^/]+/(candidate|audio_complete)\z})
  end

  # Return 429 JSON instead of the default plain-text response.
  self.throttled_responder = lambda do |_req|
    [
      429,
      { 'Content-Type' => 'application/json' },
      [{ error: 'Too many requests. Please try again later.' }.to_json]
    ]
  end
end
