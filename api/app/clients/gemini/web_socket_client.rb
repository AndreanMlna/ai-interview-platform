# frozen_string_literal: true

require 'socket'
require 'openssl'
require 'websocket/driver'
require 'uri'
require 'monitor'

module Gemini
  # Cross-platform, SSL-resilient WebSocket client powered by websocket-driver and OpenSSL.
  # Eliminates dependency on EventMachine's platform-specific C++ SSL extension on Windows/MingW.
  class WebSocketClient
    attr_reader :url, :ready_state

    def initialize(url, _protocols = nil, headers: {})
      @url = url
      @headers = headers || {}
      @callbacks = { open: [], message: [], close: [], error: [] }
      @monitor = Monitor.new
      @ready_state = 0 # 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
      @closed = false

      setup_connection
    end

    def on(event, &block)
      @callbacks[event.to_sym] << block if block && @callbacks.key?(event.to_sym)
    end

    def send(data)
      return false if @closed || @driver.nil?

      @monitor.synchronize do
        if data.is_a?(String) && data.encoding == Encoding::BINARY && !data.valid_encoding?
          @driver.binary(data)
        else
          @driver.text(data)
        end
      end
      true
    rescue StandardError => e
      trigger(:error, Event.new(message: e.message))
      false
    end

    def close(code = 1000, reason = '')
      return if @closed

      @closed = true
      @ready_state = 2

      @monitor.synchronize do
        @driver&.close(reason, code)
      end
    rescue StandardError => e
      Rails.logger.warn("[Gemini::WebSocketClient] Error during close: #{e.message}")
    ensure
      cleanup_socket
      @ready_state = 3
    end

    def write(data)
      @socket&.write(data)
    rescue StandardError => e
      Rails.logger.error("[Gemini::WebSocketClient] Socket write error: #{e.message}")
      trigger(:error, Event.new(message: e.message))
    end

    # Minimal event wrapper mimicking Faye::WebSocket event structure
    class Event
      attr_reader :data, :code, :reason, :message

      def initialize(data: nil, code: 1000, reason: '', message: nil)
        @data = data
        @code = code
        @reason = reason
        @message = message || reason
      end
    end

    private

    def setup_connection
      uri = URI.parse(@url)
      port = uri.port || (uri.scheme == 'wss' ? 443 : 80)
      use_ssl = uri.scheme == 'wss'

      tcp_socket = TCPSocket.new(uri.host, port)

      if use_ssl
        ctx = OpenSSL::SSL::SSLContext.new
        ctx.verify_mode = OpenSSL::SSL::VERIFY_PEER
        ctx.set_params
        @socket = OpenSSL::SSL::SSLSocket.new(tcp_socket, ctx)
        @socket.hostname = uri.host
        @socket.connect
      else
        @socket = tcp_socket
      end

      # Adapt self as driver transport target
      @driver = WebSocket::Driver.client(self)
      @headers.each { |key, val| @driver.set_header(key.to_s, val.to_s) }

      bind_driver_events
      @driver.start
      start_reader_thread
    rescue StandardError => e
      Rails.logger.error("[Gemini::WebSocketClient] Connection failed: #{e.message}")
      cleanup_socket
      # Defer error callback slightly so callers can bind .on(:error)
      Thread.new do
        sleep 0.05
        trigger(:error, Event.new(message: e.message))
        trigger(:close, Event.new(code: 1006, reason: e.message))
      end
    end

    def bind_driver_events
      @driver.on(:open) do |_e|
        @ready_state = 1
        trigger(:open, Event.new)
      end

      @driver.on(:message) do |e|
        trigger(:message, Event.new(data: e.data))
      end

      @driver.on(:close) do |e|
        @closed = true
        @ready_state = 3
        cleanup_socket
        trigger(:close, Event.new(code: e.code, reason: e.reason))
      end

      @driver.on(:error) do |e|
        trigger(:error, Event.new(message: e.message))
      end
    end

    def start_reader_thread
      @reader_thread = Thread.new do
        while !@closed && @socket && !@socket.closed?
          begin
            chunk = @socket.readpartial(16_384)
            @monitor.synchronize { @driver.parse(chunk) }
          rescue EOFError, IOError, Errno::ECONNRESET
            break
          rescue StandardError => e
            Rails.logger.warn("[Gemini::WebSocketClient] Reader error: #{e.message}")
            trigger(:error, Event.new(message: e.message))
            break
          end
        end

        unless @closed
          @closed = true
          @ready_state = 3
          cleanup_socket
          trigger(:close, Event.new(code: 1006, reason: 'Socket closed unexpectedly'))
        end
      end
    end

    def cleanup_socket
      @socket&.close rescue nil
      @socket = nil
    end

    def trigger(event, event_obj)
      callbacks = @callbacks[event.to_sym] || []
      callbacks.each do |cb|
        cb.call(event_obj)
      rescue StandardError => e
        Rails.logger.error("[Gemini::WebSocketClient] Callback error for #{event}: #{e.message}\n#{e.backtrace&.first(3)&.join("\n")}")
      end
    end
  end
end
