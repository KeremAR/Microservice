using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;
using IssueService.Messaging.Interfaces;
using System.Threading;
using System; // Added for Console.WriteLine

namespace IssueService.Messaging.Implementations;

public class RabbitMQProducer : IRabbitMQProducer, IDisposable
{
    private IConnection _connection;
    private IModel _channel;
    private readonly string _issueCreatedQueueName;
    private readonly string _issueStatusChangedQueueName; // New queue name
    private readonly IConfiguration _configuration;
    private readonly int _maxRetries = 5;
    private readonly int _retryDelayMs = 2000; // 2 seconds

    public RabbitMQProducer(IConfiguration configuration)
    {
        _configuration = configuration;
        _issueCreatedQueueName = configuration["RabbitMQ:QueueName"] ?? "issue_created";
        // Read the new queue name from configuration, default to "issue_status_changed"
        _issueStatusChangedQueueName = configuration["RabbitMQ:IssueStatusChangedQueueName"] ?? "issue_status_changed";
        
        ConnectToRabbitMQ();
    }

    private void ConnectToRabbitMQ()
    {
        int retryCount = 0;
        bool connected = false;

        while (!connected && retryCount < _maxRetries)
        {
            try
            {
                Console.WriteLine($"Attempt {retryCount + 1} to connect to RabbitMQ...");
                
                var factory = new ConnectionFactory
                {
                    HostName = _configuration["RabbitMQ:HostName"],
                    Port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672"),
                    UserName = _configuration["RabbitMQ:UserName"],
                    Password = _configuration["RabbitMQ:Password"]
                };

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                // Declare the issue_created queue
                _channel.QueueDeclare(
                    queue: _issueCreatedQueueName,
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null);
                Console.WriteLine($"✨ Successfully declared queue: {_issueCreatedQueueName}");

                // Declare the issue_status_changed queue
                _channel.QueueDeclare(
                    queue: _issueStatusChangedQueueName,
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null);
                Console.WriteLine($"✨ Successfully declared queue: {_issueStatusChangedQueueName}");

                Console.WriteLine($"✨ Successfully connected to RabbitMQ and declared queues.");
                connected = true;
            }
            catch (Exception ex)
            {
                retryCount++;
                Console.WriteLine($"❌ Failed to connect to RabbitMQ (attempt {retryCount}/{_maxRetries}): {ex.Message}");
                
                if (retryCount < _maxRetries)
                {
                    Console.WriteLine($"Retrying in {_retryDelayMs}ms...");
                    Thread.Sleep(_retryDelayMs);
                }
                else
                {
                    Console.WriteLine("Maximum retry attempts reached. Failed to connect to RabbitMQ.");
                }
            }
        }
    }

    public void PublishIssueCreated(object message)
    {
        PublishMessage(_issueCreatedQueueName, message);
    }

    public void PublishIssueStatusChanged(object message)
    {
        PublishMessage(_issueStatusChangedQueueName, message);
    }

    private void PublishMessage(string queueName, object message)
    {
        try
        {
            if (_channel == null || _connection == null || !_connection.IsOpen)
            {
                Console.WriteLine("RabbitMQ connection is not available. Attempting to reconnect...");
                ConnectToRabbitMQ();
                
                if (_channel == null || _connection == null || !_connection.IsOpen)
                {
                    Console.WriteLine($"❌ Cannot publish message to {queueName} - RabbitMQ connection is not available");
                    return;
                }
            }

            var json = JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            _channel.BasicPublish(
                exchange: "",
                routingKey: queueName,
                basicProperties: null,
                body: body);

            Console.WriteLine($"✨ Message published to queue {queueName} successfully: {json}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error publishing message to queue {queueName}: {ex.Message}");
        }
    }

    public void Dispose()
    {
        try
        {
            _channel?.Close();
            _channel?.Dispose();
            _connection?.Close();
            _connection?.Dispose();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during RabbitMQ disposal: {ex.Message}");
        }
        GC.SuppressFinalize(this); // Added to follow IDisposable pattern properly
    }
} 