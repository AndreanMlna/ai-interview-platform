# frozen_string_literal: true

module Api
  module V1
    class AuthenticationController < ApiController
      skip_before_action :require_tenant!

      # POST /api/v1/auth/login
      def authenticate
        user = User.find_by(email: params[:email].to_s.downcase)

        return json_error('Invalid email or password', :unauthorized) unless user&.authenticate(params[:password])

        return json_error('Invalid email or password', :unauthorized) unless user.role == 'admin'

        scheme = resolve_scheme
        token  = JsonWebToken.encode({ user_id: user.id, role: user.role, scheme: })

        json_response({ token:, user: { id: user.id, email: user.email, role: user.role } })
      end

      # POST /api/v1/auth/register or POST /api/v1/signup
      def register
        user = User.new(register_params)
        user.role = register_params[:role].presence || 'admin'

        if user.save
          scheme = resolve_scheme
          token  = JsonWebToken.encode({ user_id: user.id, role: user.role, scheme: })

          json_response({
            message: 'User registered successfully',
            token:,
            user: { id: user.id, email: user.email, role: user.role }
          }, :created)
        else
          json_error(user.errors.full_messages.join(', '), :unprocessable_entity)
        end
      end

      private

      def register_params
        payload = params.key?(:authentication) ? params.require(:authentication) : params
        payload.permit(:email, :password, :password_confirmation, :role)
      end

      def resolve_scheme
        request.headers['X-Tenant-Scheme'].presence ||
          ActiveRecord::Base.connection.select_value(
            'SELECT scheme FROM organizations LIMIT 1'
          ) || 'test-corp'
      end
    end
  end
end
