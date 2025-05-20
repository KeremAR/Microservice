using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;
using IssueService.Messaging.Interfaces;
using System.Threading;
using System;

namespace IssueService.Messaging.Implementations;

public class RabbitMQProducer : IRabbitMQProducer, IDisposable
{
    private IConnection _connection;
    private IModel _channel;
    private readonly string _issueCreatedQueueName;
    private readonly string _issueStatusChangedQueueName;
    private readonly IConfiguration _configuration;
    private readonly int _maxRetries = 5;
    private readonly int _retryDelayMs = 2000;

    public RabbitMQProducer(IConfiguration configuration)
    {
        _configuration = configuration;
        _issueCreatedQueueName = configuration["RabbitMQ:QueueName"] ?? "issue_created";
        _issueStatusChangedQueueName = configuration["RabbitMQ:IssueStatusChangedQueueName"] ?? "issue_status_changed";
        
        ConnectToRabbitMQ();
    }

    private void ConnectToRabbitMQ()
    {
        var factory = new ConnectionFactory
        {
            HostName = _configuration["RabbitMQ:HostName"] ?? "localhost",
            UserName = _configuration["RabbitMQ:UserName"] ?? "guest",
            Password = _configuration["RabbitMQ:Password"] ?? "guest",
            Port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672")
        };

        for (int i = 0; i < _maxRetries; i++)
        {
            try
            {
                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                // Exchange tanımla
                _channel.ExchangeDeclare("issue_exchange", ExchangeType.Direct, true);

                // Kuyrukları tanımla
                _channel.QueueDeclare(_issueCreatedQueueName, true, false, false, null);
                _channel.QueueDeclare(_issueStatusChangedQueueName, true, false, false, null);

                // Kuyrukları exchange'e bağla
                _channel.QueueBind(_issueCreatedQueueName, "issue_exchange", "issue.created");
                _channel.QueueBind(_issueStatusChangedQueueName, "issue_exchange", "issue.status_changed");

                Console.WriteLine("Successfully connected to RabbitMQ");
                return;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to connect to RabbitMQ (attempt {i + 1}/{_maxRetries}): {ex.Message}");
                if (i < _maxRetries - 1)
                {
                    Thread.Sleep(_retryDelayMs);
                }
                else
                {
                    throw;
                }
            }
        }
    }

    public void PublishIssueCreated(object message)
    {
        PublishMessage(message, "issue.created", _issueCreatedQueueName);
    }

    public void PublishIssueStatusChanged(object message)
    {
        PublishMessage(message, "issue.status_changed", _issueStatusChangedQueueName);
    }

    private void PublishMessage(object message, string routingKey, string queueName)
    {
        if (_channel == null || !_channel.IsOpen)
        {
            Console.WriteLine("Channel is not open, attempting to reconnect...");
            ConnectToRabbitMQ();
        }

        try
        {
            var json = JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.MessageId = Guid.NewGuid().ToString();
            properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());

            _channel.BasicPublish(
                exchange: "issue_exchange",
                routingKey: routingKey,
                basicProperties: properties,
                body: body);

            Console.WriteLine($"Message published to {queueName} with routing key {routingKey}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error publishing message to {queueName}: {ex.Message}");
            throw;
        }
    }

    public void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
    }
} 