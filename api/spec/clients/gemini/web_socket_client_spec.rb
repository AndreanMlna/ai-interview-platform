# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Gemini::WebSocketClient do
  describe 'initialization and event binding' do
    it 'creates a client and binds event callbacks' do
      client = described_class.allocate

      opened = false
      client.instance_variable_set(:@callbacks, { open: [], message: [], close: [], error: [] })
      client.on(:open) { opened = true }

      client.__send__(:trigger, :open, Gemini::WebSocketClient::Event.new)
      expect(opened).to be true
    end

    it 'handles error and close callbacks without crashing' do
      client = described_class.allocate
      client.instance_variable_set(:@callbacks, { open: [], message: [], close: [], error: [] })

      err_message = nil
      client.on(:error) { |e| err_message = e.message }
      client.__send__(:trigger, :error, Gemini::WebSocketClient::Event.new(message: 'SSL failure simulated'))

      expect(err_message).to eq('SSL failure simulated')
    end
  end

  describe 'Gemini::LiveClient client selection' do
    it 'selects Gemini::WebSocketClient when EventMachine does not support SSL' do
      allow(EventMachine).to receive(:ssl?).and_return(false)

      live_client = Gemini::LiveClient.new(system_prompt: 'Test', api_key: 'test_key')
      expect(Gemini::WebSocketClient).to receive(:new).and_call_original

      # Stub setup_connection so it doesn't open a real network socket during unit test
      allow_any_instance_of(Gemini::WebSocketClient).to receive(:setup_connection)

      live_client.connect
    end
  end
end
